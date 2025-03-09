/**
 * ui/WorkflowPanel.js
 * 
 * A panel for visualizing and controlling workflow execution.
 * Provides a clear interface for executing, monitoring, and debugging workflows.
 */
export class WorkflowPanel {
    constructor(eventBus, workflowManager) {
      this.eventBus = eventBus;
      this.workflowManager = workflowManager;
      
      // DOM elements
      this.container = null;
      this.statusDisplay = null;
      this.executionStepsDisplay = null;
      this.controlsContainer = null;
      
      // State
      this.isExecuting = false;
      this.currentStep = 0;
      this.executionSteps = [];
      this.executionResults = {};
      
      // Bind methods
      this.handleWorkflowExecuting = this.handleWorkflowExecuting.bind(this);
      this.handleNodeExecuting = this.handleNodeExecuting.bind(this);
      this.handleNodeCompleted = this.handleNodeCompleted.bind(this);
      this.handleNodeError = this.handleNodeError.bind(this);
      this.handleWorkflowCompleted = this.handleWorkflowCompleted.bind(this);
      this.handleWorkflowFailed = this.handleWorkflowFailed.bind(this);
      
      // Subscribe to events
      this.subscribeToEvents();
    }
    
    /**
     * Initialize the workflow panel
     * @param {HTMLElement} container - The container element
     */
    initialize(container) {
      this.container = container;
      this.render();
    }
    
    /**
     * Subscribe to workflow-related events
     */
    subscribeToEvents() {
      this.eventBus.subscribe('workflow:executing', this.handleWorkflowExecuting);
      this.eventBus.subscribe('workflow:node-executing', this.handleNodeExecuting);
      this.eventBus.subscribe('workflow:node-completed', this.handleNodeCompleted);
      this.eventBus.subscribe('workflow:node-error', this.handleNodeError);
      this.eventBus.subscribe('workflow:completed', this.handleWorkflowCompleted);
      this.eventBus.subscribe('workflow:failed', this.handleWorkflowFailed);
    }
    
    /**
     * Render the workflow panel
     */
    render() {
      if (!this.container) return;
      
      this.container.innerHTML = `
        <div class="workflow-panel">
          <h3 class="panel-title">Workflow Execution</h3>
          
          <div class="workflow-status">
            <div class="status-indicator waiting">
              <div class="status-dot"></div>
              <span class="status-text">Ready</span>
            </div>
          </div>
          
          <div class="execution-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0%</div>
          </div>
          
          <div class="execution-steps">
            <h4>Execution Plan</h4>
            <div class="steps-container"></div>
          </div>
          
          <div class="execution-results">
            <h4>Results</h4>
            <div class="results-container"></div>
          </div>
          
          <div class="workflow-controls">
            <button class="execute-btn">Execute Workflow</button>
            <button class="stop-btn" disabled>Stop Execution</button>
            <button class="validate-btn">Validate Workflow</button>
          </div>
          
          <div class="workflow-errors hidden">
            <h4>Errors</h4>
            <div class="errors-container"></div>
          </div>
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
      
      executeBtn.addEventListener('click', () => this.executeWorkflow());
      stopBtn.addEventListener('click', () => this.stopExecution());
      validateBtn.addEventListener('click', () => this.validateWorkflow());
    }
    
    /**
     * Update the status display
     * @param {string} status - The status text
     * @param {string} statusClass - The CSS class for styling
     */
    updateStatus(status, statusClass) {
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
    }
    
    /**
     * Update the progress display
     * @param {number} percent - The progress percentage (0-100)
     */
    updateProgress(percent) {
      if (!this.progressBar || !this.progressText) return;
      
      const clampedPercent = Math.max(0, Math.min(100, percent));
      this.progressBar.style.width = `${clampedPercent}%`;
      this.progressText.textContent = `${Math.round(clampedPercent)}%`;
    }
    
    /**
     * Execute the workflow
     */
    async executeWorkflow() {
      if (this.isExecuting) return;
      
      this.isExecuting = true;
      this.updateStatus('Executing', 'executing');
      
      try {
        // Get the current graph ID
        const graphId = this.workflowManager.getCurrentGraphId();
        
        if (!graphId) {
          this.showError('No graph selected. Please save the graph first.');
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
        const validation = await this.workflowManager.validateWorkflow();
        
        if (!validation.success) {
          this.showValidationErrors(validation);
          return;
        }
        
        // Execute the workflow
        await this.workflowManager.executeWorkflow(graphId);
        
      } catch (error) {
        this.showError(`Error executing workflow: ${error.message}`);
        this.updateStatus('Error', 'error');
      } finally {
        this.isExecuting = false;
      }
    }
    
    /**
     * Stop the current execution
     */
    stopExecution() {
      if (!this.isExecuting) return;
      
      this.workflowManager.stopExecution();
      this.isExecuting = false;
      this.updateStatus('Stopped', 'waiting');
    }
    
    /**
     * Validate the workflow without executing it
     */
    async validateWorkflow() {
      this.updateStatus('Validating', 'executing');
      
      try {
        const validation = await this.workflowManager.validateWorkflow();
        
        if (validation.success) {
          this.updateStatus('Valid', 'success');
          this.executionStepsDisplay.innerHTML = '<div class="validation-success">Workflow is valid and ready to execute</div>';
          
          // Show the execution plan
          this.showExecutionPlan();
        } else {
          this.showValidationErrors(validation);
        }
      } catch (error) {
        this.showError(`Error validating workflow: ${error.message}`);
      }
    }
    
    /**
     * Show validation errors
     * @param {Object} validation - The validation result
     */
    showValidationErrors(validation) {
      this.updateStatus('Invalid', 'error');
      
      let errorsHtml = '<div class="validation-errors">';
      validation.errors.forEach(error => {
        errorsHtml += `<div class="error-item">${error}</div>`;
      });
      errorsHtml += '</div>';
      
      if (validation.hasCycles) {
        errorsHtml += '<div class="cycles-warning">';
        errorsHtml += '<h4>Cycles Detected</h4>';
        errorsHtml += '<p>This workflow contains cycles which may prevent sequential execution:</p>';
        errorsHtml += '<ul>';
        validation.cycles.forEach(cycle => {
          errorsHtml += `<li>${cycle.join(' → ')}</li>`;
        });
        errorsHtml += '</ul>';
        errorsHtml += '<button class="highlight-cycles-btn">Highlight Cycles</button>';
        errorsHtml += '<button class="break-cycles-btn">Break Cycles</button>';
        errorsHtml += '</div>';
      }
      
      this.errorsContainer.classList.remove('hidden');
      this.errorsDisplay.innerHTML = errorsHtml;
      
      // Add event listeners to the cycle buttons
      const highlightBtn = this.errorsDisplay.querySelector('.highlight-cycles-btn');
      const breakBtn = this.errorsDisplay.querySelector('.break-cycles-btn');
      
      if (highlightBtn) {
        highlightBtn.addEventListener('click', () => this.workflowManager.highlightCycles());
      }
      
      if (breakBtn) {
        breakBtn.addEventListener('click', () => this.workflowManager.breakCycles());
      }
    }
    
    /**
     * Show the execution plan
     */
    showExecutionPlan() {
      const executionOrder = this.workflowManager.getExecutionOrder();
      
      if (!executionOrder || executionOrder.length === 0) {
        this.executionStepsDisplay.innerHTML = '<div class="empty-plan">No execution steps planned</div>';
        return;
      }
      
      let stepsHtml = '<div class="execution-plan">';
      stepsHtml += '<ol class="steps-list">';
      
      executionOrder.forEach((nodeId, index) => {
        const node = this.workflowManager.graphManager.getNodeData(nodeId);
        if (node) {
          stepsHtml += `<li class="step-item" data-node-id="${nodeId}">
            <span class="step-number">${index + 1}</span>
            <span class="step-name">${node.name}</span>
            <span class="step-model">${node.model}</span>
            <span class="step-status pending">Pending</span>
          </li>`;
        }
      });
      
      stepsHtml += '</ol>';
      stepsHtml += '</div>';
      
      this.executionStepsDisplay.innerHTML = stepsHtml;
    }
    
    /**
     * Show an error message
     * @param {string} message - The error message
     */
    showError(message) {
      this.errorsContainer.classList.remove('hidden');
      this.errorsDisplay.innerHTML = `<div class="error-message">${message}</div>`;
      this.updateStatus('Error', 'error');
    }
    
    /**
     * Handle workflow executing event
     * @param {Object} data - Event data
     */
    handleWorkflowExecuting(data) {
      this.isExecuting = true;
      this.updateStatus('Executing', 'executing');
      this.updateProgress(0);
      
      // Enable stop button, disable execute button
      const executeBtn = this.container.querySelector('.execute-btn');
      const stopBtn = this.container.querySelector('.stop-btn');
      
      if (executeBtn) executeBtn.disabled = true;
      if (stopBtn) stopBtn.disabled = false;
    }
    
    /**
     * Handle node executing event
     * @param {Object} data - Event data
     */
    handleNodeExecuting(data) {
      const { nodeId, progress } = data;
      
      // Update the progress bar
      if (typeof progress === 'number') {
        this.updateProgress(progress * 100);
      }
      
      // Update the step status in the execution plan
      const stepItem = this.executionStepsDisplay.querySelector(`[data-node-id="${nodeId}"]`);
      if (stepItem) {
        const statusSpan = stepItem.querySelector('.step-status');
        if (statusSpan) {
          statusSpan.textContent = 'Executing';
          statusSpan.className = 'step-status executing';
        }
        
        // Scroll to the current step
        stepItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    
    /**
     * Handle node completed event
     * @param {Object} data - Event data
     */
    handleNodeCompleted(data) {
      const { nodeId, result } = data;
      
      // Update the step status in the execution plan
      const stepItem = this.executionStepsDisplay.querySelector(`[data-node-id="${nodeId}"]`);
      if (stepItem) {
        const statusSpan = stepItem.querySelector('.step-status');
        if (statusSpan) {
          statusSpan.textContent = 'Completed';
          statusSpan.className = 'step-status success';
        }
      }
      
      // Add the result to the results display
      this.executionResults[nodeId] = result;
      this.updateResultsDisplay();
    }
    
    /**
     * Handle node error event
     * @param {Object} data - Event data
     */
    handleNodeError(data) {
      const { nodeId, error } = data;
      
      // Update the step status in the execution plan
      const stepItem = this.executionStepsDisplay.querySelector(`[data-node-id="${nodeId}"]`);
      if (stepItem) {
        const statusSpan = stepItem.querySelector('.step-status');
        if (statusSpan) {
          statusSpan.textContent = 'Error';
          statusSpan.className = 'step-status error';
        }
      }
      
      // Add the error to the results display
      this.executionResults[nodeId] = `Error: ${error}`;
      this.updateResultsDisplay();
      
      // Show the error in the errors display
      this.showError(`Error executing node ${nodeId}: ${error}`);
    }
    
    /**
     * Handle workflow completed event
     * @param {Object} data - Event data
     */
    handleWorkflowCompleted(data) {
        console.log("Workflow completed event received:", data);
        
        this.isExecuting = false;
        this.updateStatus('Completed', 'success');
        this.updateProgress(100);
        
        // Force-update buttons
        if (this.executeBtn) {
          this.executeBtn.disabled = false;
        }
        
        if (this.stopBtn) {
          this.stopBtn.disabled = true;
        }
        
        // Process results regardless of format
        let results = {};
        if (data && data.results) {
          results = data.results;
        } else if (data && typeof data === 'object') {
          // Try to extract results from other possible formats
          results = data.executionResults || data.execution_results || {};
        }
        
        // Update results display
        this.executionResults = results;
        this.updateResultsDisplay();
      }
    /**
     * Handle workflow failed event
     * @param {Object} data - Event data
     */
    handleWorkflowFailed(data) {
      this.isExecuting = false;
      this.updateStatus('Failed', 'error');
      
      // Show the error
      this.showError(`Workflow execution failed: ${data.error}`);
      
      // Disable stop button, enable execute button
      const executeBtn = this.container.querySelector('.execute-btn');
      const stopBtn = this.container.querySelector('.stop-btn');
      
      if (executeBtn) executeBtn.disabled = false;
      if (stopBtn) stopBtn.disabled = true;
    }
    
    /**
     * Update the results display
     */
    updateResultsDisplay() {
      if (!this.resultsDisplay) return;
      
      // Generate HTML for the results
      let resultsHtml = '';
      
      Object.entries(this.executionResults).forEach(([nodeId, result]) => {
        const node = this.workflowManager.graphManager.getNodeData(nodeId);
        
        if (node) {
          resultsHtml += `<div class="result-item ${result.startsWith('Error') ? 'error' : ''}" data-node-id="${nodeId}">`;
          resultsHtml += `<h5>${node.name}</h5>`;
          
          // Limit the result length for display
          const displayResult = result.length > 300 ? 
            result.substring(0, 300) + '...' : result;
            
          resultsHtml += `<pre class="result-content">${displayResult}</pre>`;
          
          if (result.length > 300) {
            resultsHtml += `<button class="show-full-result-btn" data-node-id="${nodeId}">Show Full Result</button>`;
          }
          
          resultsHtml += '</div>';
        }
      });
      
      if (resultsHtml === '') {
        resultsHtml = '<div class="empty-results">No results yet</div>';
      }
      
      this.resultsDisplay.innerHTML = resultsHtml;
      
      // Add event listeners to the show full result buttons
      const showButtons = this.resultsDisplay.querySelectorAll('.show-full-result-btn');
      
      showButtons.forEach(button => {
        button.addEventListener('click', () => {
          const nodeId = button.getAttribute('data-node-id');
          const result = this.executionResults[nodeId];
          
          // Show a modal with the full result
          this.showResultModal(nodeId, result);
        });
      });
    }
    
    /**
     * Show a modal with the full result
     * @param {string} nodeId - The node ID
     * @param {string} result - The full result
     */
    showResultModal(nodeId, result) {
      // Get the node name
      const node = this.workflowManager.graphManager.getNodeData(nodeId);
      const nodeName = node ? node.name : nodeId;
      
      // Create the modal
      const modal = document.createElement('div');
      modal.classList.add('result-modal');
      
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-btn">&times;</span>
          <h3>Result for ${nodeName}</h3>
          <pre class="full-result">${result}</pre>
        </div>
      `;
      
      // Add the modal to the document
      document.body.appendChild(modal);
      
      // Add event listener to close button
      const closeBtn = modal.querySelector('.close-btn');
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Close when clicking outside the modal content
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
  }