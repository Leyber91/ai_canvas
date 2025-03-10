/**
 * ui/dialog/WorkflowProgressDialog.js
 * 
 * Specialized dialog component for workflow execution progress.
 */

import { DialogComponent } from './DialogComponent.js';
import { DOMHelper } from '../helpers/domHelpers.js';

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
   * @returns {Object} Dialog elements including overlay, dialog, and content
   */
  show() {
    // Create progress overlay
    const progressOverlay = this.createDialogOverlay();
    
    // Create progress dialog
    const progressDialog = this.createDialogContent();
    
    // Add title
    const progressTitle = document.createElement('h2');
    progressTitle.textContent = 'Workflow Execution Progress';
    progressDialog.appendChild(progressTitle);
    
    // Add content container
    const progressContent = this.createProgressContent();
    progressDialog.appendChild(progressContent);
    
    progressOverlay.appendChild(progressDialog);
    
    // Add to document
    document.body.appendChild(progressOverlay);
    
    // Add escape key handler
    this.addEscapeKeyHandler(progressOverlay);
    
    return {
      overlay: progressOverlay,
      dialog: progressDialog,
      content: progressContent
    };
  }
  
  /**
   * Create the progress content container
   * 
   * @returns {HTMLElement} The progress content container
   */
  createProgressContent() {
    const progressContent = document.createElement('div');
    progressContent.className = 'progress-content';
    
    if (!this.themeManager) {
      progressContent.style.margin = '15px 0';
    }
    
    // Add loading animation
    const loadingContainer = this.createLoadingSpinner();
    
    // Update loading text specifically for workflow
    const loadingText = loadingContainer.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = 'Analyzing graph and determining execution order...';
    }
    
    progressContent.appendChild(loadingContainer);
    
    return progressContent;
  }
  
  /**
   * Update the dialog with execution results
   * 
   * @param {Object} dialog - Dialog elements
   * @param {Object} results - Workflow execution results
   */
  update(dialog, results) {
    const { content } = dialog;
    const { execution_order, results: nodeResults } = results;
    
    // Clear existing content
    content.innerHTML = '';
    
    // Build HTML for results
    const resultContent = document.createElement('div');
    resultContent.className = 'result-content';
    
    // Add execution order section
    this.addExecutionOrderSection(resultContent, execution_order);
    
    // Add results section
    this.addResultsSection(resultContent, nodeResults);
    
    // Add close button
    this.addCloseButton(resultContent, () => {
      this.dialogManager.removeDialog(dialog.overlay);
    });
    
    // Update dialog content
    content.appendChild(resultContent);
    
    // Update all conversations if the node has results
    Object.keys(nodeResults).forEach(nodeId => {
      if (this.uiManager.conversationManager.activeNodeId === nodeId) {
        this.uiManager.conversationManager.displayConversation(nodeId);
      }
    });
    
    // Highlight execution path in the graph
    this.uiManager.nodeOperationsManager.highlightExecutionPath(execution_order);
  }
  
  /**
   * Add execution order section to the container
   * 
   * @param {HTMLElement} container - Container to add to
   * @param {Array} executionOrder - Execution order array
   */
  addExecutionOrderSection(container, executionOrder) {
    const orderSection = document.createElement('div');
    orderSection.className = 'execution-order-section';
    
    const orderTitle = document.createElement('h3');
    orderTitle.textContent = 'Execution Order:';
    orderSection.appendChild(orderTitle);
    
    const orderList = document.createElement('ol');
    orderList.className = 'execution-order-list';
    
    executionOrder.forEach(nodeId => {
      const node = this.uiManager.graphManager.getNodeData(nodeId);
      const listItem = document.createElement('li');
      listItem.innerHTML = `<strong>${node ? this.escapeHtml(node.name) : nodeId}</strong>`;
      orderList.appendChild(listItem);
    });
    
    orderSection.appendChild(orderList);
    container.appendChild(orderSection);
  }
  
  /**
   * Add results section to the container
   * 
   * @param {HTMLElement} container - Container to add to
   * @param {Object} nodeResults - Results by node ID
   */
  addResultsSection(container, nodeResults) {
    const resultsSection = document.createElement('div');
    resultsSection.className = 'results-section';
    
    const resultsTitle = document.createElement('h3');
    resultsTitle.textContent = 'Results:';
    resultsSection.appendChild(resultsTitle);
    
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container';
    
    if (!this.themeManager) {
      resultsContainer.style.marginTop = '10px';
    }
    
    // Add custom scrollbar if available
    if (this.themeManager && DOMHelper.createCustomScrollbar) {
      DOMHelper.createCustomScrollbar(resultsContainer);
    }
    
    Object.keys(nodeResults).forEach(nodeId => {
      const node = this.uiManager.graphManager.getNodeData(nodeId);
      const result = nodeResults[nodeId];
      
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      
      if (result.startsWith('Error:')) {
        resultItem.classList.add('error-result');
      }
      
      if (!this.themeManager) {
        Object.assign(resultItem.style, {
          marginBottom: '15px',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px'
        });
      }
      
      const resultHeader = document.createElement('h4');
      resultHeader.textContent = node ? node.name : nodeId;
      resultItem.appendChild(resultHeader);
      
      const resultContent = document.createElement('div');
      resultContent.className = 'result-content';
      
      if (!this.themeManager) {
        Object.assign(resultContent.style, {
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          marginTop: '5px',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '3px',
          maxHeight: '200px',
          overflowY: 'auto'
        });
      }
      
      if (result.startsWith('Error:')) {
        resultContent.classList.add('error-text');
        if (!this.themeManager) {
          resultContent.style.color = 'red';
        }
      }
      
      resultContent.textContent = result;
      resultItem.appendChild(resultContent);
      
      resultsContainer.appendChild(resultItem);
    });
    
    resultsSection.appendChild(resultsContainer);
    container.appendChild(resultsSection);
  }
  
  /**
   * Handle execution error
   * 
   * @param {Object} dialog - Dialog elements
   * @param {Error} error - Execution error
   */
  handleError(dialog, error) {
    const { content } = dialog;
    
    // Clear existing content
    content.innerHTML = '';
    
    // Create error message
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    
    if (!this.themeManager) {
      Object.assign(errorContainer.style, {
        color: 'red',
        margin: '15px 0',
        padding: '15px',
        backgroundColor: '#ffebee',
        borderRadius: '5px',
        border: '1px solid #ffcdd2'
      });
    }
    
    const errorTitle = document.createElement('h3');
    errorTitle.textContent = 'Error Executing Workflow';
    errorTitle.style.marginTop = '0';
    errorContainer.appendChild(errorTitle);
    
    const errorMessage = document.createElement('p');
    errorMessage.textContent = error.message;
    errorContainer.appendChild(errorMessage);
    
    content.appendChild(errorContainer);
    
    // Add close button
    this.addCloseButton(content, () => {
      this.dialogManager.removeDialog(dialog.overlay);
    });
  }
}