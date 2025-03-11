/**
 * core/dialog/DialogService.js
 * 
 * Central service for managing all dialogs
 * Acts as registry and controller for dialog instances
 */

import { BaseDialog } from './BaseDialog.js';

export class DialogService {
  /**
   * Create a new dialog service instance
   */
  constructor() {
    // Registry of dialog constructors by type
    this.registry = new Map();
    
    // Active dialog instances
    this.activeDialogs = new Map();
    
    // Dialog z-index management
    this.baseZIndex = 1000;
    this.zIndexIncrement = 10;
    
    // Register base dialog type
    this.register('base', BaseDialog);
  }
  
  /**
   * Register a dialog type with its constructor
   * 
   * @param {string} type - Dialog type identifier
   * @param {Function} constructor - Dialog constructor function
   * @returns {DialogService} This service instance for chaining
   */
  register(type, constructor) {
    if (typeof type !== 'string' || !type) {
      throw new Error('Dialog type must be a non-empty string');
    }
    
    if (typeof constructor !== 'function') {
      throw new Error('Dialog constructor must be a function');
    }
    
    this.registry.set(type, constructor);
    return this;
  }
  
  /**
   * Unregister a dialog type
   * 
   * @param {string} type - Dialog type identifier
   * @returns {boolean} Whether the type was successfully unregistered
   */
  unregister(type) {
    return this.registry.delete(type);
  }
  
  /**
   * Create a dialog instance of the specified type
   * 
   * @param {string} type - Dialog type identifier
   * @param {Object} options - Dialog options
   * @returns {BaseDialog} Created dialog instance
   */
  createDialog(type, options = {}) {
    const Constructor = this.registry.get(type);
    
    if (!Constructor) {
      throw new Error(`Dialog type "${type}" is not registered`);
    }
    
    return new Constructor(options);
  }
  
  /**
   * Show a dialog of the specified type
   * 
   * @param {string} type - Dialog type identifier
   * @param {Object} options - Dialog options
   * @returns {BaseDialog} The shown dialog instance
   */
  showDialog(type, options = {}) {
    // Create dialog instance
    const dialog = this.createDialog(type, options);
    
    // Set z-index based on active dialogs
    const zIndex = this.getNextZIndex();
    dialog.setZIndex(zIndex);
    
    // Set up close handler to remove from active dialogs
    const originalOnClose = dialog.onClose;
    dialog.onClose = (dialogInstance) => {
      this.activeDialogs.delete(dialogInstance.getId());
      
      if (typeof originalOnClose === 'function') {
        originalOnClose(dialogInstance);
      }
    };
    
    // Show dialog
    dialog.show();
    
    // Add to active dialogs
    this.activeDialogs.set(dialog.getId(), dialog);
    
    return dialog;
  }
  
  /**
   * Hide a specific dialog by ID
   * 
   * @param {string} id - Dialog ID
   * @returns {Promise} Promise that resolves when dialog is hidden
   */
  hideDialog(id) {
    const dialog = this.activeDialogs.get(id);
    
    if (!dialog) {
      return Promise.resolve(false);
    }
    
    return dialog.hide();
  }
  
  /**
   * Hide all open dialogs
   * 
   * @param {boolean} skipAnimation - Whether to skip exit animations
   * @returns {Promise} Promise that resolves when all dialogs are hidden
   */
  hideAll(skipAnimation = false) {
    const promises = [];
    
    this.activeDialogs.forEach(dialog => {
      promises.push(dialog.hide(skipAnimation));
    });
    
    return Promise.all(promises);
  }
  
  /**
   * Get a dialog instance by ID
   * 
   * @param {string} id - Dialog ID
   * @returns {BaseDialog|null} Dialog instance or null if not found
   */
  getDialogById(id) {
    return this.activeDialogs.get(id) || null;
  }
  
  /**
   * Get all dialogs of a specific type
   * 
   * @param {string} type - Dialog type
   * @returns {Array<BaseDialog>} Array of dialog instances
   */
  getDialogsByType(type) {
    const Constructor = this.registry.get(type);
    
    if (!Constructor) {
      return [];
    }
    
    const dialogs = [];
    
    this.activeDialogs.forEach(dialog => {
      if (dialog instanceof Constructor) {
        dialogs.push(dialog);
      }
    });
    
    return dialogs;
  }
  
  /**
   * Check if any dialogs are open
   * 
   * @returns {boolean} Whether any dialogs are open
   */
  hasOpenDialogs() {
    return this.activeDialogs.size > 0;
  }
  
  /**
   * Get the number of open dialogs
   * 
   * @returns {number} Number of open dialogs
   */
  getOpenDialogCount() {
    return this.activeDialogs.size;
  }
  
  /**
   * Get the next z-index for a new dialog
   * 
   * @returns {number} Next z-index value
   */
  getNextZIndex() {
    if (this.activeDialogs.size === 0) {
      return this.baseZIndex;
    }
    
    let maxZIndex = this.baseZIndex;
    
    this.activeDialogs.forEach(dialog => {
      const dialogZIndex = dialog.zIndex || this.baseZIndex;
      maxZIndex = Math.max(maxZIndex, dialogZIndex);
    });
    
    return maxZIndex + this.zIndexIncrement;
  }
  
  /**
   * Update the z-index of a dialog
   * 
   * @param {string} id - Dialog ID
   * @param {number} zIndex - New z-index
   * @returns {boolean} Whether the update was successful
   */
  updateZIndex(id, zIndex) {
    const dialog = this.activeDialogs.get(id);
    
    if (!dialog) {
      return false;
    }
    
    dialog.setZIndex(zIndex);
    return true;
  }
  
  /**
   * Bring a dialog to the front
   * 
   * @param {string} id - Dialog ID
   * @returns {boolean} Whether the operation was successful
   */
  bringToFront(id) {
    const dialog = this.activeDialogs.get(id);
    
    if (!dialog) {
      return false;
    }
    
    const zIndex = this.getNextZIndex();
    dialog.setZIndex(zIndex);
    
    return true;
  }
  
  /**
   * Check if a dialog type is registered
   * 
   * @param {string} type - Dialog type
   * @returns {boolean} Whether the type is registered
   */
  isRegistered(type) {
    return this.registry.has(type);
  }
  
  /**
   * Get all registered dialog types
   * 
   * @returns {Array<string>} Array of registered dialog types
   */
  getRegisteredTypes() {
    return Array.from(this.registry.keys());
  }
  
  /**
   * Create a singleton instance of DialogService
   * 
   * @returns {DialogService} Singleton instance
   */
  static getInstance() {
    if (!DialogService.instance) {
      DialogService.instance = new DialogService();
    }
    
    return DialogService.instance;
  }
}

// Create and export singleton instance
export const dialogService = DialogService.getInstance();
