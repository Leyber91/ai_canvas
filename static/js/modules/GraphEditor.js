import { BaseManager } from '../managers/base/BaseManager.js';
import { EVENTS } from '../constants/eventTypes.js';
import { ERRORS } from '../constants/errorCodes.js';
import { CLASSES } from '../constants/classNames.js';
import { NODE_CONFIG } from '../constants/nodeConfig.js';
import { SELECTORS } from '../constants/elementSelectors.js';

/**
 * Module for graph editing functionality
 */
export class GraphEditor extends BaseManager {
  /**
   * @param {UIManager} uiManager - Parent UI manager
   */
  constructor(uiManager) {
    super(uiManager);
    
    // Cytoscape instance
    this.cy = null;
    
    // Node and edge data
    this.nodes = {};
    this.edges = {};
    
    // Track selected elements
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
  }
  
  /**
   * Initialize the graph editor
   */
  initialize() {
    super.initialize();
    
    // Initialize Cytoscape
    this.initializeCytoscape();
  }
  
  /**
   * Find DOM elements needed for this module
   */
  findElements() {
    this.elements = {
      graphContainer: this.findElement(SELECTORS.CANVAS_CONTAINER)
    };
    
    if (!this.elements.graphContainer) {
      this.handleError('Graph container not found', 'findElements');
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // We'll set up Cytoscape-specific event listeners in initializeCytoscape
  }
  
  /**
   * Subscribe to event bus events
   */
  subscribeToEvents() {
    this.subscribeWithCleanup(EVENTS.NODE.ADDED, this.handleNodeAdded);
    this.subscribeWithCleanup(EVENTS.NODE.REMOVED, this.handleNodeRemoved);
    this.subscribeWithCleanup(EVENTS.NODE.UPDATED, this.handleNodeUpdated);
    this.subscribeWithCleanup(EVENTS.EDGE.ADDED, this.handleEdgeAdded);
    this.subscribeWithCleanup(EVENTS.EDGE.REMOVED, this.handleEdgeRemoved);
    this.subscribeWithCleanup(EVENTS.WORKFLOW.NODE_EXECUTING, this.handleNodeExecuting);
    this.subscribeWithCleanup(EVENTS.WORKFLOW.NODE_COMPLETED, this.handleNodeCompleted);
    this.subscribeWithCleanup(EVENTS.WORKFLOW.NODE_ERROR, this.handleNodeError);
    this.subscribeWithCleanup(EVENTS.WORKFLOW.COMPLETED, this.handleWorkflowCompleted);
    this.subscribeWithCleanup(EVENTS.GRAPH.CYCLES_HIGHLIGHTED, this.handleCyclesHighlighted);
  }
  
  /**
   * Initialize Cytoscape
   */
  initializeCytoscape() {
    if (!this.elements.graphContainer) {
      this.handleError('Cannot initialize Cytoscape: graph container not found', 'initializeCytoscape');
      return;
    }
    
    // Default Cytoscape options
    const options = {
      container: this.elements.graphContainer,
      style: this.getCytoscapeStyle(),
      layout: {
        name: 'grid',
        padding: 50
      },
      wheelSensitivity: 0.3,
      minZoom: 0.2,
      maxZoom: 3,
      autoungrabify: false,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true
    };
    
    try {
      // Create Cytoscape instance
      this.cy = cytoscape(options);
      
      // Set up Cytoscape event handlers
      this.setupCytoscapeEvents();
      
      // Apply initial layout
      this.cy.layout({ name: 'grid' }).run();
    } catch (error) {
      this.handleError(error, 'initializeCytoscape');
    }
  }
  
  /**
   * Set up Cytoscape event handlers
   */
  setupCytoscapeEvents() {
    if (!this.cy) return;
    
    // Node selection
    this.cy.on('select', 'node', event => {
      const node = event.target;
      const nodeId = node.id();
      
      // Store selected node ID
      this.selectedNodeId = nodeId;
      
      // Get node data
      const nodeData = this.nodes[nodeId];
      
      // Publish node selected event
      if (this.eventBus) {
        this.eventBus.publish(EVENTS.NODE.SELECTED, {
          id: nodeId,
          nodeData
        });
      }
    });
    
    // Node deselection
    this.cy.on('unselect', 'node', event => {
      const nodeId = event.target.id();
      
      // Clear selected node ID if this was the selected node
      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null;
        
        // Publish node deselected event
        if (this.eventBus) {
          this.eventBus.publish(EVENTS.NODE.DESELECTED, {
            id: nodeId
          });
        }
      }
    });
    
    // Edge selection
    this.cy.on('select', 'edge', event => {
      const edge = event.target;
      const edgeId = edge.id();
      
      // Store selected edge ID
      this.selectedEdgeId = edgeId;
      
      // Get edge position for removing button
      const edgePosition = edge.midpoint();
      
      // Publish edge selected event
      if (this.eventBus) {
        this.eventBus.publish(EVENTS.EDGE.SELECTED, {
          id: edgeId,
          source: edge.source().id(),
          target: edge.target().id(),
          position: edgePosition
        });
      }
    });
    
    // Edge deselection
    this.cy.on('unselect', 'edge', event => {
      const edgeId = event.target.id();
      
      // Clear selected edge ID if this was the selected edge
      if (this.selectedEdgeId === edgeId) {
        this.selectedEdgeId = null;
        
        // Publish edge deselected event
        if (this.eventBus) {
          this.eventBus.publish(EVENTS.EDGE.DESELECTED, {
            id: edgeId
          });
        }
      }
    });
    
    // Node moved (mark graph as modified)
    this.cy.on('position', 'node', () => {
      this.markGraphAsModified();
    });
    
    // Double-click on node to edit
    this.cy.on('dblclick', 'node', event => {
      const nodeId = event.target.id();
      
      // Open node modal for editing
      if (this.uiManager.nodeModalManager) {
        this.uiManager.nodeModalManager.editNode(nodeId);
      }
    });
    
    // Background click to add node
    this.cy.on('dblclick', event => {
      // Only handle background clicks
      if (event.target !== this.cy) return;
      
      // Get click position
      const position = event.position;
      
      // Open node modal for creating a new node at this position
      if (this.uiManager.nodeModalManager) {
        this.uiManager.nodeModalManager.showNodeModal({
          position
        });
      }
    });
  }
  
  /**
   * Get Cytoscape style
   * 
   * @returns {Array} Cytoscape style array
   */
  getCytoscapeStyle() {
    return [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'label': 'data(name)',
          'color': '#ffffff',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '14px',
          'width': NODE_CONFIG.STYLE.WIDTH || '160px',
          'height': NODE_CONFIG.STYLE.HEIGHT || '80px',
          'shape': NODE_CONFIG.STYLE.SHAPE || 'round-rectangle',
          'text-wrap': NODE_CONFIG.STYLE.TEXT_WRAP || 'ellipsis',
          'text-max-width': NODE_CONFIG.STYLE.TEXT_MAX_WIDTH || '140px',
          'border-width': '2px',
          'border-color': '#ffffff',
          'border-opacity': 0.2,
          'text-outline-width': 2,
          'text-outline-color': 'data(color)',
          'text-outline-opacity': 1
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#4FD1C5',
          'target-arrow-color': '#4FD1C5',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'opacity': 0.8,
          'arrow-scale': 1.2
        }
      },
      {
        selector: `.${CLASSES.NODES.TYPES.OLLAMA}`,
        style: {
          'background-color': NODE_CONFIG.COLORS.ollama.background,
          'border-color': NODE_CONFIG.COLORS.ollama.border
        }
      },
      {
        selector: `.${CLASSES.NODES.TYPES.GROQ}`,
        style: {
          'background-color': NODE_CONFIG.COLORS.groq.background,
          'border-color': NODE_CONFIG.COLORS.groq.border
        }
      },
      {
        selector: `.${CLASSES.NODES.STATES.SELECTED}`,
        style: {
          'border-width': 3,
          'border-color': '#ffffff',
          'border-opacity': 0.8,
          'box-shadow': '0 0 15px #ffffff'
        }
      },
      {
        selector: `.${CLASSES.NODES.STATES.HOVERED}`,
        style: {
          'border-width': 2,
          'border-color': '#4FD1C5',
          'border-opacity': 0.8
        }
      },
      {
        selector: `.${CLASSES.NODES.STATES.EXECUTING}`,
        style: {
          'border-width': 3,
          'border-color': '#3498db',
          'border-opacity': 1
        }
      },
      {
        selector: `.${CLASSES.NODES.STATES.COMPLETED}`,
        style: {
          'border-width': 3,
          'border-color': '#10B981',
          'border-opacity': 1
        }
      },
      {
        selector: `.${CLASSES.NODES.STATES.ERROR}`,
        style: {
          'border-width': 3,
          'border-color': '#ef4444',
          'border-opacity': 1
        }
      },
      {
        selector: `edge.${CLASSES.EDGES.STATES.EXECUTING}`,
        style: {
          'line-color': '#3498db',
          'target-arrow-color': '#3498db',
          'width': 4
        }
      },
      {
        selector: `edge.${CLASSES.EDGES.STATES.COMPLETED}`,
        style: {
          'line-color': '#10B981',
          'target-arrow-color': '#10B981',
          'width': 4
        }
      },
      {
        selector: `edge.${CLASSES.EDGES.STATES.ERROR}`,
        style: {
          'line-color': '#ef4444',
          'target-arrow-color': '#ef4444',
          'width': 4
        }
      },
      {
        selector: `.${CLASSES.NODES.STATES.CYCLE}, edge.${CLASSES.EDGES.STATES.CYCLE}`,
        style: {
          'border-width': 3,
          'line-color': '#f59e0b',
          'target-arrow-color': '#f59e0b',
          'border-color': '#f59e0b',
          'border-opacity': 0.8
        }
      }
    ];
  }
  
  /**
   * Add a node to the graph
   * 
   * @param {Object} nodeData - Node data
   * @returns {Object} Cytoscape node
   */
  addNode(nodeData) {
    if (!this.cy) return null;
    
    try {
      // Generate ID if not provided
      const nodeId = nodeData.id || `node-${Date.now()}`;
      
      // Get node color based on backend
      const colors = nodeData.backend && NODE_CONFIG.COLORS[nodeData.backend]
        ? NODE_CONFIG.COLORS[nodeData.backend]
        : NODE_CONFIG.COLORS.ollama;
      
      // Get node position or generate random position
      const position = nodeData.position || {
        x: Math.random() * 500,
        y: Math.random() * 500
      };
      
      // Create node with defaults
      const node = {
        data: {
          id: nodeId,
          name: nodeData.name || 'New Node',
          backend: nodeData.backend || NODE_CONFIG.DEFAULTS.BACKEND,
          model: nodeData.model || NODE_CONFIG.DEFAULTS.MODEL,
          color: colors.background
        },
        position,
        classes: nodeData.backend ? `${nodeData.backend}-node` : ''
      };
      
      // Add to Cytoscape
      this.cy.add({
        group: 'nodes',
        data: node.data,
        position: node.position,
        classes: node.classes
      });
      
      // Store node data
      this.nodes[nodeId] = {
        ...nodeData,
        id: nodeId
      };
      
      // Mark graph as modified
      this.markGraphAsModified();
      
      return this.cy.$(`#${nodeId}`);
    } catch (error) {
      this.handleError(error, 'addNode');
      return null;
    }
  }
  
  /**
   * Update a node
   * 
   * @param {string} nodeId - Node ID
   * @param {Object} updates - Node updates
   * @returns {Object} Updated node
   */
  updateNode(nodeId, updates) {
    if (!this.cy) return null;
    
    try {
      // Get Cytoscape node
      const node = this.cy.$(`#${nodeId}`);
      if (!node || node.length === 0) {
        throw new Error(`Node ${nodeId} not found`);
      }
      
      // Get node color based on backend
      const backend = updates.backend || this.nodes[nodeId]?.backend;
      const colors = backend && NODE_CONFIG.COLORS[backend]
        ? NODE_CONFIG.COLORS[backend]
        : NODE_CONFIG.COLORS.ollama;
      
      // Update node data
      if (updates.name) {
        node.data('name', updates.name);
      }
      
      if (updates.backend) {
        node.data('backend', updates.backend);
        node.data('color', colors.background);
        
        // Update classes
        node.removeClass();
        node.addClass(`${updates.backend}-node`);
      }
      
      if (updates.model) {
        node.data('model', updates.model);
      }
      
      // Update stored node data
      this.nodes[nodeId] = {
        ...this.nodes[nodeId],
        ...updates
      };
      
      // Mark graph as modified
      this.markGraphAsModified();
      
      return node;
    } catch (error) {
      this.handleError(error, 'updateNode');
      return null;
    }
  }
  
  /**
   * Remove a node
   * 
   * @param {string} nodeId - Node ID
   * @returns {boolean} Success
   */
  removeNode(nodeId) {
    if (!this.cy) return false;
    
    try {
      // Get Cytoscape node
      const node = this.cy.$(`#${nodeId}`);
      if (!node || node.length === 0) {
        throw new Error(`Node ${nodeId} not found`);
      }
      
      // Remove the node (this also removes connected edges)
      this.cy.remove(node);
      
      // Remove from nodes map
      delete this.nodes[nodeId];
      
      // Remove connected edges from edges map
      Object.keys(this.edges).forEach(edgeId => {
        if (edgeId.startsWith(nodeId) || edgeId.endsWith(nodeId)) {
          delete this.edges[edgeId];
        }
      });
      
      // Clear selected node ID if this was the selected node
      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null;
      }
      
      // Mark graph as modified
      this.markGraphAsModified();
      
      return true;
    } catch (error) {
      this.handleError(error, 'removeNode');
      return false;
    }
  }
  
  /**
   * Add an edge between two nodes
   * 
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @param {Object} edgeData - Additional edge data
   * @returns {Object} Cytoscape edge
   */
  addEdge(sourceId, targetId, edgeData = {}) {
    if (!this.cy) return null;
    
    try {
      // Check if nodes exist
      const sourceNode = this.cy.$(`#${sourceId}`);
      const targetNode = this.cy.$(`#${targetId}`);
      
      if (!sourceNode || sourceNode.length === 0) {
        throw new Error(`Source node ${sourceId} not found`);
      }
      
      if (!targetNode || targetNode.length === 0) {
        throw new Error(`Target node ${targetId} not found`);
      }
      
      // Check for self-connection
      if (sourceId === targetId) {
        throw new Error(ERRORS.MESSAGES.ERR_EDGE_INVALID);
      }
      
      // Generate edge ID
      const edgeId = `${sourceId}-${targetId}`;
      
      // Check if edge already exists
      const existingEdge = this.cy.$(`#${edgeId}`);
      if (existingEdge && existingEdge.length > 0) {
        return existingEdge;
      }
      
      // Create edge
      const edge = {
        data: {
          id: edgeId,
          source: sourceId,
          target: targetId,
          ...edgeData
        }
      };
      
      // Add to Cytoscape
      this.cy.add({
        group: 'edges',
        data: edge.data
      });
      
      // Store edge data
      this.edges[edgeId] = {
        id: edgeId,
        source: sourceId,
        target: targetId,
        ...edgeData
      };
      
      // Mark graph as modified
      this.markGraphAsModified();
      
      return this.cy.$(`#${edgeId}`);
    } catch (error) {
      this.handleError(error, 'addEdge');
      return null;
    }
  }
  
  /**
   * Remove an edge
   * 
   * @param {string} edgeId - Edge ID
   * @returns {boolean} Success
   */
  removeEdge(edgeId) {
    if (!this.cy) return false;
    
    try {
      // Get Cytoscape edge
      const edge = this.cy.$(`#${edgeId}`);
      if (!edge || edge.length === 0) {
        throw new Error(`Edge ${edgeId} not found`);
      }
      
      // Remove the edge
      this.cy.remove(edge);
      
      // Remove from edges map
      delete this.edges[edgeId];
      
      // Clear selected edge ID if this was the selected edge
      if (this.selectedEdgeId === edgeId) {
        this.selectedEdgeId = null;
      }
      
      // Mark graph as modified
      this.markGraphAsModified();
      
      return true;
    } catch (error) {
      this.handleError(error, 'removeEdge');
      return false;
    }
  }
  
  /**
   * Mark the graph as modified
   */
  markGraphAsModified() {
    if (this.uiManager.graphManager) {
      this.uiManager.graphManager.markAsModified();
    }
  }
  
  /**
   * Handle node added event
   * 
   * @param {Object} data - Event data
   */
  handleNodeAdded(data) {
    // Add node to graph
    this.addNode(data.nodeData || {
      id: data.id,
      name: data.name || 'New Node'
    });
  }
  
  /**
   * Handle node removed event
   * 
   * @param {Object} data - Event data
   */
  handleNodeRemoved(data) {
    this.removeNode(data.id);
  }
  
  /**
   * Handle node updated event
   * 
   * @param {Object} data - Event data
   */
  handleNodeUpdated(data) {
    this.updateNode(data.id, data.nodeData);
  }
  
  /**
   * Handle edge added event
   * 
   * @param {Object} data - Event data
   */
  handleEdgeAdded(data) {
    this.addEdge(data.source, data.target, data);
  }
  
  /**
   * Handle edge removed event
   * 
   * @param {Object} data - Event data
   */
  handleEdgeRemoved(data) {
    this.removeEdge(data.id);
  }
  
  /**
   * Handle node executing event
   * 
   * @param {Object} data - Event data
   */
  handleNodeExecuting(data) {
    if (!this.cy) return;
    
    // Get node
    const node = this.cy.$(`#${data.nodeId}`);
    if (!node || node.length === 0) return;
    
    // Remove other states
    node.removeClass(
      CLASSES.NODES.STATES.COMPLETED,
      CLASSES.NODES.STATES.ERROR
    );
    
    // Add executing class
    node.addClass(CLASSES.NODES.STATES.EXECUTING);
    
    // Highlight incoming edges
    const incomingEdges = node.incomers('edge');
    if (incomingEdges.length > 0) {
      incomingEdges.addClass(CLASSES.EDGES.STATES.EXECUTING);
    }
  }
  
  /**
   * Handle node completed event
   * 
   * @param {Object} data - Event data
   */
  handleNodeCompleted(data) {
    if (!this.cy) return;
    
    // Get node
    const node = this.cy.$(`#${data.nodeId}`);
    if (!node || node.length === 0) return;
    
    // Remove executing class
    node.removeClass(CLASSES.NODES.STATES.EXECUTING);
    
    // Add completed class
    node.addClass(CLASSES.NODES.STATES.COMPLETED);
    
    // Update incoming edges
    const incomingEdges = node.incomers('edge');
    if (incomingEdges.length > 0) {
      incomingEdges.removeClass(CLASSES.EDGES.STATES.EXECUTING);
      incomingEdges.addClass(CLASSES.EDGES.STATES.COMPLETED);
    }
  }
  
  /**
   * Handle node error event
   * 
   * @param {Object} data - Event data
   */
  handleNodeError(data) {
    if (!this.cy) return;
    
    // Get node
    const node = this.cy.$(`#${data.nodeId}`);
    if (!node || node.length === 0) return;
    
    // Remove executing class
    node.removeClass(CLASSES.NODES.STATES.EXECUTING);
    
    // Add error class
    node.addClass(CLASSES.NODES.STATES.ERROR);
    
    // Update incoming edges
    const incomingEdges = node.incomers('edge');
    if (incomingEdges.length > 0) {
      incomingEdges.removeClass(CLASSES.EDGES.STATES.EXECUTING);
      incomingEdges.addClass(CLASSES.EDGES.STATES.ERROR);
    }
  }
  
  /**
   * Handle workflow completed event
   * 
   * @param {Object} data - Event data
   */
  handleWorkflowCompleted(data) {
    if (!this.cy) return;
    
    // Reset all nodes
    setTimeout(() => {
      this.cy.nodes().removeClass(
        CLASSES.NODES.STATES.EXECUTING,
        CLASSES.NODES.STATES.COMPLETED,
        CLASSES.NODES.STATES.ERROR
      );
      
      // Reset all edges
      this.cy.edges().removeClass(
        CLASSES.EDGES.STATES.EXECUTING,
        CLASSES.EDGES.STATES.COMPLETED,
        CLASSES.EDGES.STATES.ERROR
      );
    }, 5000);
  }
  
  /**
   * Handle cycles highlighted event
   * 
   * @param {Object} data - Event data
   */
  handleCyclesHighlighted(data) {
    if (!this.cy || !data.cycles) return;
    
    // Reset cycle classes
    this.cy.nodes().removeClass(CLASSES.NODES.STATES.CYCLE);
    this.cy.edges().removeClass(CLASSES.EDGES.STATES.CYCLE);
    
    // Highlight cycles
    data.cycles.forEach(cycle => {
      for (let i = 0; i < cycle.length; i++) {
        // Highlight nodes
        const nodeId = cycle[i];
        const node = this.cy.$(`#${nodeId}`);
        if (node && node.length > 0) {
          node.addClass(CLASSES.NODES.STATES.CYCLE);
        }
        
        // Highlight edges
        if (i < cycle.length - 1) {
          const edgeId = `${cycle[i]}-${cycle[i + 1]}`;
          const edge = this.cy.$(`#${edgeId}`);
          if (edge && edge.length > 0) {
            edge.addClass(CLASSES.EDGES.STATES.CYCLE);
          }
        }
        
        // Highlight the edge that completes the cycle
        if (i === cycle.length - 1) {
          const edgeId = `${cycle[i]}-${cycle[0]}`;
          const edge = this.cy.$(`#${edgeId}`);
          if (edge && edge.length > 0) {
            edge.addClass(CLASSES.EDGES.STATES.CYCLE);
          }
        }
      }
    });
    
    // Fit view to highlighted cycles
    const cyclicElements = this.cy.$(`.${CLASSES.NODES.STATES.CYCLE}, .${CLASSES.EDGES.STATES.CYCLE}`);
    if (cyclicElements.length > 0) {
      this.cy.fit(cyclicElements, 50);
    }
  }
  
  /**
   * Get graph data for export
   * 
   * @returns {Object} Graph data
   */
  getGraphData() {
    const nodes = [];
    const edges = [];
    
    // Export nodes
    this.cy.nodes().forEach(node => {
      const nodeId = node.id();
      const position = node.position();
      
      nodes.push({
        ...this.nodes[nodeId],
        id: nodeId,
        position: {
          x: position.x,
          y: position.y
        }
      });
    });
    
    // Export edges
    this.cy.edges().forEach(edge => {
      const edgeId = edge.id();
      
      edges.push({
        ...this.edges[edgeId],
        id: edgeId,
        source: edge.source().id(),
        target: edge.target().id()
      });
    });
    
    return {
      nodes,
      edges
    };
  }
  
  /**
   * Import graph data
   * 
   * @param {Object} graphData - Graph data
   */
  importGraph(graphData) {
    if (!this.cy) return;
    
    // Clear existing graph
    this.clear();
    
    // Import nodes first
    if (graphData.nodes) {
      graphData.nodes.forEach(nodeData => {
        this.addNode(nodeData);
      });
    }
    
    // Then import edges
    if (graphData.edges) {
      graphData.edges.forEach(edgeData => {
        try {
          this.addEdge(edgeData.source, edgeData.target, edgeData);
        } catch (error) {
          console.error(`Failed to import edge: ${error.message}`, edgeData);
        }
      });
    }
    
    // Fit graph to view
    this.cy.fit(50);
  }
  
  /**
   * Clear the graph
   */
  clear() {
    if (!this.cy) return;
    
    // Clear Cytoscape graph
    this.cy.elements().remove();
    
    // Clear data
    this.nodes = {};
    this.edges = {};
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
  }
  
  /**
   * Select a node
   * 
   * @param {string} nodeId - Node ID
   * @returns {boolean} Success
   */
  selectNode(nodeId) {
    if (!this.cy) return false;
    
    // Clear current selection
    this.cy.elements().unselect();
    
    // If no node ID, just clear selection
    if (!nodeId) return true;
    
    // Get node
    const node = this.cy.$(`#${nodeId}`);
    if (!node || node.length === 0) return false;
    
    // Select node
    node.select();
    
    // Focus view on node
    this.cy.fit(node, 50);
    
    return true;
  }
  
  /**
   * Get node data
   * 
   * @param {string} nodeId - Node ID
   * @returns {Object|null} Node data
   */
  getNodeData(nodeId) {
    return this.nodes[nodeId] || null;
  }
  
  /**
   * Get all node data
   * 
   * @returns {Object} All node data
   */
  getAllNodeData() {
    return this.nodes;
  }
  
  /**
   * Get edge data
   * 
   * @param {string} edgeId - Edge ID
   * @returns {Object|null} Edge data
   */
  getEdgeData(edgeId) {
    return this.edges[edgeId] || null;
  }
}