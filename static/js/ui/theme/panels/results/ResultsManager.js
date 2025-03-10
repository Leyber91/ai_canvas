/**
 * ui/components/workflow/results/ResultsManager.js
 * 
 * Manages the execution results display for the workflow panel.
 */
import { DOMHelper } from '../../../helpers/domHelpers.js';

export class ResultsManager {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element for results
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
     * Render the results container
     */
    render() {
        if (!this.container) return;
        
        const html = `
            <h4>Results</h4>
            <div class="results-container">
                <div class="empty-results">No results yet</div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Get reference to the results container
        this.resultsContainer = this.container.querySelector('.results-container');
        
        // Apply custom scrollbar
        if (this.resultsContainer) {
            DOMHelper.createCustomScrollbar(this.resultsContainer, {
                thumbColor: `${this.theme.accentColor || '#3498db'}88`,
                thumbHoverColor: this.theme.accentColor || '#3498db'
            });
        }
    }
    
    /**
     * Apply styles for the results display
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .execution-results-container h4 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                font-weight: 600;
            }
            
            .results-container {
                max-height: 200px;
                overflow-y: auto;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                padding: 8px;
            }
            
            .empty-results {
                opacity: 0.7;
                padding: 8px;
                text-align: center;
                font-style: italic;
            }
            
            .result-item {
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 8px;
                transition: background-color 0.2s ease;
            }
            
            .result-item:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .result-item.error {
                border-left: 3px solid ${this.theme.errorColor || '#e74c3c'};
            }
            
            .result-item h5 {
                margin-top: 0;
                margin-bottom: 8px;
                color: ${this.theme.accentColor || '#3498db'};
                font-size: 13px;
            }
            
            .result-content {
                background-color: rgba(0, 0, 0, 0.2);
                padding: 8px;
                border-radius: 4px;
                overflow-x: auto;
                font-family: monospace;
                font-size: 12px;
                margin: 0 0 8px 0;
                white-space: pre-wrap;
                word-break: break-word;
            }
            
            .show-full-result-btn {
                background-color: ${this.theme.accentColor || '#3498db'}22;
                color: ${this.theme.accentColor || '#3498db'};
                border: 1px solid ${this.theme.accentColor || '#3498db'}44;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .show-full-result-btn:hover {
                background-color: ${this.theme.accentColor || '#3498db'}44;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Update the results display
     * 
     * @param {Object} results - Execution results by node ID
     * @param {Object} nodeDataMap - Map of node ID to node data
     */
    updateResultsDisplay(results = {}, nodeDataMap = {}) {
        if (!this.resultsContainer) return;
        
        // Generate HTML for the results
        let resultsHtml = '';
        
        Object.entries(results).forEach(([nodeId, result]) => {
            if (!nodeId || !result) return;
            
            const node = nodeDataMap[nodeId] || { name: nodeId };
            const resultString = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            const isError = resultString.includes('Error');
            
            resultsHtml += `<div class="result-item ${isError ? 'error' : ''}" data-node-id="${nodeId}">`;
            resultsHtml += `<h5>${node.name || nodeId}</h5>`;
            
            // Limit the result length for display
            const displayResult = resultString.length > 300
                ? resultString.substring(0, 300) + '...'
                : resultString;
                
            resultsHtml += `<pre class="result-content">${this.escapeHTML(displayResult)}</pre>`;
            
            if (resultString.length > 300) {
                resultsHtml += `<button class="show-full-result-btn" data-node-id="${nodeId}">Show Full Result</button>`;
            }
            
            resultsHtml += '</div>';
        });
        
        if (resultsHtml === '') {
            resultsHtml = '<div class="empty-results">No results yet</div>';
        }
        
        this.resultsContainer.innerHTML = resultsHtml;
        
        // Add event listeners to show full result buttons
        const showButtons = this.resultsContainer.querySelectorAll('.show-full-result-btn');
        
        showButtons.forEach(button => {
            button.addEventListener('click', () => {
                const nodeId = button.getAttribute('data-node-id');
                if (nodeId && results[nodeId]) {
                    this.showResultModal(nodeId, results[nodeId], nodeDataMap);
                }
            });
        });
    }
    
    /**
     * Show execution in progress message
     */
    showExecutionInProgress() {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '<div class="empty-results">Execution in progress...</div>';
        }
    }
    
    /**
     * Show a modal with the full result
     * 
     * @param {string} nodeId - Node ID
     * @param {any} result - Full result content
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
                <h3>Result for ${this.escapeHTML(nodeName)}</h3>
                <pre class="full-result">${this.escapeHTML(resultString)}</pre>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(modal);
        
        // Apply custom scrollbar to result content
        const resultContent = modal.querySelector('.full-result');
        if (resultContent) {
            DOMHelper.createCustomScrollbar(resultContent, {
                thumbColor: `${this.theme.accentColor || '#3498db'}88`,
                thumbHoverColor: this.theme.accentColor || '#3498db'
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
    }
    
    /**
     * Escape HTML special characters to prevent XSS
     * 
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHTML(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    /**
     * Reset the results display
     */
    reset() {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '<div class="empty-results">No results yet</div>';
        }
    }


}