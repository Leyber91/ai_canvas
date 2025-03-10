/**
 * ui/theme/panels/ConversationPanelManager.js
 * 
 * Manages the conversation panel UI and interactions
 */
import { BasePanelManager } from '../../panel/BasePanelManager.js';

export class ConversationPanelManager extends BasePanelManager {
    /**
     * @param {Object} elements - DOM elements
     * @param {EventBus} eventBus - Event bus for pub/sub
     */
    constructor(elements, eventBus) {
        super({
            elements,
            eventBus,
            panelType: 'conversation',
            eventPrefix: 'conversation',
            initialExpanded: true // Conversation panel starts expanded by default
        });
    }
    
    /**
     * Initialize the conversation panel
     */
    initialize() {
        super.initialize();
        
        // Make sure the panel is in the correct initial state
        if (this.elements.conversationPanel) {
            this.applyPanelState();
        }
    }
    
    /**
     * Apply theme styling to the panel
     */
    applyThemeStyling() {
        this.applyGlassmorphism();
    }
    
    /**
     * Apply glassmorphism effect to conversation panel
     */
    applyGlassmorphism() {
        const panel = this.getPanelElement();
        if (!panel) return;
        
        // Add glassmorphism class if it doesn't have it
        if (!panel.classList.contains('glassmorphism')) {
            panel.classList.add('glassmorphism');
        }
    }
    
    /**
     * Legacy method for backward compatibility
     * @deprecated Use togglePanel() instead
     */
    toggleConversationPanel() {
        this.togglePanel();
    }
}