/**
 * ui/components/workflow/status/StatusDisplayManager.js
 * 
 * Manages the status and progress display for the workflow panel.
 */
export class StatusDisplayManager {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element for the status display
     * @param {Object} options.theme - Theme configuration
     */
    constructor(options = {}) {
        this.container = options.container;
        this.theme = options.theme || {};
        
        // DOM elements
        this.elements = {
            statusIndicator: null,
            statusDot: null,
            statusText: null,
            progressBar: null,
            progressFill: null,
            progressText: null
        };
        
        // Initialize
        this.render();
    }
    
    /**
     * Render the status display components
     */
    render() {
        if (!this.container) return;
        
        const html = `
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
        `;
        
        this.container.innerHTML = html;
        
        // Store references to elements
        this.elements.statusIndicator = this.container.querySelector('.status-indicator');
        this.elements.statusDot = this.container.querySelector('.status-dot');
        this.elements.statusText = this.container.querySelector('.status-text');
        this.elements.progressBar = this.container.querySelector('.progress-bar');
        this.elements.progressFill = this.container.querySelector('.progress-fill');
        this.elements.progressText = this.container.querySelector('.progress-text');
        
        // Apply styles
        this.applyStyles();
    }
    
    /**
     * Apply styles to status components
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .workflow-status {
                margin-bottom: 10px;
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }
            
            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .status-indicator.waiting .status-dot {
                background-color: ${this.theme.warningColor || '#f39c12'};
            }
            
            .status-indicator.executing .status-dot {
                background-color: ${this.theme.accentColor || '#3498db'};
                animation: pulse 1.5s infinite;
            }
            
            .status-indicator.success .status-dot {
                background-color: ${this.theme.successColor || '#2ecc71'};
            }
            
            .status-indicator.error .status-dot {
                background-color: ${this.theme.errorColor || '#e74c3c'};
            }
            
            .execution-progress {
                padding: 0 0 10px 0;
            }
            
            .progress-bar {
                height: 6px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            
            .progress-fill {
                height: 100%;
                background-color: ${this.theme.accentColor || '#3498db'};
                width: 0;
                transition: width 0.3s ease;
            }
            
            .progress-text {
                text-align: right;
                font-size: 12px;
                opacity: 0.7;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Update the status display
     * 
     * @param {string} status - The status text
     * @param {string} statusClass - CSS class for styling (waiting, executing, success, error)
     */
    updateStatus(status, statusClass) {
        if (!this.elements.statusIndicator) return;
        
        // Remove all status classes
        this.elements.statusIndicator.classList.remove('waiting', 'executing', 'success', 'error');
        
        // Add the new status class
        this.elements.statusIndicator.classList.add(statusClass);
        
        // Update the status text
        if (this.elements.statusText) {
            this.elements.statusText.textContent = status;
        }
    }
    
    /**
     * Update the progress display
     * 
     * @param {number} percent - Progress percentage (0-100)
     */
    updateProgress(percent) {
        if (!this.elements.progressFill || !this.elements.progressText) return;
        
        const clampedPercent = Math.max(0, Math.min(100, percent));
        
        this.elements.progressFill.style.width = `${clampedPercent}%`;
        this.elements.progressText.textContent = `${Math.round(clampedPercent)}%`;
    }
    
    /**
     * Reset status and progress to initial state
     */
    reset() {
        this.updateStatus('Ready', 'waiting');
        this.updateProgress(0);
    }
}