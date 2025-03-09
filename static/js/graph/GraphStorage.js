/**
 * graph/GraphStorage.js
 * 
 * Handles saving, loading, and managing graph persistence.
 */
export class GraphStorage {
    /**
     * @param {GraphManager} graphManager - The parent graph manager
     */
    constructor(graphManager) {
      this.graphManager = graphManager;
    }
    
/**
 * Save the current graph to the server
 * 
 * @param {string} name - Name of the graph
 * @param {string} description - Description of the graph
 * @param {boolean} forceNew - Whether to create a new graph even if current graph exists
 * @returns {Promise<Object>} Saved graph data
 */
async saveGraph(name, description = '', forceNew = false) {
    try {
      // Get graph data
      const graphData = this.graphManager.exportGraph();
      
      // Prepare the payload
      const graphPayload = {
        name,
        description,
        layout_data: {
          positions: this.graphManager.layoutManager.getNodePositions()
        }
      };
      
      let graphId = this.graphManager.getCurrentGraphId();
      let response;
      
      // Update existing graph or create new one
      if (graphId && !forceNew) {
        // Update existing graph
        response = await this.graphManager.apiClient.put(`/graphs/${graphId}`, graphPayload);
        
        if (response.status !== 'success') {
          throw new Error(response.message || 'Failed to update graph');
        }
        
        // Delete existing nodes and edges for a clean update
        // This avoids orphaned nodes/edges if some were removed
        await this.clearGraphData(graphId);
      } else {
        // Create a new graph
        response = await this.graphManager.apiClient.post('/graphs', graphPayload);
        
        if (response.status !== 'success') {
          throw new Error(response.message || 'Failed to create graph');
        }
        
        // Set the new graph ID
        graphId = response.data.id;
        this.graphManager.setCurrentGraph(graphId, name);
      }
      
      // Save all nodes with error handling
      const nodePromises = [];
      for (const node of graphData.nodes) {
        // Ensure position is properly formatted to avoid backend errors
        const nodeWithPosition = {
          ...node,
          position: {
            x: node.position?.x || 0,
            y: node.position?.y || 0
          }
        };
        
        // Ensure node is associated with this graph
        nodeWithPosition.graph_id = graphId;
        
        const nodePromise = this.graphManager.apiClient.post(`/graphs/${graphId}/nodes`, nodeWithPosition)
          .catch(err => {
            console.error(`Error saving node ${node.id}:`, err);
            // Return null but don't reject the whole operation
            return null;
          });
        
        nodePromises.push(nodePromise);
      }
      
      // Wait for all node save operations to complete
      const nodeResults = await Promise.all(nodePromises);
      const failedNodes = nodeResults.filter(r => r === null).length;
      if (failedNodes > 0) {
        console.warn(`${failedNodes} nodes failed to save`);
      }
      
      // Save all edges with error handling
      const edgePromises = [];
      for (const edge of graphData.edges) {
        const edgePromise = this.graphManager.apiClient.post('/edges', edge)
          .catch(err => {
            console.error(`Error saving edge ${edge.id}:`, err);
            // Return null but don't reject the whole operation
            return null;
          });
        
        edgePromises.push(edgePromise);
      }
      
      // Wait for all edge save operations to complete
      const edgeResults = await Promise.all(edgePromises);
      const failedEdges = edgeResults.filter(r => r === null).length;
      if (failedEdges > 0) {
        console.warn(`${failedEdges} edges failed to save`);
      }
      
      // Save to localStorage as backup
      this.graphManager.storageManager.setItem('aiCanvas_lastGraphId', graphId);
      this.graphManager.storageManager.setItem('aiCanvas_graph', JSON.stringify(graphData));
      
      // Clear the modified flag
      this.graphManager.clearModifiedFlag();
      
      // Publish graph saved event
      this.graphManager.eventBus.publish('graph:saved', { 
        id: graphId, 
        name, 
        description,
        isNew: forceNew || !this.graphManager.getCurrentGraphId(),
        partialSuccess: failedNodes > 0 || failedEdges > 0
      });
      
      return { 
        id: graphId, 
        name, 
        description,
        partialSuccess: failedNodes > 0 || failedEdges > 0
      };
    } catch (error) {
      // Save to localStorage as fallback
      const graphData = this.graphManager.exportGraph();
      this.graphManager.storageManager.setItem('aiCanvas_graph', JSON.stringify(graphData));
      console.error('Error saving graph, saved to local storage instead:', error);
      
      // Re-throw the error after saving to localStorage
      throw error;
    }
  }
    
    /**
     * Clear existing graph data before update
     * 
     * @param {string} graphId - Graph ID
     * @returns {Promise<void>}
     */
    async clearGraphData(graphId) {
      try {
        // Load the current graph from the server to get node IDs
        const response = await this.graphManager.apiClient.get(`/graphs/${graphId}`);
        
        if (response.status !== 'success' || !response.data) {
          throw new Error('Failed to load graph data for cleaning');
        }
        
        // Delete all edges
        const deleteEdgePromises = response.data.edges.map(edge => {
          return this.graphManager.apiClient.delete(`/edges/${edge.id}`);
        });
        
        await Promise.all(deleteEdgePromises);
        
        // Delete all nodes
        const deleteNodePromises = response.data.nodes.map(node => {
          return this.graphManager.apiClient.delete(`/nodes/${node.id}`);
        });
        
        await Promise.all(deleteNodePromises);
      } catch (error) {
        console.error('Error clearing graph data:', error);
        // Continue with save operation even if cleaning fails
      }
    }
    
    /**
     * Load a graph by ID from the server
     * 
     * @param {string} graphId - ID of the graph to load
     * @returns {Promise<Object>} Loaded graph data
     */
    async loadGraphById(graphId) {
      // Check for unsaved changes before loading
      if (this.graphManager.hasUnsavedChanges()) {
        // This would be handled by the UI, but we'll
        // log a warning here just in case
        console.warn('Loading graph with unsaved changes');
      }
      
      // Get the graph from the server
      const response = await this.graphManager.apiClient.get(`/graphs/${graphId}`);
      
      if (response.status === 'success' && response.data) {
        const graphData = response.data;
        
        // Clear existing graph
        this.graphManager.clearGraph();
        
        // Set current graph ID and name
        this.graphManager.setCurrentGraph(graphId, graphData.name);
        
        // Import nodes
        graphData.nodes.forEach(node => {
          // Ensure each node has the graph_id property
          const nodeWithGraphId = {
            ...node,
            graph_id: graphId
          };
          
          this.graphManager.nodeManager.addNode(nodeWithGraphId);
        });
        
        // Import edges
        graphData.edges.forEach(edge => {
          this.graphManager.edgeManager.addEdge(edge.source, edge.target);
        });
        
        // Apply layout if available
        if (graphData.layout_data && graphData.layout_data.positions) {
          this.graphManager.layoutManager.applyNodePositions(graphData.layout_data.positions);
        } else {
          // Run layout if no positions are stored
          this.graphManager.layoutManager.runLayout();
        }
        
        // Save the current graph ID to localStorage
        this.graphManager.storageManager.setItem('aiCanvas_lastGraphId', graphId);
        
        // Publish graph loaded event
        this.graphManager.eventBus.publish('graph:loaded', graphData);
        
        return graphData;
      } else {
        throw new Error(response.message || 'Failed to load graph');
      }
    }
    
    /**
     * Get all available graphs from the server
     * 
     * @returns {Promise<Array>} Array of graph metadata
     */
    async getAvailableGraphs() {
      const response = await this.graphManager.apiClient.get('/graphs');
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get available graphs');
      }
    }
    
    /**
     * Delete a graph from the server
     * 
     * @param {string} graphId - ID of the graph to delete
     * @returns {Promise<boolean>} Success
     */
    async deleteGraph(graphId) {
      const response = await this.graphManager.apiClient.delete(`/graphs/${graphId}`);
      
      if (response.status === 'success') {
        // If the deleted graph was the current one, clear it
        if (this.graphManager.getCurrentGraphId() === graphId) {
          this.graphManager.clearGraph();
        }
        
        // If the deleted graph was the last loaded one, remove from localStorage
        if (this.graphManager.storageManager.getItem('aiCanvas_lastGraphId') === graphId) {
          this.graphManager.storageManager.removeItem('aiCanvas_lastGraphId');
        }
        
        // Publish graph deleted event
        this.graphManager.eventBus.publish('graph:deleted', { id: graphId });
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete graph');
      }
    }
    
    /**
     * Reset the database (admin function)
     * 
     * @returns {Promise<boolean>} Success
     */
    async resetDatabase() {
      const response = await this.graphManager.apiClient.post('/reset-database');
      
      if (response.status === 'success') {
        // Clear local graph
        this.graphManager.clearGraph();
        
        // Clear localStorage
        this.graphManager.storageManager.removeItem('aiCanvas_lastGraphId');
        this.graphManager.storageManager.removeItem('aiCanvas_graph');
        
        // Publish database reset event
        this.graphManager.eventBus.publish('database:reset');
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to reset database');
      }
    }
    
    /**
     * Export graph to JSON
     * 
     * @returns {string} JSON string of graph data
     */
    exportToJson() {
      const graphData = this.graphManager.exportGraph();
      return JSON.stringify(graphData, null, 2);
    }
    
    /**
     * Import graph from JSON
     * 
     * @param {string} jsonString - JSON string of graph data
     * @returns {boolean} Success
     */
    importFromJson(jsonString) {
      try {
        const graphData = JSON.parse(jsonString);
        this.graphManager.importGraph(graphData);
        return true;
      } catch (error) {
        console.error('Error importing graph from JSON:', error);
        return false;
      }
    }
}