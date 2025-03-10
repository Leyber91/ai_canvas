/**
 * ui/components/workflow/errors/ErrorManager.js
 * 
 * Manages error display for the workflow panel.
 */

export class ErrorManager {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element for errors
     * @param {Object} options.theme - Theme configuration
     * @param {Function} options.onHighlightCycles - Callback for highlighting cycles
     * @param {Function} options.onBreakCycles - Callback for breaking cycles
     */
    constructor(options = {}) {
        this.container = options.container;
        this.theme = options.theme || {};
        this.onHighlightCycles = options.onHighlightCycles || (() => {});
        this.onBreakCycles = options.onBreakCycles || (() => {});
        
        // Initialize
        this.render();
        this.applyStyles();
    }
    
    /**
     * Render the error container
     */
    render() {
        if (!this.container) return;
        
        const html = `
            <h4>Errors</h4>
            <div class="errors-container hidden"></div>
        `;
        
        this.container.innerHTML = html;
        
        // Get reference to the errors container
        this.errorsContainer = this.container.querySelector('.errors-container');
    }
    
    /**
     * Apply styles for the error display
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .workflow-errors-container h4 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                font-weight: 600;
            }
            
            .errors-container {
                max-height: 150px;
                overflow-y: auto;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                padding: 8px;
            }
            
            .errors-container.hidden {
                display: none;
            }
            
            .error-message {
                color: ${this.theme.errorColor || '#e74c3c'};
                padding: 8px;
                background-color: ${this.theme.errorColor || '#e74c3c'}22;
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            .validation-success {
                background-color: ${this.theme.successColor || '#2ecc71'}22;
                color: ${this.theme.successColor || '#2ecc71'};
                padding: 8px;
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            .validation-errors {
                background-color: ${this.theme.errorColor || '#e74c3c'}22;
                color: ${this.theme.errorColor || '#e74c3c'};
                padding: 8px;
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            .error-item {
                margin-bottom: 4px;
                padding-left: 12px;
                border-left: 2px solid ${this.theme.errorColor || '#e74c3c'};
            }
            
            .cycles-warning {
                background-color: ${this.theme.warningColor || '#f39c12'}22;
                color: ${this.theme.warningColor || '#f39c12'};
                padding: 8px;
                border-radius: 4px;
                margin-top: 8px;
            }
            
            .cycles-warning h4 {
                margin-top: 0;
                margin-bottom: 8px;
                color: ${this.theme.warningColor || '#f39c12'};
            }
            
            .cycles-warning ul {
                margin-top: 8px;
                margin-bottom: 12px;
                padding-left: 24px;
            }
            
            .highlight-cycles-btn,
            .break-cycles-btn {
                background-color: ${this.theme.warningColor || '#f39c12'}44;
                color: ${this.theme.warningColor || '#f39c12'};
                border: 1px solid ${this.theme.warningColor || '#f39c12'}66;
                border-radius: 4px;
                padding: 4px 8px;
                margin-right: 8px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .highlight-cycles-btn:hover,
            .break-cycles-btn:hover {
                background-color: ${this.theme.warningColor || '#f39c12'}66;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Show an error message
     * 
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (!this.errorsContainer) return;
        
        this.errorsContainer.classList.remove('hidden');
        this.errorsContainer.innerHTML = `<div class="error-message">${this.escapeHTML(message)}</div>`;
    }
    
    /**
     * Show validation errors
     * 
     * @param {Object} validation - Validation result object
     * @param {boolean} validation.success - Whether validation succeeded
     * @param {Array|string} validation.errors - Array of error messages or single error message
     * @param {boolean} validation.hasCycles - Whether cycles were detected
     * @param {Array} validation.cycles - Array of cycles
     */
    showValidationErrors(validation) {
        if (!this.errorsContainer) return;
        
        let errorsHtml = '';
        
        // Add validation errors
        if (!validation.success) {
            errorsHtml += '<div class="validation-errors">';
            
            if (Array.isArray(validation.errors)) {
                validation.errors.forEach(error => {
                    errorsHtml += `<div class="error-item">${this.escapeHTML(error)}</div>`;
                });
            } else if (validation.errors) {
                errorsHtml += `<div class="error-item">${this.escapeHTML(validation.errors)}</div>`;
            }
            
            errorsHtml += '</div>';
        } else {
            // Show success message if no cycles
            if (!validation.hasCycles) {
                errorsHtml += '<div class="validation-success">Workflow is valid</div>';
            }
        }
        
        // Add cycles warning if cycles detected
        if (validation.hasCycles && validation.cycles) {
            errorsHtml += '<div class="cycles-warning">';
            errorsHtml += '<h4>Cycles Detected</h4>';
            errorsHtml += '<p>This workflow contains cycles which may prevent sequential execution:</p>';
            errorsHtml += '<ul>';
            
            if (Array.isArray(validation.cycles)) {
                validation.cycles.forEach(cycle => {
                    if (Array.isArray(cycle)) {
                        errorsHtml += `<li>${this.escapeHTML(cycle.join(' → '))}</li>`;
                    }
                });
            }
            
            errorsHtml += '</ul>';
            errorsHtml += '<button class="highlight-cycles-btn">Highlight Cycles</button>';
            errorsHtml += '<button class="break-cycles-btn">Break Cycles</button>';
            errorsHtml += '</div>';
        }
        
        this.errorsContainer.classList.remove('hidden');
        this.errorsContainer.innerHTML = errorsHtml;
        
        // Add event listeners to cycle buttons
        this.setupCycleButtons(validation.cycles);
    }
    
    /**
     * Set up event listeners for cycle buttons
     * 
     * @param {Array} cycles - Array of cycles
     */
    setupCycleButtons(cycles) {
        if (!this.errorsContainer) return;
        
        const highlightBtn = this.errorsContainer.querySelector('.highlight-cycles-btn');
        const breakBtn = this.errorsContainer.querySelector('.break-cycles-btn');
        
        if (highlightBtn) {
            highlightBtn.addEventListener('click', () => {
                this.onHighlightCycles(cycles);
            });
        }
        
        if (breakBtn) {
            breakBtn.addEventListener('click', () => {
                this.onBreakCycles(cycles);
            });
        }
    }
    
    /**
     * Hide errors
     */
    hideErrors() {
        if (this.errorsContainer) {
            this.errorsContainer.classList.add('hidden');
        }
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
}