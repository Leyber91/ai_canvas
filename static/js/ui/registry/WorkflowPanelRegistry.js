/**
 * ui/registry/WorkflowPanelRegistry.js
 * 
 * A singleton registry for tracking workflow panels to prevent duplicates.
 * This registry ensures that only one workflow panel exists at a time.
 */

class WorkflowPanelRegistry {
  constructor() {
    // Singleton instance
    if (WorkflowPanelRegistry.instance) {
      return WorkflowPanelRegistry.instance;
    }
    
    // Initialize registry
    this.panels = new Map();
    this.activePanel = null;
    this.panelCount = 0;
    
    // Store instance
    WorkflowPanelRegistry.instance = this;
  }
  
  /**
   * Register a workflow panel
   * 
   * @param {string} id - Unique panel ID
   * @param {Object} panel - Panel object
   * @param {HTMLElement} panel.element - Panel DOM element
   * @param {Object} panel.manager - Panel manager instance
   * @returns {boolean} Whether registration was successful
   */
  registerPanel(id, panel) {
    // Check if panel with this ID already exists
    if (this.panels.has(id)) {
      console.warn(`WorkflowPanelRegistry: Panel with ID ${id} already exists`);
      return false;
    }
    
    // Register panel
    this.panels.set(id, panel);
    this.panelCount++;
    
    // Set as active panel if it's the first one
    if (this.panelCount === 1) {
      this.activePanel = id;
    }
    
    console.log(`WorkflowPanelRegistry: Registered panel ${id}, total panels: ${this.panelCount}`);
    return true;
  }
  
  /**
   * Unregister a workflow panel
   * 
   * @param {string} id - Panel ID
   * @returns {boolean} Whether unregistration was successful
   */
  unregisterPanel(id) {
    // Check if panel exists
    if (!this.panels.has(id)) {
      console.warn(`WorkflowPanelRegistry: Panel with ID ${id} does not exist`);
      return false;
    }
    
    // Unregister panel
    this.panels.delete(id);
    this.panelCount--;
    
    // Clear active panel if it was this one
    if (this.activePanel === id) {
      this.activePanel = this.panels.size > 0 ? this.panels.keys().next().value : null;
    }
    
    console.log(`WorkflowPanelRegistry: Unregistered panel ${id}, total panels: ${this.panelCount}`);
    return true;
  }
  
  /**
   * Get a panel by ID
   * 
   * @param {string} id - Panel ID
   * @returns {Object|null} Panel object or null if not found
   */
  getPanel(id) {
    return this.panels.get(id) || null;
  }
  
  /**
   * Get the active panel
   * 
   * @returns {Object|null} Active panel object or null if none
   */
  getActivePanel() {
    return this.activePanel ? this.panels.get(this.activePanel) : null;
  }
  
  /**
   * Set the active panel
   * 
   * @param {string} id - Panel ID
   * @returns {boolean} Whether setting was successful
   */
  setActivePanel(id) {
    // Check if panel exists
    if (!this.panels.has(id)) {
      console.warn(`WorkflowPanelRegistry: Cannot set active panel, ID ${id} does not exist`);
      return false;
    }
    
    this.activePanel = id;
    return true;
  }
  
  /**
   * Check if a panel with the given ID exists
   * 
   * @param {string} id - Panel ID
   * @returns {boolean} Whether panel exists
   */
  hasPanel(id) {
    return this.panels.has(id);
  }
  
  /**
   * Get the number of registered panels
   * 
   * @returns {number} Number of panels
   */
  getPanelCount() {
    return this.panelCount;
  }
  
  /**
   * Get all panel IDs
   * 
   * @returns {Array} Array of panel IDs
   */
  getAllPanelIds() {
    return Array.from(this.panels.keys());
  }
  
  /**
   * Remove all panels except the one with the given ID
   * 
   * @param {string} keepId - ID of panel to keep
   * @returns {number} Number of panels removed
   */
  removeAllExcept(keepId) {
    let removedCount = 0;
    
    // Iterate through all panels
    for (const [id, panel] of this.panels.entries()) {
      // Skip the panel to keep
      if (id === keepId) continue;
      
      // Remove panel from DOM if it has an element
      if (panel.element && panel.element.parentNode) {
        panel.element.parentNode.removeChild(panel.element);
      }
      
      // Call destroy method if it exists
      if (panel.manager && typeof panel.manager.destroy === 'function') {
        panel.manager.destroy();
      }
      
      // Remove from registry
      this.panels.delete(id);
      removedCount++;
    }
    
    // Update panel count
    this.panelCount = this.panels.size;
    
    // Set active panel to the kept one
    if (this.panels.has(keepId)) {
      this.activePanel = keepId;
    } else {
      this.activePanel = this.panels.size > 0 ? this.panels.keys().next().value : null;
    }
    
    console.log(`WorkflowPanelRegistry: Removed ${removedCount} panels, kept ${keepId}`);
    return removedCount;
  }
  
  /**
   * Remove all panels
   * 
   * @returns {number} Number of panels removed
   */
  removeAll() {
    let removedCount = 0;
    
    // Iterate through all panels
    for (const [id, panel] of this.panels.entries()) {
      // Remove panel from DOM if it has an element
      if (panel.element && panel.element.parentNode) {
        panel.element.parentNode.removeChild(panel.element);
      }
      
      // Call destroy method if it exists
      if (panel.manager && typeof panel.manager.destroy === 'function') {
        panel.manager.destroy();
      }
      
      // Remove from registry
      this.panels.delete(id);
      removedCount++;
    }
    
    // Reset state
    this.panelCount = 0;
    this.activePanel = null;
    
    console.log(`WorkflowPanelRegistry: Removed all ${removedCount} panels`);
    return removedCount;
  }
  
  /**
   * Check for duplicate panels and remove them
   * 
   * @returns {number} Number of duplicate panels removed
   */
  cleanupDuplicates() {
    // Get all workflow panels in the DOM
    const workflowPanels = document.querySelectorAll('.workflow-panel, .draggable-panel');
    const panelElements = Array.from(workflowPanels);
    
    // If there's only one or none, no duplicates
    if (panelElements.length <= 1) {
      return 0;
    }
    
    console.log(`WorkflowPanelRegistry: Found ${panelElements.length} workflow panels in DOM`);
    
    // Keep the first panel, remove the rest
    let removedCount = 0;
    
    // Keep the first panel
    const keepElement = panelElements[0];
    const keepId = keepElement.id || 'workflow-panel';
    
    // Remove all other panels
    for (let i = 1; i < panelElements.length; i++) {
      const element = panelElements[i];
      
      // Skip if it's the same element
      if (element === keepElement) continue;
      
      // Remove from DOM
      if (element.parentNode) {
        element.parentNode.removeChild(element);
        removedCount++;
      }
    }
    
    console.log(`WorkflowPanelRegistry: Removed ${removedCount} duplicate panels`);
    
    // Update registry to match DOM
    this.removeAllExcept(keepId);
    
    return removedCount;
  }
}

// Create and export singleton instance
export const workflowPanelRegistry = new WorkflowPanelRegistry();
export default workflowPanelRegistry;
