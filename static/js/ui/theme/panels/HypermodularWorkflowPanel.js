/**
 * ui/components/workflow/HypermodularWorkflowPanel.js
 * 
 * A highly modularized panel for visualizing and controlling workflow execution.
 * Provides a clean interface for monitoring, executing, and debugging workflows.
 * Now supports dragging and positioning.
 */
import { EventEmitter } from '../../../core/EventEmitter.js';
import { DOMHelper } from '../../helpers/domHelpers.js';
import { DraggableManager } from './draggable/DraggableManager.js';
import { ThemeManager } from './theme/ThemeManager.js';
import { StatusDisplayManager } from './status/StatusDisplayManager.js';
import { ExecutionPlanManager } from './execution/ExecutionPlanManager.js';
import { ResultsManager } from './results/ResultsManager.js';
import { ErrorManager } from './errors/ErrorManager.js';
import { ControlsManager } from './controls/ControlsManager.js';

export class HypermodularWorkflowPanel extends EventEmitter {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element for the panel
     * @param {Object} options.theme - Theme configuration
     * @param {Function} options.onExecute - Callback for execution
     * @param {Function} options.onStop - Callback for stopping execution
     * @param {Function} options.onValidate - Callback for validation
     * @param {Object} options.position - Initial position of the panel
     */
    constructor(options = {}) {
        super();
        
        // Store options with defaults
        this.options = {
            container: null,
            theme: {
                dark: true,
                accentColor: '#3498db',
                errorColor: '#e74c3c',
                successColor: '#2ecc71',
                warningColor: '#f39c12',
                backgroundColor: 'rgba(18, 22, 36, 0.7)',
                textColor: '#ffffff'
            },
            onExecute: () => {},
            onStop: () => {},
            onValidate: () => {},
            position: {
                bottom: '20px',
                left: '20px'
            },
            ...options
        };
        
        // DOM elements
        this.container = this.options.container;
        this.elements = {
            panel: null,
            panelTitle: null
        };
        
        // State
        this.state = {
            isExecuting: false,
            currentStep: 0,
            executionSteps: [],
            executionResults: {},
            expanded: false,
            isValid: null,
            progress: 0
        };
        
        // Initialize managers
        this.themeManager = null;
        this.draggableManager = null;
        this.statusManager = null;
        this.executionPlanManager = null;
        this.resultsManager = null;
        this.errorManager = null;
        this.controlsManager = null;
        
        // Bound methods for event listeners
        this.handleTogglePanel = this.handleTogglePanel.bind(this);
        
        // Initialize panel
        if (this.container) {
            this.render();
            this.initializeManagers();
            this.setupEventListeners();
            this.applyInitialPosition();
        }
    }
    
    /**
     * Render the base workflow panel structure
     */
    render() {
        if (!this.container) return;
        
        // Create panel HTML
        const html = `
            <div class="hypermodular-workflow-panel">
                <div class="panel-header">
                    <h3 class="panel-title" data-expanded="${this.state.expanded ? 'true' : 'false'}">
                        <span>Workflow Execution</span>
                        <span class="toggle-indicator">${this.state.expanded ? '▼' : '►'}</span>
                    </h3>
                    <div class="panel-controls">
                        <button class="minimize-btn" title="Minimize">_</button>
                        <button class="close-btn" title="Close">×</button>
                    </div>
                </div>
                
                <div class="panel-content">
                    <!-- Each section will be rendered by its respective manager -->
                    <div class="workflow-status-container"></div>
                    <div class="execution-progress-container"></div>
                    <div class="execution-steps-container"></div>
                    <div class="execution-results-container"></div>
                    <div class="workflow-controls-container"></div>
                    <div class="workflow-errors-container"></div>
                </div>
            </div>
        `;
        
        // Set container content
        this.container.innerHTML = html;
        
        // Get references to elements
        this.elements.panel = this.container.querySelector('.hypermodular-workflow-panel');
        this.elements.panelTitle = this.container.querySelector('.panel-title');
        this.elements.minimizeBtn = this.container.querySelector('.minimize-btn');
        this.elements.closeBtn = this.container.querySelector('.close-btn');
    }
    
    /**
     * Initialize all manager components
     */
    initializeManagers() {
        // Theme Manager - handles all styling
        this.themeManager = new ThemeManager({
            panel: this.elements.panel,
            theme: this.options.theme
        });
        
        // Draggable Manager - handles dragging functionality
        this.draggableManager = new DraggableManager({
            panel: this.elements.panel,
            handle: this.container.querySelector('.panel-header'),
            container: document.body,
            onDragStart: () => this.emit('dragStart'),
            onDragEnd: () => this.emit('dragEnd')
        });
        
        // Status Display Manager
        this.statusManager = new StatusDisplayManager({
            container: this.container.querySelector('.workflow-status-container'),
            theme: this.options.theme
        });
        
        // Execution Plan Manager
        this.executionPlanManager = new ExecutionPlanManager({
            container: this.container.querySelector('.execution-steps-container'),
            theme: this.options.theme
        });
        
        // Results Manager
        this.resultsManager = new ResultsManager({
            container: this.container.querySelector('.execution-results-container'),
            theme: this.options.theme
        });
        
        // Error Manager
        this.errorManager = new ErrorManager({
            container: this.container.querySelector('.workflow-errors-container'),
            theme: this.options.theme,
            onHighlightCycles: (cycles) => this.emit('highlight-cycles', { cycles }),
            onBreakCycles: (cycles) => this.emit('break-cycles', { cycles })
        });
        
        // Controls Manager
        this.controlsManager = new ControlsManager({
            container: this.container.querySelector('.workflow-controls-container'),
            theme: this.options.theme,
            onExecute: () => {
                this.options.onExecute();
                this.emit('execute');
            },
            onStop: () => {
                this.options.onStop();
                this.emit('stop');
            },
            onValidate: () => {
                this.options.onValidate();
                this.emit('validate');
            },
            onReset: () => {
                this.resetExecutionState();
                this.emit('reset');
            }
        });
    }
    
    /**
     * Set up event listeners for the panel
     */
    setupEventListeners() {
        // Panel toggle
        if (this.elements.panelTitle) {
            this.elements.panelTitle.addEventListener('click', this.handleTogglePanel);
        }
        
        // Minimize button
        if (this.elements.minimizeBtn) {
            this.elements.minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.minimizePanel();
            });
        }
        
        // Close button
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hidePanel();
            });
        }
    }
    
    /**
     * Apply initial position to the panel
     */
    applyInitialPosition() {
        if (!this.elements.panel) return;
        
        const panel = this.elements.panel;
        const { position } = this.options;
        
        // Set the panel as positioned absolutely
        panel.style.position = 'fixed';
        
        // Apply initial position
        if (position.bottom) panel.style.bottom = position.bottom;
        if (position.left) panel.style.left = position.left;
        if (position.top) panel.style.top = position.top;
        if (position.right) panel.style.right = position.right;
        
        // Set z-index for proper stacking
        panel.style.zIndex = 1000;
    }
    
    /**
     * Handle panel toggle click
     */
    handleTogglePanel() {
        this.togglePanel();
    }
    
    /**
     * Toggle panel expansion
     */
    togglePanel() {
        this.state.expanded = !this.state.expanded;
        
        if (this.elements.panel) {
            if (this.state.expanded) {
                this.elements.panel.classList.add('expanded');
            } else {
                this.elements.panel.classList.remove('expanded');
            }
        }
        
        // Update the toggle indicator
        if (this.elements.panelTitle) {
            const indicator = this.elements.panelTitle.querySelector('.toggle-indicator');
            if (indicator) {
                indicator.textContent = this.state.expanded ? '▼' : '►';
            }
        }
        
        // Emit event
        this.emit('toggle', { expanded: this.state.expanded });
    }
    
    /**
     * Minimize the panel
     */
    minimizePanel() {
        if (this.elements.panel) {
            this.elements.panel.classList.add('minimized');
            this.emit('minimize');
        }
    }
    
    /**
     * Restore the panel from minimized state
     */
    restorePanel() {
        if (this.elements.panel) {
            this.elements.panel.classList.remove('minimized');
            this.emit('restore');
        }
    }
    
    /**
     * Hide the panel completely
     */
    hidePanel() {
        if (this.elements.panel) {
            this.elements.panel.classList.add('hidden');
            this.emit('hide');
        }
    }
    
    /**
     * Show the panel if hidden
     */
    showPanel() {
        if (this.elements.panel) {
            this.elements.panel.classList.remove('hidden');
            this.emit('show');
        }
    }
    
    /**
     * Update the status display
     * 
     * @param {string} status - The status text
     * @param {string} statusClass - CSS class for styling (waiting, executing, success, error)
     */
    updateStatus(status, statusClass) {
        this.statusManager.updateStatus(status, statusClass);
    }
    
    /**
     * Update the progress display
     * 
     * @param {number} percent - Progress percentage (0-100)
     */
    updateProgress(percent) {
        this.statusManager.updateProgress(percent);
        this.state.progress = Math.max(0, Math.min(100, percent));
    }
    
    /**
     * Show an error message
     * 
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.errorManager.showError(message);
        this.updateStatus('Error', 'error');
        
        // Expand panel if it's collapsed
        if (!this.state.expanded) {
            this.togglePanel();
        }
        
        // Emit event
        this.emit('error', { message });
    }
    
    /**
     * Show validation errors
     * 
     * @param {Object} validation - Validation result object
     */
    showValidationErrors(validation) {
        this.errorManager.showValidationErrors(validation);
        this.updateStatus('Invalid', 'error');
    }
    
    /**
     * Update execution controls state
     * 
     * @param {boolean} isExecuting - Whether workflow is executing
     */
    updateExecutionControls(isExecuting) {
        this.state.isExecuting = isExecuting;
        this.controlsManager.updateExecutionControls(isExecuting);
    }
    
    /**
     * Show the execution plan for a workflow
     * 
     * @param {Array} executionOrder - Array of node IDs in execution order
     * @param {Object} nodeDataMap - Map of node ID to node data
     */
    showExecutionPlan(executionOrder, nodeDataMap = {}) {
        this.executionPlanManager.showExecutionPlan(executionOrder, nodeDataMap);
        this.state.executionSteps = executionOrder;
    }
    
    /**
     * Update the step status in the execution plan
     * 
     * @param {string} nodeId - ID of the node to update
     * @param {string} status - Status (pending, executing, success, error)
     * @param {string} statusText - Text to display
     */
    updateStepStatus(nodeId, status, statusText = null) {
        this.executionPlanManager.updateStepStatus(nodeId, status, statusText);
    }
    
    /**
     * Update the results display
     * 
     * @param {Object} results - Execution results by node ID
     * @param {Object} nodeDataMap - Map of node ID to node data
     */
    updateResultsDisplay(results = null, nodeDataMap = {}) {
        // Use provided results or state
        const executionResults = results || this.state.executionResults;
        
        this.resultsManager.updateResultsDisplay(executionResults, nodeDataMap);
        
        // Store results in state
        if (results) {
            this.state.executionResults = { ...executionResults };
        }
    }
    
    /**
     * Show a modal with the full result
     * 
     * @param {string} nodeId - Node ID
     * @param {string} result - Full result content
     * @param {Object} nodeDataMap - Map of node ID to node data
     */
    showResultModal(nodeId, result, nodeDataMap = {}) {
        this.resultsManager.showResultModal(nodeId, result, nodeDataMap);
        this.emit('show-result-modal', { nodeId, result });
    }
    
    /**
     * Set execution mode (enabled/disabled)
     * 
     * @param {boolean} enabled - Whether execution is enabled
     */
    setExecutionEnabled(enabled) {
        this.controlsManager.setExecutionEnabled(enabled);
    }
    
    /**
     * Reset the execution state to initial
     */
    resetExecutionState() {
        // Reset state
        this.state.isExecuting = false;
        this.state.progress = 0;
        
        // Update UI
        this.updateStatus('Ready', 'waiting');
        this.updateProgress(0);
        this.updateExecutionControls(false);
        
        // Hide reset button
        this.controlsManager.hideResetButton();
        
        // Emit event
        this.emit('execution-reset');
    }
    
    /**
     * Handle workflow execution started
     */
    handleWorkflowExecuting() {
        // Update status and controls
        this.updateStatus('Executing', 'executing');
        this.updateProgress(0);
        this.updateExecutionControls(true);
        
        // Clear previous results
        this.state.executionResults = {};
        this.resultsManager.showExecutionInProgress();
        
        // Hide errors
        this.errorManager.hideErrors();
        
        // Expand panel if collapsed
        if (!this.state.expanded) {
            this.togglePanel();
        }
        
        // Emit event
        this.emit('execution-started');
    }
    
    /**
     * Handle node execution started
     * 
     * @param {Object} data - Node execution data
     */
    handleNodeExecuting(data) {
        const { nodeId, progress } = data;
        
        // Update progress bar
        if (typeof progress === 'number') {
            this.updateProgress(progress * 100);
        }
        
        // Update step status
        this.updateStepStatus(nodeId, 'executing', 'Executing');
        
        // Emit event
        this.emit('node-executing', data);
    }
    
    /**
     * Handle node execution completed
     * 
     * @param {Object} data - Node completion data
     */
    handleNodeCompleted(data) {
        const { nodeId, result } = data;
        
        // Update step status
        this.updateStepStatus(nodeId, 'success', 'Completed');
        
        // Store result
        this.state.executionResults[nodeId] = result;
        
        // Update results display
        this.updateResultsDisplay();
        
        // Emit event
        this.emit('node-completed', data);
    }
    
    /**
     * Handle node execution error
     * 
     * @param {Object} data - Node error data
     */
    handleNodeError(data) {
        const { nodeId, error } = data;
        
        // Update step status
        this.updateStepStatus(nodeId, 'error', 'Error');
        
        // Store error as result
        this.state.executionResults[nodeId] = `Error: ${error}`;
        
        // Update results display
        this.updateResultsDisplay();
        
        // Show error message
        this.showError(`Error executing node ${nodeId}: ${error}`);
        
        // Emit event
        this.emit('node-error', data);
    }
    
    /**
     * Handle workflow execution completed
     * 
     * @param {Object} data - Workflow completion data
     */
    handleWorkflowCompleted(data) {
        // Update status and controls
        this.updateStatus('Completed', 'success');
        this.updateProgress(100);
        this.updateExecutionControls(false);
        
        // Process and store results
        const results = data.results || {};
        this.state.executionResults = { ...results };
        
        // Update results display
        this.updateResultsDisplay();
        
        // Emit event
        this.emit('execution-completed', data);
    }
    
    /**
     * Handle workflow execution failed
     * 
     * @param {Object} data - Workflow failure data
     */
    handleWorkflowFailed(data) {
        // Update status and controls
        this.updateStatus('Failed', 'error');
        this.updateExecutionControls(false);
        
        // Show error message
        this.showError(`Workflow execution failed: ${data.error}`);
        
        // Emit event
        this.emit('execution-failed', data);
    }
    
    /**
     * Update the panel with graph information
     * 
     * @param {Object} graphData - Graph data
     */
    updateGraphInfo(graphData) {
        // Enable execution button if we have a valid graph
        if (graphData && graphData.id) {
            this.setExecutionEnabled(true);
        } else {
            this.setExecutionEnabled(false);
        }
        
        // Store graph info
        this.state.currentGraph = graphData;
        
        // Emit event
        this.emit('graph-updated', { graph: graphData });
    }
    
    /**
     * Reset the panel to initial state
     */
    resetPanel() {
        // Reset state
        this.state.isExecuting = false;
        this.state.executionResults = {};
        this.state.executionSteps = [];
        this.state.currentGraph = null;
        
        // Update UI
        this.updateStatus('Ready', 'waiting');
        this.updateProgress(0);
        
        // Reset all component managers
        this.executionPlanManager.reset();
        this.resultsManager.reset();
        this.errorManager.hideErrors();
        
        // Disable execution controls
        this.setExecutionEnabled(false);
        this.updateExecutionControls(false);
        
        // Emit event
        this.emit('panel-reset');
    }
}