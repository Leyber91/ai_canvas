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
    // Create a reference to apiClient to avoid inconsistencies
    this.apiClient = graphManager.apiClient;
  }
  
  /**
   * Save graph to server with improved error handling and sync
   * 
   * @param {string} name - Graph name
   * @param {string} description - Graph description
   * @param {boolean} forceNew - Force create as new graph
   * @returns {Promise<Object>} Saved graph data
   */
  async saveGraph(name, description, forceNew = false) {
      try {
        // Export graph data
        const graphData = this.graphManager.exportGraph();
        graphData.name = name || graphData.name;
        graphData.description = description || '';
        
        // If we have an existing graph ID and not forcing new, update it
        if (this.graphManager.getCurrentGraphId() && !forceNew) {
          const graphId = this.graphManager.getCurrentGraphId();
          
          // Get current server state first to compare
          let serverGraph;
          try {
            const response = await this.apiClient.get(`/api/graphs/${graphId}`);
            serverGraph = response.data;
          } catch (error) {
            console.warn(`Could not fetch graph ${graphId} for comparison:`, error);
            // Create a minimal server graph to compare against
            serverGraph = { id: graphId, nodes: [], edges: [] };
          }
          
          // Compute differential updates
          const updates = this.computeDifferentialUpdates(serverGraph, graphData);
          
          // FIXED: Don't use batch endpoint, use individual API calls instead
          console.log("Applying updates to graph:", updates);
          await this.executeUpdates(graphId, updates);
          
          // Handle response
          const result = {
            id: graphId,
            name: graphData.name,
            description: graphData.description,
            isNew: false
          };
          
          return result;
        } else {
          // Create new graph (no need for batch operations)
          const response = await this.apiClient.post('/api/graphs', {
            name: graphData.name,
            description: graphData.description,
            nodes: graphData.nodes,
            edges: graphData.edges
          });
          
          return {
            id: response.data.id,
            name: response.data.name,
            description: response.data.description,
            isNew: true
          };
        }
      } catch (error) {
        console.error('Error saving graph:', error);
        throw error;
      }
  }
    
  /**
   * Compute differential updates between server and client state
   * 
   * @param {Object} serverGraph - Current graph state on server
   * @param {Object} clientGraph - Current graph state on client
   * @returns {Object} Required updates
   */
  computeDifferentialUpdates(serverGraph, clientGraph) {
      const updates = {
        // Nodes to create/update/delete
        nodesToCreate: [],
        nodesToUpdate: [],
        nodesToDelete: [],
        
        // Edges to create/delete
        edgesToCreate: [],
        edgesToDelete: []
      };
      
      // Find nodes to create or update
      const serverNodeIds = new Set(serverGraph.nodes.map(n => n.id));
      const clientNodeIds = new Set(clientGraph.nodes.map(n => n.id));
      
      // Nodes in client but not in server should be created
      clientGraph.nodes.forEach(node => {
        if (!serverNodeIds.has(node.id)) {
          updates.nodesToCreate.push(node);
        } else {
          // Node exists in both - check if it needs update
          const serverNode = serverGraph.nodes.find(n => n.id === node.id);
          if (JSON.stringify(serverNode) !== JSON.stringify(node)) {
            updates.nodesToUpdate.push(node);
          }
        }
      });
      
      // Nodes in server but not in client should be deleted
      serverGraph.nodes.forEach(node => {
        if (!clientNodeIds.has(node.id)) {
          updates.nodesToDelete.push(node.id);
        }
      });
      
      // Same logic for edges
      const serverEdgeIds = new Set(serverGraph.edges.map(e => e.id));
      const clientEdgeIds = new Set(clientGraph.edges.map(e => e.id));
      
      clientGraph.edges.forEach(edge => {
        if (!serverEdgeIds.has(edge.id)) {
          updates.edgesToCreate.push(edge);
        }
      });
      
      serverGraph.edges.forEach(edge => {
        if (!clientEdgeIds.has(edge.id)) {
          updates.edgesToDelete.push(edge.id);
        }
      });
      
      return updates;
  }
  
  /**
   * Execute differential updates in correct order
   * 
   * @param {string} graphId - Graph ID
   * @param {Object} updates - Updates to execute
   */
  async executeUpdates(graphId, updates) {
      const errors = [];
      
      // Delete edges first (to avoid foreign key violations)
      for (const edgeId of updates.edgesToDelete) {
        try {
          await this.apiClient.delete(`/api/edges/${edgeId}`);
        } catch (error) {
          // Don't fail on 404s (edge already deleted)
          if (error.response?.status !== 404) {
            errors.push(`Failed to delete edge ${edgeId}: ${error.message}`);
          }
        }
      }
      
      // Delete nodes that should be removed
      for (const nodeId of updates.nodesToDelete) {
        try {
          await this.apiClient.delete(`/api/nodes/${nodeId}`);
        } catch (error) {
          if (error.response?.status !== 404) {
            errors.push(`Failed to delete node ${nodeId}: ${error.message}`);
          }
        }
      }
      
      // Create/update nodes
      for (const node of updates.nodesToCreate) {
        try {
          await this.apiClient.post(`/api/graphs/${graphId}/nodes`, node);
        } catch (error) {
          errors.push(`Failed to create node ${node.id}: ${error.message}`);
        }
      }
      
      // Update existing nodes
      for (const node of updates.nodesToUpdate) {
        try {
          await this.apiClient.put(`/api/nodes/${node.id}`, node);
        } catch (error) {
          errors.push(`Failed to update node ${node.id}: ${error.message}`);
        }
      }
      
      // Create edges (after all nodes exist)
      for (const edge of updates.edgesToCreate) {
        try {
          await this.apiClient.post('/api/edges', edge);
        } catch (error) {
          errors.push(`Failed to create edge ${edge.id}: ${error.message}`);
        }
      }
      
      // If we have errors, log them but don't stop the process
      if (errors.length > 0) {
        console.warn(`${errors.length} errors during graph update:`, errors);
      }
      
      return errors.length === 0;
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
      const response = await this.graphManager.apiClient.get(`/api/graphs/${graphId}`);
      
      if (response.status !== 'success' || !response.data) {
        throw new Error('Failed to load graph data for cleaning');
      }
      
      // Delete all edges with improved error handling
      const deleteEdgePromises = response.data.edges.map(edge => {
        return this.graphManager.apiClient.delete(`/api/edges/${edge.id}`)
          .catch(err => {
            // Log but don't fail the operation if edge deletion fails
            console.warn(`Non-critical error deleting edge ${edge.id}:`, err);
            // Return a success result to avoid breaking the Promise.all
            return { status: 'success', message: 'Edge deletion skipped' };
          });
      });
      
      await Promise.all(deleteEdgePromises);
      
      // Delete all nodes
      const deleteNodePromises = response.data.nodes.map(node => {
        return this.graphManager.apiClient.delete(`/api/nodes/${node.id}`)
          .catch(err => {
            console.error(`Error deleting node ${node.id}:`, err);
            // Return null but don't reject the whole operation
            return null;
          });
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
      const response = await this.graphManager.apiClient.get(`/api/graphs/${graphId}`);
      
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
        
        // Import edges with proper source and target handling
        graphData.edges.forEach(edge => {
          // Make sure we use the correct properties based on the API response
          const sourceId = edge.source || edge.source_node_id;
          const targetId = edge.target || edge.target_node_id;
          
          if (sourceId && targetId) {
            this.graphManager.edgeManager.addEdge(sourceId, targetId);
          } else {
            console.warn('Edge has invalid source or target:', edge);
          }
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
    const response = await this.graphManager.apiClient.get('/api/graphs');
    
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
    const response = await this.graphManager.apiClient.delete(`/api/graphs/${graphId}`);
    
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
    const response = await this.graphManager.apiClient.post('/api/reset-database');
    
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

  /**
   * Save edges in batch for better performance
   * 
   * @param {Array} edges - Array of edge data objects
   * @returns {Promise<Array>} Results of edge creation
   */
  async saveEdgesBatch(edges) {
    try {
      const edgePromises = [];
      
      for (const edge of edges) {
        // Format edge data properly for the API
        const edgeData = {
          source: edge.source,
          target: edge.target,
          type: edge.type || 'provides_context'
        };
        
        const edgePromise = this.graphManager.apiClient.post('/api/edges', edgeData)
          .catch(err => {
            console.error(`Error saving edge ${edge.source}->${edge.target}:`, err);
            // Return null but don't reject the whole operation
            return null;
          });
        
        edgePromises.push(edgePromise);
      }
      
      const results = await Promise.all(edgePromises);
      return results.filter(r => r !== null);
    } catch (error) {
      console.error('Error saving edges in batch:', error);
      return [];
    }
  }
}