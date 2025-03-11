/**
 * ui/dialog/WorkflowProgressDialog.js
 * 
 * Extends DialogComponent for backward compatibility
 * Uses new WorkflowProgressTemplate internally
 */

import { DialogComponent } from './DialogComponent.js';
import { WorkflowProgressTemplate } from '../../core/dialog/templates/WorkflowProgressTemplate.js';

export class WorkflowProgressDialog extends DialogComponent {
  /**
   * @param {DialogManager} dialogManager - Parent dialog manager
   */
  constructor(dialogManager) {
    super(dialogManager);
  }
  
  /**
   * Show the workflow progress dialog
   * 
   * @param {Object} workflow - Workflow data
   * @param {Object} options - Additional options
   * @returns {BaseDialog} The dialog instance
   */
  show(workflow = {}, options = {}) {
    // Create options for the template
    const templateOptions = {
      title: options.title || 'Workflow Execution Progress',
      executionOrder: workflow.execution_order || [],
      nodeData: workflow.nodeData || {},
      initialMessage: options.initialMessage || 'Analyzing graph and determining execution order...',
      showLoadingSpinner: options.showLoadingSpinner !== false
    };
    
    // Create content using the template
    const content = WorkflowProgressTemplate.render(templateOptions);
    
    // Show dialog with the content
    const dialog = super.show({
      title: options.dialogTitle || 'Workflow Execution',
      content,
      closeOnEscape: options.closeOnEscape !== false,
      closeOnOverlayClick: options.closeOnOverlayClick !== false,
      showCloseButton: options.showCloseButton !== false,
      width: options.width || '700px',
      height: options.height || 'auto',
      className: options.className || 'workflow-progress-dialog'
    });
    
    // For backward compatibility, return an object with overlay, dialog, and content
    return {
      overlay: dialog.getOverlayElement(),
      dialog: dialog.getDialogElement(),
      content: dialog.getContentElement(),
      instance: dialog
    };
  }
  
  /**
   * Update the dialog with execution results
   * 
   * @param {Object} dialog - Dialog elements
   * @param {Object} results - Workflow execution results
   */
  update(dialog, results) {
    // Handle both new and legacy dialog formats
    let contentElement;
    
    if (dialog.instance && dialog.instance.getContentElement) {
      // New dialog instance
      contentElement = dialog.instance.getContentElement();
    } else if (dialog.content) {
      // Legacy dialog format
      contentElement = dialog.content;
    } else {
      console.warn('Invalid dialog format in WorkflowProgressDialog.update');
      return;
    }
    
    // Update content using the template
    WorkflowProgressTemplate.update(contentElement, results);
    
    // Update all conversations if the node has results
    if (results.results) {
      Object.keys(results.results).forEach(nodeId => {
        if (this.uiManager.conversationManager.activeNodeId === nodeId) {
          this.uiManager.conversationManager.displayConversation(nodeId);
        }
      });
    }
    
    // Highlight execution path in the graph
    if (results.execution_order) {
      this.uiManager.nodeOperationsManager.highlightExecutionPath(results.execution_order);
    }
  }
  
  /**
   * Update node execution status
   * 
   * @param {Object} dialog - Dialog elements
   * @param {string} nodeId - Node ID
   * @param {string} status - Execution status
   */
  updateProgress(dialog, nodeId, status) {
    // Handle both new and legacy dialog formats
    let contentElement;
    
    if (dialog.instance && dialog.instance.getContentElement) {
      // New dialog instance
      contentElement = dialog.instance.getContentElement();
    } else if (dialog.content) {
      // Legacy dialog format
      contentElement = dialog.content;
    } else {
      console.warn('Invalid dialog format in WorkflowProgressDialog.updateProgress');
      return;
    }
    
    // Update progress using the template
    WorkflowProgressTemplate.updateProgress(contentElement, nodeId, status);
  }
  
  /**
   * Handle execution error
   * 
   * @param {Object} dialog - Dialog elements
   * @param {Error} error - Execution error
   */
  handleError(dialog, error) {
    // Handle both new and legacy dialog formats
    let contentElement;
    
    if (dialog.instance && dialog.instance.getContentElement) {
      // New dialog instance
      contentElement = dialog.instance.getContentElement();
    } else if (dialog.content) {
      // Legacy dialog format
      contentElement = dialog.content;
    } else {
      console.warn('Invalid dialog format in WorkflowProgressDialog.handleError');
      return;
    }
    
    // Handle error using the template
    WorkflowProgressTemplate.handleError(contentElement, error);
  }
}
