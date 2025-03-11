/**
 * ui/WorkflowPanelManager.js
 *
 * Hypermodularized workflow panel manager that coordinates between the workflow panel
 * and other UI components like the event bus, theme manager, and graph/workflow managers.
 * 
 * Now supports draggable workflow panels using the DraggablePanelManager.
 * Integrated with WorkflowPanelRegistry to prevent duplicate panels.
 * Enhanced with robust error handling and animation coordination.
 */
import { BasePanelManager } from './panel/BasePanelManager.js';
import { HypermodularWorkflowPanel } from './theme/panels/HypermodularWorkflowPanel.js';
import { DOMHelper } from './helpers/domHelpers.js';
import { draggablePanelManager } from '../core/panel/DraggablePanelManager.js';
import { workflowPanelRegistry } from './registry/WorkflowPanelRegistry.js';

export class WorkflowPanelManager extends BasePanelManager {
    /**
     * @param {UIManager} uiManager - The parent UI manager
     */
    constructor(uiManager) {
        super({
            uiManager,
            panelType: 'workflow',
            eventPrefix: 'workflow',
            // Initialize expanded state from theme if available
            initialExpanded: uiManager.themeManager && uiManager.themeManager.state 
                ? uiManager.themeManager.state.workflowPanelExpanded 
                : false
        });
        
        // Core dependencies
        this.workflowManager = uiManager.workflowManager;
        this.graphManager = uiManager.graphManager;
        this.themeManager = uiManager.themeManager;
        
        // State
        this.containerElement = null;
        this.panel = null;
        this.executionTimeout = null;
        this.executingNodes = new Set(); // Track currently executing nodes
        this.completedNodes = new Set(); // Track completed nodes
        this.errorNodes = new Set(); // Track nodes with errors
        this.nodeRegistry = {}; // Map of node IDs to their UI elements
        
        // Bind event handlers
        this.handleExecute = this.handleExecute.bind(this);
        this.handleStop = this.handleStop.bind(this);
        this.handleValidate = this.handleValidate.bind(this);
        this.handlePanelToggle = this.handlePanelToggle.bind(this);
        this.handleHighlightCycles = this.handleHighlightCycles.bind(this);
        this.handleBreakCycles = this.handleBreakCycles.bind(this);
        
        // Bind event bus handlers
        this.handleWorkflowExecuting = this.handleWorkflowExecuting.bind(this);
        this.handleNodeExecuting = this.handleNodeExecuting.bind(this);
        this.handleNodeCompleted = this.handleNodeCompleted.bind(this);
        this.handleNodeError = this.handleNodeError.bind(this);
        this.handleWorkflowCompleted = this.handleWorkflowCompleted.bind(this);
        this.handleWorkflowFailed = this.handleWorkflowFailed.bind(this);
        this.handleWorkflowStopped = this.handleWorkflowStopped.bind(this);
        
        // Bind utility methods
        this.updateNodeExecutionStatus = this.updateNodeExecutionStatus.bind(this);
        this.addNodeToExecutionList = this.addNodeToExecutionList.bind(this);
        this.updateGraphNodeStatus = this.updateGraphNodeStatus.bind(this);
    }
    
    /**
     * Initialize the workflow panel manager
     */
    initialize() {
        // Return early if already initialized
        if (this.initialized) return;
        
        // Log initialization
        console.log('Initializing WorkflowPanelManager');
        
        try {
            // Check for existing workflow panels and clean up duplicates
            this.cleanupDuplicatePanels();
            
            // Create or find container element
            this.createContainerElement();
            
            // Initialize panel with theme-aware configuration
            this.initializePanel();
            
            // Subscribe to events
            this.subscribeToEvents();
            
            // Register this panel with the registry
            this.registerWithRegistry();
            
            // Call base initialization
            super.initialize();
            
            console.log('WorkflowPanelManager initialized');
        } catch (error) {
            console.error('Error initializing WorkflowPanelManager:', error);
        }
    }
    
    /**
     * Clean up any duplicate workflow panels in the DOM
     */
    cleanupDuplicatePanels() {
        try {
            // Use the registry to clean up duplicates
            const removedCount = workflowPanelRegistry.cleanupDuplicates();
            
            if (removedCount > 0) {
                console.log(`Cleaned up ${removedCount} duplicate workflow panels`);
            }
        } catch (error) {
            console.warn('Error cleaning up duplicate panels:', error);
        }
    }
    
    /**
     * Register this panel with the workflow panel registry
     */
    registerWithRegistry() {
        if (!this.panel) return;
        
        try {
            const panelId = this.draggablePanel ? 'workflow-panel' : 'workflow-panel-fixed';
            
            // Register with registry
            workflowPanelRegistry.registerPanel(panelId, {
                element: this.draggablePanel || this.containerElement,
                manager: this,
                panel: this.panel
            });
            
            // Set as active panel
            workflowPanelRegistry.setActivePanel(panelId);
        } catch (error) {
            console.warn('Error registering with panel registry:', error);
        }
    }
    
    /**
     * Create or find the container element for the panel
     */
    createContainerElement() {
        try {
            // Check if ThemeManager provides a container
            if (this.themeManager && this.themeManager.elements && this.themeManager.elements.workflowPanelContainer) {
                this.containerElement = this.themeManager.elements.workflowPanelContainer;
                return;
            }
            
            // Look for existing container in DOM
            let container = document.querySelector('.workflow-panel-container');
            
            // Check if we already have a draggable panel in the registry
            const existingPanel = workflowPanelRegistry.getPanel('workflow-panel');
            if (existingPanel && existingPanel.element) {
                console.log('Using existing workflow panel from registry');
                
                // Get the panel content container
                const panelContent = existingPanel.element.querySelector('.draggable-panel-content') || 
                                    existingPanel.element.querySelector('.workflow-panel-content');
                
                if (panelContent) {
                    this.draggablePanel = existingPanel.element;
                    this.containerElement = panelContent;
                    return;
                }
            }
            
            // Check if draggable panel manager already has this panel
            const existingDraggablePanel = draggablePanelManager.getPanel('workflow-panel');
            if (existingDraggablePanel) {
                console.log('Using existing workflow panel from draggable panel manager');
                
                // Get the panel content container
                const panelContent = existingDraggablePanel.contentContainer || 
                                    existingDraggablePanel.element.querySelector('.draggable-panel-content');
                
                if (panelContent) {
                    this.draggablePanel = existingDraggablePanel.element;
                    this.containerElement = panelContent;
                    return;
                }
            }
            
            // Create container if not found
            if (!container) {
                // Create a draggable panel instead of a fixed container
                const panelContent = document.createElement('div');
                panelContent.className = 'workflow-panel-content';
                
                // Create the draggable panel
                const panel = draggablePanelManager.createPanel({
                    id: 'workflow-panel',
                    title: 'Workflow Panel',
                    content: panelContent,
                    position: { x: window.innerWidth - 370, y: 60 },
                    size: { width: 350, height: 500 },
                    resizable: true,
                    minimizable: true,
                    maximizable: true,
                    closable: false
                });
                
                // Store the panel reference
                this.draggablePanel = panel;
                
                // Use the content container as our container element
                container = panelContent;
                
                // Save panel state when moved or resized
                draggablePanelManager.onPositionChange = () => {
                    draggablePanelManager.savePanelState('workflow-panel-state');
                };
                
                draggablePanelManager.onResize = () => {
                    draggablePanelManager.savePanelState('workflow-panel-state');
                };
                
                // Load saved panel state
                draggablePanelManager.loadPanelState('workflow-panel-state');
                
                console.log('Created new draggable workflow panel');
            }
            
            this.containerElement = container;
            
            // Apply custom scrollbar
            DOMHelper.createCustomScrollbar(this.containerElement, {
                width: '5px',
                thumbColor: 'rgba(52, 152, 219, 0.5)',
                thumbHoverColor: 'rgba(52, 152, 219, 0.8)'
            });
        } catch (error) {
            console.error('Error creating container element:', error);
            // Create a fallback container if needed
            if (!this.containerElement) {
                this.containerElement = document.createElement('div');
                this.containerElement.className = 'workflow-panel-container fallback';
                document.body.appendChild(this.containerElement);
            }
        }
    }
    
    /**
     * Initialize the workflow panel component
     */
    initializePanel() {
        try {
            // Configure theme based on ThemeManager if available
            const themeConfig = this.getThemeConfiguration();
            
            // Create the panel
            this.panel = new HypermodularWorkflowPanel({
                container: this.containerElement,
                theme: themeConfig,
                onExecute: this.handleExecute,
                onStop: this.handleStop,
                onValidate: this.handleValidate,
                isIntegrated: true // Flag to indicate this is integrated into the workflow panel
            });
            
            // Set initial expansion state using the base class state
            if (this.expanded && !this.panel.state.expanded) {
                this.panel.togglePanel();
            }
            
            // Listen to panel events
            this.panel.on('execute', this.handleExecute);
            this.panel.on('stop', this.handleStop);
            this.panel.on('validate', this.handleValidate);
            this.panel.on('toggle', this.handlePanelToggle);
            this.panel.on('highlight-cycles', this.handleHighlightCycles);
            this.panel.on('break-cycles', this.handleBreakCycles);
            this.panel.on('reset', this.handleReset.bind(this));
            
            // If we have a current graph, update panel with graph info
            const currentGraphId = this.graphManager ? this.graphManager.getCurrentGraphId() : null;
            if (currentGraphId) {
                const graphData = this.graphManager.getCurrentGraphData 
                    ? this.graphManager.getCurrentGraphData() 
                    : { id: currentGraphId, name: 'Current Graph' };
                
                this.panel.updateGraphInfo(graphData);
            }
        } catch (error) {
            console.error('Error initializing panel:', error);
        }
    }
    
    /**
     * Get theme configuration from ThemeManager or use defaults
     * 
     * @returns {Object} Theme configuration
     */
    getThemeConfiguration() {
        // Default theme
        const defaultTheme = {
            dark: true,
            accentColor: '#3498db',
            errorColor: '#e74c3c',
            successColor: '#2ecc71',
            warningColor: '#f39c12',
            textColor: '#ffffff'
        };
        
        try {
            // Use ThemeManager if available
            if (this.themeManager && this.themeManager.state) {
                const { state } = this.themeManager;
                
                return {
                    dark: state.isDarkTheme !== false,
                    accentColor: state.accentColor || defaultTheme.accentColor,
                    errorColor: state.errorColor || defaultTheme.errorColor,
                    successColor: state.successColor || defaultTheme.successColor,
                    warningColor: state.warningColor || defaultTheme.warningColor,
                    backgroundColor: state.panelBackgroundColor || defaultTheme.backgroundColor,
                    textColor: state.textColor || defaultTheme.textColor
                };
            }
        } catch (error) {
            console.warn('Error getting theme configuration:', error);
        }
        
        return defaultTheme;
    }
    
    /**
     * Subscribe to workflow-related events
     */
    subscribeToEvents() {
        try {
            // Workflow execution events
            this.eventBus.subscribe('workflow:executing', this.handleWorkflowExecuting);
            this.eventBus.subscribe('workflow:node-executing', this.handleNodeExecuting);
            this.eventBus.subscribe('workflow:node-completed', this.handleNodeCompleted);
            this.eventBus.subscribe('workflow:node-error', this.handleNodeError);
            this.eventBus.subscribe('workflow:completed', this.handleWorkflowCompleted);
            this.eventBus.subscribe('workflow:failed', this.handleWorkflowFailed);
            this.eventBus.subscribe('workflow:stopped', this.handleWorkflowStopped);
            
            // Graph events
            this.eventBus.subscribe('graph:loaded', this.handleGraphLoaded.bind(this));
            this.eventBus.subscribe('graph:saved', this.handleGraphSaved.bind(this));
            this.eventBus.subscribe('graph:cleared', this.handleGraphCleared.bind(this));
            this.eventBus.subscribe('graph:current-changed', this.handleGraphChanged.bind(this));
        } catch (error) {
            console.error('Error subscribing to events:', error);
        }
    }
    
    /**
     * Override togglePanel to handle the panel component
     */
    togglePanel() {
        if (!this.panel) return;
        
        try {
            // Toggle the panel component
            this.panel.togglePanel();
            
            // Update base class state
            this.expanded = this.panel.state.expanded;
            
            // Publish event and update theme state
            this.publishToggleEvent();
            this.updateThemeState();
        } catch (error) {
            console.warn('Error toggling panel:', error);
        }
    }
    
    /**
     * Override isExpanded to use panel component state
     * 
     * @returns {boolean} Whether the panel is expanded
     */
    isExpanded() {
        return this.panel ? this.panel.state.expanded : this.expanded;
    }
    
    /**
     * Legacy method for backward compatibility
     * @deprecated Use togglePanel() instead
     */
    toggleWorkflowPanel() {
        this.togglePanel();
    }
    
    /**
 * Improved method to detect if a workflow is already executing
 * This prevents the "A workflow is already being executed" error
 * 
 * @returns {boolean} Whether a workflow is currently executing
 */
isWorkflowExecuting() {
    // First check our panel state
    if (this.panel && this.panel.state && this.panel.state.isExecuting) {
        return true;
    }
    
    // Then check workflowManager execution state
    if (this.workflowManager) {
        // Check direct execution state
        if (this.workflowManager.executionState && this.workflowManager.executionState.isExecuting) {
            return true;
        }
        
        // Check execution engine
        if (this.workflowManager.executionEngine && 
            this.workflowManager.executionEngine.executionState && 
            this.workflowManager.executionEngine.executionState.isExecuting) {
            return true;
        }
        
        // Check direct isExecuting flag
        if (this.workflowManager.isExecuting === true) {
            return true;
        }
    }
    
    // Check our tracking sets
    if (this.executingNodes && this.executingNodes.size > 0) {
        return true;
    }
    
    return false;
}

/**
 * Fixed executeWorkflow method with better execution state checking
 * This addresses the "A workflow is already being executed" error
 */
async executeWorkflow() {
    if (!this.panel || !this.workflowManager) return;
    
    try {
        // First check if workflow is already executing using our improved method
        if (this.isWorkflowExecuting()) {
            // Show user-friendly error
            this.panel.showError('A workflow is already running. Please wait for it to complete or stop it first.');
            return;
        }
        
        // Before starting, make sure execution state is properly reset
        this.resetExecutionState();
        
        // Update UI state
        this.updateExecutionStatus('Executing', 'executing');
        if (typeof this.panel.handleWorkflowExecuting === 'function') {
            this.panel.handleWorkflowExecuting();
        }
        
        // Clear execution tracking sets
        this.executingNodes = this.executingNodes || new Set();
        this.completedNodes = this.completedNodes || new Set();
        this.errorNodes = this.errorNodes || new Set();
        this.executingNodes.clear();
        this.completedNodes.clear();
        this.errorNodes.clear();
        
        // Get current graph ID
        const graphId = this.workflowManager.currentGraphId ||
                       (this.graphManager && this.graphManager.getCurrentGraphId()) ||
                       localStorage.getItem('aiCanvas_lastGraphId');
        
        if (!graphId) {
            this.panel.showError('No graph selected. Please save the graph first.');
            this.resetExecutionState();
            return;
        }
        
        // Validate workflow before execution
        const canExecute = await this.validateWorkflow(true);
        
        if (!canExecute) {
            this.resetExecutionState();
            return;
        }
        
        console.log(`Executing workflow for graph ${graphId}`);
        
        // Mark as executing in our state before calling workflowManager
        // This prevents race conditions where multiple executions can start
        if (this.panel.state) {
            this.panel.state.isExecuting = true;
        }
        
        // Set a flag to indicate that we've initiated execution
        this._executionInitiated = true;
        
        // Add a timeout to prevent execution hanging indefinitely
        const executionPromise = this.workflowManager.executeWorkflow(graphId);
        
        // Create a timeout promise
        this.clearExecutionTimeout();
        const timeoutPromise = new Promise((_, reject) => {
            this.executionTimeout = setTimeout(() => {
                reject(new Error('Workflow execution timed out after 60 seconds'));
            }, 200000);
        });
        
        try {
            // Race the execution against the timeout
            const result = await Promise.race([executionPromise, timeoutPromise]);
            
            // Clear the timeout since execution completed
            this.clearExecutionTimeout();
            
            // Handle result formatting differences
            if (result && (result.results || result.executionResults)) {
                // Some implementations use different property names
                const results = result.results || result.executionResults || {};
                const executionOrder = result.executionOrder || result.execution_order || [];
                
                // Pass to panel for display
                if (typeof this.panel.handleWorkflowCompleted === 'function') {
                    this.panel.handleWorkflowCompleted({
                        results,
                        executionOrder
                    });
                }
                
                // Update status
                this.updateExecutionStatus('Completed', 'success');
            }
        } catch (error) {
            console.error('Error executing workflow:', error);
            
            // Clear timeout if it exists
            this.clearExecutionTimeout();
            
            // Provide more helpful error messages based on the error type
            let errorMessage = error.message || 'Unknown error during execution';
            
            if (errorMessage.includes('already being executed')) {
                errorMessage = 'A workflow is already running. Please wait for it to complete or stop it first.';
            } else if (errorMessage.includes('timed out')) {
                errorMessage = 'Workflow execution timed out. The operation may still be running but is taking longer than expected.';
            }
            
            // Update UI with error
            if (typeof this.panel.handleWorkflowFailed === 'function') {
                this.panel.handleWorkflowFailed({
                    error: errorMessage
                });
            }
            
            // Update status
            this.updateExecutionStatus('Failed', 'error');
            
            // Show error in panel if possible
            if (typeof this.panel.showError === 'function') {
                this.panel.showError(errorMessage);
            }
        } finally {
            // Clear execution flag
            this._executionInitiated = false;
        }
    } catch (error) {
        console.error('Error executing workflow:', error);
        
        // Clear timeout if it exists
        this.clearExecutionTimeout();
        
        // Reset state regardless of error
        this.resetExecutionState();
        
        // Update status
        this.updateExecutionStatus('Failed', 'error');
    }
}

    
    /**
     * Clear the execution timeout
     */
    clearExecutionTimeout() {
        if (this.executionTimeout) {
            clearTimeout(this.executionTimeout);
            this.executionTimeout = null;
        }
    }
    
/**
 * Reset the execution state in all relevant components
 */
resetExecutionState() {
    // Reset panel state
    if (this.panel) {
        if (this.panel.state) {
            this.panel.state.isExecuting = false;
        }
        
        if (typeof this.panel.resetExecutionState === 'function') {
            this.panel.resetExecutionState();
        }
    }
    
    // Reset workflow manager state
    if (this.workflowManager) {
        if (this.workflowManager.executionState) {
            this.workflowManager.executionState.isExecuting = false;
        }
        
        if (this.workflowManager.executionEngine && this.workflowManager.executionEngine.executionState) {
            this.workflowManager.executionEngine.executionState.isExecuting = false;
        }
        
        if (typeof this.workflowManager.resetExecutionState === 'function') {
            try {
                this.workflowManager.resetExecutionState();
            } catch (error) {
                console.warn('Error resetting workflow execution state:', error);
            }
        }
    }
    
    // Clear execution tracking sets
    if (this.executingNodes) this.executingNodes.clear();
    if (this.completedNodes) this.completedNodes.clear();
    if (this.errorNodes) this.errorNodes.clear();
    
    // Clear timeout
    this.clearExecutionTimeout();
    
    // Reset execution flag
    this._executionInitiated = false;
    
    // Update status to waiting
    this.updateExecutionStatus('Ready', 'waiting');
}

/**
 * Enhanced stop execution method that properly cleans up state
 */
stopExecution() {
    if (!this.panel || !this.workflowManager) return;
    
    try {
        // Clear any timeouts
        this.clearExecutionTimeout();
        
        console.log('Stopping workflow execution');
        
        // First, reset our internal state
        this.resetExecutionState();
        
        // Then call workflowManager's stop method if it exists
        if (typeof this.workflowManager.stopExecution === 'function') {
            this.workflowManager.stopExecution();
        } else if (this.workflowManager.executionEngine?.stopExecution) {
            this.workflowManager.executionEngine.stopExecution();
        } else {
            // Fallback - just reset the executing flag
            if (this.workflowManager.executionState) {
                this.workflowManager.executionState.isExecuting = false;
            }
            
            if (this.workflowManager.executionEngine && this.workflowManager.executionEngine.executionState) {
                this.workflowManager.executionEngine.executionState.isExecuting = false;
            }
            
            // Publish event
            if (this.eventBus) {
                this.eventBus.publish('workflow:stopped', {
                    timestamp: Date.now()
                });
            }
        }
        
        // Update UI
        if (this.panel.resetExecutionState) {
            this.panel.resetExecutionState();
        }
        
        this.updateExecutionStatus('Stopped', 'waiting');
    } catch (error) {
        console.error('Error stopping workflow execution:', error);
        
        // Force update status even in case of error
        this.updateExecutionStatus('Stopped', 'waiting');
    }
}

    
    /**
     * Validate the workflow
     * 
     * @param {boolean} silent - Whether to show validation results
     * @returns {boolean} Whether validation was successful
     */
    async validateWorkflow(silent = false) {
        if (!this.panel || !this.workflowManager) return false;
        
        try {
            // Update UI for validation
            if (!silent) {
                this.panel.updateStatus('Validating', 'executing');
            }
            
            // Check which validation function is available
            let validation;
            
            if (typeof this.workflowManager.validateWorkflow === 'function') {
                validation = await this.workflowManager.validateWorkflow();
            } else if (typeof this.workflowManager.validate === 'function') {
                validation = await this.workflowManager.validate();
            } else {
                // If no validation method is available, check for cycles
                validation = { 
                    success: true, 
                    errors: [],
                    hasCycles: false,
                    cycles: []
                };
                
                // Check for cycles if the method exists
                if (typeof this.workflowManager.detectCycles === 'function') {
                    const cycles = await this.workflowManager.detectCycles();
                    validation.hasCycles = cycles && cycles.length > 0;
                    validation.cycles = cycles || [];
                    
                    if (validation.hasCycles) {
                        validation.success = false;
                        validation.errors = ['Workflow contains cycles that may prevent execution'];
                    }
                }
            }
            
            // Handle validation results
            if (validation.success) {
                if (!silent) {
                    this.panel.updateStatus('Valid', 'success');
                    
                    // Get execution order if available
                    let executionOrder = [];
                    if (typeof this.workflowManager.getExecutionOrder === 'function') {
                        executionOrder = this.workflowManager.getExecutionOrder();
                    } else if (typeof this.workflowManager.computeTopologicalSort === 'function') {
                        executionOrder = this.workflowManager.computeTopologicalSort();
                    } else if (this.workflowManager.executionOrder) {
                        executionOrder = this.workflowManager.executionOrder;
                    }
                    
                    // Show execution plan
                    const nodeDataMap = this.getNodeDataMap();
                    this.panel.showExecutionPlan(executionOrder, nodeDataMap);
                    
                    // Hide any previous errors
                    if (this.panel.elements && this.panel.elements.errorsContainer) {
                        this.panel.elements.errorsContainer.classList.add('hidden');
                    }
                }
                
                return true;
            } else {
                if (!silent) {
                    this.panel.showValidationErrors(validation);
                }
                
                return false;
            }
        } catch (error) {
            console.error('Error validating workflow:', error);
            
            if (!silent) {
                this.panel.showError(`Error validating workflow: ${error.message || 'Unknown error'}`);
            }
            
            return false;
        }
    }
    
    /**
     * Get a map of node IDs to node data
     * 
     * @returns {Object} Map of node ID to node data
     */
    getNodeDataMap() {
        const nodeDataMap = {};
        
        if (!this.graphManager) return nodeDataMap;
        
        try {
            // Get all nodes in the graph
            let nodes = [];
            
            if (typeof this.graphManager.getAllNodes === 'function') {
                nodes = this.graphManager.getAllNodes();
            } else if (this.graphManager.cy) {
                // If we have direct access to Cytoscape
                nodes = this.graphManager.cy.nodes().map(node => node.data());
            } else if (Array.isArray(this.graphManager.nodes)) {
                // Direct access to nodes array
                nodes = this.graphManager.nodes;
            }
            
            // Build the map
            nodes.forEach(node => {
                if (node && node.id) {
                    nodeDataMap[node.id] = node;
                }
            });
        } catch (error) {
            console.error('Error building node data map:', error);
        }
        
        return nodeDataMap;
    }
    
    /**
     * Improved method to update a node's execution status in the UI
     * 
     * @param {string} nodeId - ID of the node
     * @param {string} status - Status (running, completed, error, waiting)
     */
    updateNodeExecutionStatus(nodeId, status) {
        if (!nodeId) {
            console.warn('Missing nodeId in updateNodeExecutionStatus');
            return;
        }
        
        if (!this.panel) {
            console.warn('No panel available to update node status');
            return;
        }
        
        try {
            // Update tracked nodes sets
            if (status === 'running') {
                this.executingNodes.add(nodeId);
                this.completedNodes.delete(nodeId);
                this.errorNodes.delete(nodeId);
            } else if (status === 'completed') {
                this.executingNodes.delete(nodeId);
                this.completedNodes.add(nodeId);
                this.errorNodes.delete(nodeId);
            } else if (status === 'error') {
                this.executingNodes.delete(nodeId);
                this.completedNodes.delete(nodeId);
                this.errorNodes.add(nodeId);
            }
            
            // Try using the panel's method first
            if (typeof this.panel.updateNodeExecutionStatus === 'function') {
                this.panel.updateNodeExecutionStatus(nodeId, status);
                return;
            }
            
            // Check if we have an execution status list
            const executionList = this.panel.elements?.executionStatusList || 
                               this.panel.elements?.nodesList ||
                               this.containerElement?.querySelector('.execution-nodes');
            
            if (executionList) {
                // Otherwise, get the node element from the panel
                const nodeElement = executionList.querySelector(`[data-node-id="${nodeId}"]`);
                
                if (!nodeElement) {
                    // Node might not be in the list yet, try to create it
                    if (typeof this.panel.addNodeToExecution === 'function') {
                        this.panel.addNodeToExecution(nodeId);
                        // Try again after adding
                        setTimeout(() => this.updateNodeExecutionStatus(nodeId, status), 10);
                    } else {
                        // Try our own implementation
                        const nodeData = this.getNodeDataMap()[nodeId];
                        const nodeName = nodeData?.name || nodeId;
                        this.addNodeToExecutionList(nodeId, nodeName, status);
                    }
                    return;
                }
                
                // Update status classes
                nodeElement.classList.remove('running', 'completed', 'error', 'waiting');
                nodeElement.classList.add(status);
                
                // Update status indicator
                const statusIndicator = nodeElement.querySelector('.node-status');
                if (statusIndicator) {
                    statusIndicator.textContent = this.getStatusLabel(status);
                    statusIndicator.className = `node-status ${status}`;
                }
                
                // Update styles
                switch (status) {
                    case 'running':
                        nodeElement.style.borderColor = '#3498db';
                        break;
                    case 'completed':
                        nodeElement.style.borderColor = '#2ecc71';
                        break;
                    case 'error':
                        nodeElement.style.borderColor = '#e74c3c';
                        break;
                    default:
                        nodeElement.style.borderColor = '#95a5a6';
                }
            }
            
            // Also update graph visualization via ThemeManager
            this.updateGraphNodeStatus(nodeId, status);
        } catch (error) {
            console.error(`Error updating node execution status for node ${nodeId}:`, error);
        }
    }
    
    /**
     * Get readable status label
     * 
     * @param {string} status - Status code
     * @returns {string} Human-readable status
     */
    getStatusLabel(status) {
        switch (status) {
            case 'running': return 'Executing...';
            case 'completed': return 'Completed';
            case 'error': return 'Failed';
            case 'waiting': return 'Waiting';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    }
    
    /**
     * Helper method to add a node to the execution list in the UI
     * 
     * @param {string} nodeId - Node ID
     * @param {string} nodeName - Node name
     * @param {string} status - Initial status
     */
    addNodeToExecutionList(nodeId, nodeName, status = 'waiting') {
        // Skip if no panel
        if (!this.panel) return;
        
        try {
            // Look for execution list element
            const executionList = this.panel.elements?.executionStatusList || 
                                 this.panel.elements?.nodesList ||
                                 this.containerElement?.querySelector('.execution-nodes');
            
            if (!executionList) {
                console.warn('No execution list container found');
                return;
            }
            
            // Check if node already exists in list
            const existingNode = executionList.querySelector(`[data-node-id="${nodeId}"]`);
            if (existingNode) {
                // Update status if already exists
                existingNode.querySelector('.node-status').textContent = this.getStatusLabel(status);
                existingNode.querySelector('.node-status').className = `node-status ${status}`;
                existingNode.classList.remove('running', 'completed', 'error', 'waiting');
                existingNode.classList.add(status);
                return;
            }
            
            // Create node element
            const nodeElement = document.createElement('div');
            nodeElement.className = `execution-node ${status}`;
            nodeElement.setAttribute('data-node-id', nodeId);
            nodeElement.innerHTML = `
                <span class="node-name">${nodeName || nodeId}</span>
                <span class="node-status ${status}">${this.getStatusLabel(status)}</span>
            `;
            
            // Add to list
            executionList.appendChild(nodeElement);
            
            // Track this node element
            this.nodeRegistry[nodeId] = nodeElement;
        } catch (error) {
            console.error(`Error adding node to execution list: ${nodeId}`, error);
        }
    }
    
    /**
     * Update graph node status through ThemeManager or GraphManager
     * 
     * @param {string} nodeId - ID of the node
     * @param {string} status - Status (running, completed, error, waiting)
     */
    updateGraphNodeStatus(nodeId, status) {
        // Skip if no nodeId
        if (!nodeId) return;
        
        try {
            // Check if we have themeManager with cytoscape integration
            if (this.themeManager && this.themeManager.cytoscapeThemeManager) {
                const manager = this.themeManager.cytoscapeThemeManager;
                
                switch (status) {
                    case 'running':
                        if (typeof manager.addNodeExecutingAnimation === 'function') {
                            // Get node by ID if we have cytoscape instance
                            if (manager.cy) {
                                const node = manager.cy.$(`#${nodeId}`);
                                if (node && node.length > 0) {
                                    manager.addNodeExecutingAnimation(node);
                                }
                            }
                        } else if (typeof manager.markNodeExecuting === 'function') {
                            manager.markNodeExecuting(nodeId);
                        }
                        break;
                    case 'completed':
                        if (typeof manager.markNodeCompleted === 'function') {
                            manager.markNodeCompleted(nodeId);
                        } else if (manager.cy) {
                            // Direct manipulation if we have cytoscape
                            const node = manager.cy.$(`#${nodeId}`);
                            if (node && node.length > 0) {
                                if (typeof manager.removeNodeExecutingAnimation === 'function') {
                                    manager.removeNodeExecutingAnimation(node);
                                }
                                if (typeof manager.safelyAddClass === 'function') {
                                    manager.safelyAddClass(node, 'completed');
                                } else if (typeof node.addClass === 'function') {
                                    node.addClass('completed');
                                }
                            }
                        }
                        break;
                    case 'error':
                        if (typeof manager.markNodeError === 'function') {
                            manager.markNodeError(nodeId);
                        } else if (manager.cy) {
                            // Direct manipulation if we have cytoscape
                            const node = manager.cy.$(`#${nodeId}`);
                            if (node && node.length > 0) {
                                if (typeof manager.removeNodeExecutingAnimation === 'function') {
                                    manager.removeNodeExecutingAnimation(node);
                                }
                                if (typeof manager.safelyAddClass === 'function') {
                                    manager.safelyAddClass(node, 'error');
                                } else if (typeof node.addClass === 'function') {
                                    node.addClass('error');
                                }
                            }
                        }
                        break;
                }
            }
            // If no ThemeManager, try GraphManager directly
            else if (this.graphManager) {
                switch (status) {
                    case 'running':
                        if (typeof this.graphManager.highlightExecutingNode === 'function') {
                            this.graphManager.highlightExecutingNode(nodeId);
                        }
                        break;
                    case 'completed':
                        if (typeof this.graphManager.markNodeCompleted === 'function') {
                            this.graphManager.markNodeCompleted(nodeId);
                        }
                        break;
                    case 'error':
                        if (typeof this.graphManager.markNodeError === 'function') {
                            this.graphManager.markNodeError(nodeId);
                        }
                        break;
                }
            }
        } catch (error) {
            console.error(`Error updating graph node status for node ${nodeId}:`, error);
        }
    }
    
    /**
     * Handle execute button click
     */
    handleExecute() {
        this.executeWorkflow();
    }
    
    /**
     * Handle stop button click
     */
    handleStop() {
        this.stopExecution();
    }
    
    /**
     * Handle validate button click
     */
    handleValidate() {
        this.validateWorkflow();
    }
    
    /**
     * Handle reset button click
     */
    handleReset() {
        try {
            // Stop execution first
            this.stopExecution();
            
            // Force reset the execution state
            if (this.workflowManager && this.workflowManager.resetExecutionState) {
                try {
                    this.workflowManager.resetExecutionState();
                } catch (error) {
                    console.warn('Error resetting workflow execution state:', error);
                }
            }
            
            // Reset the panel
            if (this.panel) {
                this.panel.resetExecutionState();
            }
            
            // Clear any execution styling in the graph
            if (this.graphManager && this.graphManager.clearWorkflowVisualization) {
                try {
                    this.graphManager.clearWorkflowVisualization();
                } catch (error) {
                    console.warn('Error clearing workflow visualization:', error);
                }
            }
            
            // Clear all tracking sets
            this.executingNodes.clear();
            this.completedNodes.clear();
            this.errorNodes.clear();
            
            console.log('Workflow execution reset');
        } catch (error) {
            console.error('Error resetting workflow execution:', error);
        }
    }
    
    /**
     * Handle panel toggle event from the panel component
     * 
     * @param {Object} data - Toggle event data
     * @param {boolean} data.expanded - Whether panel is expanded
     */
    handlePanelToggle(data) {
        try {
            // Update base class state
            this.expanded = data.expanded;
            
            // Publish event and update theme state
            this.publishToggleEvent();
            this.updateThemeState();
        } catch (error) {
            console.warn('Error handling panel toggle:', error);
        }
    }
    
    /**
     * Handle highlight cycles button click
     * 
     * @param {Object} data - Event data
     * @param {Array} data.cycles - Array of cycles to highlight
     */
    handleHighlightCycles(data) {
        if (!this.workflowManager) return;
        
        try {
            // Call corresponding method if it exists
            if (typeof this.workflowManager.highlightCycles === 'function') {
                this.workflowManager.highlightCycles(data.cycles);
            } else if (this.graphManager && typeof this.graphManager.highlightCycles === 'function') {
                this.graphManager.highlightCycles(data.cycles);
            }
            
            // Publish event
            this.eventBus.publish('workflow:cycles-highlighted', {
                cycles: data.cycles
            });
        } catch (error) {
            console.error('Error highlighting cycles:', error);
        }
    }
    
    /**
     * Handle break cycles button click
     * 
     * @param {Object} data - Event data
     * @param {Array} data.cycles - Array of cycles to break
     */
    handleBreakCycles(data) {
        if (!this.workflowManager) return;
        
        try {
            // Call corresponding method if it exists
            if (typeof this.workflowManager.breakCycles === 'function') {
                this.workflowManager.breakCycles(data.cycles);
            }
            
            // Publish event
            this.eventBus.publish('workflow:cycles-broken', {
                cycles: data.cycles
            });
        } catch (error) {
            console.error('Error breaking cycles:', error);
        }
    }
    
    /**
     * Enhanced method to handle a node executing event
     * 
     * @param {Object} data - Event data
     */
    handleNodeExecuting(data) {
        if (!this.panel) return;
        
        try {
            // Skip if invalid data
            if (!data || !data.nodeId) {
                console.warn('Invalid node executing data received:', data);
                return;
            }
            
            // Update execution tracking
            this.executingNodes.add(data.nodeId);
            
            // Update UI through panel if method exists
            if (typeof this.panel.handleNodeExecuting === 'function') {
                this.panel.handleNodeExecuting(data);
            } else {
                // Fallback to our implementation
                this.updateNodeExecutionStatus(data.nodeId, 'running');
            }
            
            // Also update the node in the execution list if needed
            const nodeData = this.getNodeDataMap()[data.nodeId];
            const nodeName = data.nodeName || nodeData?.name || data.nodeId;
            this.addNodeToExecutionList(data.nodeId, nodeName, 'running');
        } catch (error) {
            console.error('Error handling node executing event:', error);
        }
    }
    
    /**
     * Handle node completed event
     * 
     * @param {Object} data - Event data
     */
    handleNodeCompleted(data) {
        if (!this.panel) return;
        
        try {
            // Skip if invalid data
            if (!data || !data.nodeId) {
                console.warn('Invalid node completed data received:', data);
                return;
            }
            
            // Update execution tracking
            this.executingNodes.delete(data.nodeId);
            this.completedNodes.add(data.nodeId);
            
            // Pass to panel for UI updates
            if (typeof this.panel.handleNodeCompleted === 'function') {
                this.panel.handleNodeCompleted(data);
            } else {
                // Fallback to our implementation
                this.updateNodeExecutionStatus(data.nodeId, 'completed');
            }
        } catch (error) {
            console.error('Error handling node completed event:', error);
        }
    }
    
    /**
     * Handle node error event
     * 
     * @param {Object} data - Event data
     */
    handleNodeError(data) {
        if (!this.panel) return;
        
        try {
            // Skip if invalid data
            if (!data || !data.nodeId) {
                console.warn('Invalid node error data received:', data);
                return;
            }
            
            // Update execution tracking
            this.executingNodes.delete(data.nodeId);
            this.errorNodes.add(data.nodeId);
            
            // Pass to panel for UI updates
            if (typeof this.panel.handleNodeError === 'function') {
                this.panel.handleNodeError(data);
            } else {
                // Fallback to our implementation
                this.updateNodeExecutionStatus(data.nodeId, 'error');
            }
        } catch (error) {
            console.error('Error handling node error event:', error);
        }
    }
    
    /**
     * Handle workflow executing event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowExecuting(data) {
        if (!this.panel) return;
        
        try {
            // Clear execution tracking at the start
            this.executingNodes.clear();
            this.completedNodes.clear();
            this.errorNodes.clear();
            
            // Pass to panel for UI updates
            if (typeof this.panel.handleWorkflowExecuting === 'function') {
                this.panel.handleWorkflowExecuting(data);
            }
        } catch (error) {
            console.error('Error handling workflow executing event:', error);
        }
    }
    
    /**
     * Handle workflow completed event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowCompleted(data) {
        if (!this.panel) return;
        
        try {
            // Clear any timeouts
            this.clearExecutionTimeout();
            
            // Pass to panel for UI updates
            if (typeof this.panel.handleWorkflowCompleted === 'function') {
                this.panel.handleWorkflowCompleted(data);
            }
        } catch (error) {
            console.error('Error handling workflow completed event:', error);
        }
    }
    
/**
 * Handle workflow failed event - this ensures proper state cleanup
 * 
 * @param {Object} data - Event data
 */
handleWorkflowFailed(data) {
    if (!this.panel) return;
    
    try {
        // Clear any timeouts
        this.clearExecutionTimeout();
        
        // Reset execution state
        this.resetExecutionState();
        
        // Pass to panel for UI updates
        if (typeof this.panel.handleWorkflowFailed === 'function') {
            this.panel.handleWorkflowFailed(data);
        }
        
        // Update status
        this.updateExecutionStatus('Failed', 'error');
        
        // Show error in panel if possible
        if (typeof this.panel.showError === 'function') {
            this.panel.showError(data.error || 'Workflow execution failed');
        }
    } catch (error) {
        console.error('Error handling workflow failed event:', error);
    }
}
    
    /**
     * Handle workflow stopped event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowStopped(data) {
        if (!this.panel) return;
        
        try {
            // Clear any timeouts
            this.clearExecutionTimeout();
            
            // Reset tracking sets
            this.executingNodes.clear();
            this.completedNodes.clear();
            this.errorNodes.clear();
            
            // Reset UI state
            this.panel.resetExecutionState();
            this.panel.updateStatus('Stopped', 'waiting');
        } catch (error) {
            console.error('Error handling workflow stopped event:', error);
        }
    }
    
    /**
     * Handle graph loaded event
     * 
     * @param {Object} graphData - Graph data
     */
    handleGraphLoaded(graphData) {
        if (!this.panel) return;
        
        try {
            // Update panel with graph info
            this.panel.updateGraphInfo(graphData);
        } catch (error) {
            console.error('Error handling graph loaded event:', error);
        }
    }
    
    /**
     * Handle graph saved event
     * 
     * @param {Object} graphData - Graph data
     */
    handleGraphSaved(graphData) {
        if (!this.panel) return;
        
        try {
            // Update panel with graph info
            this.panel.updateGraphInfo(graphData);
        } catch (error) {
            console.error('Error handling graph saved event:', error);
        }
    }
    
    /**
     * Handle graph cleared event
     */
    handleGraphCleared() {
        if (!this.panel) return;
        
        try {
            // Reset panel
            this.panel.resetPanel();
            
            // Clear tracking sets
            this.executingNodes.clear();
            this.completedNodes.clear();
            this.errorNodes.clear();
        } catch (error) {
            console.error('Error handling graph cleared event:', error);
        }
    }
    
    /**
     * Handle graph changed event
     * 
     * @param {Object} graphData - Graph data
     */
    handleGraphChanged(graphData) {
        if (!this.panel) return;
        
        try {
            // Update panel with graph info
            this.panel.updateGraphInfo(graphData);
        } catch (error) {
            console.error('Error handling graph changed event:', error);
        }
    }
    
    /**
     * Update graph information in the panel
     * 
     * @param {Object} graphData - Graph data
     */
    updateGraphInfo(graphData) {
        if (!this.panel) return;
        
        try {
            this.panel.updateGraphInfo(graphData);
        } catch (error) {
            console.error('Error updating graph info:', error);
        }
    }
    
    /**
     * Reset the panel
     */
    resetPanel() {
        if (!this.panel) return;
        
        try {
            this.panel.resetPanel();
            
            // Clear execution tracking sets
            this.executingNodes.clear();
            this.completedNodes.clear();
            this.errorNodes.clear();
        } catch (error) {
            console.error('Error resetting panel:', error);
        }
    }
    
    /**
     * Bring the workflow panel to the front
     */
    bringToFront() {
        try {
            if (this.draggablePanel) {
                draggablePanelManager.bringToFront('workflow-panel');
            }
        } catch (error) {
            console.warn('Error bringing workflow panel to front:', error);
        }
    }

    /**
 * Missing method that UIManager is trying to call
 * This is causing the TypeError in UIManager.handleWorkflowFailed
 * 
 * @param {string} status - The execution status (running, completed, failed, waiting)
 * @param {string} type - Visual indicator type (executing, success, error, waiting)
 */
updateExecutionStatus(status, type = 'waiting') {
    if (!this.panel) return;
    
    try {
        // If the panel has its own updateStatus method, use it
        if (typeof this.panel.updateStatus === 'function') {
            this.panel.updateStatus(status, type);
            return;
        }
        
        // Otherwise find status element
        const statusElement = this.panel.elements?.statusIndicator || 
                             this.containerElement?.querySelector('.workflow-status');
        
        if (statusElement) {
            // Update text and classes
            statusElement.textContent = status;
            statusElement.className = `workflow-status ${type}`;
        }
        
        // Update panel state if panel tracks this
        if (this.panel.state) {
            this.panel.state.executionStatus = status;
            this.panel.state.executionType = type;
        }
        
        // Handle workflow-wide status changes
        switch (type) {
            case 'executing':
            case 'running':
                // Enable stop button, disable execute button
                if (this.panel.elements?.executeBtn) {
                    this.panel.elements.executeBtn.disabled = true;
                }
                if (this.panel.elements?.stopBtn) {
                    this.panel.elements.stopBtn.disabled = false;
                }
                break;
                
            case 'completed':
            case 'success':
            case 'error':
            case 'failed':
            case 'waiting':
                // Enable execute button, disable stop button
                if (this.panel.elements?.executeBtn) {
                    this.panel.elements.executeBtn.disabled = false;
                }
                if (this.panel.elements?.stopBtn) {
                    this.panel.elements.stopBtn.disabled = true;
                }
                break;
        }
    } catch (error) {
        console.error('Error updating execution status:', error);
    }
}
    
    /**
     * Clean up resources on destroy
     */
    destroy() {
        try {
            // Clear any timeouts
            this.clearExecutionTimeout();
            
            // Unsubscribe from all events
            if (this.eventBus) {
                this.eventBus.unsubscribe('workflow:executing', this.handleWorkflowExecuting);
                this.eventBus.unsubscribe('workflow:node-executing', this.handleNodeExecuting);
                this.eventBus.unsubscribe('workflow:node-completed', this.handleNodeCompleted);
                this.eventBus.unsubscribe('workflow:node-error', this.handleNodeError);
                this.eventBus.unsubscribe('workflow:completed', this.handleWorkflowCompleted);
                this.eventBus.unsubscribe('workflow:failed', this.handleWorkflowFailed);
                this.eventBus.unsubscribe('workflow:stopped', this.handleWorkflowStopped);
                this.eventBus.unsubscribe('graph:loaded', this.handleGraphLoaded);
                this.eventBus.unsubscribe('graph:saved', this.handleGraphSaved);
                this.eventBus.unsubscribe('graph:cleared', this.handleGraphCleared);
                this.eventBus.unsubscribe('graph:current-changed', this.handleGraphChanged);
            }
            
            // Clean up panel if it has a destroy method
            if (this.panel && typeof this.panel.destroy === 'function') {
                this.panel.destroy();
            }
            
            // Clean up draggable panel
            if (this.draggablePanel) {
                draggablePanelManager.closePanel('workflow-panel');
                this.draggablePanel = null;
            }
            
            // Unregister from registry
            const panelId = this.draggablePanel ? 'workflow-panel' : 'workflow-panel-fixed';
            workflowPanelRegistry.unregisterPanel(panelId);
            
            // Clear references
            this.panel = null;
            this.nodeRegistry = {};
            this.executingNodes.clear();
            this.completedNodes.clear();
            this.errorNodes.clear();
            
            // Call base destroy
            super.destroy();
        } catch (error) {
            console.error('Error destroying WorkflowPanelManager:', error);
        }
    }
}