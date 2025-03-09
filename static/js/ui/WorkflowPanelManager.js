/**
 * ui/WorkflowPanelManager.js
 *
 * Manages the workflow panel UI component.
 * Handles workflow execution visualization, status updates,
 * and user interactions with the workflow.
 */
export class WorkflowPanelManager {
    /**
     * @param {UIManager} uiManager - The parent UI manager
     */
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.eventBus = uiManager.eventBus;
        this.workflowManager = uiManager.workflowManager;
        this.graphManager = uiManager.graphManager;

        // DOM elements
        this.container = null;
        this.statusDisplay = null;
        this.progressBar = null;
        this.progressText = null;
        this.executionStepsDisplay = null;
        this.resultsDisplay = null;
        this.errorsDisplay = null;
        this.errorsContainer = null;

        // State
        this.isExecuting = false;
        this.currentStep = 0;
        this.executionSteps = [];
        this.executionResults = {};
        this.currentGraphInfo = null;
    }

    /**
     * Initialize the workflow panel manager
     */
    initialize() {
        try {
            // Create the workflow panel container
            this.createWorkflowPanel();

            // Find the workflow controls section to insert our panel
            const workflowControls = document.querySelector('.workflow-controls');
            if (!workflowControls) {
                console.warn('Workflow controls container not found');
                return;
            }

            // Insert the panel before any existing content
            workflowControls.insertBefore(this.container, workflowControls.firstChild);

            // Add event listeners for workflow events
            this.eventBus.subscribe('workflow:executing', (data) => this.handleWorkflowExecuting(data));
            this.eventBus.subscribe('workflow:node-executing', (data) => this.handleNodeExecuting(data));
            this.eventBus.subscribe('workflow:completed', (data) => this.handleWorkflowCompleted(data));
            this.eventBus.subscribe('workflow:failed', (data) => this.handleWorkflowFailed(data));

            console.log('Workflow Panel Manager initialized with event subscriptions');
        } catch (error) {
            console.error('Error initializing WorkflowPanelManager:', error);
        }
    }

    handleWorkflowCompleted(data) {
        console.log("WorkflowPanelManager received completion event:", data);

        try {
            // Update status display
            this.updateStatus('Completed', 'success');

            // Update progress to 100%
            this.updateProgress(100);

            // Reset execution state
            this.isExecuting = false;

            // Update buttons state
            if (this.executeBtn) this.executeBtn.disabled = false;
            if (this.stopBtn) this.stopBtn.disabled = true;

            // Extract execution order and results
            let executionOrder = [];
            if (data.executionOrder) {
                executionOrder = data.executionOrder;
            } else if (data.execution_order) {
                executionOrder = data.execution_order;
            }

            // Extract results from the event data
            const results = data.results || {};
            this.executionResults = results;

            // Update the execution plan display with actual execution order
            this.updateExecutionPlanDisplay(executionOrder, results);

            // Update the results display in the UI
            this.updateResultsDisplay();
        } catch (err) {
            console.error("Error updating UI after workflow completion:", err);
        }
    }

    /**
     * Update the execution plan display with the actual execution order
     *
     * @param {Array} executionOrder - The order nodes were executed in
     * @param {Object} results - The execution results by node ID
     */
    updateExecutionPlanDisplay(executionOrder, results) {
        try {
            if (!this.executionStepsDisplay || !executionOrder || executionOrder.length === 0) {
                return;
            }

            let stepsHtml = '<div class="execution-plan">';
            stepsHtml += '<ol class="steps-list">';

            // For each node in the execution order
            executionOrder.forEach((nodeId, index) => {
                if (!nodeId) return;

                // Get node data if possible
                const node = this.graphManager.getNodeData
                    ? this.graphManager.getNodeData(nodeId)
                    : null;
                const nodeName = node ? (node.name || 'Unnamed Node') : `Node ${nodeId}`;
                const nodeModel = node ? (node.model || 'No model') : 'Unknown';

                // Determine status based on results
                let status = 'success';
                let statusText = 'Completed';

                if (results && results[nodeId]) {
                    const result = results[nodeId];
                    if (typeof result === 'string' && result.startsWith('Error')) {
                        status = 'error';
                        statusText = 'Error';
                    }
                }

                stepsHtml += `
                    <li class="step-item" data-node-id="${nodeId}">
                        <span class="step-number">${index + 1}</span>
                        <span class="step-name">${nodeName}</span>
                        <span class="step-model">${nodeModel}</span>
                        <span class="step-status ${status}">${statusText}</span>
                    </li>
                `;
            });

            stepsHtml += '</ol>';
            stepsHtml += '</div>';

            this.executionStepsDisplay.innerHTML = stepsHtml;

            // Scroll to show the execution plan
            if (this.executionStepsDisplay.scrollIntoView) {
                this.executionStepsDisplay.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error updating execution plan display:', error);
        }
    }

    /**
     * Create the workflow panel UI
     */
    createWorkflowPanel() {
        try {
            // Create container element
            this.container = document.createElement('div');
            this.container.className = 'workflow-panel';

            // Set initial HTML content
            this.container.innerHTML = `
                <h3 class="panel-title">Workflow Execution</h3>

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
                </div>

                <div class="workflow-errors hidden">
                    <h4>Errors</h4>
                    <div class="errors-container"></div>
                </div>
            `;

            // Store references to elements
            this.statusDisplay = this.container.querySelector('.status-indicator');
            this.progressBar = this.container.querySelector('.progress-fill');
            this.progressText = this.container.querySelector('.progress-text');
            this.executionStepsDisplay = this.container.querySelector('.steps-container');
            this.resultsDisplay = this.container.querySelector('.results-container');
            this.errorsDisplay = this.container.querySelector('.errors-container');
            this.errorsContainer = this.container.querySelector('.workflow-errors');

            // Set up button event listeners
            const executeBtn = this.container.querySelector('.execute-btn');
            const stopBtn = this.container.querySelector('.stop-btn');
            const validateBtn = this.container.querySelector('.validate-btn');

            if (executeBtn) {
                executeBtn.addEventListener('click', () => this.executeWorkflow());
                this.executeBtn = executeBtn;
            }

            if (stopBtn) {
                stopBtn.addEventListener('click', () => this.stopExecution());
                this.stopBtn = stopBtn;
            }

            if (validateBtn) {
                validateBtn.addEventListener('click', () => this.validateWorkflow());
                this.validateBtn = validateBtn;
            }

            // Add emergency reset button
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Force Reset';
            // Instead of inline styles, we give it a CSS class:
            resetButton.classList.add('reset-btn', 'hidden'); 
            // (We'll toggle the 'hidden' class on/off in code.)

            resetButton.addEventListener('click', () => {
                // Force reset execution state
                this.isExecuting = false;
                this.updateStatus('Ready', 'waiting');
                this.updateProgress(0);

                // Reset UI
                if (this.executeBtn) this.executeBtn.disabled = false;
                if (this.stopBtn) this.stopBtn.disabled = true;

                // Reset workflow manager state
                if (this.workflowManager) {
                    this.workflowManager.executionState.isExecuting = false;
                }

                // Hide the button again
                resetButton.classList.add('hidden');
            });

            // Add to UI
            const controlsContainer = this.container.querySelector('.workflow-controls');
            if (controlsContainer) {
                controlsContainer.appendChild(resetButton);
            }

            // Show reset button if execution takes too long
            setTimeout(() => {
                if (this.isExecuting) {
                    resetButton.classList.remove('hidden');
                }
            }, 15000);

            // (Removed addWorkflowPanelStyles() entirely – 
            //  all styles now live in your external CSS files)
        } catch (error) {
            console.error('Error creating workflow panel:', error);
        }
    }

    // Removed the entire addWorkflowPanelStyles() method here,
    // since all styles should live in external CSS.

    /**
     * Update the status display
     * @param {string} status - The status text
     * @param {string} statusClass - The CSS class for styling
     */
    updateStatus(status, statusClass) {
        try {
            if (!this.statusDisplay) return;

            // Remove all status classes
            this.statusDisplay.classList.remove('waiting', 'executing', 'success', 'error');

            // Add the new status class
            this.statusDisplay.classList.add(statusClass);

            // Update the status text
            const statusText = this.statusDisplay.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = status;
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    /**
     * Update the progress display
     * @param {number} percent - The progress percentage (0-100)
     */
    updateProgress(percent) {
        try {
            if (!this.progressBar || !this.progressText) return;

            const clampedPercent = Math.max(0, Math.min(100, percent));
            this.progressBar.style.width = `${clampedPercent}%`;
            this.progressText.textContent = `${Math.round(clampedPercent)}%`;
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    /**
     * Execute the workflow
     */
    async executeWorkflow() {
        if (this.isExecuting) return;

        this.isExecuting = true;
        this.updateStatus('Executing', 'executing');

        try {
            // Get the current graph ID from multiple possible sources
            const graphId = this.workflowManager.currentGraphId ||
                            this.graphManager.getCurrentGraphId() ||
                            localStorage.getItem('aiCanvas_lastGraphId');

            console.log("Attempting to execute workflow with graph ID:", graphId);

            if (!graphId) {
                this.showError('No graph selected. Please save the graph first.');
                this.isExecuting = false;
                this.updateStatus('Error', 'error');
                return;
            }

            // Clear previous execution data
            this.executionSteps = [];
            this.executionResults = {};
            this.currentStep = 0;

            // Update the UI
            this.executionStepsDisplay.innerHTML = '<div class="loading">Analyzing workflow...</div>';
            this.resultsDisplay.innerHTML = '';
            this.updateProgress(0);

            // Validate the workflow first
            const validation = this.workflowManager.validateWorkflow
                ? this.workflowManager.validateWorkflow()
                : { success: false, errors: ['Cannot validate workflow'] };

            if (!validation.success) {
                this.showValidationErrors(validation);
                this.isExecuting = false;
                this.updateStatus('Error', 'error');
                return;
            }

            // Enable stop button, disable execute button
            this.updateExecutionControls(true);

            // Execute the workflow
            const result = await this.workflowManager.executeWorkflow(graphId);

            // Store execution results for later use
            if (result && result.results) {
                this.executionResults = result.results;
            }

        } catch (error) {
            console.error('Workflow execution error:', error);
            this.showError(`Error executing workflow: ${error.message || 'Unknown error'}`);
            this.updateStatus('Error', 'error');

            // Reset button states
            this.updateExecutionControls(false);
        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * Stop the current execution
     */
    stopExecution() {
        try {
            if (!this.isExecuting) return;

            if (this.workflowManager.stopExecution) {
                this.workflowManager.stopExecution();
            }

            this.isExecuting = false;
            this.updateStatus('Stopped', 'waiting');

            // Reset button states
            this.updateExecutionControls(false);
        } catch (error) {
            console.error('Error stopping execution:', error);
        }
    }

    /**
     * Update execution control buttons
     *
     * @param {boolean} isExecuting - Whether workflow is executing
     */
    updateExecutionControls(isExecuting) {
        try {
            if (this.executeBtn) {
                this.executeBtn.disabled = isExecuting;
            }
            if (this.stopBtn) {
                this.stopBtn.disabled = !isExecuting;
            }
        } catch (error) {
            console.error('Error updating execution controls:', error);
        }
    }

    /**
     * Validate the workflow without executing it
     */
    async validateWorkflow() {
        try {
            this.updateStatus('Validating', 'executing');

            // Check if validateWorkflow method exists
            if (!this.workflowManager.validateWorkflow) {
                this.showError('Validation method not available');
                return;
            }

            const validation = this.workflowManager.validateWorkflow();

            if (validation.success) {
                this.updateStatus('Valid', 'success');
                this.executionStepsDisplay.innerHTML =
                    '<div class="validation-success">Workflow is valid and ready to execute</div>';

                // Show the execution plan
                this.showExecutionPlan();

                // Hide any previous errors
                if (this.errorsContainer) {
                    this.errorsContainer.classList.add('hidden');
                }
            } else {
                this.showValidationErrors(validation);
            }
        } catch (error) {
            console.error('Validation error:', error);
            this.showError(`Error validating workflow: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Show validation errors
     * @param {Object} validation - The validation result
     */
    showValidationErrors(validation) {
        try {
            if (!validation) return;

            this.updateStatus('Invalid', 'error');

            let errorsHtml = '<div class="validation-errors">';
            if (Array.isArray(validation.errors)) {
                validation.errors.forEach((error) => {
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

                // Safe handling of cycles data
                if (Array.isArray(validation.cycles)) {
                    validation.cycles.forEach((cycle) => {
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

            if (this.errorsContainer) {
                this.errorsContainer.classList.remove('hidden');
            }

            if (this.errorsDisplay) {
                this.errorsDisplay.innerHTML = errorsHtml;

                // Add event listeners to the cycle buttons
                const highlightBtn = this.errorsDisplay.querySelector('.highlight-cycles-btn');
                const breakBtn = this.errorsDisplay.querySelector('.break-cycles-btn');

                if (highlightBtn) {
                    highlightBtn.addEventListener('click', () => {
                        if (this.workflowManager.highlightCycles) {
                            this.workflowManager.highlightCycles();
                        }
                    });
                }

                if (breakBtn) {
                    breakBtn.addEventListener('click', () => {
                        if (this.workflowManager.breakCycles) {
                            this.workflowManager.breakCycles();
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error showing validation errors:', error);
        }
    }

    /**
     * Show the execution plan
     * @param {Array} executionOrder - Optional execution order to display
     */
    showExecutionPlan(executionOrder = null) {
        try {
            // If no execution order was provided, try to get it from the workflow manager
            if (!executionOrder) {
                if (typeof this.workflowManager.getExecutionOrder === 'function') {
                    executionOrder = this.workflowManager.getExecutionOrder();
                } else if (typeof this.workflowManager.computeTopologicalSort === 'function') {
                    executionOrder = this.workflowManager.computeTopologicalSort();
                } else if (this.workflowManager.executionOrder) {
                    executionOrder = this.workflowManager.executionOrder;
                }
            }

            // Ensure executionOrder is an array
            if (!Array.isArray(executionOrder)) {
                console.warn('Execution order is not an array, initializing as empty array');
                executionOrder = [];
            }

            if (executionOrder.length === 0) {
                this.executionStepsDisplay.innerHTML =
                    '<div class="empty-plan">No execution steps available</div>';
                return;
            }

            let stepsHtml = '<div class="execution-plan">';
            stepsHtml += '<ol class="steps-list">';

            executionOrder.forEach((nodeId, index) => {
                if (!nodeId) return;

                const node = this.graphManager.getNodeData
                    ? this.graphManager.getNodeData(nodeId)
                    : null;
                if (node) {
                    stepsHtml += `
                        <li class="step-item" data-node-id="${nodeId}">
                            <span class="step-number">${index + 1}</span>
                            <span class="step-name">${node.name || 'Unnamed Node'}</span>
                            <span class="step-model">${node.model || 'No model'}</span>
                            <span class="step-status pending">Pending</span>
                        </li>
                    `;
                } else {
                    stepsHtml += `
                        <li class="step-item" data-node-id="${nodeId}">
                            <span class="step-number">${index + 1}</span>
                            <span class="step-name">Node ${nodeId}</span>
                            <span class="step-model">Unknown</span>
                            <span class="step-status pending">Pending</span>
                        </li>
                    `;
                }
            });

            stepsHtml += '</ol>';
            stepsHtml += '</div>';

            if (this.executionStepsDisplay) {
                this.executionStepsDisplay.innerHTML = stepsHtml;
            }
        } catch (error) {
            console.error('Error showing execution plan:', error);
            if (this.executionStepsDisplay) {
                this.executionStepsDisplay.innerHTML =
                    '<div class="error-message">Error generating execution plan</div>';
            }
        }
    }

    /**
     * Show an error message
     * @param {string} message - The error message
     */
    showError(message) {
        try {
            if (this.errorsContainer) {
                this.errorsContainer.classList.remove('hidden');
            }

            if (this.errorsDisplay) {
                this.errorsDisplay.innerHTML = `<div class="error-message">${message}</div>`;
            }

            this.updateStatus('Error', 'error');
        } catch (error) {
            console.error('Error showing error message:', error);
        }
    }

    /**
     * Update the results display
     */
    updateResultsDisplay() {
        try {
            if (!this.resultsDisplay) return;

            // Generate HTML for the results
            let resultsHtml = '';

            Object.entries(this.executionResults).forEach(([nodeId, result]) => {
                if (!nodeId || !result) return;

                const node = this.graphManager.getNodeData
                    ? this.graphManager.getNodeData(nodeId)
                    : null;
                const nodeName = node ? (node.name || nodeId) : nodeId;
                const resultString = typeof result === 'string' ? result : JSON.stringify(result);
                const isError = resultString.startsWith('Error');

                resultsHtml += `<div class="result-item ${isError ? 'error' : ''}" data-node-id="${nodeId}">`;
                resultsHtml += `<h5>${nodeName}</h5>`;

                // Limit the result length for display
                const displayResult =
                    resultString.length > 300
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

            this.resultsDisplay.innerHTML = resultsHtml;

            // Add event listeners to the show full result buttons
            const showButtons = this.resultsDisplay.querySelectorAll('.show-full-result-btn');

            showButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    const nodeId = button.getAttribute('data-node-id');
                    if (nodeId && this.executionResults[nodeId]) {
                        this.showResultModal(nodeId, this.executionResults[nodeId]);
                    }
                });
            });
        } catch (error) {
            console.error('Error updating results display:', error);
        }
    }

    /**
     * Show a modal with the full result
     * @param {string} nodeId - The node ID
     * @param {string} result - The full result
     */
    showResultModal(nodeId, result) {
        try {
            // Get the node name
            const node = this.graphManager.getNodeData
                ? this.graphManager.getNodeData(nodeId)
                : null;
            const nodeName = node ? (node.name || nodeId) : nodeId;
            const resultString = typeof result === 'string' ? result : JSON.stringify(result);

            // Create the modal
            const modal = document.createElement('div');
            modal.classList.add('result-modal');

            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h3>Result for ${nodeName}</h3>
                    <pre class="full-result">${resultString}</pre>
                </div>
            `;

            // Add the modal to the document
            document.body.appendChild(modal);

            // Add event listener to close button
            const closeBtn = modal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
            }

            // Close when clicking outside the modal content
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } catch (error) {
            console.error('Error showing result modal:', error);
        }
    }

    /**
     * Update graph information in the panel
     *
     * @param {Object} graphData - Graph data
     */
    updateGraphInfo(graphData) {
        try {
            this.currentGraphInfo = graphData;

            // Enable execute button if we have a valid graph
            if (this.executeBtn && graphData && graphData.id) {
                this.executeBtn.disabled = false;
            }

            // Clear any previous errors
            if (this.errorsContainer) {
                this.errorsContainer.classList.add('hidden');
            }

            // Update the execution plan
            this.validateWorkflow();
        } catch (error) {
            console.error('Error updating graph info:', error);
        }
    }

    /**
     * Reset the workflow panel
     */
    resetPanel() {
        try {
            this.currentGraphInfo = null;
            this.executionResults = {};
            this.executionSteps = [];

            // Reset UI elements
            this.updateStatus('Ready', 'waiting');
            this.updateProgress(0);

            if (this.executionStepsDisplay) {
                this.executionStepsDisplay.innerHTML =
                    '<div class="empty-plan">Select or save a graph to enable workflow execution</div>';
            }

            if (this.resultsDisplay) {
                this.resultsDisplay.innerHTML = '<div class="empty-results">No results yet</div>';
            }

            if (this.errorsContainer) {
                this.errorsContainer.classList.add('hidden');
            }

            // Disable execution controls
            if (this.executeBtn) {
                this.executeBtn.disabled = true;
            }

            if (this.stopBtn) {
                this.stopBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error resetting panel:', error);
        }
    }

    /**
     * Handle node executing event
     * @param {Object} data - Event data
     */
    handleNodeExecuting(data) {
        try {
            const { nodeId, iteration, totalNodes, progress } = data;

            // Ensure progress is a number and clamp it to valid range
            const safeProgress =
                typeof progress === 'number'
                    ? Math.max(0, Math.min(100, progress * 100))
                    : 0;

            console.log(`Updating progress for node ${nodeId}: ${safeProgress}%`);

            // Update the progress bar
            this.updateProgress(safeProgress);

            // Find the step item for this node
            const stepItem = this.executionStepsDisplay?.querySelector(`[data-node-id="${nodeId}"]`);

            // If we don't have a step item for this node yet, we may need to create the execution plan
            if (!stepItem && this.workflowManager && this.graphManager) {
                // Try to get execution order from the workflow manager
                let executionOrder = [];
                if (typeof this.workflowManager.getExecutionOrder === 'function') {
                    executionOrder = this.workflowManager.getExecutionOrder();
                } else if (typeof this.workflowManager.computeTopologicalSort === 'function') {
                    executionOrder = this.workflowManager.computeTopologicalSort();
                }

                if (executionOrder && executionOrder.length > 0) {
                    this.showExecutionPlan(executionOrder);
                }
            }

            // Update the step status in the execution plan
            const updatedStepItem = this.executionStepsDisplay?.querySelector(`[data-node-id="${nodeId}"]`);
            if (updatedStepItem) {
                const statusSpan = updatedStepItem.querySelector('.step-status');
                if (statusSpan) {
                    statusSpan.textContent = 'Executing';
                    statusSpan.className = 'step-status executing';
                }

                // Scroll to the current step
                updatedStepItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (error) {
            console.error('Error in handleNodeExecuting:', error);
        }
    }
}
