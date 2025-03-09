/**
 * workflow/WorkflowVisualizer.js
 * 
 * Responsible for visualizing workflow execution, highlighting cycles,
 * and providing visual feedback during workflow execution.
 */
export class WorkflowVisualizer {
    /**
     * @param {WorkflowManager} workflowManager - Parent workflow manager
     */
    constructor(workflowManager) {
      this.workflowManager = workflowManager;
      this.graphManager = null;
      this.eventBus = null;
      this.cy = null;
      
      // Visualization state
      this.activeVisualization = null; // 'execution', 'cycles', etc.
      this.executionState = {
        currentNodeId: null,
        executedNodes: new Set(),
        executionPath: [],
        results: {}
      };
      
      // Style definitions
      this.styles = {
        node: {
          executing: {
            'border-color': '#3498db',
            'border-width': 3,
            'border-opacity': 1,
            'background-opacity': 0.9
          },
          executed: {
            'border-color': '#2ecc71',
            'border-width': 3,
            'border-opacity': 1
          },
          error: {
            'border-color': '#e74c3c',
            'border-width': 3,
            'border-opacity': 1
          },
          cycle: {
            'border-width': 3,
            'border-opacity': 0.8
          }
        },
        edge: {
          executing: {
            'line-color': '#3498db',
            'target-arrow-color': '#3498db',
            'width': 3,
            'arrow-scale': 1.5
          },
          executed: {
            'line-color': '#2ecc71',
            'target-arrow-color': '#2ecc71',
            'width': 3
          },
          error: {
            'line-color': '#e74c3c',
            'target-arrow-color': '#e74c3c',
            'width': 3
          },
          cycle: {
            'width': 3,
            'arrow-scale': 1.3
          }
        }
      };
      
      // Animation options
      this.animations = {
        duration: 300,
        easing: 'ease-in-out-cubic'
      };
    }
    
    /**
     * Initialize the visualizer
     * 
     * @param {GraphManager} graphManager - Graph manager instance
     * @param {EventBus} eventBus - Event bus instance
     */
    initialize(graphManager, eventBus) {
      this.graphManager = graphManager || this.workflowManager.graphManager;
      this.eventBus = eventBus || this.workflowManager.eventBus;
      this.cy = this.graphManager.cy;
      
      // Subscribe to events
      this.subscribeToEvents();
    }
    
    /**
     * Subscribe to relevant events
     */
    subscribeToEvents() {
      this.eventBus.subscribe('workflow:executing', this.handleWorkflowExecuting.bind(this));
      this.eventBus.subscribe('workflow:node-executing', this.handleNodeExecuting.bind(this));
      this.eventBus.subscribe('workflow:node-completed', this.handleNodeCompleted.bind(this));
      this.eventBus.subscribe('workflow:node-error', this.handleNodeError.bind(this));
      this.eventBus.subscribe('workflow:completed', this.handleWorkflowCompleted.bind(this));
      this.eventBus.subscribe('workflow:failed', this.handleWorkflowFailed.bind(this));
      this.eventBus.subscribe('graph:cycles-detected', this.handleCyclesDetected.bind(this));
    }
    
    /**
     * Reset all visualizations and return to default state
     */
    resetVisualization() {
      // Reset execution state
      this.executionState = {
        currentNodeId: null,
        executedNodes: new Set(),
        executionPath: [],
        results: {}
      };
      
      if (!this.cy) return;
      
      // Remove all visualization classes
      this.cy.elements().removeClass('executing executed error cycle path');
      
      // Remove custom styles
      this.cy.elements().removeStyle();
      
      this.activeVisualization = null;
      
      // Publish event
      this.eventBus.publish('visualization:reset');
    }
    
    /**
     * Visualize a workflow execution path
     * 
     * @param {Array} executionPath - Array of node IDs in execution order
     * @param {Object} results - Execution results by node ID
     */
    visualizeExecutionPath(executionPath, results = {}) {
      // Reset any existing visualization
      this.resetVisualization();
      
      if (!this.cy) return;
      
      // Store the execution data
      this.executionState.executionPath = executionPath;
      this.executionState.results = results;
      this.activeVisualization = 'execution';
      
      // Apply classes to all nodes in the path
      executionPath.forEach(nodeId => {
        const node = this.cy.$id(nodeId);
        if (node.length === 0) return;
        
        // Determine node status based on results
        let status = 'executed';
        if (results[nodeId] && typeof results[nodeId] === 'string' && results[nodeId].startsWith('Error')) {
          status = 'error';
        }
        
        // Apply class and style
        node.addClass(status);
        node.addClass('path');
        node.style(this.styles.node[status]);
      });
      
      // Apply styles to edges between consecutive nodes
      for (let i = 0; i < executionPath.length - 1; i++) {
        const sourceId = executionPath[i];
        const targetId = executionPath[i + 1];
        
        // Find edge connecting these nodes
        const edge = this.cy.edges(`[source = "${sourceId}"][target = "${targetId}"]`);
        if (edge.length === 0) continue;
        
        // Determine edge status based on source node
        let status = 'executed';
        if (results[sourceId] && typeof results[sourceId] === 'string' && results[sourceId].startsWith('Error')) {
          status = 'error';
        }
        
        // Apply class and style
        edge.addClass(status);
        edge.addClass('path');
        edge.style(this.styles.edge[status]);
      }
      
      // Focus the view on the execution path
      this.focusOnElements('.path');
      
      // Publish visualization event
      this.eventBus.publish('visualization:execution-path', {
        path: executionPath,
        results
      });
    }
    
    /**
     * Visualize cycles in the graph
     * 
     * @param {Array} cycles - Array of cycles, where each cycle is an array of node IDs
     */
    visualizeCycles(cycles) {
      // Reset any existing visualization
      this.resetVisualization();
      
      if (!this.cy || !cycles || cycles.length === 0) {
        console.warn('No cycles to visualize or cytoscape instance not available');
        return;
      }
      
      this.activeVisualization = 'cycles';
      
      // Colors for different cycles
      const cycleColors = [
        '#e74c3c', // Red
        '#e67e22', // Orange
        '#f1c40f', // Yellow
        '#9b59b6', // Purple
        '#3498db'  // Blue
      ];
      
      // Highlight each cycle with a different color
      cycles.forEach((cycle, index) => {
        const color = cycleColors[index % cycleColors.length];
        
        // Highlight nodes in the cycle
        cycle.forEach(nodeId => {
          const node = this.cy.$id(nodeId);
          if (node.length === 0) return;
          
          node.addClass('cycle');
          node.style({
            ...this.styles.node.cycle,
            'border-color': color
          });
        });
        
        // Highlight edges in the cycle
        for (let i = 0; i < cycle.length - 1; i++) {
          const sourceId = cycle[i];
          const targetId = cycle[i + 1];
          
          // Handle the closing edge from last to first node
          if (i === cycle.length - 2 && targetId === cycle[0]) {
            const edge = this.cy.edges(`[source = "${sourceId}"][target = "${targetId}"]`);
            if (edge.length === 0) continue;
            
            edge.addClass('cycle');
            edge.style({
              ...this.styles.edge.cycle,
              'line-color': color,
              'target-arrow-color': color
            });
          } else {
            const edge = this.cy.edges(`[source = "${sourceId}"][target = "${targetId}"]`);
            if (edge.length === 0) continue;
            
            edge.addClass('cycle');
            edge.style({
              ...this.styles.edge.cycle,
              'line-color': color,
              'target-arrow-color': color
            });
          }
        }
      });
      
      // Focus the view on the cycles
      this.focusOnElements('.cycle');
      
      // Add cycle labels
      this.addCycleLabels(cycles);
      
      // Publish visualization event
      this.eventBus.publish('visualization:cycles', {
        cycles
      });
    }
    
    /**
     * Add labels to cycles to identify them
     * 
     * @param {Array} cycles - Array of cycles
     */
    addCycleLabels(cycles) {
      // If the graph supports overlays, add cycle labels
      if (this.cy && this.cy.overlay) {
        cycles.forEach((cycle, index) => {
          // Find a good position for the label (average position of cycle nodes)
          const positions = cycle.map(nodeId => {
            const node = this.cy.$id(nodeId);
            return node.length > 0 ? node.position() : null;
          }).filter(p => p !== null);
          
          if (positions.length === 0) return;
          
          // Calculate average position
          const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
          const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
          
          // Add label
          this.cy.overlay({
            id: `cycle-${index}-label`,
            type: 'text',
            position: { x: avgX, y: avgY },
            content: `Cycle ${index + 1}`,
            style: {
              'color': '#fff',
              'background-color': '#34495e',
              'padding': '5px 10px',
              'border-radius': '10px',
              'font-size': '12px',
              'font-weight': 'bold',
              'z-index': 1000
            }
          });
        });
      }
    }
    
    /**
     * Show the real-time execution of a node
     * 
     * @param {string} nodeId - ID of the executing node
     */
    showNodeExecution(nodeId) {
      if (!this.cy) return;
      
      // Reset previous executing node if any
      if (this.executionState.currentNodeId && this.executionState.currentNodeId !== nodeId) {
        const prevNode = this.cy.$id(this.executionState.currentNodeId);
        if (prevNode.length > 0) {
          // If the node was executed successfully, mark it as executed
          if (this.executionState.executedNodes.has(this.executionState.currentNodeId)) {
            prevNode.removeClass('executing');
            prevNode.addClass('executed');
            prevNode.style(this.styles.node.executed);
          } else {
            // Otherwise, remove execution styles
            prevNode.removeClass('executing');
            prevNode.removeStyle();
          }
        }
      }
      
      // Mark new node as executing
      const node = this.cy.$id(nodeId);
      if (node.length > 0) {
        node.removeClass('executed error');
        node.addClass('executing');
        node.style(this.styles.node.executing);
        
        // Create pulsing animation if browser supports it
        if (node.animation) {
          node.animation({
            style: { 'border-width': 5 },
            duration: 800
          })
          .animation({
            style: { 'border-width': 3 },
            duration: 800
          })
          .play().repeat().sync();
        }
        
        // Center view on the executing node
        this.cy.animate({
          center: { eles: node },
          duration: this.animations.duration,
          easing: this.animations.easing
        });
      }
      
      // Update execution state
      this.executionState.currentNodeId = nodeId;
    }
    
    /**
     * Focus the view on a set of elements
     * 
     * @param {string|Object} selector - Elements to focus on
     */
    focusOnElements(selector) {
      if (!this.cy) return;
      
      const elements = typeof selector === 'string' ? 
        this.cy.$(selector) : selector;
        
      if (elements.length === 0) return;
      
      // Fit view with padding
      this.cy.animate({
        fit: {
          eles: elements,
          padding: 50
        },
        duration: this.animations.duration,
        easing: this.animations.easing
      });
    }
    
    /**
     * Handle workflow executing event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowExecuting(data) {
      // Reset any existing visualization
      this.resetVisualization();
      
      // Mark that we're now visualizing execution
      this.activeVisualization = 'execution';
    }
    
    /**
     * Handle node executing event
     * 
     * @param {Object} data - Event data
     */
    handleNodeExecuting(data) {
      const { nodeId } = data;
      
      // Show node execution
      this.showNodeExecution(nodeId);
    }
    
    /**
     * Handle node completed event
     * 
     * @param {Object} data - Event data
     */
    handleNodeCompleted(data) {
      const { nodeId, result } = data;
      
      // Store the result
      this.executionState.results[nodeId] = result;
      
      // Mark node as executed
      this.executionState.executedNodes.add(nodeId);
      
      if (!this.cy) return;
      
      // Update node visualization if it's the current executing node
      if (this.executionState.currentNodeId === nodeId) {
        const node = this.cy.$id(nodeId);
        if (node.length > 0) {
          // Stop any running animations
          if (node.stop) {
            node.stop();
          }
          
          // Update style
          node.removeClass('executing');
          node.addClass('executed');
          node.style(this.styles.node.executed);
        }
      }
    }
    
    /**
     * Handle node error event
     * 
     * @param {Object} data - Event data
     */
    handleNodeError(data) {
      const { nodeId, error } = data;
      
      // Store the error as result
      this.executionState.results[nodeId] = `Error: ${error}`;
      
      // Mark node as executed with error
      this.executionState.executedNodes.add(nodeId);
      
      if (!this.cy) return;
      
      // Update node visualization
      const node = this.cy.$id(nodeId);
      if (node.length > 0) {
        // Stop any running animations
        if (node.stop) {
          node.stop();
        }
        
        // Update style
        node.removeClass('executing');
        node.addClass('error');
        node.style(this.styles.node.error);
      }
    }
    
    /**
     * Handle workflow completed event
     * 
     * @param {Object} data - Event data
     */
        // In WorkflowVisualizer.js
        handleWorkflowCompleted(data) {
            console.log("Workflow completed: ", data);
            
            // Ensure we have valid data to work with
            if (!data) return;
            
            // Handle different data formats
            const executionOrder = Array.isArray(data.executionOrder) ? 
            data.executionOrder : 
            (Array.isArray(data.execution_order) ? data.execution_order : []);
            
            const results = data.results || {};
            
            // Visualize the complete execution path
            this.visualizeExecutionPath(
            executionOrder, 
            results
            );
        }
    
    /**
     * Handle workflow failed event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowFailed(data) {
      // If cycles caused the failure, visualize them
      if (data.error && data.error.includes('cycles')) {
        if (data.cycles) {
          this.visualizeCycles(data.cycles);
        }
      }
    }
    
    /**
     * Handle cycles detected event
     * 
     * @param {Object} data - Event data
     */
    handleCyclesDetected(data) {
      // Visualize detected cycles
      if (data.cycles) {
        this.visualizeCycles(data.cycles);
      }
    }
    
    /**
     * Get static image of current visualization as data URL
     * 
     * @returns {string|null} Base64 PNG data URL or null if not supported
     */
    getVisualizationImage() {
      if (!this.cy || !this.cy.png) return null;
      
      return this.cy.png({
        output: 'base64uri',
        bg: 'white',
        full: true
      });
    }
}