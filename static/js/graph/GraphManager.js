/**
 * graph/GraphManager.js
 * 
 * Core class for managing graph operations and state.
 * This file coordinates the other graph-related modules.
 */
import { CytoscapeManager } from './CytoscapeManager.js';
import { NodeManager } from './NodeManager.js';
import { EdgeManager } from './EdgeManager.js';
import { GraphStorage } from './GraphStorage.js';
import { GraphLayoutManager } from './GraphLayoutManager.js';

export class GraphManager {
    constructor(apiClient, eventBus, storageManager) {
      this.apiClient = apiClient;
      this.eventBus = eventBus;
      this.storageManager = storageManager;
      
      // Internal state
      this.currentGraphId = null;
      this.currentGraphName = null;
      this.isModified = false;
      
      // Initialize sub-managers
      this.cytoscapeManager = new CytoscapeManager(this);
      this.nodeManager = new NodeManager(this);
      this.edgeManager = new EdgeManager(this);
      this.graphStorage = new GraphStorage(this);
      this.layoutManager = new GraphLayoutManager(this);
      
      // Subscribe to events
      this.subscribeToEvents();
    }
    
    /**
     * Initialize the graph manager and all sub-managers
     */
    async initialize() {
      // Initialize Cytoscape
      await this.cytoscapeManager.initialize();
      
      // Check if there's a last loaded graph in localStorage
      const lastGraphId = this.storageManager.getItem('aiCanvas_lastGraphId');
      if (lastGraphId) {
        try {
          // Attempt to load the last graph
          await this.loadGraphById(lastGraphId);
          console.log(`Loaded last used graph: ${this.currentGraphName} (ID: ${this.currentGraphId})`);
        } catch (error) {
          console.warn(`Failed to load last graph (ID: ${lastGraphId}):`, error);
          // Fall back to localStorage backup if available
          const backupGraph = this.storageManager.getItem('aiCanvas_graph');
          if (backupGraph) {
            try {
              this.importGraph(JSON.parse(backupGraph));
              console.log('Loaded graph from localStorage backup');
            } catch (backupError) {
              console.error('Failed to load backup graph:', backupError);
            }
          }
        }
      }
      
      // Publish initialization event
      this.eventBus.publish('graph:initialized', this);
    }
    
    /**
     * Subscribe to required events
     */
    subscribeToEvents() {
      // Node events
      this.eventBus.subscribe('node:add', this.handleNodeAdd.bind(this));
      this.eventBus.subscribe('node:update', this.handleNodeUpdate.bind(this));
      this.eventBus.subscribe('node:remove', this.handleNodeRemove.bind(this));
      
      // Edge events
      this.eventBus.subscribe('edge:add', this.handleEdgeAdd.bind(this));
      this.eventBus.subscribe('edge:remove', this.handleEdgeRemove.bind(this));
      
      // Track changes to mark graph as modified
      this.eventBus.subscribe('node:added', () => this.markAsModified());
      this.eventBus.subscribe('node:removed', () => this.markAsModified());
      this.eventBus.subscribe('node:updated', () => this.markAsModified());
      this.eventBus.subscribe('edge:added', () => this.markAsModified());
      this.eventBus.subscribe('edge:removed', () => this.markAsModified());
    }
    
    /**
     * Handle node add event
     * 
     * @param {Object} nodeData - Node data
     */
    handleNodeAdd(nodeData) {
      if (!nodeData || !nodeData.id) return;
      
      // Add node through NodeManager
      this.nodeManager.addNode(nodeData);
      
      // Call API to create node on the server
      this.addNodeToServer(nodeData);
    }
    
    /**
     * Handle node update event
     * 
     * @param {Object} nodeData - Node data
     */
    handleNodeUpdate(nodeData) {
      if (!nodeData || !nodeData.id) return;
      
      // Update node in NodeManager
      const updatedNode = this.nodeManager.updateNode(nodeData.id, nodeData);
      
      // Update position if provided
      if (nodeData.position) {
        this.cytoscapeManager.updateNodePosition(nodeData.id, nodeData.position);
      }
      
      // Call API to update node on the server
      this.updateNodeOnServer(nodeData.id, nodeData);
    }
    
    /**
     * Handle node remove event
     * 
     * @param {string} nodeId - Node ID
     */
    handleNodeRemove(nodeId) {
      if (!nodeId) return;
      
      // Remove node through NodeManager
      this.nodeManager.removeNode(nodeId);
      
      // Call API to remove node from server
      this.removeNodeFromServer(nodeId);
    }
    
    /**
     * Handle edge add event
     * 
     * @param {Object} edgeData - Edge data with source and target
     */
    handleEdgeAdd(edgeData) {
      if (!edgeData || !edgeData.source || !edgeData.target) {
        return;
      }
      
      // Add edge through EdgeManager
      this.edgeManager.addEdge(edgeData.source, edgeData.target);
      
      // Call API to create edge on server
      this.addEdgeToServer(edgeData);
    }
    
    /**
     * Handle edge remove event
     * 
     * @param {string} edgeId - Edge ID
     */
    handleEdgeRemove(edgeId) {
      if (!edgeId) return;
      
      // Remove edge through EdgeManager
      this.edgeManager.removeEdge(edgeId);
      
      // Call API to remove edge from server
      this.removeEdgeFromServer(edgeId);
    }
    
    /**
     * Add node to server
     * 
     * @param {Object} nodeData - Node data
     */
    addNodeToServer(nodeData) {
      const graphId = this.getCurrentGraphId();
      if (!graphId) {
        console.warn('Cannot add node to server: No current graph ID');
        return;
      }
      
      // Make API call to POST /api/graphs/{graphId}/nodes
      this.apiClient.post(`/api/graphs/${graphId}/nodes`, nodeData)
        .then(response => {
          if (response.status === 'success') {
            console.log('Node added to server:', response.data);
          } else {
            console.error('Error adding node to server:', response.message);
          }
        })
        .catch(error => {
          console.error('Error adding node:', error);
        });
    }
    
    /**
     * Update node on server
     * 
     * @param {string} nodeId - Node ID
     * @param {Object} nodeData - Node data
     */
    updateNodeOnServer(nodeId, nodeData) {
      // Make API call to PUT /api/nodes/{nodeId}
      this.apiClient.put(`/api/nodes/${nodeId}`, nodeData)
        .then(response => {
          if (response.status === 'success') {
            console.log('Node updated on server:', response.data);
          } else {
            console.error('Error updating node on server:', response.message);
          }
        })
        .catch(error => {
          console.error('Error updating node:', error);
        });
    }
    
    /**
     * Remove node from server
     * 
     * @param {string} nodeId - Node ID
     */
    removeNodeFromServer(nodeId) {
      // Make API call to DELETE /api/nodes/{nodeId}
      this.apiClient.delete(`/api/nodes/${nodeId}`)
        .then(response => {
          if (response.status === 'success') {
            console.log('Node removed from server:', response.data);
          } else {
            console.error('Error removing node from server:', response.message);
          }
        })
        .catch(error => {
          console.error('Error removing node:', error);
        });
    }
    
    /**
     * Add edge to server
     * 
     * @param {Object} edgeData - Edge data
     */
    addEdgeToServer(edgeData) {
      // Make API call to POST /api/edges
      this.apiClient.post('/api/edges', edgeData)
        .then(response => {
          if (response.status === 'success') {
            console.log('Edge added to server:', response.data);
          } else {
            console.error('Error adding edge to server:', response.message);
          }
        })
        .catch(error => {
          console.error('Error adding edge:', error);
        });
    }
    
    /**
     * Remove edge from server
     * 
     * @param {string} edgeId - Edge ID
     */
    removeEdgeFromServer(edgeId) {
      // Make API call to DELETE /api/edges/{edgeId}
      this.apiClient.delete(`/api/edges/${edgeId}`)
        .then(response => {
          if (response.status === 'success') {
            console.log('Edge removed from server:', response.data);
          } else {
            console.error('Error removing edge from server:', response.message);
          }
        })
        .catch(error => {
          console.error('Error removing edge:', error);
        });
    }
    
    /**
     * Mark the current graph as modified
     */
    markAsModified() {
      this.isModified = true;
      this.eventBus.publish('graph:modified', { 
        id: this.currentGraphId,
        name: this.currentGraphName
      });
    }
    
    /**
     * Clear the modified flag
     */
    clearModifiedFlag() {
      this.isModified = false;
    }
    
    /**
     * Get the current graph ID
     * 
     * @returns {string|null} Current graph ID or null if no graph is loaded
     */
    getCurrentGraphId() {
      return this.currentGraphId;
    }
    
    /**
     * Get the current graph name
     * 
     * @returns {string|null} Current graph name or null if no graph is loaded
     */
    getCurrentGraphName() {
      return this.currentGraphName;
    }
    
    /**
     * Check if current graph has unsaved changes
     * 
     * @returns {boolean} True if graph has unsaved changes
     */
    hasUnsavedChanges() {
      return this.isModified;
    }
    
    /**
     * Set the current graph details
     * 
     * @param {string} id - Graph ID
     * @param {string} name - Graph name
     */
    setCurrentGraph(id, name) {
        this.currentGraphId = id;
        this.currentGraphName = name;
        this.clearModifiedFlag();
        
        // Update localStorage
        if (id) {
          this.storageManager.setItem('aiCanvas_lastGraphId', id);
          
          // Also set workflowManager's currentGraphId
          if (this.workflowManager) {
            this.workflowManager.currentGraphId = id;
            console.log("Updated WorkflowManager graph ID to:", id);
          }
        }
        
        // Publish graph changed event
        this.eventBus.publish('graph:current-changed', { 
          id: this.currentGraphId,
          name: this.currentGraphName
        });
      }
    
    /**
     * Export the current graph to a data object
     * 
     * @returns {Object} Graph data object
     */
    exportGraph() {
      return {
        id: this.currentGraphId,
        name: this.currentGraphName,
        nodes: this.nodeManager.getAllNodes(),
        edges: this.edgeManager.getAllEdges()
      };
    }
    
    /**
     * Import a graph from a data object
     * 
     * @param {Object} graphData - Graph data object
     */
    importGraph(graphData) {
      // Clear existing graph
      this.clearGraph();
      
      // Set current graph info if available
      if (graphData.id) {
        this.setCurrentGraph(graphData.id, graphData.name || 'Imported Graph');
      }
      
      // Add nodes
      if (Array.isArray(graphData.nodes)) {
        graphData.nodes.forEach(nodeData => {
          this.nodeManager.addNode(nodeData);
        });
      }
      
      // Add edges
      if (Array.isArray(graphData.edges)) {
        graphData.edges.forEach(edgeData => {
          this.edgeManager.addEdge(edgeData.source, edgeData.target);
        });
      }
      
      // Run layout
      this.layoutManager.runLayout();
      
      // Clear modified flag since we just imported
      this.clearModifiedFlag();
      
      // Publish graph imported event
      this.eventBus.publish('graph:imported', graphData);
    }
    
    /**
     * Clear the graph
     */
    clearGraph() {
      this.cytoscapeManager.clearAll();
      this.nodeManager.clearNodes();
      this.edgeManager.clearEdges();
      this.setCurrentGraph(null, null);
      
      // Publish graph cleared event
      this.eventBus.publish('graph:cleared');
    }
    
/**
 * Save the current graph with improved error handling
 * 
 * @param {string} name - Graph name
 * @param {string} description - Graph description
 * @param {boolean} forceNew - Force save as new graph
 * @returns {Promise<Object>} Saved graph data
 */
async saveGraph(name, description, forceNew = false) {
    try {
      // First try to save to server
      const result = await this.graphStorage.saveGraph(name, description, forceNew);
      
      // If successful, update local state
      this.setCurrentGraph(result.id, result.name);
      this.clearModifiedFlag();
      
      // Also save backup to localStorage
      const graphData = this.exportGraph();
      this.storageManager.setItem('aiCanvas_graph', JSON.stringify(graphData));
      this.storageManager.setItem('aiCanvas_lastGraphId', result.id);
      
      // Publish success event with partial success flag if there were non-critical errors
      const partialSuccess = result.hasOwnProperty('partialSuccess') ? result.partialSuccess : false;
      this.eventBus.publish('graph:saved', {
        id: result.id,
        name: result.name,
        description: result.description,
        isNew: result.isNew,
        partialSuccess
      });
      
      return result;
    } catch (error) {
      // Handle save failure
      console.error('Failed to save graph:', error);
      
      // Try to save backup to localStorage even if server save failed
      try {
        const graphData = this.exportGraph();
        this.storageManager.setItem('aiCanvas_graph_backup', JSON.stringify(graphData));
        this.storageManager.setItem('aiCanvas_lastSaveAttemptTime', Date.now());
      } catch (localStorageError) {
        console.error('Could not save backup to localStorage:', localStorageError);
      }
      
      // Publish error event
      this.eventBus.publish('graph:save-failed', {
        error: error.message,
        originalError: error
      });
      
      throw error;
    }
  }
    
    /**
     * Load a graph by ID from the server
     * 
     * @param {string} graphId - ID of the graph to load
     * @returns {Promise<Object>} Loaded graph data
     */
    async loadGraphById(graphId) {
      return this.graphStorage.loadGraphById(graphId);
    }
    
    /**
     * Get all available graphs from the server
     * 
     * @returns {Promise<Array>} Array of graph metadata
     */
    async getAvailableGraphs() {
      return this.graphStorage.getAvailableGraphs();
    }
    
    /**
     * Delete a graph from the server
     * 
     * @param {string} graphId - ID of the graph to delete
     * @returns {Promise<boolean>} Success
     */
    async deleteGraph(graphId) {
      return this.graphStorage.deleteGraph(graphId);
    }
    
    /**
     * Reset the database (admin function)
     * 
     * @returns {Promise<boolean>} Success
     */
    async resetDatabase() {
      return this.graphStorage.resetDatabase();
    }
    
    // Proxy methods to underlying managers for API compatibility
    
    /**
     * Get the Cytoscape instance
     */
    get cy() {
      return this.cytoscapeManager.cy;
    }
    
    /**
     * Get all nodes
     */
    get nodes() {
      return this.nodeManager.getAllNodes();
    }
    
    /**
     * Get all edges
     */
    get edges() {
      return this.edgeManager.getAllEdges();
    }
    
    /**
     * Get the currently selected node ID
     */
    get selectedNode() {
      return this.nodeManager.getSelectedNodeId();
    }
    
    /**
     * Add a node to the graph (compatibility method)
     */
    addNode(nodeData) {
      return this.nodeManager.addNode(nodeData);
    }
    
    /**
     * Update an existing node (compatibility method)
     */
    updateNode(nodeId, nodeData) {
      return this.nodeManager.updateNode(nodeId, nodeData);
    }
    
    /**
     * Remove a node from the graph (compatibility method)
     */
    removeNode(nodeId) {
      return this.nodeManager.removeNode(nodeId);
    }
    
    /**
     * Add an edge between two nodes (compatibility method)
     */
    addEdge(sourceId, targetId) {
      return this.edgeManager.addEdge(sourceId, targetId);
    }
    
    /**
     * Remove an edge from the graph (compatibility method)
     */
    removeEdge(edgeId) {
      return this.edgeManager.removeEdge(edgeId);
    }
    
    /**
     * Select a node in the graph (compatibility method)
     */
    selectNode(nodeId) {
      return this.nodeManager.selectNode(nodeId);
    }
    
    /**
     * Deselect the currently selected node (compatibility method)
     */
    deselectNode() {
      return this.nodeManager.deselectNode();
    }
    
    /**
     * Get data for a specific node (compatibility method)
     */
    getNodeData(nodeId) {
      return this.nodeManager.getNodeData(nodeId);
    }
    
    /**
     * Get parent nodes for a given node (compatibility method)
     */
    getParentNodes(nodeId) {
      return this.nodeManager.getParentNodes(nodeId);
    }
    
    /**
     * Run the graph layout algorithm (compatibility method)
     */
    runLayout(layoutName) {
      return this.layoutManager.runLayout(layoutName);
    }
    
    /**
     * Get node positions (compatibility method)
     */
    getNodePositions() {
      return this.layoutManager.getNodePositions();
    }
    
    /**
     * Apply node positions (compatibility method)
     */
    applyNodePositions(positions) {
      return this.layoutManager.applyNodePositions(positions);
    }


    // Add to GraphManager.js

/**
 * Visualize the execution of a workflow
 * 
 * @param {Array} executionOrder - Execution order of nodes
 * @param {Object} results - Execution results by node ID
 */
visualizeWorkflowExecution(executionOrder, results = {}) {
    if (!executionOrder || executionOrder.length === 0) return;
    
    // Reset node styles
    this.cy.nodes().removeClass('executed executing error success');
    
    // Reset edge styles
    this.cy.edges().removeClass('executed executing error success');
    
    // Helper to get node status
    const getNodeStatus = (nodeId) => {
      if (!results[nodeId]) return 'pending';
      
      if (typeof results[nodeId] === 'string' && results[nodeId].startsWith('Error')) {
        return 'error';
      }
      
      return 'success';
    };
    
    // Apply styles to nodes and edges
    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      const node = this.cy.$(`#${nodeId}`);
      
      if (node.length === 0) continue;
      
      // Apply style based on execution result
      const status = getNodeStatus(nodeId);
      node.addClass(status);
      
      // Style the edge to the next node
      if (i < executionOrder.length - 1) {
        const nextNodeId = executionOrder[i + 1];
        const edge = this.cy.$(`#${nodeId}-${nextNodeId}`);
        
        if (edge.length > 0) {
          edge.addClass(status);
        }
      }
    }
    
    // Fit the view to show all highlighted nodes
    const nodesToShow = this.cy.collection();
    executionOrder.forEach(nodeId => {
      const node = this.cy.$(`#${nodeId}`);
      if (node.length > 0) {
        nodesToShow.merge(node);
      }
    });
    
    if (nodesToShow.length > 0) {
      this.cy.fit(nodesToShow, 50);
    }
    
    // Publish event
    this.eventBus.publish('graph:execution-visualized', {
      executionOrder,
      results
    });
  }
  
  /**
   * Highlight cycles in the graph
   * 
   * @param {Array} cycles - Array of cycles
   * @returns {Array} Array of highlighted cycles
   */
  highlightCycles(cycles = null) {
    // If cycles not provided, get them from the workflow manager
    if (!cycles && this.workflowManager) {
      const cycleInfo = this.workflowManager.detectCycles();
      cycles = cycleInfo.cycles;
    }
    
    if (!cycles || cycles.length === 0) {
      console.log('No cycles to highlight');
      return [];
    }
    
    // Reset styles first
    this.cy.nodes().removeClass('cycle');
    this.cy.edges().removeClass('cycle');
    
    // Colors for different cycles
    const cycleColors = [
      '#e74c3c', // Red
      '#e67e22', // Orange
      '#f1c40f', // Yellow
      '#9b59b6', // Purple
      '#3498db'  // Blue
    ];
    
    // Highlight each cycle
    cycles.forEach((cycle, index) => {
      // Get a color for this cycle
      const colorIndex = index % cycleColors.length;
      const color = cycleColors[colorIndex];
      
      // Highlight nodes in the cycle
      cycle.forEach(nodeId => {
        const node = this.cy.$(`#${nodeId}`);
        if (node.length > 0) {
          node.addClass('cycle');
          node.style({
            'border-color': color,
            'border-width': 3
          });
        }
      });
      
      // Highlight edges in the cycle
      for (let i = 0; i < cycle.length - 1; i++) {
        const edgeId = `${cycle[i]}-${cycle[i + 1]}`;
        const edge = this.cy.$(`#${edgeId}`);
        
        if (edge.length > 0) {
          edge.addClass('cycle');
          edge.style({
            'line-color': color,
            'target-arrow-color': color,
            'width': 3
          });
        }
      }
    });
    
    // Fit view to highlighted cycles
    const nodesToShow = this.cy.nodes('.cycle');
    if (nodesToShow.length > 0) {
      this.cy.fit(nodesToShow, 50);
    }
    
    // Publish event
    this.eventBus.publish('graph:cycles-highlighted', {
      cycles
    });
    
    return cycles;
  }
  
  /**
   * Clear workflow visualization styles
   */
  clearWorkflowVisualization() {
    // Reset node styles
    this.cy.nodes().removeClass('executed executing error success cycle');
    
    // Reset edge styles
    this.cy.edges().removeClass('executed executing error success cycle');
    
    // Reset custom styles
    this.cy.nodes().removeStyle('border-color border-width');
    this.cy.edges().removeStyle('line-color target-arrow-color width');
    
    // Publish event
    this.eventBus.publish('graph:visualization-cleared');
  }
}