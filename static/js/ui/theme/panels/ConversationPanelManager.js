/**
 * ui/theme/panels/ConversationPanelManager.js
 * 
 * Manages the conversation panel UI and interactions
 */

export class ConversationPanelManager {
    /**
     * @param {Object} elements - DOM elements
     * @param {EventBus} eventBus - Event bus for pub/sub
     */
    constructor(elements, eventBus) {
      this.elements = elements;
      this.eventBus = eventBus;
      this.collapsed = false;
    }
    
    /**
     * Initialize the conversation panel
     */
    initialize() {
      // Initially expanded
      this.collapsed = false;
      
      // Make sure the panel is in the correct initial state
      if (this.elements.conversationPanel) {
        this.elements.conversationPanel.classList.remove('collapsed');
      }
      
      // Apply glassmorphism effects if needed
      this.applyGlassmorphism();
    }
    
    /**
     * Apply glassmorphism effect to conversation panel
     */
    applyGlassmorphism() {
      if (!this.elements.conversationPanel) return;
      
      // Add glassmorphism class if it doesn't have it
      if (!this.elements.conversationPanel.classList.contains('glassmorphism')) {
        this.elements.conversationPanel.classList.add('glassmorphism');
      }
    }
    
    /**
     * Toggle conversation panel collapse
     */
    toggleConversationPanel() {
      if (!this.elements.conversationPanel) return;
      
      this.collapsed = !this.collapsed;
      
      if (this.collapsed) {
        this.elements.conversationPanel.classList.add('collapsed');
      } else {
        this.elements.conversationPanel.classList.remove('collapsed');
      }
      
      // Publish event for other components
      this.eventBus.publish('conversation:panel-toggled', {
        collapsed: this.collapsed
      });
    }
    
    /**
     * Check if the conversation panel is collapsed
     * 
     * @returns {boolean} True if collapsed
     */
    isCollapsed() {
      return this.collapsed;
    }
    
    /**
     * Expand the conversation panel
     */
    expandPanel() {
      if (this.collapsed) {
        this.toggleConversationPanel();
      }
    }
    
    /**
     * Collapse the conversation panel
     */
    collapsePanel() {
      if (!this.collapsed) {
        this.toggleConversationPanel();
      }
    }
  }