/**
 * graph/GraphLayoutManager.js
 * 
 * Manages graph layouts and node positioning.
 */
export class GraphLayoutManager {
    /**
     * @param {GraphManager} graphManager - The parent graph manager
     */
    constructor(graphManager) {
      this.graphManager = graphManager;
      this.layoutOptions = {
        default: {
          name: 'cose',
          animate: true,
          animationDuration: 500,
          refresh: 20,
          fit: true,
          padding: 30,
          randomize: false,
          componentSpacing: 100,
          nodeRepulsion: 400000,
          nodeOverlap: 10,
          idealEdgeLength: 100,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0
        },
        grid: {
          name: 'grid',
          rows: 3,
          columns: 3,
          fit: true,
          padding: 30,
          animate: true,
          animationDuration: 500
        },
        concentric: {
          name: 'concentric',
          fit: true,
          padding: 30,
          startAngle: 3/2 * Math.PI,
          sweep: 2 * Math.PI,
          animate: true,
          animationDuration: 500,
          concentric: function(node) {
            // Sort by connected edges count
            return node.connectedEdges().length;
          },
          levelWidth: function(nodes) {
            // Arrange nodes with the same number of connections in the same level
            return nodes.maxDegree() / 4;
          }
        }
      };
    }
    
    /**
     * Run a layout algorithm on the graph
     * 
     * @param {string} layoutName - Name of the layout to run (default: 'cose')
     * @param {Object} customOptions - Optional custom layout options
     */
    runLayout(layoutName = 'cose', customOptions = {}) {
      // Get basic options for the layout
      const baseOptions = this.layoutOptions[layoutName] || this.layoutOptions.default;
      
      // Merge with custom options
      const layoutOptions = {
        ...baseOptions,
        ...customOptions
      };
      
      // Run the layout
      const layout = this.graphManager.cy.layout(layoutOptions);
      layout.run();
      
      // Mark the graph as modified after layout
      this.graphManager.markAsModified();
    }
    
    /**
     * Get node positions
     * 
     * @returns {Object} Node positions mapping
     */
    getNodePositions() {
      const positions = {};
      this.graphManager.cy.nodes().forEach(node => {
        const position = node.position();
        positions[node.id()] = {
          x: position.x,
          y: position.y
        };
      });
      return positions;
    }
    
    /**
     * Apply node positions
     * 
     * @param {Object} positions - Node positions mapping
     */
    applyNodePositions(positions) {
      if (!positions) return;
      
      Object.keys(positions).forEach(nodeId => {
        const node = this.graphManager.cytoscapeManager.findNode(nodeId);
        if (node.length > 0) {
          node.position(positions[nodeId]);
        }
      });
      
      // Fit the graph to the viewport
      this.graphManager.cy.fit();
    }
    
    /**
     * Arrange nodes in a circle
     */
    arrangeInCircle() {
      this.runLayout('circle');
    }
    
    /**
     * Arrange nodes in a grid
     * 
     * @param {number} rows - Number of rows (optional)
     * @param {number} columns - Number of columns (optional)
     */
    arrangeInGrid(rows, columns) {
      const options = { ...this.layoutOptions.grid };
      
      if (rows) options.rows = rows;
      if (columns) options.columns = columns;
      
      this.runLayout('grid', options);
    }
    
    /**
     * Arrange nodes in a hierarchical layout
     */
    arrangeHierarchical() {
      // Find roots (nodes with no incoming edges)
      const roots = this.graphManager.cy.nodes().filter(node => {
        return node.indegree() === 0;
      });
      
      // Use dagre layout if available
      if (this.graphManager.cy.layout('dagre')) {
        this.runLayout('dagre', {
          rankDir: 'TB', // Top to bottom
          roots: roots
        });
      } else {
        // Fallback to breadthfirst layout
        this.runLayout('breadthfirst', {
          roots: roots,
          directed: true
        });
      }
    }
    
    /**
     * Center the graph in the viewport
     */
    centerGraph() {
      this.graphManager.cy.center();
    }
    
    /**
     * Fit the graph to the viewport
     * 
     * @param {number} padding - Padding around the graph
     */
    fitGraph(padding = 30) {
      this.graphManager.cy.fit(undefined, padding);
    }
    
    /**
     * Get available layout names
     * 
     * @returns {Array} Array of layout names
     */
    getAvailableLayouts() {
      return Object.keys(this.layoutOptions);
    }
}