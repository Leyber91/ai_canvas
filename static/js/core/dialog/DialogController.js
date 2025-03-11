/**
 * core/dialog/DialogController.js
 * 
 * Controls dialog interactions and lifecycle
 * Manages dialog stack and focus management
 */

import { dialogService } from './DialogService.js';
import { EventDelegate } from '../events/EventDelegate.js';

export class DialogController {
  /**
   * Create a new dialog controller
   */
  constructor() {
    // Track focus history for restoration
    this.focusHistory = [];
    
    // Track dialog stack for proper z-index management
    this.dialogStack = [];
    
    // Event handlers
    this.eventHandlers = new Map();
    
    // Initialize global event listeners
    this.initGlobalEvents();
  }
  
  /**
   * Initialize global event listeners
   */
  initGlobalEvents() {
    // Handle escape key for dialogs
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && this.dialogStack.length > 0) {
        const topDialogId = this.dialogStack[this.dialogStack.length - 1];
        const dialog = dialogService.getDialogById(topDialogId);
        
        if (dialog && dialog.closeOnEscape) {
          dialog.hide();
        }
      }
    };
    
    document.addEventListener('keydown', escapeHandler);
    this.eventHandlers.set('escapeKey', escapeHandler);
  }
  
  /**
   * Open a dialog with focus management
   * 
   * @param {string} type - Dialog type
   * @param {Object} options - Dialog options
   * @returns {BaseDialog} The opened dialog
   */
  openDialog(type, options = {}) {
    // Save current focus for later restoration
    const currentFocus = document.activeElement;
    if (currentFocus) {
      this.focusHistory.push(currentFocus);
    }
    
    // Set up callbacks for focus management
    const originalOnOpen = options.onOpen;
    const originalOnClose = options.onClose;
    
    options.onOpen = (dialog) => {
      // Add to dialog stack
      this.dialogStack.push(dialog.getId());
      
      // Trap focus within dialog
      this.trapFocus(dialog);
      
      // Call original onOpen if provided
      if (typeof originalOnOpen === 'function') {
        originalOnOpen(dialog);
      }
    };
    
    options.onClose = (dialog) => {
      // Remove from dialog stack
      const index = this.dialogStack.indexOf(dialog.getId());
      if (index !== -1) {
        this.dialogStack.splice(index, 1);
      }
      
      // Restore focus
      this.restoreFocus();
      
      // Call original onClose if provided
      if (typeof originalOnClose === 'function') {
        originalOnClose(dialog);
      }
    };
    
    // Show dialog
    const dialog = dialogService.showDialog(type, options);
    
    return dialog;
  }
  
  /**
   * Close a dialog and restore focus
   * 
   * @param {string} id - Dialog ID
   * @returns {Promise} Promise that resolves when dialog is closed
   */
  closeDialog(id) {
    return dialogService.hideDialog(id);
  }
  
  /**
   * Close all dialogs
   * 
   * @param {boolean} skipAnimation - Whether to skip exit animations
   * @returns {Promise} Promise that resolves when all dialogs are closed
   */
  closeAllDialogs(skipAnimation = false) {
    return dialogService.hideAll(skipAnimation).then(() => {
      // Clear dialog stack
      this.dialogStack = [];
      
      // Restore focus to the first item in history
      if (this.focusHistory.length > 0) {
        const firstFocus = this.focusHistory[0];
        if (firstFocus && typeof firstFocus.focus === 'function') {
          firstFocus.focus();
        }
        this.focusHistory = [];
      }
    });
  }
  
  /**
   * Handle common dialog actions
   * 
   * @param {string} action - Action to perform
   * @param {Object} data - Action data
   * @returns {*} Action result
   */
  handleDialogAction(action, data = {}) {
    switch (action) {
      case 'open':
        return this.openDialog(data.type, data.options);
      
      case 'close':
        return this.closeDialog(data.id);
      
      case 'closeAll':
        return this.closeAllDialogs(data.skipAnimation);
      
      case 'bringToFront':
        return dialogService.bringToFront(data.id);
      
      case 'updateContent':
        const dialog = dialogService.getDialogById(data.id);
        if (dialog) {
          return dialog.setContent(data.content);
        }
        return null;
      
      case 'updateTitle':
        const titleDialog = dialogService.getDialogById(data.id);
        if (titleDialog) {
          return titleDialog.setTitle(data.title);
        }
        return null;
      
      default:
        console.warn(`Unknown dialog action: ${action}`);
        return null;
    }
  }
  
  /**
   * Register standard dialog templates
   */
  registerTemplates() {
    // This method would be implemented to register standard templates
    // It's a placeholder for now, as templates will be imported and registered elsewhere
  }
  
  /**
   * Set z-index for a dialog
   * 
   * @param {BaseDialog} dialog - Dialog instance
   * @param {number} index - Stack index
   */
  setZIndex(dialog, index) {
    const baseZIndex = dialogService.baseZIndex;
    const zIndexIncrement = dialogService.zIndexIncrement;
    
    const zIndex = baseZIndex + (index * zIndexIncrement);
    dialog.setZIndex(zIndex);
  }
  
  /**
   * Trap focus within a dialog
   * 
   * @param {BaseDialog} dialog - Dialog instance
   */
  trapFocus(dialog) {
    if (!dialog || !dialog.getDialogElement()) return;
    
    const dialogElement = dialog.getDialogElement();
    
    // Find all focusable elements
    const focusableElements = dialogElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    // Focus the first element
    setTimeout(() => {
      focusableElements[0].focus();
    }, 100);
    
    // The BaseDialog class already handles focus trapping internally
  }
  
  /**
   * Restore focus when dialog closes
   */
  restoreFocus() {
    if (this.focusHistory.length === 0) return;
    
    // Get the last focused element
    const lastFocus = this.focusHistory.pop();
    
    // Restore focus if element still exists
    if (lastFocus && typeof lastFocus.focus === 'function') {
      setTimeout(() => {
        lastFocus.focus();
      }, 100);
    }
  }
  
  /**
   * Handle overlay click
   * 
   * @param {Event} event - Click event
   * @param {BaseDialog} dialog - Dialog instance
   */
  handleOverlayClick(event, dialog) {
    if (!dialog || !dialog.closeOnOverlayClick) return;
    
    const overlay = dialog.getOverlayElement();
    
    if (event.target === overlay) {
      dialog.hide();
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Remove event listeners
    this.eventHandlers.forEach((handler, key) => {
      if (key === 'escapeKey') {
        document.removeEventListener('keydown', handler);
      }
    });
    
    // Clear event handlers
    this.eventHandlers.clear();
    
    // Clear focus history
    this.focusHistory = [];
    
    // Clear dialog stack
    this.dialogStack = [];
  }
  
  /**
   * Create a singleton instance of DialogController
   * 
   * @returns {DialogController} Singleton instance
   */
  static getInstance() {
    if (!DialogController.instance) {
      DialogController.instance = new DialogController();
    }
    
    return DialogController.instance;
  }
}

// Create and export singleton instance
export const dialogController = DialogController.getInstance();
