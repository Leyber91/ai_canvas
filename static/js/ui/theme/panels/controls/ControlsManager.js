/**
 * ui/components/workflow/controls/ControlsManager.js
 * 
 * Manages control buttons for the workflow panel.
 */
import { EventUtils } from '../../../helpers/EventUtils.js';

export class ControlsManager {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element for controls
     * @param {Object} options.theme - Theme configuration
     * @param {Function} options.onExecute - Callback for execute button
     * @param {Function} options.onStop - Callback for stop button
     * @param {Function} options.onValidate - Callback for validate button
     * @param {Function} options.onReset - Callback for reset button
     */
    constructor(options = {}) {
        this.container = options.container;
        this.theme = options.theme || {};
        this.onExecute = options.onExecute || (() => {});
        this.onStop = options.onStop || (() => {});
        this.onValidate = options.onValidate || (() => {});
        this.onReset = options.onReset || (() => {});
        
        // DOM elements
        this.elements = {
            executeBtn: null,
            stopBtn: null,
            validateBtn: null,
            resetBtn: null
        };
        
        // Initialize
        this.render();
        this.applyStyles();
        this.setupEventListeners();
    }
    
    /**
     * Render the control buttons
     */
    render() {
        if (!this.container) return;
        
        const html = `
            <div class="workflow-controls">
                <button class="execute-btn" disabled>Execute Workflow</button>
                <button class="stop-btn" disabled>Stop Execution</button>
                <button class="validate-btn">Validate Workflow</button>
                <button class="reset-btn hidden">Force Reset</button>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Store references to elements
        this.elements.executeBtn = this.container.querySelector('.execute-btn');
        this.elements.stopBtn = this.container.querySelector('.stop-btn');
        this.elements.validateBtn = this.container.querySelector('.validate-btn');
        this.elements.resetBtn = this.container.querySelector('.reset-btn');
    }
    
    /**
     * Apply styles for the control buttons
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .workflow-controls {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .workflow-controls button {
                padding: 8px 12px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: bold;
                font-size: 13px;
                position: relative;
                overflow: hidden;
            }
            
            .execute-btn {
                background-color: ${this.theme.accentColor || '#3498db'};
                color: white;
                flex: 1;
                min-width: 120px;
            }
            
            .execute-btn:hover:not(:disabled) {
                background-color: ${this.theme.accentColor || '#3498db'}dd;
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            
            .stop-btn {
                background-color: ${this.theme.errorColor || '#e74c3c'};
                color: white;
                min-width: 100px;
            }
            
            .stop-btn:hover:not(:disabled) {
                background-color: ${this.theme.errorColor || '#e74c3c'}dd;
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            
            .validate-btn {
                background-color: ${this.theme.warningColor || '#f39c12'};
                color: white;
                min-width: 120px;
            }
            
            .validate-btn:hover:not(:disabled) {
                background-color: ${this.theme.warningColor || '#f39c12'}dd;
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            
            .reset-btn {
                background-color: ${this.theme.errorColor || '#e74c3c'};
                color: white;
                margin-left: auto;
            }
            
            .reset-btn:hover:not(:disabled) {
                background-color: ${this.theme.errorColor || '#e74c3c'}dd;
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            
            .workflow-controls button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            .workflow-controls button.hidden {
                display: none;
            }
            
            /* Ripple effect */
            .workflow-controls button .ripple {
                position: absolute;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            }
            
            @keyframes ripple {
                to {
                    transform: scale(2.5);
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Set up event listeners for the control buttons
     */
    setupEventListeners() {
        if (!this.container) return;
        
        // Execute button
        if (this.elements.executeBtn) {
            this.elements.executeBtn.addEventListener('click', () => {
                this.onExecute();
                EventUtils.createRippleEffect(event);
            });
        }
        
        // Stop button
        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', () => {
                this.onStop();
                EventUtils.createRippleEffect(event);
            });
        }
        
        // Validate button
        if (this.elements.validateBtn) {
            this.elements.validateBtn.addEventListener('click', () => {
                this.onValidate();
                EventUtils.createRippleEffect(event);
            });
        }
        
        // Reset button
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => {
                this.onReset();
                EventUtils.createRippleEffect(event);
            });
        }
    }
    
    /**
     * Update execution controls state
     * 
     * @param {boolean} isExecuting - Whether workflow is executing
     */
    updateExecutionControls(isExecuting) {
        if (!this.elements.executeBtn || !this.elements.stopBtn) return;
        
        // Update button states
        this.elements.executeBtn.disabled = isExecuting;
        this.elements.stopBtn.disabled = !isExecuting;
        
        // Show/hide reset button
        if (isExecuting) {
            this.showResetButton(15000); // Show after 15 seconds if still executing
        } else {
            this.hideResetButton();
        }
    }
    
    /**
     * Show the reset button after a delay
     * 
     * @param {number} delay - Delay in milliseconds
     */
    showResetButton(delay = 0) {
        if (!this.elements.resetBtn) return;
        
        if (delay > 0) {
            setTimeout(() => {
                // Only show if parent is still checking isExecuting
                if (this.elements.executeBtn && this.elements.executeBtn.disabled) {
                    this.elements.resetBtn.classList.remove('hidden');
                }
            }, delay);
        } else {
            this.elements.resetBtn.classList.remove('hidden');
        }
    }
    
    /**
     * Hide the reset button
     */
    hideResetButton() {
        if (this.elements.resetBtn) {
            this.elements.resetBtn.classList.add('hidden');
        }
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
}