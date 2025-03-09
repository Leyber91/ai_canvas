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
      this.eventBus.subscribe('node:add', this.nodeManager.addNode, this.nodeManager);
      this.eventBus.subscribe('node:remove', this.nodeManager.removeNode, this.nodeManager);
      
      // Edge events
      this.eventBus.subscribe('edge:add', this.edgeManager.addEdge, this.edgeManager);
      this.eventBus.subscribe('edge:remove', this.edgeManager.removeEdge, this.edgeManager);
      
      // Track changes to mark graph as modified
      this.eventBus.subscribe('node:added', () => this.markAsModified());
      this.eventBus.subscribe('node:removed', () => this.markAsModified());
      this.eventBus.subscribe('node:updated', () => this.markAsModified());
      this.eventBus.subscribe('edge:added', () => this.markAsModified());
      this.eventBus.subscribe('edge:removed', () => this.markAsModified());
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
     * Save the current graph to the server
     * 
     * @param {string} name - Name of the graph
     * @param {string} description - Description of the graph
     * @param {boolean} forceNew - Whether to create a new graph even if current graph exists
     * @returns {Promise<Object>} Saved graph data
     */
    async saveGraph(name, description = '', forceNew = false) {
      return this.graphStorage.saveGraph(name, description, forceNew);
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