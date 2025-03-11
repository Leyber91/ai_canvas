/**
 * ui/WorkflowPanelManager.js
 *
 * Hypermodularized workflow panel manager that coordinates between the workflow panel
 * and other UI components like the event bus, theme manager, and graph/workflow managers.
 * 
 * Now supports draggable workflow panels using the DraggablePanelManager.
 * Integrated with WorkflowPanelRegistry to prevent duplicate panels.
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
        
        // State
        this.containerElement = null;
        this.panel = null;
        this.executionTimeout = null;
        
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
    }
    
    /**
     * Initialize the workflow panel manager
     */
    initialize() {
        // Return early if already initialized
        if (this.initialized) return;
        
        // Log initialization
        console.log('Initializing WorkflowPanelManager');
        
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
    }
    
    /**
     * Clean up any duplicate workflow panels in the DOM
     */
    cleanupDuplicatePanels() {
        // Use the registry to clean up duplicates
        const removedCount = workflowPanelRegistry.cleanupDuplicates();
        
        if (removedCount > 0) {
            console.log(`Cleaned up ${removedCount} duplicate workflow panels`);
        }
    }
    
    /**
     * Register this panel with the workflow panel registry
     */
    registerWithRegistry() {
        if (!this.panel) return;
        
        const panelId = this.draggablePanel ? 'workflow-panel' : 'workflow-panel-fixed';
        
        // Register with registry
        workflowPanelRegistry.registerPanel(panelId, {
            element: this.draggablePanel || this.containerElement,
            manager: this,
            panel: this.panel
        });
        
        // Set as active panel
        workflowPanelRegistry.setActivePanel(panelId);
    }
    
    /**
     * Create or find the container element for the panel
     */
    createContainerElement() {
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
    }
    
    /**
     * Initialize the workflow panel component
     */
    initializePanel() {
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
        
        return defaultTheme;
    }
    
    /**
     * Subscribe to workflow-related events
     */
    subscribeToEvents() {
        // Workflow execution events
        this.eventBus.subscribe('workflow:executing', this.handleWorkflowExecuting);
        this.eventBus.subscribe('workflow:node-executing', this.handleNodeExecuting);
        this.eventBus.subscribe('workflow:node-completed', this.handleNodeCompleted);
        this.eventBus.subscribe('workflow:node-error', this.handleNodeError);
        this.eventBus.subscribe('workflow:completed', this.handleWorkflowCompleted);
        this.eventBus.subscribe('workflow:failed', this.handleWorkflowFailed);
        this.eventBus.subscribe('workflow:stopped', this.handleWorkflowStopped.bind(this));
        
        // Graph events
        this.eventBus.subscribe('graph:loaded', this.handleGraphLoaded.bind(this));
        this.eventBus.subscribe('graph:saved', this.handleGraphSaved.bind(this));
        this.eventBus.subscribe('graph:cleared', this.handleGraphCleared.bind(this));
        this.eventBus.subscribe('graph:current-changed', this.handleGraphChanged.bind(this));
    }
    
    /**
     * Override togglePanel to handle the panel component
     */
    togglePanel() {
        if (!this.panel) return;
        
        // Toggle the panel component
        this.panel.togglePanel();
        
        // Update base class state
        this.expanded = this.panel.state.expanded;
        
        // Publish event and update theme state
        this.publishToggleEvent();
        this.updateThemeState();
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
     * Execute the workflow
     */
    async executeWorkflow() {
        if (!this.panel || !this.workflowManager) return;
        
        // Check if a workflow is already executing
        if (this.workflowManager.executionState?.isExecuting) {
            this.panel.showError('A workflow is already running. Please wait for it to complete or stop it first.');
            return;
        }
        
        // Update UI state
        this.panel.handleWorkflowExecuting();
        
        try {
            // Get current graph ID
            const graphId = this.workflowManager.currentGraphId ||
                           this.graphManager.getCurrentGraphId() ||
                           localStorage.getItem('aiCanvas_lastGraphId');
            
            if (!graphId) {
                this.panel.showError('No graph selected. Please save the graph first.');
                this.panel.resetExecutionState();
                return;
            }
            
            // Validate workflow before execution
            const canExecute = await this.validateWorkflow(true);
            
            if (!canExecute) {
                this.panel.resetExecutionState();
                return;
            }
            
            console.log(`Executing workflow for graph ${graphId}`);
            
            // Add a timeout to prevent execution hanging indefinitely
            const executionPromise = this.workflowManager.executeWorkflow(graphId);
            
            // Create a timeout promise
            this.clearExecutionTimeout();
            const timeoutPromise = new Promise((_, reject) => {
                this.executionTimeout = setTimeout(() => {
                    reject(new Error('Workflow execution timed out after 60 seconds'));
                }, 60000);
            });
            
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
                this.panel.handleWorkflowCompleted({
                    results,
                    executionOrder
                });
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
            
            this.panel.handleWorkflowFailed({
                error: errorMessage
            });
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
     * Stop the execution
     */
    stopExecution() {
        if (!this.panel || !this.workflowManager) return;
        
        // Clear any timeouts
        this.clearExecutionTimeout();
        
        console.log('Stopping workflow execution');
        
        // Call workflowManager's stop method if it exists
        if (typeof this.workflowManager.stopExecution === 'function') {
            this.workflowManager.stopExecution();
        } else if (this.workflowManager.executionEngine?.stopExecution) {
            this.workflowManager.executionEngine.stopExecution();
        } else {
            // Fallback - just reset the executing flag
            if (this.workflowManager.executionState) {
                this.workflowManager.executionState.isExecuting = false;
            }
            
            // Publish event
            this.eventBus.publish('workflow:stopped', {
                timestamp: Date.now()
            });
        }
        
        // Update UI
        this.panel.resetExecutionState();
        this.panel.updateStatus('Stopped', 'waiting');
    }
    
    /**
     * Validate the workflow
     * 
     * @param {boolean} silent - Whether to show validation results
     * @returns {boolean} Whether validation was successful
     */
    async validateWorkflow(silent = false) {
        if (!this.panel || !this.workflowManager) return false;
        
        // Update UI for validation
        if (!silent) {
            this.panel.updateStatus('Validating', 'executing');
        }
        
        try {
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
                    if (this.panel.elements.errorsContainer) {
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
        
        // Get all nodes in the graph
        let nodes = [];
        
        try {
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
        this.panel.resetExecutionState();
        
        // Clear any execution styling in the graph
        if (this.graphManager && this.graphManager.clearWorkflowVisualization) {
            try {
                this.graphManager.clearWorkflowVisualization();
            } catch (error) {
                console.warn('Error clearing workflow visualization:', error);
            }
        }
        
        console.log('Workflow execution reset');
    }
    
    /**
     * Handle panel toggle event from the panel component
     * 
     * @param {Object} data - Toggle event data
     * @param {boolean} data.expanded - Whether panel is expanded
     */
    handlePanelToggle(data) {
        // Update base class state
        this.expanded = data.expanded;
        
        // Publish event and update theme state
        this.publishToggleEvent();
        this.updateThemeState();
    }
    
    /**
     * Handle highlight cycles button click
     * 
     * @param {Object} data - Event data
     * @param {Array} data.cycles - Array of cycles to highlight
     */
    handleHighlightCycles(data) {
        if (!this.workflowManager) return;
        
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
    }
    
    /**
     * Handle break cycles button click
     * 
     * @param {Object} data - Event data
     * @param {Array} data.cycles - Array of cycles to break
     */
    handleBreakCycles(data) {
        if (!this.workflowManager) return;
        
        // Call corresponding method if it exists
        if (typeof this.workflowManager.breakCycles === 'function') {
            this.workflowManager.breakCycles(data.cycles);
        }
        
        // Publish event
        this.eventBus.publish('workflow:cycles-broken', {
            cycles: data.cycles
        });
    }
    
    /**
     * Handle workflow executing event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowExecuting(data) {
        if (!this.panel) return;
        
        // Pass to panel for UI updates
        this.panel.handleWorkflowExecuting(data);
    }
    
    /**
     * Handle node executing event
     * 
     * @param {Object} data - Event data
     */
    handleNodeExecuting(data) {
        if (!this.panel) return;
        
        // Pass to panel for UI updates
        this.panel.handleNodeExecuting(data);
    }
    
    /**
     * Handle node completed event
     * 
     * @param {Object} data - Event data
     */
    handleNodeCompleted(data) {
        if (!this.panel) return;
        
        // Pass to panel for UI updates
        this.panel.handleNodeCompleted(data);
    }
    
    /**
     * Handle node error event
     * 
     * @param {Object} data - Event data
     */
    handleNodeError(data) {
        if (!this.panel) return;
        
        // Pass to panel for UI updates
        this.panel.handleNodeError(data);
    }
    
    /**
     * Handle workflow completed event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowCompleted(data) {
        if (!this.panel) return;
        
        // Clear any timeouts
        this.clearExecutionTimeout();
        
        // Pass to panel for UI updates
        this.panel.handleWorkflowCompleted(data);
    }
    
    /**
     * Handle workflow failed event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowFailed(data) {
        if (!this.panel) return;
        
        // Clear any timeouts
        this.clearExecutionTimeout();
        
        // Pass to panel for UI updates
        this.panel.handleWorkflowFailed(data);
    }
    
    /**
     * Handle workflow stopped event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowStopped(data) {
        if (!this.panel) return;
        
        // Clear any timeouts
        this.clearExecutionTimeout();
        
        // Reset UI state
        this.panel.resetExecutionState();
        this.panel.updateStatus('Stopped', 'waiting');
    }
    
    /**
     * Handle graph loaded event
     * 
     * @param {Object} graphData - Graph data
     */
    handleGraphLoaded(graphData) {
        if (!this.panel) return;
        
        // Update panel with graph info
        this.panel.updateGraphInfo(graphData);
    }
    
    /**
     * Handle graph saved event
     * 
     * @param {Object} graphData - Graph data
     */
    handleGraphSaved(graphData) {
        if (!this.panel) return;
        
        // Update panel with graph info
        this.panel.updateGraphInfo(graphData);
    }
    
    /**
     * Handle graph cleared event
     */
    handleGraphCleared() {
        if (!this.panel) return;
        
        // Reset panel
        this.panel.resetPanel();
    }
    
    /**
     * Handle graph changed event
     * 
     * @param {Object} graphData - Graph data
     */
    handleGraphChanged(graphData) {
        if (!this.panel) return;
        
        // Update panel with graph info
        this.panel.updateGraphInfo(graphData);
    }
    
    /**
     * Update graph information in the panel
     * 
     * @param {Object} graphData - Graph data
     */
    updateGraphInfo(graphData) {
        if (!this.panel) return;
        
        this.panel.updateGraphInfo(graphData);
    }
    
    /**
     * Reset the panel
     */
    resetPanel() {
        if (!this.panel) return;
        
        this.panel.resetPanel();
    }
    
    /**
     * Clean up resources on destroy
     */
    destroy() {
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
        
        this.panel = null;
        
        // Call base destroy
        super.destroy();
    }
    
    /**
     * Bring the workflow panel to the front
     */
    bringToFront() {
        if (this.draggablePanel) {
            draggablePanelManager.bringToFront('workflow-panel');
        }
    }
}
