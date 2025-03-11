/**
 * ui/dialog/DialogManager.js
 * 
 * Compatibility wrapper around DialogService
 * Maintains backward compatibility with existing code
 */

import { dialogService } from '../../core/dialog/DialogService.js';
import { dialogController } from '../../core/dialog/DialogController.js';
import { GraphSelectionDialog } from './GraphSelectionDialog.js';
import { WorkflowProgressDialog } from './WorkflowProgressDialog.js';
import { ConfirmationDialog } from './ConfirmationDialog.js';
import { FormatHelpers } from '../helpers/formatHelpers.js';

export class DialogManager {
    /**
     * @param {UIManager} uiManager - The parent UI manager
     */
    constructor(uiManager) {
      this.uiManager = uiManager;
      this.themeManager = uiManager.themeManager;
      this.activeDialogs = new Map(); // Changed to Map to store dialog instances by ID
      
      // Initialize dialog components
      this.graphSelectionDialog = new GraphSelectionDialog(this);
      this.workflowProgressDialog = new WorkflowProgressDialog(this);
      this.confirmationDialog = new ConfirmationDialog(this);
      
      // Register dialog types with the service if not already registered
      this._registerDialogTypes();
    }
    
    /**
     * Register dialog types with the DialogService
     * @private
     */
    _registerDialogTypes() {
      // Only register if not already registered
      if (!dialogService.isRegistered('graphSelection')) {
        dialogService.register('graphSelection', (options) => new GraphSelectionDialog(this));
      }
      
      if (!dialogService.isRegistered('workflowProgress')) {
        dialogService.register('workflowProgress', (options) => new WorkflowProgressDialog(this));
      }
      
      if (!dialogService.isRegistered('confirmation')) {
        dialogService.register('confirmation', (options) => new ConfirmationDialog(this));
      }
    }
    
    /**
     * Show a dialog with options
     * 
     * @param {Object} options - Dialog options
     * @returns {Object} Dialog instance
     */
    showDialog(options) {
      const dialog = dialogController.openDialog(options.type || 'base', options);
      this.activeDialogs.set(dialog.getId(), dialog);
      return dialog;
    }
    
    /**
     * Show a dialog to select a graph to load
     * 
     * @param {Array} graphs - Array of available graphs
     * @param {Function} onSelect - Callback when a graph is selected
     * @returns {HTMLElement} The dialog overlay element
     */
    showGraphSelectionDialog(graphs, onSelect) {
      const dialog = this.graphSelectionDialog.show(graphs, onSelect);
      this.activeDialogs.set(dialog.getId ? dialog.getId() : Date.now(), dialog);
      return dialog;
    }
    
    /**
     * Show a dialog to display workflow execution progress
     * 
     * @param {Object} workflow - Workflow data
     * @returns {Object} Dialog elements including overlay, dialog, and content
     */
    showWorkflowProgressDialog(workflow) {
      const dialog = this.workflowProgressDialog.show(workflow);
      
      // Handle both new and legacy dialog formats
      if (dialog.getId) {
        this.activeDialogs.set(dialog.getId(), dialog);
      } else if (dialog.overlay) {
        this.activeDialogs.set(Date.now(), dialog);
      }
      
      return dialog;
    }
    
    /**
     * Update the workflow progress dialog with execution results
     * 
     * @param {Object} dialog - Dialog elements
     * @param {Object} results - Workflow execution results
     */
    updateWorkflowProgressDialog(dialog, results) {
      this.workflowProgressDialog.update(dialog, results);
    }
    
    /**
     * Handle workflow execution error
     * 
     * @param {Object} dialog - Dialog elements
     * @param {Error} error - Execution error
     */
    handleWorkflowError(dialog, error) {
      this.workflowProgressDialog.handleError(dialog, error);
    }
    
    /**
     * Show a confirmation dialog
     * 
     * @param {string} message - The confirmation message
     * @param {Function} onConfirm - Function to call when confirmed
     * @param {Function} onCancel - Function to call when cancelled
     * @returns {HTMLElement} The dialog element
     */
    showConfirmDialog(message, onConfirm, onCancel = null) {
      const dialog = this.confirmationDialog.show(message, onConfirm, onCancel);
      
      // Handle both new and legacy dialog formats
      if (dialog.getId) {
        this.activeDialogs.set(dialog.getId(), dialog);
      } else {
        this.activeDialogs.set(Date.now(), dialog);
      }
      
      return dialog;
    }
    
    /**
     * Remove a dialog from the DOM and tracking list
     * 
     * @param {HTMLElement|Object} dialog - The dialog element or instance to remove
     */
    removeDialog(dialog) {
      // Handle both new dialog instances and legacy DOM elements
      if (dialog.hide) {
        // New dialog instance
        dialog.hide();
        this.activeDialogs.delete(dialog.getId());
      } else if (dialog.getId) {
        // New dialog instance by ID
        this.activeDialogs.delete(dialog.getId());
        dialogService.hideDialog(dialog.getId());
      } else {
        // Legacy DOM element
        if (document.body.contains(dialog)) {
          document.body.removeChild(dialog);
        }
        
        // Find and remove from activeDialogs
        for (const [id, activeDialog] of this.activeDialogs.entries()) {
          if (activeDialog === dialog || 
              (activeDialog.overlay && activeDialog.overlay === dialog)) {
            this.activeDialogs.delete(id);
            break;
          }
        }
      }
    }
    
    /**
     * Hide a specific dialog by ID
     * 
     * @param {string} id - Dialog ID
     * @returns {Promise} Promise that resolves when dialog is hidden
     */
    hideDialog(id) {
      const dialog = this.activeDialogs.get(id);
      
      if (dialog) {
        this.removeDialog(dialog);
      }
      
      return dialogService.hideDialog(id);
    }
    
    /**
     * Close all active dialogs
     */
    closeAllDialogs() {
      // Close all dialogs using DialogService
      dialogService.hideAll();
      
      // Also handle legacy dialogs
      this.activeDialogs.forEach(dialog => {
        this.removeDialog(dialog);
      });
      
      this.activeDialogs.clear();
    }
    
    /**
     * Hide the most recently active dialog
     */
    hideActiveDialog() {
      if (this.activeDialogs.size > 0) {
        const lastDialogId = Array.from(this.activeDialogs.keys()).pop();
        const lastDialog = this.activeDialogs.get(lastDialogId);
        this.removeDialog(lastDialog);
      }
    }
    
    /**
     * Escape HTML to prevent XSS when inserting user content
     * 
     * @param {string} unsafe - Potentially unsafe string
     * @returns {string} Safe string with HTML entities escaped
     */
    escapeHtml(unsafe) {
      return FormatHelpers.escapeHtml(unsafe);
    }
    
    /**
     * Get singleton instance
     * 
     * @returns {DialogManager} Singleton instance
     */
    static getInstance() {
      if (!DialogManager.instance) {
        DialogManager.instance = new DialogManager();
      }
      
      return DialogManager.instance;
    }
}
