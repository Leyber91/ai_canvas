/**
 * core/panel/PanelFactory.js
 * 
 * Factory for creating panel components of different types.
 * Provides registration and instantiation of panel components.
 */

import { BasePanelComponent } from './BasePanelComponent.js';
import { stateManager } from '../state/StateManager.js';

export class PanelFactory {
  constructor() {
    // Registry of panel types
    this.panelTypes = {
      // Register base panel type
      base: BasePanelComponent
    };
    
    // Default options for panels
    this.defaultOptions = {
      stateManager
    };
    
    // Bind methods
    this.registerPanelType = this.registerPanelType.bind(this);
    this.createPanel = this.createPanel.bind(this);
  }
  
  /**
   * Register a panel type
   * 
   * @param {string} type - Panel type identifier
   * @param {Class} constructor - Panel component constructor
   * @param {Object} defaultOptions - Default options for this panel type
   * @returns {PanelFactory} This instance for chaining
   */
  registerPanelType(type, constructor, defaultOptions = {}) {
    if (!type || typeof type !== 'string') {
      console.error('[PanelFactory] Invalid panel type:', type);
      return this;
    }
    
    if (!constructor || typeof constructor !== 'function') {
      console.error('[PanelFactory] Invalid constructor for panel type:', type);
      return this;
    }
    
    // Register panel type
    this.panelTypes[type] = constructor;
    
    // Store default options for this panel type
    this.defaultOptions[type] = defaultOptions;
    
    return this;
  }
  
  /**
   * Create a panel of the specified type
   * 
   * @param {string} type - Panel type identifier
   * @param {Object} options - Panel options
   * @returns {BasePanelComponent} Created panel component
   */
  createPanel(type, options = {}) {
    // Use base type if specified type not found
    const PanelConstructor = this.panelTypes[type] || this.panelTypes.base;
    
    // Merge default options with provided options
    const mergedOptions = {
      ...this.defaultOptions,
      ...(this.defaultOptions[type] || {}),
      ...options,
      panelType: type
    };
    
    // Create panel instance
    const panel = new PanelConstructor(mergedOptions);
    
    return panel;
  }
  
  /**
   * Get available panel types
   * 
   * @returns {Array<string>} Array of registered panel type identifiers
   */
  getPanelTypes() {
    return Object.keys(this.panelTypes);
  }
  
  /**
   * Check if a panel type is registered
   * 
   * @param {string} type - Panel type identifier
   * @returns {boolean} Whether the panel type is registered
   */
  hasPanelType(type) {
    return !!this.panelTypes[type];
  }
  
  /**
   * Get the constructor for a panel type
   * 
   * @param {string} type - Panel type identifier
   * @returns {Class|null} Panel constructor or null if not found
   */
  getPanelConstructor(type) {
    return this.panelTypes[type] || null;
  }
  
  /**
   * Get default options for a panel type
   * 
   * @param {string} type - Panel type identifier
   * @returns {Object} Default options for the panel type
   */
  getDefaultOptions(type) {
    return this.defaultOptions[type] || {};
  }
}

// Create singleton instance
export const panelFactory = new PanelFactory();
