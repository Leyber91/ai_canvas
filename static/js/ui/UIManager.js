/**
 * ui/UIManager.js
 * 
 * Core UI manager that coordinates the other UI components.
 */
import { NodeModalManager } from './NodeModalManager.js';
import { ConversationPanelManager } from './ConversationPanelManager.js';
import { GraphControlsManager } from './GraphControlsManager.js';
import { NodeOperationsManager } from './NodeOperationsManager.js';
import { DialogManager } from './DialogManager.js';
import { NotificationManager } from './NotificationManager.js';
import { WorkflowPanelManager } from './WorkflowPanelManager.js';

export class UIManager {
    constructor(eventBus, graphManager, conversationManager, modelRegistry, workflowManager, errorHandler) {
      this.eventBus = eventBus;
      this.graphManager = graphManager;
      this.conversationManager = conversationManager;
      this.modelRegistry = modelRegistry;
      this.workflowManager = workflowManager;
      this.errorHandler = errorHandler;
      
      // Store DOM references
      this.elements = {};
      
      // Create sub-managers
      this.nodeModalManager = new NodeModalManager(this);
      this.conversationPanelManager = new ConversationPanelManager(this);
      this.graphControlsManager = new GraphControlsManager(this);
      this.nodeOperationsManager = new NodeOperationsManager(this);
      this.dialogManager = new DialogManager(this);
      this.notificationManager = new NotificationManager();
      this.workflowPanelManager = new WorkflowPanelManager(this);
      
      // Subscribe to events
      this.subscribeToEvents();
    }
    
    /**
     * Initialize the UI Manager and all sub-managers
     */
    async initialize() {
      // Get references to DOM elements
      this.findDOMElements();
      
      // Initialize sub-managers
      this.nodeModalManager.initialize();
      this.conversationPanelManager.initialize();
      this.graphControlsManager.initialize();
      this.nodeOperationsManager.initialize();
      this.workflowPanelManager.initialize();
      
      // Set up global event listeners
      this.setupEventListeners();
      
      // Add reset database button
      this.graphControlsManager.addResetDbButton();
      
      // Hide the original execute button since we use the one in workflow panel
      if (this.elements.executeWorkflowBtn) {
        this.elements.executeWorkflowBtn.style.display = 'none';
      }
      
      console.log('UI Manager initialized');
    }
    
    /**
     * Find all required DOM elements
     */
    findDOMElements() {
      // Buttons
      this.elements.addNodeBtn = document.getElementById('add-node-btn');
      this.elements.saveGraphBtn = document.getElementById('save-graph-btn');
      this.elements.loadGraphBtn = document.getElementById('load-graph-btn');
      this.elements.executeWorkflowBtn = document.getElementById('execute-workflow-btn');
      
      // Modal elements
      this.elements.nodeModal = document.getElementById('node-modal');
      this.elements.nodeForm = document.getElementById('node-form');
      this.elements.closeModalBtn = document.querySelector('.close');
      this.elements.cancelBtn = document.getElementById('cancel-btn');
      
      // Form elements
      this.elements.backendSelect = document.getElementById('backend-select');
      this.elements.modelSelect = document.getElementById('model-select');
      this.elements.temperatureInput = document.getElementById('temperature');
      this.elements.temperatureValue = document.getElementById('temperature-value');
      
      // Conversation panel
      this.elements.activeNodeTitle = document.getElementById('active-node-title');
      this.elements.nodeDetails = document.getElementById('node-details');
      this.elements.chatMessages = document.getElementById('chat-messages');
      this.elements.chatInput = document.getElementById('chat-input');
      this.elements.sendBtn = document.getElementById('send-btn');
      
      // Workflow panel container
      this.elements.workflowControls = document.querySelector('.workflow-controls');
      
      // Check for missing elements and handle gracefully
      const missingElements = Object.entries(this.elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);
      
      if (missingElements.length > 0) {
        console.warn(`Missing DOM elements: ${missingElements.join(', ')}`);
      }
    }
    
    /**
     * Subscribe to required events
     */
    subscribeToEvents() {
      // Node events
      this.eventBus.subscribe('node:selected', this.handleNodeSelected, this);
      this.eventBus.subscribe('node:deselected', this.handleNodeDeselected, this);
      this.eventBus.subscribe('node:added', this.handleNodeAdded, this);
      this.eventBus.subscribe('node:removed', this.handleNodeRemoved, this);
      
      // Edge events
      this.eventBus.subscribe('edge:selected', this.handleEdgeSelected, this);
      
      // Graph events
      this.eventBus.subscribe('graph:loaded', this.handleGraphLoaded, this);
      this.eventBus.subscribe('graph:saved', this.handleGraphSaved, this);
      this.eventBus.subscribe('graph:cleared', this.handleGraphCleared, this);
      this.eventBus.subscribe('graph:current-changed', this.handleGraphChanged, this);
      this.eventBus.subscribe('graph:modified', this.handleGraphModified, this);
      this.eventBus.subscribe('graph:cycles-highlighted', this.handleCyclesHighlighted, this);
      this.eventBus.subscribe('graph:cycles-broken', this.handleCyclesBroken, this);
      
      // Models events
      this.eventBus.subscribe('models:loaded', this.handleModelsLoaded, this);
      this.eventBus.subscribe('models:updated', this.handleModelsUpdated, this);
      
      // Workflow events
      this.eventBus.subscribe('workflow:executing', this.handleWorkflowExecuting, this);
      this.eventBus.subscribe('workflow:node-executing', this.handleNodeExecuting, this);
      this.eventBus.subscribe('workflow:node-completed', this.handleNodeCompleted, this);
      this.eventBus.subscribe('workflow:node-error', this.handleNodeError, this);
      this.eventBus.subscribe('workflow:completed', this.handleWorkflowCompleted, this);
      this.eventBus.subscribe('workflow:failed', this.handleWorkflowFailed, this);
      this.eventBus.subscribe('workflow:invalid', this.handleWorkflowInvalid, this);
      
      // Error events
      this.eventBus.subscribe('error', this.handleError, this);
      
      // API events
      this.eventBus.subscribe('api:request:start', this.handleAPIRequestStart, this);
      this.eventBus.subscribe('api:request:end', this.handleAPIRequestEnd, this);
    }
    
    /**
     * Set up global DOM event listeners
     */
    setupEventListeners() {
      // Safely add event listeners only if elements exist
      if (this.elements.addNodeBtn) {
        this.elements.addNodeBtn.addEventListener('click', () => this.nodeModalManager.showNodeModal());
      }
      
      if (this.elements.saveGraphBtn) {
        this.elements.saveGraphBtn.addEventListener('click', () => this.graphControlsManager.saveGraph(false));
      }
      
      if (this.elements.loadGraphBtn) {
        this.elements.loadGraphBtn.addEventListener('click', () => this.graphControlsManager.loadGraph());
      }
      
      if (this.elements.executeWorkflowBtn) {
        this.elements.executeWorkflowBtn.addEventListener('click', () => this.workflowPanelManager.executeWorkflow());
      }
      
      // Add keyboard shortcuts
      document.addEventListener('keydown', (event) => {
        // Ctrl+S to save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
          this.graphControlsManager.saveGraph(false);
        }
        
        // Escape to close modals
        if (event.key === 'Escape') {
          this.nodeModalManager.hideNodeModal();
          this.dialogManager.hideActiveDialog();
        }
      });
    }
    
    /**
     * Handle node selected event
     * 
     * @param {Object} nodeData - Data for the selected node
     */
    handleNodeSelected(nodeData) {
      // Ensure we have the necessary DOM elements
      if (!this.elements.activeNodeTitle || !this.elements.nodeDetails) {
        console.error('Missing DOM elements for node display');
        return;
      }
      
      // Update UI
      this.elements.activeNodeTitle.textContent = nodeData.name;
      this.elements.nodeDetails.innerHTML = `
        <p><strong>Backend:</strong> ${nodeData.backend}</p>
        <p><strong>Model:</strong> ${nodeData.model}</p>
        <p><strong>System Message:</strong> ${nodeData.systemMessage}</p>
      `;
      
      // Enable chat input via conversation panel manager
      this.conversationPanelManager.enableChat();
      
      // Update node operations safely
      this.nodeOperationsManager.updateNodeOperations(nodeData.id);
    }
    
    /**
     * Handle node deselected event
     */
    handleNodeDeselected() {
      // Ensure we have the necessary DOM elements
      if (!this.elements.activeNodeTitle || !this.elements.nodeDetails) {
        console.error('Missing DOM elements for node display');
        return;
      }
      
      // Update UI
      this.elements.activeNodeTitle.textContent = 'No Active Node';
      this.elements.nodeDetails.innerHTML = '<p>Select a node to view details</p>';
      
      // Disable chat input via conversation panel manager
      this.conversationPanelManager.disableChat();
      
      // Clear node operations
      this.nodeOperationsManager.clearNodeOperations();
    }
    
    /**
     * Handle node added event
     * 
     * @param {Object} data - Node data
     */
    handleNodeAdded(data) {
      console.log(`Node added: ${data.id}`);
      this.showNotification(`Node "${data.nodeData?.name || data.id}" added`, 'success');
    }
    
    /**
     * Handle node removed event
     * 
     * @param {Object} data - Node data
     */
    handleNodeRemoved(data) {
      console.log(`Node removed: ${data.id}`);
      this.showNotification(`Node removed: ${data.id}`, 'info');
    }
    
    /**
     * Handle edge selected event
     * 
     * @param {Object} data - Edge data
     */
    handleEdgeSelected(data) {
      this.nodeOperationsManager.showEdgeRemoveButton(data);
    }
    
    /**
     * Handle graph loaded event
     * 
     * @param {Object} graphData - Loaded graph data
     */
    handleGraphLoaded(graphData) {
      console.log(`Graph loaded: ${graphData.name}`);
      this.graphControlsManager.updateGraphStatus(graphData.name, false);
      this.showNotification(`Graph "${graphData.name}" loaded successfully`, 'success');
      
      // Update workflow panel
      this.workflowPanelManager.updateGraphInfo(graphData);
    }
    
    /**
     * Handle graph saved event
     * 
     * @param {Object} data - Saved graph data
     */
    handleGraphSaved(data) {
      console.log(`Graph saved: ${data.name}`);
      this.graphControlsManager.updateGraphStatus(data.name, false);
      this.showNotification(`Graph "${data.name}" saved successfully`, 'success');
      
      // Update workflow panel
      this.workflowPanelManager.updateGraphInfo(data);
    }
    
    /**
     * Handle graph cleared event
     */
    handleGraphCleared() {
      console.log('Graph cleared');
      this.graphControlsManager.updateGraphStatus(null, false);
      
      // Reset workflow panel
      this.workflowPanelManager.resetPanel();
    }
    
    /**
     * Handle graph changed event
     */
    handleGraphChanged(data) {
      if (data && data.name) {
        this.graphControlsManager.updateGraphStatus(data.name, false);
        
        // Update workflow panel
        this.workflowPanelManager.updateGraphInfo(data);
      } else {
        this.graphControlsManager.updateGraphStatus(null, false);
      }
    }
    
    /**
     * Handle graph modified event
     */
    handleGraphModified() {
      this.graphControlsManager.updateGraphStatus(null, true);
    }
    
    /**
     * Handle cycles highlighted event
     */
    handleCyclesHighlighted(data) {
      const cycleCount = data.cycles?.length || 0;
      if (cycleCount > 0) {
        this.showNotification(`${cycleCount} cycle${cycleCount > 1 ? 's' : ''} found in the graph`, 'warning');
      }
    }
    
    /**
     * Handle cycles broken event
     */
    handleCyclesBroken(data) {
      const removedEdges = data.removedEdges?.length || 0;
      if (removedEdges > 0) {
        this.showNotification(`Removed ${removedEdges} connection${removedEdges > 1 ? 's' : ''} to break cycles`, 'info');
      }
    }
    
    /**
     * Handle models loaded event
     * 
     * @param {Object} models - Loaded models by backend
     */
    handleModelsLoaded(models) {
      // Populate model select dropdown
      this.nodeModalManager.updateModelOptions();
    }
    
    /**
     * Handle models updated event
     * 
     * @param {Object} models - Updated models by backend
     */
    handleModelsUpdated(models) {
      // Update model select dropdown
      this.nodeModalManager.updateModelOptions();
    }
    
    /**
     * Handle workflow executing event
     * 
     * @param {Object} data - Workflow execution data
     */
    handleWorkflowExecuting(data) {
      console.log(`Executing workflow: ${data.graphId}`);
      this.showNotification('Workflow execution started', 'info');
    }
    
    /**
     * Handle node executing event
     * 
     * @param {Object} data - Node execution data
     */
    handleNodeExecuting(data) {
      // This will be handled by the workflow panel manager
      console.log(`Executing node: ${data.nodeId}`);
    }
    
    /**
     * Handle node completed event
     * 
     * @param {Object} data - Node completion data
     */
    handleNodeCompleted(data) {
      // This will be handled by the workflow panel manager
      console.log(`Node completed: ${data.nodeId}`);
    }
    
    /**
     * Handle node error event
     * 
     * @param {Object} data - Node error data
     */
    handleNodeError(data) {
      console.error(`Error in node ${data.nodeId}: ${data.error}`);
      this.showNotification(`Error in node: ${data.error}`, 'error');
    }
    
    /**
     * Handle workflow completed event
     * 
     * @param {Object} results - Workflow execution results
          */
      // In UIManager.js - Update this method to also update the workflow panel
      // In UIManager.js
      handleWorkflowCompleted(results) {
        console.log('Workflow execution completed with results:', results);
        this.showNotification('Workflow execution completed successfully', 'success');
        
        // Visualize the execution in the graph
        if (results.executionOrder && this.graphManager.visualizeWorkflowExecution) {
          this.graphManager.visualizeWorkflowExecution(results.executionOrder, results.results);
        }
        
        // Explicitly update the workflow panel if it exists
        if (this.workflowPanelManager) {
          this.workflowPanelManager.handleWorkflowCompleted(results);
        }
        
        // Force refresh any active conversations that received results
        if (this.conversationManager && results.results) {
          const activeNodeId = this.conversationManager.activeNodeId;
          if (activeNodeId && results.results[activeNodeId]) {
            this.conversationManager.displayConversation(activeNodeId);
          }
        }
      }
    
    /**
     * Handle workflow failed event
     * 
     * @param {Object} data - Workflow failure data
     */
    handleWorkflowFailed(data) {
      console.error(`Workflow execution failed: ${data.error}`);
      this.showNotification(`Workflow execution failed: ${data.error}`, 'error');
    }
    
    /**
     * Handle workflow invalid event
     * 
     * @param {Object} data - Workflow validation data
     */
    handleWorkflowInvalid(data) {
      if (!data.silent) {
        const errors = Array.isArray(data.errors) ? data.errors.join('. ') : data.errors;
        console.warn(`Workflow validation failed: ${errors}`);
        this.showNotification(`Workflow validation failed: ${errors}`, 'warning');
      }
    }
    
    /**
     * Handle error event
     * 
     * @param {Object} errorRecord - Error record
     */
    handleError(errorRecord) {
      console.error(`[Error] ${errorRecord.context}: ${errorRecord.message}`);
    }
    
    /**
     * Handle API request start event
     * 
     * @param {Object} data - Request data
     */
    handleAPIRequestStart(data) {
      // Show spinner or loading indicator if needed
      if (data.method === 'GET' && data.url.includes('/graphs/')) {
        document.body.classList.add('loading-graph');
      }
    }
    
    /**
     * Handle API request end event
     * 
     * @param {Object} data - Request data
     */
    handleAPIRequestEnd(data) {
      // Hide spinner or loading indicator
      if (data.method === 'GET' && data.url.includes('/graphs/')) {
        document.body.classList.remove('loading-graph');
      }
    }
    
    /**
     * Show a notification message
     * 
     * @param {string} message - The message to show
     * @param {string} type - The type of notification (success, error, info, warning)
     * @param {number} duration - How long to show the notification in ms
     */
    showNotification(message, type = 'success', duration = 3000) {
      this.notificationManager.show(message, type, duration);
    }
    
    /**
     * Execute the workflow
     * Convenience method that delegates to the workflow panel manager
     */
    async executeWorkflow() {
      try {
        // Show execution in progress
        const executeBtn = this.elements.executeWorkflowBtn;
        const originalText = executeBtn.textContent;
        executeBtn.textContent = 'Executing...';
        executeBtn.disabled = true;
        
        // Check if there's a graph ID
        const graphId = this.graphManager.getCurrentGraphId();
        if (!graphId) {
          alert('Please save the graph first before executing the workflow.');
          return;
        }
        
        // Show execution progress modal
        const progressDialog = this.showWorkflowProgressDialog();
        
        try {
          // Validate workflow before execution
          const validation = this.workflowManager.validateWorkflow();
          
          // If validation failed
          if (!validation.success) {
            // If cycles are detected, highlight them
            if (validation.hasCycles) {
              this.workflowManager.highlightCycles();
            }
            
            this.handleWorkflowError(progressDialog, new Error(validation.errors.join('. ')));
            return;
          }
          
          // Execute the workflow
          const results = await this.workflowManager.executeWorkflow(graphId);
          
          // Update progress dialog with results
          this.updateWorkflowProgressDialog(progressDialog, results);
        } catch (error) {
          this.handleWorkflowError(progressDialog, error);
        }
      } finally {
        // Reset button
        const executeBtn = this.elements.executeWorkflowBtn;
        executeBtn.textContent = originalText;
        executeBtn.disabled = false;
      }
    }

/**
 * Handle workflow executing event
 * 
 * @param {Object} data - Event data
 */
handleWorkflowExecuting(data) {
  console.log(`Executing workflow: ${data.graphId}`);
  
  // Disable any controls that might interfere with execution
  this.elements.executeWorkflowBtn.disabled = true;
  
  // Show a loading indicator if needed
  if (this.elements.workflowStatusIndicator) {
    this.elements.workflowStatusIndicator.textContent = "Executing workflow...";
    this.elements.workflowStatusIndicator.classList.add('executing');
  }
}

/**
 * Handle workflow completed event
 * 
 * @param {Object} results - Workflow execution results
 */
handleWorkflowCompleted(results) {
  console.log('Workflow execution completed');
  
  // Re-enable workflow controls
  this.elements.executeWorkflowBtn.disabled = false;
  
  // Update UI with results
  if (this.elements.workflowStatusIndicator) {
    this.elements.workflowStatusIndicator.textContent = "Workflow completed successfully";
    this.elements.workflowStatusIndicator.classList.remove('executing');
    this.elements.workflowStatusIndicator.classList.add('completed');
  }
  
  // Refresh conversation if active node has results
  if (this.conversationManager.activeNodeId && 
      results.results && 
      results.results[this.conversationManager.activeNodeId]) {
    this.conversationManager.displayConversation(this.conversationManager.activeNodeId);
  }
}

/**
 * Handle node executing event
 * 
 * @param {Object} data - Event data
 */
handleNodeExecuting(data) {
  const { nodeId, iteration, totalNodes, progress } = data;
  
  console.log(`Executing node ${nodeId} (iteration ${iteration + 1})`);
  
  // Update progress indicator if available
  if (this.elements.workflowProgress) {
    this.elements.workflowProgress.value = progress * 100;
    this.elements.workflowProgress.textContent = `${Math.round(progress * 100)}%`;
  }
  
  // Highlight the current node in the graph
  this.highlightExecutingNode(nodeId);
}

/**
 * Highlight the currently executing node
 * 
 * @param {string} nodeId - ID of the executing node
 */
highlightExecutingNode(nodeId) {
  // Delegate to workflow visualizer if available
  if (this.workflowManager.visualizer) {
    this.workflowManager.visualizer.showNodeExecution(nodeId);
  }
}

/**
 * Get suggestions for fixing workflow issues
 * 
 * @returns {Promise<void>}
 */
async showWorkflowSuggestions() {
  // Get suggestions from workflow manager
  const suggestions = this.workflowManager.getWorkflowSuggestions();
  
  if (suggestions.length === 0) {
    alert('No workflow issues detected.');
    return;
  }
  
  // Create a modal to display suggestions
  const dialogContent = document.createElement('div');
  
  suggestions.forEach(suggestion => {
    const suggestionEl = document.createElement('div');
    suggestionEl.className = `suggestion suggestion-${suggestion.type}`;
    
    // Create suggestion content
    suggestionEl.innerHTML = `
      <h4>${suggestion.message}</h4>
      ${suggestion.details ? `<p>${suggestion.details}</p>` : ''}
    `;
    
    // Add action button if available
    if (suggestion.action) {
      const actionBtn = document.createElement('button');
      actionBtn.textContent = suggestion.action.label;
      actionBtn.className = 'suggestion-action';
      
      // Handle action button click
      actionBtn.addEventListener('click', () => {
        this.handleSuggestionAction(suggestion.action.type);
        // Close the dialog
        const dialog = suggestionEl.closest('.modal');
        if (dialog) {
          dialog.style.display = 'none';
        }
      });
      
      suggestionEl.appendChild(actionBtn);
    }
    
    dialogContent.appendChild(suggestionEl);
  });
  
  // Display the modal
  this.showModal('Workflow Suggestions', dialogContent);
}

/**
 * Handle a suggestion action
 * 
 * @param {string} actionType - Type of action to perform
 */
handleSuggestionAction(actionType) {
  switch (actionType) {
    case 'highlight-cycles':
      this.workflowManager.highlightCycles();
      break;
    case 'break-cycles':
      const removedEdges = this.workflowManager.breakCycles();
      alert(`Removed ${removedEdges.length} edges to break cycles.`);
      break;
    case 'enable-cycles':
      this.workflowManager.updateConfig({ allowCycles: true, cycleHandlingMode: 'iterate' });
      alert('Cycle iteration is now enabled. Workflows can include cycles.');
      break;
    case 'reduce-iterations':
      this.workflowManager.updateConfig({ maxCycleIterations: 2 });
      alert('Maximum cycle iterations reduced to 2.');
      break;
    case 'highlight-isolated':
      // Find and highlight isolated nodes
      this.highlightIsolatedNodes();
      break;
    default:
      console.warn(`Unknown suggestion action: ${actionType}`);
  }
}

/**
 * Highlight isolated nodes in the graph
 */
highlightIsolatedNodes() {
  const connectedNodes = new Set();
  
  // Find all nodes that are connected by edges
  this.graphManager.edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });
  
  // Find isolated nodes
  const isolatedNodes = this.graphManager.nodes.filter(node => 
    !connectedNodes.has(node.id)
  ).map(node => node.id);
  
  if (isolatedNodes.length === 0) {
    alert('No isolated nodes found.');
    return;
  }
  
  // Highlight isolated nodes
  isolatedNodes.forEach(nodeId => {
    const node = this.graphManager.cy.$(`#${nodeId}`);
    if (node.length === 0) return;
    
    node.style({
      'border-width': 3,
      'border-color': '#f39c12', // Orange
      'border-opacity': 1
    });
  });
  
  // Focus view on isolated nodes
  this.graphManager.cy.fit(
    this.graphManager.cy.nodes().filter(node => isolatedNodes.includes(node.id())),
    50 // Padding
  );
  
  // Show message
  alert(`Found ${isolatedNodes.length} isolated nodes. These nodes have no connections and will not receive context from other nodes.`);
}
}