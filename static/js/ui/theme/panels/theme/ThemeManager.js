/**
 * ui/components/workflow/theme/ThemeManager.js
 * 
 * Manages theme styling for the workflow panel.
 */
import { DOMHelper } from '../../../helpers/domHelpers.js';

export class ThemeManager {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.panel - The panel element to apply theme to
     * @param {Object} options.theme - Theme configuration
     */
    constructor(options = {}) {
        this.panel = options.panel;
        this.theme = {
            dark: true,
            accentColor: '#3498db',
            errorColor: '#e74c3c',
            successColor: '#2ecc71',
            warningColor: '#f39c12',
            backgroundColor: 'rgba(18, 22, 36, 0.7)',
            textColor: '#ffffff',
            ...options.theme
        };
        
        // Initialize theme
        this.applyTheme();
    }
    
    /**
     * Apply theme to the panel elements
     */
    applyTheme() {
        if (!this.panel) return;
        
        const { theme } = this;
        
        // Create dynamic styles
        const styleId = 'hypermodular-workflow-panel-styles';
        DOMHelper.injectStyles(styleId, this.generateStyles());
        
        // Apply glassmorphism effect if the theme is dark
        if (theme.dark) {
            DOMHelper.applyGlassmorphism(this.panel, {
                backgroundColor: theme.backgroundColor,
                borderColor: `${theme.accentColor}33`
            });
        }
    }
    
    /**
     * Generate CSS styles for the panel
     * @returns {string} CSS styles
     */
    generateStyles() {
        const { theme } = this;
        
        return `
            .hypermodular-workflow-panel {
                color: ${theme.textColor};
                border: 1px solid ${theme.accentColor}33;
                border-radius: 8px;
                overflow: hidden;
                transition: all 0.3s ease;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                position: fixed;
                min-width: 320px;
                max-width: 450px;
                resize: both;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                max-height: 80vh;
            }
            
            /* Dragging styles */
            .hypermodular-workflow-panel.dragging {
                opacity: 0.8;
                transform: scale(1.02);
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
            }
            
            /* Panel Header */
            .hypermodular-workflow-panel .panel-header {
                background-color: ${theme.accentColor}22;
                padding: 10px 15px;
                border-bottom: 1px solid ${theme.accentColor}33;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .hypermodular-workflow-panel .panel-title {
                margin: 0;
                user-select: none;
                display: flex;
                align-items: center;
                font-size: 16px;
                font-weight: 600;
            }
            
            .hypermodular-workflow-panel .toggle-indicator {
                font-size: 12px;
                opacity: 0.7;
                margin-left: 8px;
                transition: transform 0.3s ease;
            }
            
            .hypermodular-workflow-panel .panel-controls {
                display: flex;
                gap: 8px;
            }
            
            .hypermodular-workflow-panel .panel-controls button {
                background: transparent;
                border: none;
                color: ${theme.textColor}aa;
                cursor: pointer;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s ease;
                font-size: 14px;
            }
            
            .hypermodular-workflow-panel .panel-controls button:hover {
                background-color: ${theme.accentColor}33;
                color: ${theme.textColor};
            }
            
            .hypermodular-workflow-panel .close-btn:hover {
                background-color: ${theme.errorColor}33;
                color: ${theme.errorColor};
            }
            
            /* Panel Content */
            .hypermodular-workflow-panel .panel-content {
                overflow: hidden;
                display: flex;
                flex-direction: column;
                flex: 1;
            }
            
            /* Expanded/Collapsed states */
            .hypermodular-workflow-panel:not(.expanded) .execution-steps-container,
            .hypermodular-workflow-panel:not(.expanded) .execution-results-container,
            .hypermodular-workflow-panel:not(.expanded) .workflow-errors-container {
                display: none;
            }
            
            /* Minimized state */
            .hypermodular-workflow-panel.minimized .panel-content {
                display: none;
            }
            
            .hypermodular-workflow-panel.minimized {
                height: auto !important;
                width: auto !important;
                resize: none;
            }
            
            /* Hidden state */
            .hypermodular-workflow-panel.hidden {
                display: none;
            }
            
            /* Status indicator */
            .workflow-status-container {
                padding: 10px;
            }
            
            /* Progress bar */
            .execution-progress-container {
                padding: 0 12px 12px;
            }
            
            /* Scroll areas */
            .execution-steps-container,
            .execution-results-container,
            .workflow-errors-container {
                padding: 8px 12px;
                overflow-y: auto;
                max-height: 200px;
            }
            
            /* Controls area */
            .workflow-controls-container {
                padding: 10px 12px;
                border-top: 1px solid ${theme.accentColor}22;
            }
            
            /* Animations */
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @keyframes pulse-text {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            /* Modal styles */
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
        `;
    }
    
    /**
     * Update the theme
     * @param {Object} newTheme - New theme settings
     */
    updateTheme(newTheme) {
        this.theme = {
            ...this.theme,
            ...newTheme
        };
        
        this.applyTheme();
    }
}