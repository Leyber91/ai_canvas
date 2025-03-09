/**
 * graph/CytoscapeManager.js
 * 
 * Manages the Cytoscape.js instance and related functionality.
 */
export class CytoscapeManager {
    /**
     * @param {GraphManager} graphManager - The parent graph manager
     */
    constructor(graphManager) {
      this.graphManager = graphManager;
      this.cy = null;
    }
    
    /**
     * Initialize the Cytoscape instance
     */
    async initialize() {
      this.cy = cytoscape({
        container: document.getElementById('cy'),
        style: this.getGraphStyle(),
        layout: {
          name: 'grid',
          rows: 2
        },
        wheelSensitivity: 0.2
      });
      
      // Add event listeners
      this.setupEventListeners();
      
      return this.cy;
    }
    
    /**
     * Get the graph style definition for Cytoscape
     * 
     * @returns {Array} Cytoscape style array
     */
    getGraphStyle() {
      return [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(name)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'width': '120px',
            'height': '40px',
            'shape': 'round-rectangle',
            'text-wrap': 'ellipsis',
            'text-max-width': '100px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.8
          }
        },
        {
          selector: '.selected',
          style: {
            'border-width': 3,
            'border-color': '#e74c3c'
          }
        },
        {
          selector: '.hovered',
          style: {
            'border-width': 2,
            'border-color': '#3498db'
          }
        },
        {
          selector: '.ollama-node',
          style: {
            'background-color': '#3498db'
          }
        },
        {
          selector: '.groq-node',
          style: {
            'background-color': '#9b59b6'
          }
        }
      ];
    }
    
    /**
     * Set up event listeners for the Cytoscape instance
     */
    setupEventListeners() {
      const { eventBus } = this.graphManager;
      
      // Node selection
      this.cy.on('tap', 'node', (event) => {
        const node = event.target;
        this.graphManager.selectNode(node.id());
      });
      
      // Background click - deselect nodes
      this.cy.on('tap', (event) => {
        if (event.target === this.cy) {
          this.graphManager.deselectNode();
        }
      });
      
      // Edge selection
      this.cy.on('tap', 'edge', (event) => {
        const edge = event.target;
        eventBus.publish('edge:selected', {
          id: edge.id(),
          source: edge.source().id(),
          target: edge.target().id(),
          position: event.renderedPosition
        });
      });
      
      // Hover effects
      this.cy.on('mouseover', 'node', (event) => {
        const node = event.target;
        node.addClass('hovered');
      });
      
      this.cy.on('mouseout', 'node', (event) => {
        const node = event.target;
        node.removeClass('hovered');
      });
      
      // Track node movements to mark graph as modified
      this.cy.on('position', 'node', () => {
        this.graphManager.markAsModified();
      });
    }
    
    /**
     * Add a node to the Cytoscape instance
     * 
     * @param {string} id - Node ID
     * @param {Object} data - Node data
     * @param {string} classes - Node CSS classes
     * @param {Object} position - Node position
     * @returns {Object} Added node
     */
    addNode(id, data, classes, position = null) {
      // Default position if none provided
      const nodePosition = position || {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50
      };
      
      // Add node to Cytoscape
      return this.cy.add({
        group: 'nodes',
        data,
        classes,
        position: nodePosition
      });
    }
    
    /**
     * Add an edge to the Cytoscape instance
     * 
     * @param {string} id - Edge ID
     * @param {string} sourceId - Source node ID
     * @param {string} targetId - Target node ID
     * @returns {Object} Added edge
     */
    addEdge(id, sourceId, targetId) {
      return this.cy.add({
        group: 'edges',
        data: {
          id,
          source: sourceId,
          target: targetId
        }
      });
    }
    
    /**
     * Remove an element (node or edge) from the Cytoscape instance
     * 
     * @param {string} id - Element ID
     */
    removeElement(id) {
      this.cy.remove(`#${id}`);
    }
    
    /**
     * Clear all elements from the Cytoscape instance
     */
    clearAll() {
      this.cy.elements().remove();
    }
    
    /**
     * Find a node in the Cytoscape instance
     * 
     * @param {string} nodeId - Node ID
     * @returns {Object} Cytoscape node object or null collection
     */
    findNode(nodeId) {
      return this.cy.$(`#${nodeId}`);
    }
    
    /**
     * Find an edge in the Cytoscape instance
     * 
     * @param {string} edgeId - Edge ID
     * @returns {Object} Cytoscape edge object or null collection
     */
    findEdge(edgeId) {
      return this.cy.$(`#${edgeId}`);
    }
    
    /**
     * Find edges connecting to a specific node
     * 
     * @param {string} nodeId - Node ID
     * @param {string} direction - 'incoming', 'outgoing', or 'both'
     * @returns {Object} Collection of edges
     */
    findConnectedEdges(nodeId, direction = 'both') {
      if (direction === 'incoming') {
        return this.cy.edges(`[target = "${nodeId}"]`);
      } else if (direction === 'outgoing') {
        return this.cy.edges(`[source = "${nodeId}"]`);
      } else {
        return this.cy.$(`#${nodeId}`).connectedEdges();
      }
    }
    
    /**
     * Select a node
     * 
     * @param {string} nodeId - Node ID
     */
    selectNode(nodeId) {
      this.cy.$('.selected').removeClass('selected');
      this.cy.$(`#${nodeId}`).addClass('selected');
    }
    
    /**
     * Clear selection
     */
    clearSelection() {
      this.cy.$('.selected').removeClass('selected');
    }
    
    /**
     * Highlight a path in the graph
     * 
     * @param {Array} nodeIds - Array of node IDs in the path
     * @param {string} className - CSS class to add
     */
    highlightPath(nodeIds, className = 'highlighted') {
      // Clear previous highlights
      this.cy.$(`.${className}`).removeClass(className);
      
      // Highlight nodes
      nodeIds.forEach(id => this.cy.$(`#${id}`).addClass(className));
      
      // Highlight edges between consecutive nodes
      for (let i = 0; i < nodeIds.length - 1; i++) {
        const edgeId = `${nodeIds[i]}-${nodeIds[i+1]}`;
        this.cy.$(`#${edgeId}`).addClass(className);
      }
    }
    
    /**
     * Get all current nodes as Cytoscape collection
     * 
     * @returns {Object} Cytoscape node collection
     */
    getAllNodeElements() {
      return this.cy.nodes();
    }
    
    /**
     * Get all current edges as Cytoscape collection
     * 
     * @returns {Object} Cytoscape edge collection
     */
    getAllEdgeElements() {
      return this.cy.edges();
    }
}