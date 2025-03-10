/**
 * ui/theme/execution/ExecutionUIManager.js
 * 
 * Manages the execution UI elements including progress, steps, and results
 */

export class ExecutionUIManager {
    /**
     * @param {ThemeManager} themeManager - Parent theme manager
     * @param {Object} elements - DOM elements
     * @param {EventBus} eventBus - Event bus for pub/sub
     */
    constructor(themeManager, elements, eventBus) {
      this.themeManager = themeManager;
      this.elements = elements;
      this.eventBus = eventBus;
    }
    
    /**
     * Reset execution UI
     */
    resetExecutionUI() {
      // Reset progress
      if (this.elements.executionProgressFill) {
        this.elements.executionProgressFill.style.width = '0%';
        
        if (this.elements.executionProgressText) {
          this.elements.executionProgressText.textContent = '0%';
        }
        
        // Remove status classes
        if (this.elements.executionProgressFill.parentElement) {
          this.elements.executionProgressFill.parentElement.classList.remove('completed', 'error');
        }
      }
      
      // Reset status
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge waiting';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Ready';
        }
      }
      
      // Clear execution steps
      if (this.elements.executionSteps) {
        this.elements.executionSteps.innerHTML = '';
      }
      
      // Clear execution results
      if (this.elements.executionResults) {
        this.elements.executionResults.innerHTML = '<div class="empty-results">No results yet</div>';
      }
      
      // Reset node styling in graph
      if (this.themeManager.uiManager.graphManager && this.themeManager.uiManager.graphManager.cy) {
        this.themeManager.uiManager.graphManager.cy.nodes().removeClass('executing completed error');
        this.themeManager.uiManager.graphManager.cy.edges().removeClass('executing completed error');
      }
    }
    
    /**
     * Update node executing UI
     * 
     * @param {string} nodeId - Node ID
     * @param {number} progress - Execution progress (0-1)
     */
    updateNodeExecuting(nodeId, progress) {
      // Update progress UI
      if (this.elements.executionProgressFill && typeof progress === 'number') {
        const percentage = Math.round(progress * 100);
        this.elements.executionProgressFill.style.width = `${percentage}%`;
        
        if (this.elements.executionProgressText) {
          this.elements.executionProgressText.textContent = `${percentage}%`;
        }
      }
      
      // Update status UI
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge executing';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Executing';
        }
      }
      
      // Update node in execution steps
      this.updateExecutionStep(nodeId, 'executing');
    }
    
    /**
     * Update node completed UI
     * 
     * @param {string} nodeId - Node ID
     * @param {string} result - Execution result
     */
    updateNodeCompleted(nodeId, result) {
      // Update node in execution steps
      this.updateExecutionStep(nodeId, 'completed');
      
      // Add result to results section
      this.addExecutionResult(nodeId, result);
    }
    
    /**
     * Update node error UI
     * 
     * @param {string} nodeId - Node ID
     * @param {string} error - Error message
     */
    updateNodeError(nodeId, error) {
      // Update node in execution steps
      this.updateExecutionStep(nodeId, 'error');
      
      // Add error to results section
      this.addExecutionResult(nodeId, `Error: ${error}`, true);
    }
    
    /**
     * Handle workflow executing event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowExecuting(data) {
      // Update status
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge executing';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Executing';
        }
      }
      
      // Initialize execution steps UI based on execution plan
      this.initializeExecutionSteps(data.executionPlan || []);
    }
    
    /**
     * Handle workflow completed event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowCompleted(data) {
      // Update status
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge completed';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Completed';
        }
      }
      
      // Update progress to 100%
      if (this.elements.executionProgressFill) {
        this.elements.executionProgressFill.style.width = '100%';
        
        if (this.elements.executionProgressText) {
          this.elements.executionProgressText.textContent = '100%';
        }
      }
      
      // Add completed class to progress bar
      if (this.elements.executionProgressFill && this.elements.executionProgressFill.parentElement) {
        this.elements.executionProgressFill.parentElement.classList.add('completed');
      }
    }
    
    /**
     * Handle workflow failed event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowFailed(data) {
      // Update status
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge error';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Failed';
        }
      }
      
      // Add error class to progress bar
      if (this.elements.executionProgressFill && this.elements.executionProgressFill.parentElement) {
        this.elements.executionProgressFill.parentElement.classList.add('error');
      }
      
      // Add error message to results
      const errorDiv = document.createElement('div');
      errorDiv.className = 'execution-error';
      errorDiv.innerHTML = `<strong>Execution Error:</strong> ${data.error}`;
      
      // Add to execution results if it exists
      if (this.elements.executionResults) {
        this.elements.executionResults.innerHTML = '';
        this.elements.executionResults.appendChild(errorDiv);
      }
    }
    
    /**
     * Initialize execution steps UI
     * 
     * @param {Array} executionPlan - Order of node execution
     */
    initializeExecutionSteps(executionPlan) {
      if (!this.elements.executionSteps) return;
      
      // Clear existing steps
      this.elements.executionSteps.innerHTML = '';
      
      // If no plan provided, try to get it from topological sort
      if (!executionPlan || executionPlan.length === 0) {
        if (this.themeManager.uiManager.workflowManager && this.themeManager.uiManager.workflowManager.topologicalSorter) {
          executionPlan = this.themeManager.uiManager.workflowManager.topologicalSorter.computeTopologicalSort() || [];
        }
        
        // If still no plan, show message
        if (!executionPlan || executionPlan.length === 0) {
          this.elements.executionSteps.innerHTML = '<div class="empty-steps">No execution steps planned</div>';
          return;
        }
      }
      
      // Create steps for each node
      executionPlan.forEach((nodeId, index) => {
        const nodeData = this.themeManager.uiManager.graphManager ? 
          this.themeManager.uiManager.graphManager.getNodeData(nodeId) : null;
        
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item';
        stepItem.dataset.nodeId = nodeId;
        
        const stepNumber = document.createElement('div');
        stepNumber.className = 'step-number';
        stepNumber.textContent = (index + 1).toString();
        
        const stepDetails = document.createElement('div');
        stepDetails.className = 'step-details';
        
        const stepName = document.createElement('div');
        stepName.className = 'step-name';
        stepName.textContent = nodeData ? nodeData.name : `Node ${nodeId}`;
        
        const stepModel = document.createElement('div');
        stepModel.className = 'step-model';
        stepModel.textContent = nodeData ? 
          `${nodeData.backend || 'Unknown'} / ${nodeData.model || 'Unknown'}` : '';
        
        const stepStatus = document.createElement('div');
        stepStatus.className = 'step-status';
        stepStatus.textContent = 'Pending';
        
        // Assemble step item
        stepDetails.appendChild(stepName);
        stepDetails.appendChild(stepModel);
        stepItem.appendChild(stepNumber);
        stepItem.appendChild(stepDetails);
        stepItem.appendChild(stepStatus);
        
        this.elements.executionSteps.appendChild(stepItem);
      });
    }
    
    /**
     * Update the status of an execution step
     * 
     * @param {string} nodeId - Node ID
     * @param {string} status - New status (executing, completed, error)
     */
    updateExecutionStep(nodeId, status) {
      if (!this.elements.executionSteps) return;
      
      const stepItem = this.elements.executionSteps.querySelector(`[data-node-id="${nodeId}"]`);
      if (!stepItem) return;
      
      // Update status class
      stepItem.className = `step-item ${status}`;
      
      // Update status text
      const statusEl = stepItem.querySelector('.step-status');
      if (statusEl) {
        statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      }
      
      // If this step is executing, scroll it into view
      if (status === 'executing') {
        stepItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    
    /**
     * Add an execution result to the results section
     * 
     * @param {string} nodeId - Node ID
     * @param {string} result - Result content
     * @param {boolean} isError - Whether this is an error result
     */
    addExecutionResult(nodeId, result, isError = false) {
      if (!this.elements.executionResults) return;
      
      // Remove empty results placeholder if present
      const emptyResults = this.elements.executionResults.querySelector('.empty-results');
      if (emptyResults) {
        emptyResults.remove();
      }
      
      // Get node data
      const nodeData = this.themeManager.uiManager.graphManager ? 
        this.themeManager.uiManager.graphManager.getNodeData(nodeId) : null;
      
      // Create result item
      const resultItem = document.createElement('div');
      resultItem.className = isError ? 'result-item error' : 'result-item';
      resultItem.dataset.nodeId = nodeId;
      
      // Create result header
      const resultHeader = document.createElement('h5');
      resultHeader.textContent = nodeData ? nodeData.name : `Node ${nodeId}`;
      
      // Create result content
      const resultContent = document.createElement('pre');
      resultContent.className = 'result-content';
      
      // Limit content length for display
      const displayResult = result.length > 300 ? 
        result.substring(0, 300) + '...' : result;
      
      resultContent.textContent = displayResult;
      
      // Add to result item
      resultItem.appendChild(resultHeader);
      resultItem.appendChild(resultContent);
      
      // Add view full button if truncated
      if (result.length > 300) {
        const viewButton = document.createElement('button');
        viewButton.className = 'show-full-result-btn';
        viewButton.textContent = 'View Full Result';
        viewButton.addEventListener('click', () => {
          this.themeManager.showResultModal(nodeId, result);
        });
        
        resultItem.appendChild(viewButton);
      }
      
      // Add to results container
      this.elements.executionResults.appendChild(resultItem);
    }
    
    /**
     * Show result modal
     * 
     * @param {string} nodeId - ID of the node
     * @param {string} result - Result content
     * @param {string} nodeName - Name of the node
     */
    showResultModal(nodeId, result, nodeName) {
      if (!this.elements.resultModal) return;
      
      // Set title
      this.elements.resultModalTitle.textContent = `Result for ${nodeName || nodeId}`;
      
      // Set content
      this.elements.resultModalContent.textContent = result;
      
      // Show modal
      this.elements.resultModal.style.display = 'block';
    }
    
    /**
     * Hide result modal
     */
    hideResultModal() {
      if (!this.elements.resultModal) return;
      
      this.elements.resultModal.style.display = 'none';
    }
  }