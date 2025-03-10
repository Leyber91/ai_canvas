/**
 * ui/UIManager.js
 * 
 * Core UI manager that coordinates all UI components.
 * Uses the DOMElementRegistry for consistent DOM access.
 */
import { BaseManager } from './managers/BaseManager.js';
import { DOMElementRegistry } from './registry/DOMElementRegistry.js';
import { NodeModalManager } from './NodeModalManager.js';
import { ConversationPanelManager } from './ConversationPanelManager.js';
import { GraphControlsManager } from './GraphControlsManager.js';
import { NodeOperationsManager } from './NodeOperationsManager.js';
import { DialogManager } from './dialog/DialogManager.js';
import { NotificationManager } from './NotificationManager.js';
import { WorkflowPanelManager } from './WorkflowPanelManager.js';
import { ThemeManager } from './ThemeManager.js';

export class UIManager extends BaseManager {
  /**
   * Create a new UIManager
   * 
   * @param {EventBus} eventBus - Event bus for pub/sub
   * @param {GraphManager} graphManager - Graph manager
   * @param {ConversationManager} conversationManager - Conversation manager
   * @param {ModelRegistry} modelRegistry - Model registry
   * @param {WorkflowManager} workflowManager - Workflow manager
   * @param {ErrorHandler} errorHandler - Error handler
   */
  constructor(eventBus, graphManager, conversationManager, modelRegistry, workflowManager, errorHandler) {
    // Create the element registry
    const registry = DOMElementRegistry.getInstance();
    
    // Initialize base manager
    super({
      registry,
      eventBus
    });
    
    // Store dependencies
    this.graphManager = graphManager;
    this.conversationManager = conversationManager;
    this.modelRegistry = modelRegistry;
    this.workflowManager = workflowManager;
    this.errorHandler = errorHandler;
    
    // Error count tracking to prevent cascading errors
    this.errorCount = 0;
    this.errorResetTimeout = null;
    
    // Initialize theme manager first to establish styling
    this.themeManager = new ThemeManager(this);
    
    // Create sub-managers with dependency injection
    this.nodeModalManager = new NodeModalManager(this);
    this.conversationPanelManager = new ConversationPanelManager(this);
    this.graphControlsManager = new GraphControlsManager(this);
    this.nodeOperationsManager = new NodeOperationsManager(this);
    this.dialogManager = new DialogManager(this);
    this.notificationManager = new NotificationManager();
    this.workflowPanelManager = new WorkflowPanelManager(this);
    
    // Bind methods
    this.handleNodeSelected = this.handleNodeSelected.bind(this);
    this.handleNodeDeselected = this.handleNodeDeselected.bind(this);
    this.handleEdgeSelected = this.handleEdgeSelected.bind(this);
    this.handleErrorEvent = this.handleErrorEvent.bind(this);
  }
  
  /**
   * Initialize the UI Manager and all sub-managers
   */
  async initialize() {
    console.log('Initializing UI Manager');
    
    try {
      // Call base initialization (finds elements and sets up events)
      super.initialize();
      
      // Initialize theme manager first to set up styling
      this.themeManager.initialize();
      
      // Initialize sub-managers
      this.nodeModalManager.initialize();
      this.conversationPanelManager.initialize();
      this.graphControlsManager.initialize();
      this.nodeOperationsManager.initialize();
      this.workflowPanelManager.initialize();
      
      // Hide the original execute button since we use the one in workflow panel
      if (this.elements.executeWorkflowBtn) {
        this.elements.executeWorkflowBtn.style.display = 'none';
      }
      
      // Subscribe to events
      this.subscribeToEvents();
      
      console.log('UI Manager initialized');
    } catch (error) {
      this.handleError(error, 'initialize');
    }
  }
  
  /**
   * Find DOM elements needed by this manager
   */
  findDOMElements() {
    // Define the elements we need
    const elementKeys = [
      'addNodeBtn',
      'saveGraphBtn',
      'loadGraphBtn',
      'executeWorkflowBtn',
      'nodeModal',
      'nodeForm',
      'closeModalBtn',
      'cancelBtn',
      'backendSelect',
      'modelSelect',
      'temperatureInput',
      'temperatureValue',
      'activeNodeTitle',
      'nodeDetails',
      'chatMessages',
      'chatInput',
      'sendBtn',
      'workflowControls'
    ];
    
    // Find all elements
    this.elements = this.findElements(elementKeys);
    
    // Check for missing elements and log warnings
    const missingElements = elementKeys.filter(key => !this.elements[key]);
    if (missingElements.length > 0) {
      console.warn(`Missing DOM elements: ${missingElements.join(', ')}`);
    }
  }
  
  /**
   * Set up global DOM event listeners
   */
  setupEventListeners() {
    // Add Node button
    this.addEventListenerWithCleanup(
      this.elements.addNodeBtn,
      'click', 
      () => this.nodeModalManager.showNodeModal()
    );
    
    // Save Graph button
    this.addEventListenerWithCleanup(
      this.elements.saveGraphBtn,
      'click',
      () => this.graphControlsManager.saveGraph(false)
    );
    
    // Load Graph button
    this.addEventListenerWithCleanup(
      this.elements.loadGraphBtn,
      'click',
      () => this.graphControlsManager.loadGraph()
    );
    
    // Execute Workflow button
    this.addEventListenerWithCleanup(
      this.elements.executeWorkflowBtn,
      'click',
      () => this.workflowPanelManager.executeWorkflow()
    );
    
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
        this.dialogManager.closeAllDialogs();
      }
    });
  }
  
  /**
   * Subscribe to required events
   */
  subscribeToEvents() {
    // Node events
    this.subscribeWithCleanup('node:selected', this.handleNodeSelected);
    this.subscribeWithCleanup('node:deselected', this.handleNodeDeselected);
    this.subscribeWithCleanup('node:added', this.handleNodeAdded);
    this.subscribeWithCleanup('node:removed', this.handleNodeRemoved);
    
    // Edge events
    this.subscribeWithCleanup('edge:selected', this.handleEdgeSelected);
    
    // Graph events
    this.subscribeWithCleanup('graph:loaded', this.handleGraphLoaded);
    this.subscribeWithCleanup('graph:saved', this.handleGraphSaved);
    this.subscribeWithCleanup('graph:cleared', this.handleGraphCleared);
    this.subscribeWithCleanup('graph:current-changed', this.handleGraphChanged);
    this.subscribeWithCleanup('graph:modified', this.handleGraphModified);
    this.subscribeWithCleanup('graph:cycles-highlighted', this.handleCyclesHighlighted);
    this.subscribeWithCleanup('graph:cycles-broken', this.handleCyclesBroken);
    
    // Models events
    this.subscribeWithCleanup('models:loaded', this.handleModelsLoaded);
    this.subscribeWithCleanup('models:updated', this.handleModelsUpdated);
    
    // Workflow events
    this.subscribeWithCleanup('workflow:executing', this.handleWorkflowExecuting);
    this.subscribeWithCleanup('workflow:node-executing', this.handleNodeExecuting);
    this.subscribeWithCleanup('workflow:node-completed', this.handleNodeCompleted);
    this.subscribeWithCleanup('workflow:node-error', this.handleNodeError);
    this.subscribeWithCleanup('workflow:completed', this.handleWorkflowCompleted);
    this.subscribeWithCleanup('workflow:failed', this.handleWorkflowFailed);
    this.subscribeWithCleanup('workflow:invalid', this.handleWorkflowInvalid);
    
    // Error events - CAREFUL! This is where recursion can happen
    this.subscribeWithCleanup('error', this.handleErrorEvent);
    
    // API events
    this.subscribeWithCleanup('api:request:start', this.handleAPIRequestStart);
    this.subscribeWithCleanup('api:request:end', this.handleAPIRequestEnd);
  }
  
  /**
   * Handle an error event from the event bus
   * This is a safe wrapper that prevents recursive error handling loops
   * 
   * @param {Object} errorData - Error data from event bus
   */
  handleErrorEvent(errorData) {
    // Increment error count for flood protection
    this.errorCount++;
    
    // Reset the error count after a delay
    clearTimeout(this.errorResetTimeout);
    this.errorResetTimeout = setTimeout(() => {
      this.errorCount = 0;
    }, 5000); // Reset after 5 seconds with no errors
    
    // If we're getting flooded with errors, limit processing
    if (this.errorCount > 5) {
      if (this.errorCount === 6) { // Only log once when we start throttling
        console.warn('[UIManager] Too many errors, throttling error handling');
      }
      return;
    }
    
    try {
      // If we have an error handler, use it
      if (this.errorHandler && typeof this.errorHandler.handleError === 'function') {
        this.errorHandler.handleError(errorData.error || errorData.message, errorData.context);
        return;
      }
      
      // Otherwise, just log the error without re-publishing to avoid recursion
      console.error(`[Error] ${errorData.context || 'Unknown'}: ${errorData.message || 'No message'}`);
      
      // Show a notification for user-visible errors (but not for every internal error)
      if (errorData.userVisible) {
        this.showNotification(`Error: ${errorData.message || 'An error occurred'}`, 'error');
      }
    } catch (e) {
      // If we get an error handling an error, just log it without using handleError
      console.error('Error in error handler:', e);
    }
  }
  
  /**
   * Handle node selected event
   * 
   * @param {Object} nodeData - Data for the selected node
   */
  handleNodeSelected(nodeData) {
    try {
      // Ensure we have the necessary DOM elements
      const activeNodeTitle = this.findElement('activeNodeTitle');
      const nodeDetails = this.findElement('nodeDetails');
      
      if (!activeNodeTitle || !nodeDetails) {
        console.warn('Missing DOM elements for node display');
        return;
      }
      
      // Update UI
      activeNodeTitle.textContent = nodeData.name || 'Unknown Node';
      nodeDetails.innerHTML = `
        <p><strong>Backend:</strong> ${nodeData.backend || 'Not specified'}</p>
        <p><strong>Model:</strong> ${nodeData.model || 'Not specified'}</p>
        <p><strong>System Message:</strong> ${nodeData.systemMessage || 'None'}</p>
      `;
      
      // Enable chat input via conversation panel manager
      this.conversationPanelManager.enableChat();
      
      // Update node operations safely
      if (this.nodeOperationsManager && typeof this.nodeOperationsManager.updateNodeOperations === 'function') {
        this.nodeOperationsManager.updateNodeOperations(nodeData.id);
      }
      
      // Let theme manager know about node selection
      if (this.themeManager && typeof this.themeManager.handleNodeSelected === 'function') {
        this.themeManager.handleNodeSelected(nodeData);
      }
    } catch (error) {
      this.handleError(error, 'handleNodeSelected');
    }
  }
  
  /**
   * Handle node deselected event
   */
  handleNodeDeselected() {
    try {
      // Ensure we have the necessary DOM elements
      const activeNodeTitle = this.findElement('activeNodeTitle');
      const nodeDetails = this.findElement('nodeDetails');
      
      if (activeNodeTitle) {
        activeNodeTitle.textContent = 'No node selected';
      }
      
      if (nodeDetails) {
        nodeDetails.innerHTML = '<p>Select a node to see details</p>';
      }
      
      // Disable chat input via conversation panel manager
      this.conversationPanelManager.disableChat();
      
      // Let theme manager know about node deselection
      if (this.themeManager && typeof this.themeManager.handleNodeDeselected === 'function') {
        this.themeManager.handleNodeDeselected();
      }
    } catch (error) {
      this.handleError(error, 'handleNodeDeselected');
    }
  }
  
  /**
   * Handle edge selected event
   * 
   * @param {Object} edgeData - Data for the selected edge
   */
  handleEdgeSelected(edgeData) {
    try {
      // Implement edge selection behavior as needed
      console.log('Edge selected:', edgeData);
      
      // Let theme manager know about edge selection
      if (this.themeManager && typeof this.themeManager.handleEdgeSelected === 'function') {
        this.themeManager.handleEdgeSelected(edgeData);
      }
    } catch (error) {
      this.handleError(error, 'handleEdgeSelected');
    }
  }
  
  // Placeholder for additional event handlers
  // Add implementations as needed
  
  handleNodeAdded(nodeData) {
    console.log('Node added:', nodeData);
  }
  
  handleNodeRemoved(nodeData) {
    console.log('Node removed:', nodeData);
  }
  
  handleGraphLoaded(graphData) {
    console.log('Graph loaded:', graphData);
  }
  
  handleGraphSaved(graphData) {
    console.log('Graph saved:', graphData);
  }
  
  handleGraphCleared() {
    console.log('Graph cleared');
  }
  
  handleGraphChanged(graphData) {
    console.log('Graph changed:', graphData);
  }
  
  handleGraphModified(modificationData) {
    console.log('Graph modified:', modificationData);
  }
  
  handleCyclesHighlighted(cycleData) {
    console.log('Cycles highlighted:', cycleData);
  }
  
  handleCyclesBroken(cycleData) {
    console.log('Cycles broken:', cycleData);
  }
  
  handleModelsLoaded(modelsData) {
    console.log('Models loaded:', modelsData);
  }
  
  handleModelsUpdated(modelsData) {
    console.log('Models updated:', modelsData);
  }
  
  handleWorkflowExecuting(executionData) {
    console.log('Workflow executing:', executionData);
  }
  
  handleNodeExecuting(executionData) {
    console.log('Node executing:', executionData);
  }
  
  handleNodeCompleted(executionData) {
    console.log('Node completed:', executionData);
  }
  
  handleNodeError(errorData) {
    console.log('Node error:', errorData);
  }
  
  handleWorkflowCompleted(executionData) {
    console.log('Workflow completed:', executionData);
  }
  
  handleWorkflowFailed(errorData) {
    console.log('Workflow failed:', errorData);
  }
  
  handleWorkflowInvalid(validationData) {
    console.log('Workflow invalid:', validationData);
  }
  
  handleAPIRequestStart(requestData) {
    console.log('API request start:', requestData);
  }
  
  handleAPIRequestEnd(requestData) {
    console.log('API request end:', requestData);
  }
  
  /**
   * Show a notification message
   * 
   * @param {string} message - The message to show
   * @param {string} type - The type of notification (success, error, info, warning)
   * @param {number} duration - How long to show the notification in ms
   */
  showNotification(message, type = 'success', duration = 3000) {
    try {
      if (this.notificationManager) {
        this.notificationManager.show(message, type, duration);
      } else {
        // Fallback to console if notification manager not available
        const logMethod = type === 'error' ? console.error : 
                         type === 'warning' ? console.warn : console.log;
        logMethod(`[Notification] ${message}`);
      }
    } catch (error) {
      // Don't use handleError here to avoid potential recursion
      console.error('Error showing notification:', error);
    }
  }
  
  /**
   * Handle errors with appropriate logging and notifications
   * 
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  handleError(error, context) {
    const errorMessage = `Error in UI Manager (${context}): ${error.message}`;
    console.error(errorMessage, error);
    
    // Publish error event if we have an event bus
    if (this.eventBus) {
      this.eventBus.publish('error', {
        error,
        context: `UIManager:${context}`,
        message: error.message,
        // Only show UI notification for user-facing errors
        userVisible: context !== 'internal'
      });
    }
  }
  
  /**
   * Clean up resources when UIManager is destroyed
   */
  destroy() {
    // Clear any pending timeouts
    if (this.errorResetTimeout) {
      clearTimeout(this.errorResetTimeout);
    }
    
    // Clean up sub-managers
    const managers = [
      'themeManager',
      'nodeModalManager', 
      'conversationPanelManager',
      'graphControlsManager',
      'nodeOperationsManager',
      'dialogManager',
      'workflowPanelManager'
    ];
    
    managers.forEach(managerName => {
      const manager = this[managerName];
      if (manager && typeof manager.destroy === 'function') {
        try {
          manager.destroy();
        } catch (error) {
          console.error(`Error destroying ${managerName}:`, error);
        }
      }
    });
    
    // Call base class destroy to clean up event listeners
    super.destroy();
  }
}