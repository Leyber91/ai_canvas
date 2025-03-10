/**
 * ui/theme/panels/WorkflowPanelManager.js
 * 
 * Manages the workflow panel UI and interactions
 */

export class WorkflowPanelManager {
    /**
     * @param {Object} elements - DOM elements
     * @param {EventBus} eventBus - Event bus for pub/sub
     */
    constructor(elements, eventBus) {
      this.elements = elements;
      this.eventBus = eventBus;
      this.expanded = false;
    }
    
    /**
     * Initialize the workflow panel
     */
    initialize() {
      // Initially collapsed
      this.expanded = false;
      
      // Make sure the panel is in the correct initial state
      if (this.elements.workflowPanel) {
        this.elements.workflowPanel.classList.remove('expanded');
      }
      
      // Apply glassmorphism effects if needed
      this.applyGlassmorphism();
    }
    
    /**
     * Apply glassmorphism effect to workflow panel
     */
    applyGlassmorphism() {
      if (!this.elements.workflowPanel) return;
      
      // Add glassmorphism class if it doesn't have it
      if (!this.elements.workflowPanel.classList.contains('glassmorphism')) {
        this.elements.workflowPanel.classList.add('glassmorphism');
      }
    }
    
    /**
     * Toggle workflow panel expansion
     */
    toggleWorkflowPanel() {
      if (!this.elements.workflowPanel) return;
      
      this.expanded = !this.expanded;
      
      if (this.expanded) {
        this.elements.workflowPanel.classList.add('expanded');
      } else {
        this.elements.workflowPanel.classList.remove('expanded');
      }
      
      // Publish event for other components
      this.eventBus.publish('workflow:panel-toggled', {
        expanded: this.expanded
      });
    }
    
    /**
     * Check if the workflow panel is expanded
     * 
     * @returns {boolean} True if expanded
     */
    isExpanded() {
      return this.expanded;
    }
    
    /**
     * Expand the workflow panel
     */
    expandPanel() {
      if (!this.expanded) {
        this.toggleWorkflowPanel();
      }
    }
    
    /**
     * Collapse the workflow panel
     */
    collapsePanel() {
      if (this.expanded) {
        this.toggleWorkflowPanel();
      }
    }
  }