/**
 * ui/components/workflow/execution/ExecutionPlanManager.js
 * 
 * Manages the execution plan display for the workflow panel.
 */
import { DOMHelper } from '../../../helpers/domHelpers.js';

export class ExecutionPlanManager {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element for the execution plan
     * @param {Object} options.theme - Theme configuration
     */
    constructor(options = {}) {
        this.container = options.container;
        this.theme = options.theme || {};
        
        // Initialize
        this.render();
        this.applyStyles();
    }
    
    /**
     * Render the execution plan container
     */
    render() {
        if (!this.container) return;
        
        const html = `
            <h4>Execution Plan</h4>
            <div class="steps-container">
                <div class="empty-plan">Select or save a graph to enable workflow execution</div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Get reference to the steps container
        this.stepsContainer = this.container.querySelector('.steps-container');
        
        // Apply custom scrollbar
        if (this.stepsContainer) {
            DOMHelper.createCustomScrollbar(this.stepsContainer, {
                thumbColor: `${this.theme.accentColor || '#3498db'}88`,
                thumbHoverColor: this.theme.accentColor || '#3498db'
            });
        }
    }
    
    /**
     * Apply styles for the execution plan
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .execution-steps-container h4 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                font-weight: 600;
            }
            
            .steps-container {
                max-height: 150px;
                overflow-y: auto;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                padding: 8px;
            }
            
            .empty-plan {
                opacity: 0.7;
                padding: 8px;
                text-align: center;
                font-style: italic;
            }
            
            .step-item {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                padding: 8px;
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }
            
            .step-item:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .step-number {
                background-color: ${this.theme.accentColor || '#3498db'}44;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 8px;
                font-size: 12px;
                flex-shrink: 0;
            }
            
            .step-name {
                flex: 1;
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .step-model {
                font-size: 12px;
                opacity: 0.7;
                margin-right: 8px;
                max-width: 100px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .step-status {
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                background-color: rgba(0, 0, 0, 0.2);
                white-space: nowrap;
                min-width: 70px;
                text-align: center;
            }
            
            .step-status.pending {
                background-color: ${this.theme.warningColor || '#f39c12'}44;
                color: ${this.theme.warningColor || '#f39c12'};
            }
            
            .step-status.executing {
                background-color: ${this.theme.accentColor || '#3498db'}44;
                color: ${this.theme.accentColor || '#3498db'};
                animation: pulse-text 1.5s infinite;
            }
            
            .step-status.success {
                background-color: ${this.theme.successColor || '#2ecc71'}44;
                color: ${this.theme.successColor || '#2ecc71'};
            }
            
            .step-status.error {
                background-color: ${this.theme.errorColor || '#e74c3c'}44;
                color: ${this.theme.errorColor || '#e74c3c'};
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Show the execution plan for a workflow
     * 
     * @param {Array} executionOrder - Array of node IDs in execution order
     * @param {Object} nodeDataMap - Map of node ID to node data
     */
    showExecutionPlan(executionOrder, nodeDataMap = {}) {
        if (!this.stepsContainer || !Array.isArray(executionOrder) || executionOrder.length === 0) {
            if (this.stepsContainer) {
                this.stepsContainer.innerHTML = '<div class="empty-plan">No execution steps planned</div>';
            }
            return;
        }
        
        let stepsHtml = '<div class="execution-plan">';
        
        executionOrder.forEach((nodeId, index) => {
            if (!nodeId) return;
            
            const node = nodeDataMap[nodeId] || { name: `Node ${nodeId}`, model: 'Unknown' };
            
            stepsHtml += `
                <div class="step-item" data-node-id="${nodeId}">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-name" title="${node.name || 'Unnamed Node'}">${node.name || 'Unnamed Node'}</div>
                    <div class="step-model" title="${node.model || 'Unknown'}">${node.model || 'Unknown'}</div>
                    <div class="step-status pending">Pending</div>
                </div>
            `;
        });
        
        stepsHtml += '</div>';
        
        this.stepsContainer.innerHTML = stepsHtml;
    }
    
    /**
     * Update the step status in the execution plan
     * 
     * @param {string} nodeId - ID of the node to update
     * @param {string} status - Status (pending, executing, success, error)
     * @param {string} statusText - Text to display
     */
    updateStepStatus(nodeId, status, statusText = null) {
        if (!this.stepsContainer) return;
        
        const stepItem = this.stepsContainer.querySelector(`[data-node-id="${nodeId}"]`);
        if (!stepItem) return;
        
        const statusElement = stepItem.querySelector('.step-status');
        if (!statusElement) return;
        
        // Set status class
        statusElement.className = `step-status ${status}`;
        
        // Set status text if provided
        if (statusText) {
            statusElement.textContent = statusText;
        } else {
            // Default text based on status
            switch (status) {
                case 'pending': statusElement.textContent = 'Pending'; break;
                case 'executing': statusElement.textContent = 'Executing'; break;
                case 'success': statusElement.textContent = 'Completed'; break;
                case 'error': statusElement.textContent = 'Error'; break;
                default: statusElement.textContent = status;
            }
        }
        
        // Highlight the active step
        const allSteps = this.stepsContainer.querySelectorAll('.step-item');
        allSteps.forEach(step => step.classList.remove('active'));
        
        if (status === 'executing') {
            stepItem.classList.add('active');
            // Scroll to the current step
            stepItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    /**
     * Reset the execution plan to initial state
     */
    reset() {
        if (this.stepsContainer) {
            this.stepsContainer.innerHTML = '<div class="empty-plan">Select or save a graph to enable workflow execution</div>';
        }
    }
}