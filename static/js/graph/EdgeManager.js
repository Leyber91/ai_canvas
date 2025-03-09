/**
 * graph/EdgeManager.js
 * 
 * Manages edges in the graph, including creating, removing,
 * and querying edges between nodes.
 */
export class EdgeManager {
    /**
     * @param {GraphManager} graphManager - The parent graph manager
     */
    constructor(graphManager) {
      this.graphManager = graphManager;
      this.edges = [];
    }
    
    /**
     * Add an edge between two nodes
     * 
     * @param {string} sourceId - Source node ID
     * @param {string} targetId - Target node ID
     * @returns {string|null} Edge ID or null if failed
     */
    addEdge(sourceId, targetId) {
      // Check if nodes exist
      const sourceNode = this.graphManager.cytoscapeManager.findNode(sourceId);
      const targetNode = this.graphManager.cytoscapeManager.findNode(targetId);
      
      if (sourceNode.length === 0 || targetNode.length === 0) {
        console.error('Cannot add edge: one or both nodes do not exist');
        return null;
      }
      
      // Check if edge already exists
      const edgeId = `${sourceId}-${targetId}`;
      const existingEdge = this.graphManager.cytoscapeManager.findEdge(edgeId);
      
      if (existingEdge.length > 0) {
        console.warn('Edge already exists');
        return edgeId;
      }
      
      // Add edge to Cytoscape
      this.graphManager.cytoscapeManager.addEdge(edgeId, sourceId, targetId);
      
      // Add to internal edges array
      this.edges.push({
        id: edgeId,
        source: sourceId,
        target: targetId
      });
      
      // Publish edge added event
      this.graphManager.eventBus.publish('edge:added', { 
        id: edgeId, 
        source: sourceId, 
        target: targetId 
      });
      
      return edgeId;
    }
    
    /**
     * Remove an edge from the graph
     * 
     * @param {string} edgeId - ID of the edge to remove
     * @returns {boolean} Success
     */
    removeEdge(edgeId) {
      // Remove edge from Cytoscape
      this.graphManager.cytoscapeManager.removeElement(edgeId);
      
      // Remove from internal edges array
      this.edges = this.edges.filter(edge => edge.id !== edgeId);
      
      // Publish edge removed event
      this.graphManager.eventBus.publish('edge:removed', { id: edgeId });
      
      return true;
    }
    
    /**
     * Get all edges
     * 
     * @returns {Array} Array of edge data objects
     */
    getAllEdges() {
      return [...this.edges];
    }
    
    /**
     * Clear all edges
     */
    clearEdges() {
      this.edges = [];
    }
    
    /**
     * Check if an edge exists
     * 
     * @param {string} edgeId - Edge ID to check
     * @returns {boolean} True if edge exists
     */
    edgeExists(edgeId) {
      return this.graphManager.cytoscapeManager.findEdge(edgeId).length > 0;
    }
    
    /**
     * Check if an edge exists between two nodes
     * 
     * @param {string} sourceId - Source node ID
     * @param {string} targetId - Target node ID
     * @returns {boolean} True if edge exists
     */
    hasEdge(sourceId, targetId) {
      const edgeId = `${sourceId}-${targetId}`;
      return this.edgeExists(edgeId);
    }
    
    /**
     * Get all edges for a node
     * 
     * @param {string} nodeId - Node ID
     * @param {string} direction - 'incoming', 'outgoing', or 'both'
     * @returns {Array} Array of edge data objects
     */
    getEdgesForNode(nodeId, direction = 'both') {
      const result = [];
      
      if (direction === 'incoming' || direction === 'both') {
        this.edges.forEach(edge => {
          if (edge.target === nodeId) {
            result.push(edge);
          }
        });
      }
      
      if (direction === 'outgoing' || direction === 'both') {
        this.edges.forEach(edge => {
          if (edge.source === nodeId) {
            result.push(edge);
          }
        });
      }
      
      return result;
    }
    
    /**
     * Get count of edges
     * 
     * @returns {number} Number of edges
     */
    getEdgeCount() {
      return this.edges.length;
    }
    
    /**
     * Check if adding an edge would create a cycle
     * 
     * @param {string} sourceId - Source node ID
     * @param {string} targetId - Target node ID
     * @returns {boolean} True if adding the edge would create a cycle
     */
    wouldCreateCycle(sourceId, targetId) {
      // Direct self-reference is a cycle
      if (sourceId === targetId) {
        return true;
      }
      
      // Check if there's already a path from target to source
      const visited = new Set();
      
      const dfs = (currentId) => {
        if (currentId === sourceId) {
          return true; // Found a path back to source
        }
        
        visited.add(currentId);
        
        // Check all outgoing edges from current node
        for (const edge of this.edges) {
          if (edge.source === currentId && !visited.has(edge.target)) {
            if (dfs(edge.target)) {
              return true;
            }
          }
        }
        
        return false;
      };
      
      return dfs(targetId);
    }
    
    /**
     * Get an edge by ID
     * 
     * @param {string} edgeId - Edge ID
     * @returns {Object|null} Edge data or null if not found
     */
    getEdgeById(edgeId) {
      return this.edges.find(edge => edge.id === edgeId) || null;
    }
}