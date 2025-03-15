/**
 * ui/NodeOperationsManager.js
 * 
 * Manages operations that can be performed on nodes, such as
 * editing nodes, removing nodes, clearing conversations, creating connections,
 * and displaying node information.
 */
export class NodeOperationsManager {
  /**
   * @param {UIManager} uiManager - The parent UI manager
   */
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.operationsContainer = null;
    this.activeEdgeRemoveButton = null;
  }
  
  /**
   * Initialize the node operations manager
   */
  initialize() {
    // Set up node operations container
    this.setupNodeOperations();
  }
  
  /**
   * Set up node operations container
   */
  setupNodeOperations() {
    // Find the node-info container
    const nodeInfoContainer = document.querySelector('.node-info');
    
    if (!nodeInfoContainer) {
      console.error('Node info container not found');
      return;
    }
    
    // Create node operations container if it doesn't exist
    if (!document.getElementById('node-operations')) {
      const nodeOpsContainer = document.createElement('div');
      nodeOpsContainer.id = 'node-operations';
      nodeOpsContainer.className = 'node-operations';
      nodeInfoContainer.appendChild(nodeOpsContainer);
      
      // Store reference
      this.operationsContainer = nodeOpsContainer;
    } else {
      // Store reference to existing container
      this.operationsContainer = document.getElementById('node-operations');
    }
  }
  
  /**
   * Update node operations panel for selected node
   * 
   * @param {string} nodeId - ID of the selected node
   */
  updateNodeOperations(nodeId) {
    // Make sure we have the operations container
    if (!this.operationsContainer) {
      this.setupNodeOperations();
      if (!this.operationsContainer) {
        console.error('Failed to set up node operations container');
        return;
      }
    }
    
    // Clear existing operations
    this.clearNodeOperations();
    
    // Exit if no nodeId provided
    if (!nodeId) return;
    
    // Get node data
    const nodeData = this.uiManager.graphManager.getNodeData(nodeId);
    if (!nodeData) return;
    
    // Set the node name in the header if exists
    const headerElement = document.querySelector('.node-ops-header h3');
    if (headerElement) {
      headerElement.textContent = nodeData.name;
    }
    
    // Add Edit Node button
    this.addOperationButton('Edit Node', () => {
      // Call the NodeModalManager to show edit form
      this.uiManager.nodeModalManager.showEditNodeModal(nodeId);
    });
    
    // Add operation buttons
    this.addOperationButton('Remove Node', () => {
      if (confirm('Are you sure you want to remove this node?')) {
        this.uiManager.graphManager.removeNode(nodeId);
      }
    });
    
    this.addOperationButton('Clear Conversation', () => {
      if (confirm('Are you sure you want to clear this conversation?')) {
        this.uiManager.conversationManager.clearConversation(nodeId);
      }
    });
    
    this.addOperationButton('Add Connection', () => {
      // Start edge drawing mode
      this.startEdgeDrawingMode(nodeId);
    });
    
    // Add model limits info for Groq nodes
    if (nodeData && nodeData.backend === 'groq') {
      this.addModelLimitsInfo(nodeData.model);
    }
  }
  
  /**
   * Clear node operations panel
   */
  clearNodeOperations() {
    if (this.operationsContainer) {
      this.operationsContainer.innerHTML = '';
    }
  }
  
  /**
   * Add an operation button to the panel
   * 
   * @param {string} text - Button text
   * @param {Function} callback - Click callback
   * @returns {HTMLElement} The button element
   */
  addOperationButton(text, callback) {
    // Make sure we have the operations container
    if (!this.operationsContainer) {
      console.error('Node operations container not available');
      return null;
    }
    
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'node-op-btn';
    button.addEventListener('click', callback);
    this.operationsContainer.appendChild(button);
    return button;
  }
  
  /**
   * Add model limits info for Groq models
   * 
   * @param {string} model - The model name
   */
  addModelLimitsInfo(model) {
    // Make sure we have the operations container
    if (!this.operationsContainer) {
      return;
    }
    
    const limits = this.uiManager.modelRegistry.getModelLimits(model);
    if (!limits) return;
    
    const limitsInfo = document.createElement('div');
    limitsInfo.className = 'model-limits-info';
    limitsInfo.innerHTML = `
      <h4>Model Limits</h4>
      <div class="limits-grid">
        <div>Requests:</div>
        <div>${limits.req_per_min}/min, ${limits.req_per_day}/day</div>
        <div>Tokens:</div>
        <div>${limits.tokens_per_min}/min, ${limits.tokens_per_day === "No limit" ? "No limit/day" : limits.tokens_per_day + "/day"}</div>
      </div>
    `;
    this.operationsContainer.appendChild(limitsInfo);
  }
  
  /**
   * Start edge drawing mode for creating connections
   * 
   * @param {string} sourceNodeId - ID of the source node
   */
  startEdgeDrawingMode(sourceNodeId) {
    const { graphManager } = this.uiManager;
    
    if (!graphManager || !graphManager.cy) {
      console.error('Graph manager or Cytoscape instance not available');
      return;
    }
    
    // Configure Cytoscape for selection
    graphManager.cy.edges().unselectify();
    graphManager.cy.nodes().selectify();
    
    const sourceNode = graphManager.cy.$(`#${sourceNodeId}`);
    if (!sourceNode || sourceNode.length === 0) {
      console.error(`Source node with ID ${sourceNodeId} not found`);
      return;
    }
    
    // Change button text to indicate mode
    const button = this.operationsContainer.querySelector('button:nth-child(4)');
    if (button) {
      button.textContent = 'Select Target Node...';
      button.classList.add('active-operation');
    }
    
    // Track if connection was made
    let connectionMade = false;
    
    // One-time event for selecting target node
    const selectTargetHandler = (event) => {
      if (event.target !== graphManager.cy && event.target.isNode()) {
        const targetNode = event.target;
        const targetNodeId = targetNode.id();
        
        // Don't allow self-connections
        if (targetNodeId !== sourceNodeId) {
          // Check if adding this edge would create a cycle
          if (graphManager.workflowManager && 
              graphManager.workflowManager.wouldCreateCycle && 
              graphManager.workflowManager.wouldCreateCycle(sourceNodeId, targetNodeId)) {
            
            // Ask for confirmation
            if (!confirm('This connection would create a cycle in the graph, which may cause issues with workflow execution. Add anyway?')) {
              // Clean up and exit without adding the edge
              cleanup();
              return;
            }
          }
          
          // Add the edge
          graphManager.addEdge(sourceNodeId, targetNodeId);
          connectionMade = true;
          
          // Show success notification
          this.uiManager.showNotification('Connection created successfully');
        } else {
          // Show error for self-connections
          this.uiManager.showNotification('Cannot connect a node to itself', 'error');
        }
        
        // Clean up
        cleanup();
      }
    };
    
    // Function to clean up event handlers and reset UI
    const cleanup = () => {
      // Remove the event listener
      graphManager.cy.off('tap', selectTargetHandler);
      
      // Reset Cytoscape selection state
      graphManager.cy.nodes().unselectify();
      graphManager.cy.edges().selectify();
      
      // Reset button
      if (button) {
        button.textContent = 'Add Connection';
        button.classList.remove('active-operation');
      }
      
      // Show notification if no connection was made
      if (!connectionMade) {
        this.uiManager.showNotification('Connection creation cancelled', 'info');
      }
    };
    
    // Add the event handler
    graphManager.cy.on('tap', selectTargetHandler);
    
    // Also listen for a single click on the background to cancel
    const cancelHandler = (event) => {
      if (event.target === graphManager.cy) {
        cleanup();
        graphManager.cy.off('tap', cancelHandler);
      }
    };
    
    graphManager.cy.on('tap', cancelHandler);
  }
  
  /**
   * Show a temporary button to remove an edge
   * 
   * @param {Object} data - Edge data including position
   */
  showEdgeRemoveButton(data) {
    // Remove any existing buttons
    if (this.activeEdgeRemoveButton && document.body.contains(this.activeEdgeRemoveButton)) {
      document.body.removeChild(this.activeEdgeRemoveButton);
    }
    
    // Create a floating button to remove the edge
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove Connection';
    removeBtn.className = 'floating-edge-btn';
    
    // Position near the edge
    const position = data.position;
    removeBtn.style.position = 'absolute';
    removeBtn.style.left = position.x + 'px';
    removeBtn.style.top = position.y + 'px';
    removeBtn.style.zIndex = '1000';
    
    // Add click handler
    removeBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to remove this connection?')) {
        this.uiManager.graphManager.removeEdge(data.id);
        
        // Show success notification
        this.uiManager.showNotification('Connection removed successfully');
        
        // Remove the button
        if (document.body.contains(removeBtn)) {
          document.body.removeChild(removeBtn);
        }
      }
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(removeBtn)) {
        document.body.removeChild(removeBtn);
        this.activeEdgeRemoveButton = null;
      }
    }, 3000);
    
    // Add to document
    document.body.appendChild(removeBtn);
    
    // Store reference to the active button
    this.activeEdgeRemoveButton = removeBtn;
  }
  
  /**
   * Highlight nodes in the workflow execution path
   * 
   * @param {Array} nodeIds - Array of node IDs in the execution path
   */
  highlightExecutionPath(nodeIds) {
    const { graphManager } = this.uiManager;
    
    if (!graphManager || !graphManager.cy) {
      console.error('Graph manager or Cytoscape instance not available');
      return;
    }
    
    // Reset any existing highlights
    graphManager.cy.$('.highlighted').removeClass('highlighted');
    
    // Add highlighting class to each node in the path
    nodeIds.forEach(nodeId => {
      const node = graphManager.cy.$(`#${nodeId}`);
      if (node && node.length > 0) {
        node.addClass('highlighted');
      }
    });
    
    // Highlight edges between consecutive nodes
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const edgeId = `${nodeIds[i]}-${nodeIds[i+1]}`;
      const edge = graphManager.cy.$(`#${edgeId}`);
      if (edge && edge.length > 0) {
        edge.addClass('highlighted');
      }
    }
  }
}