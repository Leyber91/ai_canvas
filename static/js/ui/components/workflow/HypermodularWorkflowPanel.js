/**
 * ui/components/workflow/HypermodularWorkflowPanel.js
 * 
 * A highly modularized panel for visualizing and controlling workflow execution.
 * Provides a clean interface for monitoring, executing, and debugging workflows.
 */
import { EventEmitter } from '../../../core/EventEmitter.js';
import { DOMHelper } from '../../helpers/domHelpers.js';
import { EventUtils } from '../../helpers/EventUtils.js';

export class HypermodularWorkflowPanel extends EventEmitter {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element for the panel
     * @param {Object} options.theme - Theme configuration
     * @param {Function} options.onExecute - Callback for execution
     * @param {Function} options.onStop - Callback for stopping execution
     * @param {Function} options.onValidate - Callback for validation
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
            ...options
        };
        
        // DOM elements
        this.container = this.options.container;
        this.elements = {
            statusDisplay: null,
            progressBar: null,
            progressText: null,
            executionStepsDisplay: null,
            resultsDisplay: null,
            errorsDisplay: null,
            errorsContainer: null,
            executeBtn: null,
            stopBtn: null,
            validateBtn: null
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
        
        // Bound methods for event listeners
        this.handleExecuteClick = this.handleExecuteClick.bind(this);
        this.handleStopClick = this.handleStopClick.bind(this);
        this.handleValidateClick = this.handleValidateClick.bind(this);
        this.handleTogglePanel = this.handleTogglePanel.bind(this);
        
        // Initialize panel
        if (this.container) {
            this.render();
            this.setupEventListeners();
        }
    }
    
    /**
     * Render the workflow panel
     */
    render() {
        if (!this.container) return;
        
        // Create panel HTML
        const html = `
            <div class="hypermodular-workflow-panel">
                <h3 class="panel-title" data-expanded="${this.state.expanded ? 'true' : 'false'}">
                    <span>Workflow Execution</span>
                    <span class="toggle-indicator">${this.state.expanded ? '▼' : '►'}</span>
                </h3>
                
                <div class="workflow-status">
                    <div class="status-indicator waiting">
                        <div class="status-dot"></div>
                        <span class="status-text">Ready</span>
                    </div>
                </div>
                
                <div class="execution-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-text">0%</div>
                </div>
                
                <div class="execution-steps">
                    <h4>Execution Plan</h4>
                    <div class="steps-container">
                        <div class="empty-plan">Select or save a graph to enable workflow execution</div>
                    </div>
                </div>
                
                <div class="execution-results">
                    <h4>Results</h4>
                    <div class="results-container">
                        <div class="empty-results">No results yet</div>
                    </div>
                </div>
                
                <div class="workflow-controls">
                    <button class="execute-btn" disabled>Execute Workflow</button>
                    <button class="stop-btn" disabled>Stop Execution</button>
                    <button class="validate-btn">Validate Workflow</button>
                    <button class="reset-btn hidden">Force Reset</button>
                </div>
                
                <div class="workflow-errors hidden">
                    <h4>Errors</h4>
                    <div class="errors-container"></div>
                </div>
            </div>
        `;
        
        // Set container content
        this.container.innerHTML = html;
        
        // Get references to elements
        this.elements.panel = this.container.querySelector('.hypermodular-workflow-panel');
        this.elements.statusDisplay = this.container.querySelector('.status-indicator');
        this.elements.progressBar = this.container.querySelector('.progress-fill');
        this.elements.progressText = this.container.querySelector('.progress-text');
        this.elements.executionStepsDisplay = this.container.querySelector('.steps-container');
        this.elements.resultsDisplay = this.container.querySelector('.results-container');
        this.elements.errorsDisplay = this.container.querySelector('.errors-container');
        this.elements.errorsContainer = this.container.querySelector('.workflow-errors');
        this.elements.executeBtn = this.container.querySelector('.execute-btn');
        this.elements.stopBtn = this.container.querySelector('.stop-btn');
        this.elements.validateBtn = this.container.querySelector('.validate-btn');
        this.elements.resetBtn = this.container.querySelector('.reset-btn');
        this.elements.panelTitle = this.container.querySelector('.panel-title');
        
        // Apply theme
        this.applyTheme();
        
        // Apply glassmorphism effect if the theme is dark
        if (this.options.theme.dark) {
            DOMHelper.applyGlassmorphism(this.elements.panel, {
                backgroundColor: this.options.theme.backgroundColor,
                borderColor: `${this.options.theme.accentColor}33`
            });
        }
        
        // Apply custom scrollbar to the results container
        DOMHelper.createCustomScrollbar(this.elements.resultsDisplay, {
            thumbColor: `${this.options.theme.accentColor}88`,
            thumbHoverColor: this.options.theme.accentColor
        });
        
        // Apply custom scrollbar to the execution steps container
        DOMHelper.createCustomScrollbar(this.elements.executionStepsDisplay, {
            thumbColor: `${this.options.theme.accentColor}88`,
            thumbHoverColor: this.options.theme.accentColor
        });
    }
    
    /**
     * Apply theme to the panel elements
     */
    applyTheme() {
        const { theme } = this.options;
        
        // Create dynamic styles
        const styleId = 'hypermodular-workflow-panel-styles';
        DOMHelper.injectStyles(styleId, `
            .hypermodular-workflow-panel {
                color: ${theme.textColor};
                border: 1px solid ${theme.accentColor}33;
                border-radius: 8px;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .hypermodular-workflow-panel .panel-title {
                background-color: ${theme.accentColor}22;
                padding: 10px 15px;
                margin: 0;
                border-bottom: 1px solid ${theme.accentColor}33;
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .hypermodular-workflow-panel .toggle-indicator {
                font-size: 12px;
                opacity: 0.7;
                margin-left: 8px;
            }
            
            .hypermodular-workflow-panel:not(.expanded) .execution-steps,
            .hypermodular-workflow-panel:not(.expanded) .execution-results,
            .hypermodular-workflow-panel:not(.expanded) .workflow-errors {
                display: none;
            }
            
            .hypermodular-workflow-panel .status-indicator {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                margin: 10px;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }
            
            .hypermodular-workflow-panel .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .hypermodular-workflow-panel .status-indicator.waiting .status-dot {
                background-color: ${theme.warningColor};
            }
            
            .hypermodular-workflow-panel .status-indicator.executing .status-dot {
                background-color: ${theme.accentColor};
                animation: pulse 1.5s infinite;
            }
            
            .hypermodular-workflow-panel .status-indicator.success .status-dot {
                background-color: ${theme.successColor};
            }
            
            .hypermodular-workflow-panel .status-indicator.error .status-dot {
                background-color: ${theme.errorColor};
            }
            
            .hypermodular-workflow-panel .execution-progress {
                padding: 0 12px 12px;
            }
            
            .hypermodular-workflow-panel .progress-bar {
                height: 6px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            
            .hypermodular-workflow-panel .progress-fill {
                height: 100%;
                background-color: ${theme.accentColor};
                width: 0;
                transition: width 0.3s ease;
            }
            
            .hypermodular-workflow-panel .progress-text {
                text-align: right;
                font-size: 12px;
                opacity: 0.7;
            }
            
            .hypermodular-workflow-panel .execution-steps,
            .hypermodular-workflow-panel .execution-results,
            .hypermodular-workflow-panel .workflow-errors {
                padding: 0 12px 12px;
            }
            
            .hypermodular-workflow-panel .steps-container,
            .hypermodular-workflow-panel .results-container,
            .hypermodular-workflow-panel .errors-container {
                max-height: 150px;
                overflow-y: auto;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                padding: 8px;
            }
            
            .hypermodular-workflow-panel .step-item {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                padding: 8px;
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }
            
            .hypermodular-workflow-panel .step-number {
                background-color: ${theme.accentColor}44;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 8px;
                font-size: 12px;
            }
            
            .hypermodular-workflow-panel .step-name {
                flex: 1;
                font-weight: bold;
            }
            
            .hypermodular-workflow-panel .step-model {
                font-size: 12px;
                opacity: 0.7;
                margin-right: 8px;
            }
            
            .hypermodular-workflow-panel .step-status {
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                background-color: rgba(0, 0, 0, 0.2);
            }
            
            .hypermodular-workflow-panel .step-status.pending {
                background-color: ${theme.warningColor}44;
                color: ${theme.warningColor};
            }
            
            .hypermodular-workflow-panel .step-status.executing {
                background-color: ${theme.accentColor}44;
                color: ${theme.accentColor};
                animation: pulse-text 1.5s infinite;
            }
            
            .hypermodular-workflow-panel .step-status.success {
                background-color: ${theme.successColor}44;
                color: ${theme.successColor};
            }
            
            .hypermodular-workflow-panel .step-status.error {
                background-color: ${theme.errorColor}44;
                color: ${theme.errorColor};
            }
            
            .hypermodular-workflow-panel .result-item {
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 8px;
            }
            
            .hypermodular-workflow-panel .result-item.error {
                border-left: 3px solid ${theme.errorColor};
            }
            
            .hypermodular-workflow-panel .result-item h5 {
                margin-top: 0;
                margin-bottom: 8px;
                color: ${theme.accentColor};
            }
            
            .hypermodular-workflow-panel .result-content {
                background-color: rgba(0, 0, 0, 0.2);
                padding: 8px;
                border-radius: 4px;
                overflow-x: auto;
                font-family: monospace;
                font-size: 12px;
                margin: 0 0 8px 0;
            }
            
            .hypermodular-workflow-panel .show-full-result-btn {
                background-color: ${theme.accentColor}22;
                color: ${theme.accentColor};
                border: 1px solid ${theme.accentColor}44;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .hypermodular-workflow-panel .show-full-result-btn:hover {
                background-color: ${theme.accentColor}44;
            }
            
            .hypermodular-workflow-panel .workflow-controls {
                display: flex;
                padding: 0 12px 12px;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .hypermodular-workflow-panel .workflow-controls button {
                padding: 8px 12px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: bold;
            }
            
            .hypermodular-workflow-panel .execute-btn {
                background-color: ${theme.accentColor};
                color: white;
            }
            
            .hypermodular-workflow-panel .execute-btn:hover:not(:disabled) {
                background-color: ${theme.accentColor}dd;
            }
            
            .hypermodular-workflow-panel .stop-btn {
                background-color: ${theme.errorColor};
                color: white;
            }
            
            .hypermodular-workflow-panel .stop-btn:hover:not(:disabled) {
                background-color: ${theme.errorColor}dd;
            }
            
            .hypermodular-workflow-panel .validate-btn {
                background-color: ${theme.warningColor};
                color: white;
            }
            
            .hypermodular-workflow-panel .validate-btn:hover:not(:disabled) {
                background-color: ${theme.warningColor}dd;
            }
            
            .hypermodular-workflow-panel .reset-btn {
                background-color: ${theme.errorColor};
                color: white;
                margin-left: auto;
            }
            
            .hypermodular-workflow-panel .reset-btn:hover:not(:disabled) {
                background-color: ${theme.errorColor}dd;
            }
            
            .hypermodular-workflow-panel button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .hypermodular-workflow-panel .hidden {
                display: none;
            }
            
            .hypermodular-workflow-panel .validation-success {
                background-color: ${theme.successColor}22;
                color: ${theme.successColor};
                padding: 8px;
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            .hypermodular-workflow-panel .validation-errors {
                background-color: ${theme.errorColor}22;
                color: ${theme.errorColor};
                padding: 8px;
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            .hypermodular-workflow-panel .error-item {
                margin-bottom: 4px;
                padding-left: 12px;
                border-left: 2px solid ${theme.errorColor};
            }
            
            .hypermodular-workflow-panel .cycles-warning {
                background-color: ${theme.warningColor}22;
                color: ${theme.warningColor};
                padding: 8px;
                border-radius: 4px;
                margin-top: 8px;
            }
            
            .hypermodular-workflow-panel .highlight-cycles-btn,
            .hypermodular-workflow-panel .break-cycles-btn {
                background-color: ${theme.warningColor}44;
                color: ${theme.warningColor};
                border: 1px solid ${theme.warningColor}66;
                border-radius: 4px;
                padding: 4px 8px;
                margin-right: 8px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .hypermodular-workflow-panel .highlight-cycles-btn:hover,
            .hypermodular-workflow-panel .break-cycles-btn:hover {
                background-color: ${theme.warningColor}66;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @keyframes pulse-text {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .result-modal {
                position: fixed;
                z-index: 9999;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .result-modal .modal-content {
                background-color: ${theme.backgroundColor};
                border: 1px solid ${theme.accentColor}33;
                border-radius: 8px;
                padding: 16px;
                width: 80%;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            }
            
            .result-modal .close-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 24px;
                cursor: pointer;
                color: ${theme.textColor}aa;
            }
            
            .result-modal .close-btn:hover {
                color: ${theme.textColor};
            }
            
            .result-modal .full-result {
                background-color: rgba(0, 0, 0, 0.2);
                padding: 12px;
                border-radius: 4px;
                overflow-x: auto;
                font-family: monospace;
                white-space: pre-wrap;
                max-height: 60vh;
                overflow-y: auto;
            }
        `);
    }
    
    /**
     * Set up event listeners for the panel
     */
    setupEventListeners() {
        // Button click handlers
        if (this.elements.executeBtn) {
            this.elements.executeBtn.addEventListener('click', this.handleExecuteClick);
        }
        
        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', this.handleStopClick);
        }
        
        if (this.elements.validateBtn) {
            this.elements.validateBtn.addEventListener('click', this.handleValidateClick);
        }
        
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', this.handleResetClick);
        }
        
        // Panel toggle
        if (this.elements.panelTitle) {
            this.elements.panelTitle.addEventListener('click', this.handleTogglePanel);
        }
        
        // Apply ripple effect to buttons
        const buttons = this.container.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', EventUtils.createRippleEffect);
        });
    }
    
    /**
     * Handle execute button click
     */
    handleExecuteClick() {
        // Emit event
        this.emit('execute');
        
        // Call callback if provided
        if (typeof this.options.onExecute === 'function') {
            this.options.onExecute();
        }
    }
    
    /**
     * Handle stop button click
     */
    handleStopClick() {
        // Emit event
        this.emit('stop');
        
        // Call callback if provided
        if (typeof this.options.onStop === 'function') {
            this.options.onStop();
        }
    }
    
    /**
     * Handle validate button click
     */
    handleValidateClick() {
        // Emit event
        this.emit('validate');
        
        // Call callback if provided
        if (typeof this.options.onValidate === 'function') {
            this.options.onValidate();
        }
    }
    
    /**
     * Handle reset button click
     */
    handleResetClick() {
        // Reset execution state
        this.resetExecutionState();
        
        // Emit event
        this.emit('reset');
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
            this.elements.panelTitle.querySelector('::after').textContent = 
                this.state.expanded ? '▼' : '►';
        }
        
        // Emit event
        this.emit('toggle', { expanded: this.state.expanded });
    }
    
    /**
     * Update the status display
     * 
     * @param {string} status - The status text
     * @param {string} statusClass - CSS class for styling (waiting, executing, success, error)
     */
    updateStatus(status, statusClass) {
        if (!this.elements.statusDisplay) return;
        
        // Remove all status classes
        this.elements.statusDisplay.classList.remove('waiting', 'executing', 'success', 'error');
        
        // Add the new status class
        this.elements.statusDisplay.classList.add(statusClass);
        
        // Update the status text
        const statusText = this.elements.statusDisplay.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = status;
        }
    }
    
    /**
     * Update the progress display
     * 
     * @param {number} percent - Progress percentage (0-100)
     */
    updateProgress(percent) {
        if (!this.elements.progressBar || !this.elements.progressText) return;
        
        const clampedPercent = Math.max(0, Math.min(100, percent));
        this.state.progress = clampedPercent;
        
        this.elements.progressBar.style.width = `${clampedPercent}%`;
        this.elements.progressText.textContent = `${Math.round(clampedPercent)}%`;
    }
    
    /**
     * Show an error message
     * 
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (!this.elements.errorsContainer || !this.elements.errorsDisplay) return;
        
        this.elements.errorsContainer.classList.remove('hidden');
        this.elements.errorsDisplay.innerHTML = `<div class="error-message">${message}</div>`;
        
        // Update status
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
     * @param {boolean} validation.success - Whether validation succeeded
     * @param {Array} validation.errors - Array of error messages
     * @param {boolean} validation.hasCycles - Whether cycles were detected
     * @param {Array} validation.cycles - Array of cycles
     */
    showValidationErrors(validation) {
        if (!this.elements.errorsContainer || !this.elements.errorsDisplay) return;
        
        this.updateStatus('Invalid', 'error');
        
        let errorsHtml = '<div class="validation-errors">';
        if (Array.isArray(validation.errors)) {
            validation.errors.forEach(error => {
                errorsHtml += `<div class="error-item">${error}</div>`;
            });
        } else if (validation.errors) {
            errorsHtml += `<div class="error-item">${validation.errors}</div>`;
        }
        errorsHtml += '</div>';
        
        if (validation.hasCycles && validation.cycles) {
            errorsHtml += '<div class="cycles-warning">';
            errorsHtml += '<h4>Cycles Detected</h4>';
            errorsHtml += '<p>This workflow contains cycles which may prevent sequential execution:</p>';
            errorsHtml += '<ul>';
            
            if (Array.isArray(validation.cycles)) {
                validation.cycles.forEach(cycle => {
                    if (Array.isArray(cycle)) {
                        errorsHtml += `<li>${cycle.join(' → ')}</li>`;
                    }
                });
            }
            
            errorsHtml += '</ul>';
            errorsHtml += '<button class="highlight-cycles-btn">Highlight Cycles</button>';
            errorsHtml += '<button class="break-cycles-btn">Break Cycles</button>';
            errorsHtml += '</div>';
        }
        
        this.elements.errorsContainer.classList.remove('hidden');
        this.elements.errorsDisplay.innerHTML = errorsHtml;
        
        // Add event listeners to cycle buttons
        const highlightBtn = this.elements.errorsDisplay.querySelector('.highlight-cycles-btn');
        const breakBtn = this.elements.errorsDisplay.querySelector('.break-cycles-btn');
        
        if (highlightBtn) {
            highlightBtn.addEventListener('click', () => {
                this.emit('highlight-cycles', { cycles: validation.cycles });
            });
        }
        
        if (breakBtn) {
            breakBtn.addEventListener('click', () => {
                this.emit('break-cycles', { cycles: validation.cycles });
            });
        }
    }
    
    /**
     * Update execution controls state
     * 
     * @param {boolean} isExecuting - Whether workflow is executing
     */
    updateExecutionControls(isExecuting) {
        this.state.isExecuting = isExecuting;
        
        if (this.elements.executeBtn) {
            this.elements.executeBtn.disabled = isExecuting;
        }
        
        if (this.elements.stopBtn) {
            this.elements.stopBtn.disabled = !isExecuting;
        }
        
        if (this.elements.resetBtn) {
            this.elements.resetBtn.classList.toggle('hidden', !isExecuting);
            
            // Show reset button after a delay if still executing
            if (isExecuting) {
                setTimeout(() => {
                    if (this.state.isExecuting && this.elements.resetBtn) {
                        this.elements.resetBtn.classList.remove('hidden');
                    }
                }, 15000); // 15 seconds
            }
        }
    }
    
    /**
     * Show the execution plan for a workflow
     * 
     * @param {Array} executionOrder - Array of node IDs in execution order
     * @param {Object} nodeDataMap - Map of node ID to node data
     */
    showExecutionPlan(executionOrder, nodeDataMap = {}) {
        if (!this.elements.executionStepsDisplay || !Array.isArray(executionOrder) || executionOrder.length === 0) {
            if (this.elements.executionStepsDisplay) {
                this.elements.executionStepsDisplay.innerHTML = '<div class="empty-plan">No execution steps planned</div>';
            }
            return;
        }
        
        let stepsHtml = '<div class="execution-plan">';
        stepsHtml += '<ol class="steps-list">';
        
        executionOrder.forEach((nodeId, index) => {
            if (!nodeId) return;
            
            const node = nodeDataMap[nodeId] || { name: `Node ${nodeId}`, model: 'Unknown' };
            
            stepsHtml += `
                <li class="step-item" data-node-id="${nodeId}">
                    <span class="step-number">${index + 1}</span>
                    <span class="step-name">${node.name || 'Unnamed Node'}</span>
                    <span class="step-model">${node.model || 'Unknown'}</span>
                    <span class="step-status pending">Pending</span>
                </li>
            `;
        });
        
        stepsHtml += '</ol>';
        stepsHtml += '</div>';
        
        this.elements.executionStepsDisplay.innerHTML = stepsHtml;
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
        if (!this.elements.executionStepsDisplay) return;
        
        const stepItem = this.elements.executionStepsDisplay.querySelector(`[data-node-id="${nodeId}"]`);
        if (!stepItem) return;
        
        const statusSpan = stepItem.querySelector('.step-status');
        if (!statusSpan) return;
        
        // Set status class
        statusSpan.className = `step-status ${status}`;
        
        // Set status text if provided
        if (statusText) {
            statusSpan.textContent = statusText;
        } else {
            // Default text based on status
            switch (status) {
                case 'pending': statusSpan.textContent = 'Pending'; break;
                case 'executing': statusSpan.textContent = 'Executing'; break;
                case 'success': statusSpan.textContent = 'Completed'; break;
                case 'error': statusSpan.textContent = 'Error'; break;
                default: statusSpan.textContent = status;
            }
        }
        
        // Scroll to the current step
        stepItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    /**
     * Update the results display
     * 
     * @param {Object} results - Execution results by node ID
     * @param {Object} nodeDataMap - Map of node ID to node data
     */
    updateResultsDisplay(results = null, nodeDataMap = {}) {
        if (!this.elements.resultsDisplay) return;
        
        // Use provided results or state
        const executionResults = results || this.state.executionResults;
        
        // Generate HTML for the results
        let resultsHtml = '';
        
        Object.entries(executionResults).forEach(([nodeId, result]) => {
            if (!nodeId || !result) return;
            
            const node = nodeDataMap[nodeId] || { name: nodeId };
            const resultString = typeof result === 'string' ? result : JSON.stringify(result);
            const isError = resultString.startsWith('Error');
            
            resultsHtml += `<div class="result-item ${isError ? 'error' : ''}" data-node-id="${nodeId}">`;
            resultsHtml += `<h5>${node.name || nodeId}</h5>`;
            
            // Limit the result length for display
            const displayResult = resultString.length > 300
                ? resultString.substring(0, 300) + '...'
                : resultString;
                
            resultsHtml += `<pre class="result-content">${displayResult}</pre>`;
            
            if (resultString.length > 300) {
                resultsHtml += `<button class="show-full-result-btn" data-node-id="${nodeId}">Show Full Result</button>`;
            }
            
            resultsHtml += '</div>';
        });
        
        if (resultsHtml === '') {
            resultsHtml = '<div class="empty-results">No results yet</div>';
        }
        
        this.elements.resultsDisplay.innerHTML = resultsHtml;
        
        // Store results in state
        if (results) {
            this.state.executionResults = { ...executionResults };
        }
        
        // Add event listeners to show full result buttons
        const showButtons = this.elements.resultsDisplay.querySelectorAll('.show-full-result-btn');
        
        showButtons.forEach(button => {
            button.addEventListener('click', () => {
                const nodeId = button.getAttribute('data-node-id');
                if (nodeId && executionResults[nodeId]) {
                    this.showResultModal(nodeId, executionResults[nodeId], nodeDataMap);
                }
            });
        });
    }
    
    /**
     * Show a modal with the full result
     * 
     * @param {string} nodeId - Node ID
     * @param {string} result - Full result content
     * @param {Object} nodeDataMap - Map of node ID to node data
     */
    showResultModal(nodeId, result, nodeDataMap = {}) {
        const node = nodeDataMap[nodeId] || { name: nodeId };
        const nodeName = node.name || nodeId;
        const resultString = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        
        // Create modal element
        const modal = document.createElement('div');
        modal.classList.add('result-modal');
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h3>Result for ${nodeName}</h3>
                <pre class="full-result">${resultString}</pre>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(modal);
        
        // Apply custom scrollbar to result content
        const resultContent = modal.querySelector('.full-result');
        if (resultContent) {
            DOMHelper.createCustomScrollbar(resultContent, {
                thumbColor: `${this.options.theme.accentColor}88`,
                thumbHoverColor: this.options.theme.accentColor
            });
        }
        
        // Add event listener to close button
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }
        
        // Close when clicking outside content
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Emit event
        this.emit('show-result-modal', { nodeId, result });
    }
    
    /**
     * Set execution mode (enabled/disabled)
     * 
     * @param {boolean} enabled - Whether execution is enabled
     */
    setExecutionEnabled(enabled) {
        if (this.elements.executeBtn) {
            this.elements.executeBtn.disabled = !enabled;
        }
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
        if (this.elements.resetBtn) {
            this.elements.resetBtn.classList.add('hidden');
        }
        
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
        this.elements.resultsDisplay.innerHTML = '<div class="empty-results">Execution in progress...</div>';
        
        // Hide errors
        if (this.elements.errorsContainer) {
            this.elements.errorsContainer.classList.add('hidden');
        }
        
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
     * @param {string} data.nodeId - ID of the executing node
     * @param {number} data.progress - Execution progress (0-1)
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
     * @param {string} data.nodeId - ID of the completed node
     * @param {any} data.result - Execution result
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
     * @param {string} data.nodeId - ID of the node with error
     * @param {string} data.error - Error message
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
     * @param {Object} data.results - Execution results by node ID
     * @param {Array} data.executionOrder - Execution order of nodes
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
     * @param {string} data.error - Error message
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
     * @param {string} graphData.id - Graph ID
     * @param {string} graphData.name - Graph name
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
        
        if (this.elements.executionStepsDisplay) {
            this.elements.executionStepsDisplay.innerHTML = 
                '<div class="empty-plan">Select or save a graph to enable workflow execution</div>';
        }
        
        if (this.elements.resultsDisplay) {
            this.elements.resultsDisplay.innerHTML = 
                '<div class="empty-results">No results yet</div>';
        }
        
        if (this.elements.errorsContainer) {
            this.elements.errorsContainer.classList.add('hidden');
        }
        
        // Disable execution controls
        this.setExecutionEnabled(false);
        this.updateExecutionControls(false);
        
        // Emit event
        this.emit('panel-reset');
    }
}