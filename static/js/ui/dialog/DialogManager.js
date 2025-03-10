/**
 * ui/dialog/DialogManager.js
 * 
 * Manages dialogs and modal interactions with ThemeManager integration.
 * Coordinates display of graph selection, workflow execution progress, and confirmation dialogs.
 */

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
      this.activeDialogs = new Set();
      
      // Initialize dialog components
      this.graphSelectionDialog = new GraphSelectionDialog(this);
      this.workflowProgressDialog = new WorkflowProgressDialog(this);
      this.confirmationDialog = new ConfirmationDialog(this);
    }
    
    /**
     * Show a dialog to select a graph to load
     * 
     * @param {Array} graphs - Array of available graphs
     * @returns {HTMLElement} The dialog overlay element
     */
    showGraphSelectionDialog(graphs) {
      const dialog = this.graphSelectionDialog.show(graphs);
      this.activeDialogs.add(dialog);
      return dialog;
    }
    
    /**
     * Show a dialog to display workflow execution progress
     * 
     * @returns {Object} Dialog elements including overlay, dialog, and content
     */
    showWorkflowProgressDialog() {
      const dialog = this.workflowProgressDialog.show();
      this.activeDialogs.add(dialog.overlay);
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
      this.activeDialogs.add(dialog);
      return dialog;
    }
    
    /**
     * Remove a dialog from the DOM and tracking list
     * 
     * @param {HTMLElement} dialog - The dialog element to remove
     */
    removeDialog(dialog) {
      if (document.body.contains(dialog)) {
        document.body.removeChild(dialog);
      }
      this.activeDialogs.delete(dialog);
    }
    
    /**
     * Close all active dialogs
     */
    closeAllDialogs() {
      this.activeDialogs.forEach(dialog => {
        this.removeDialog(dialog);
      });
    }
    
    /**
     * Hide the most recently active dialog
     */
    hideActiveDialog() {
      if (this.activeDialogs.size > 0) {
        this.removeDialog([...this.activeDialogs][this.activeDialogs.size - 1]);
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
}