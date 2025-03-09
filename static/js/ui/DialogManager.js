/**
 * ui/DialogManager.js
 * 
 * Manages dialogs and modal interactions, such as graph selection,
 * workflow execution progress, and confirmation dialogs.
 */
export class DialogManager {
    /**
     * @param {UIManager} uiManager - The parent UI manager
     */
    constructor(uiManager) {
      this.uiManager = uiManager;
      this.activeDialogs = new Set();
    }
    
    /**
     * Show a dialog to select a graph to load
     * 
     * @param {Array} graphs - Array of available graphs
     */
    showGraphSelectionDialog(graphs) {
      // Create dialog overlay
      const dialogOverlay = document.createElement('div');
      dialogOverlay.className = 'dialog-overlay';
      dialogOverlay.style.position = 'fixed';
      dialogOverlay.style.top = '0';
      dialogOverlay.style.left = '0';
      dialogOverlay.style.width = '100%';
      dialogOverlay.style.height = '100%';
      dialogOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      dialogOverlay.style.zIndex = '1000';
      dialogOverlay.style.display = 'flex';
      dialogOverlay.style.justifyContent = 'center';
      dialogOverlay.style.alignItems = 'center';
      
      // Create dialog content
      const dialog = document.createElement('div');
      dialog.className = 'dialog-content';
      dialog.style.backgroundColor = 'white';
      dialog.style.padding = '20px';
      dialog.style.borderRadius = '5px';
      dialog.style.maxWidth = '500px';
      dialog.style.width = '90%';
      dialog.style.maxHeight = '80vh';
      dialog.style.overflowY = 'auto';
      
      // Add title
      const title = document.createElement('h2');
      title.textContent = 'Select a Graph to Load';
      dialog.appendChild(title);
      
      // Create graph list
      const graphList = document.createElement('div');
      graphList.style.maxHeight = '400px';
      graphList.style.overflowY = 'auto';
      graphList.style.margin = '10px 0';
      
      // Add each graph as an item
      graphs.forEach(graph => {
        const graphItem = document.createElement('div');
        graphItem.className = 'graph-item';
        graphItem.style.padding = '10px';
        graphItem.style.margin = '5px 0';
        graphItem.style.border = '1px solid #ddd';
        graphItem.style.borderRadius = '3px';
        graphItem.style.cursor = 'pointer';
        graphItem.style.transition = 'background-color 0.2s ease';
        
        // Hover effect
        graphItem.addEventListener('mouseenter', () => {
          graphItem.style.backgroundColor = '#f0f0f0';
        });
        
        graphItem.addEventListener('mouseleave', () => {
          graphItem.style.backgroundColor = '';
        });
        
        graphItem.innerHTML = `
          <strong>${this.escapeHtml(graph.name)}</strong>
          <div>${this.escapeHtml(graph.description || 'No description')}</div>
          <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
            Created: ${new Date(graph.creation_date).toLocaleString()}
          </div>
        `;
        
        // Add click handler
        graphItem.addEventListener('click', async () => {
          try {
            // Show loading state
            graphItem.style.opacity = '0.7';
            graphItem.innerHTML += '<div style="text-align: center; margin-top: 10px;">Loading...</div>';
            
            // Load the selected graph
            await this.uiManager.graphManager.loadGraphById(graph.id);
            
            // Show success notification
            this.uiManager.showNotification(`Graph "${graph.name}" loaded successfully`);
            
            // Remove dialog
            this.removeDialog(dialogOverlay);
          } catch (error) {
            // Show error in the dialog
            const errorMsg = document.createElement('div');
            errorMsg.style.color = 'red';
            errorMsg.style.marginTop = '10px';
            errorMsg.textContent = `Error loading graph: ${error.message}`;
            graphItem.appendChild(errorMsg);
            
            // Reset loading state
            graphItem.style.opacity = '1';
            graphItem.querySelector('div:last-child').remove();
            
            this.uiManager.errorHandler.handleError(error, {
              context: 'Loading Graph',
              silent: true
            });
          }
        });
        
        graphList.appendChild(graphItem);
      });
      
      dialog.appendChild(graphList);
      
      // Add cancel button
      const buttonContainer = document.createElement('div');
      buttonContainer.style.textAlign = 'right';
      buttonContainer.style.marginTop = '15px';
      
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.className = 'dialog-btn';
      cancelButton.style.padding = '8px 16px';
      cancelButton.addEventListener('click', () => {
        this.removeDialog(dialogOverlay);
      });
      
      buttonContainer.appendChild(cancelButton);
      dialog.appendChild(buttonContainer);
      
      // Add dialog to overlay
      dialogOverlay.appendChild(dialog);
      
      // Add to document and track
      document.body.appendChild(dialogOverlay);
      this.activeDialogs.add(dialogOverlay);
      
      // Add escape key handler
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.removeDialog(dialogOverlay);
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
      
      return dialogOverlay;
    }
    
    /**
     * Show a dialog to display workflow execution progress
     * 
     * @returns {Object} Dialog elements
     */
    showWorkflowProgressDialog() {
      // Create progress overlay
      const progressOverlay = document.createElement('div');
      progressOverlay.className = 'dialog-overlay';
      progressOverlay.style.position = 'fixed';
      progressOverlay.style.top = '0';
      progressOverlay.style.left = '0';
      progressOverlay.style.width = '100%';
      progressOverlay.style.height = '100%';
      progressOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      progressOverlay.style.zIndex = '1000';
      progressOverlay.style.display = 'flex';
      progressOverlay.style.justifyContent = 'center';
      progressOverlay.style.alignItems = 'center';
      
      // Create progress dialog
      const progressDialog = document.createElement('div');
      progressDialog.className = 'dialog-content';
      progressDialog.style.backgroundColor = 'white';
      progressDialog.style.padding = '20px';
      progressDialog.style.borderRadius = '5px';
      progressDialog.style.maxWidth = '600px';
      progressDialog.style.width = '90%';
      progressDialog.style.maxHeight = '80vh';
      progressDialog.style.overflowY = 'auto';
      
      // Add title
      const progressTitle = document.createElement('h2');
      progressTitle.textContent = 'Workflow Execution Progress';
      progressDialog.appendChild(progressTitle);
      
      // Add content container
      const progressContent = document.createElement('div');
      progressContent.className = 'progress-content';
      progressContent.style.margin = '15px 0';
      
      // Add loading animation
      const loadingContainer = document.createElement('div');
      loadingContainer.style.textAlign = 'center';
      loadingContainer.style.padding = '20px';
      
      const loadingSpinner = document.createElement('div');
      loadingSpinner.className = 'loading-spinner';
      loadingSpinner.style.display = 'inline-block';
      loadingSpinner.style.width = '30px';
      loadingSpinner.style.height = '30px';
      loadingSpinner.style.border = '3px solid rgba(0, 0, 0, 0.1)';
      loadingSpinner.style.borderTopColor = '#3498db';
      loadingSpinner.style.borderRadius = '50%';
      loadingSpinner.style.animation = 'spin 1s ease-in-out infinite';
      
      const loadingText = document.createElement('div');
      loadingText.textContent = 'Analyzing graph and determining execution order...';
      loadingText.style.marginTop = '10px';
      
      // Add the spinner and text to loading container
      loadingContainer.appendChild(loadingSpinner);
      loadingContainer.appendChild(loadingText);
      
      // Add the loading container to progress content
      progressContent.appendChild(loadingContainer);
      
      // Add @keyframes rule for spinner animation
      if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      progressDialog.appendChild(progressContent);
      progressOverlay.appendChild(progressDialog);
      
      // Add to document and track
      document.body.appendChild(progressOverlay);
      this.activeDialogs.add(progressOverlay);
      
      return {
        overlay: progressOverlay,
        dialog: progressDialog,
        content: progressContent
      };
    }
    
    /**
     * Update the workflow progress dialog with execution results
     * 
     * @param {Object} dialog - Dialog elements
     * @param {Object} results - Workflow execution results
     */
    updateWorkflowProgressDialog(dialog, results) {
      const { content } = dialog;
      const { execution_order, results: nodeResults } = results;
      
      // Clear existing content
      content.innerHTML = '';
      
      // Build HTML for results
      const resultContent = document.createElement('div');
      
      // Add execution order section
      const orderSection = document.createElement('div');
      const orderTitle = document.createElement('h3');
      orderTitle.textContent = 'Execution Order:';
      orderSection.appendChild(orderTitle);
      
      const orderList = document.createElement('ol');
      execution_order.forEach(nodeId => {
        const node = this.uiManager.graphManager.getNodeData(nodeId);
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${node ? this.escapeHtml(node.name) : nodeId}</strong>`;
        orderList.appendChild(listItem);
      });
      orderSection.appendChild(orderList);
      resultContent.appendChild(orderSection);
      
      // Add results section
      const resultsSection = document.createElement('div');
      const resultsTitle = document.createElement('h3');
      resultsTitle.textContent = 'Results:';
      resultsSection.appendChild(resultsTitle);
      
      const resultsContainer = document.createElement('div');
      resultsContainer.style.marginTop = '10px';
      
      Object.keys(nodeResults).forEach(nodeId => {
        const node = this.uiManager.graphManager.getNodeData(nodeId);
        const result = nodeResults[nodeId];
        
        const resultItem = document.createElement('div');
        resultItem.style.marginBottom = '15px';
        resultItem.style.padding = '10px';
        resultItem.style.border = '1px solid #ddd';
        resultItem.style.borderRadius = '5px';
        
        const resultHeader = document.createElement('h4');
        resultHeader.textContent = node ? node.name : nodeId;
        resultItem.appendChild(resultHeader);
        
        const resultContent = document.createElement('div');
        resultContent.style.whiteSpace = 'pre-wrap';
        resultContent.style.fontFamily = 'monospace';
        resultContent.style.marginTop = '5px';
        resultContent.style.padding = '8px';
        resultContent.style.backgroundColor = '#f5f5f5';
        resultContent.style.borderRadius = '3px';
        resultContent.style.maxHeight = '200px';
        resultContent.style.overflowY = 'auto';
        
        if (result.startsWith('Error:')) {
          resultContent.style.color = 'red';
        }
        
        resultContent.textContent = result;
        resultItem.appendChild(resultContent);
        
        resultsContainer.appendChild(resultItem);
      });
      
      resultsSection.appendChild(resultsContainer);
      resultContent.appendChild(resultsSection);
      
      // Add close button
      const buttonContainer = document.createElement('div');
      buttonContainer.style.marginTop = '20px';
      buttonContainer.style.textAlign = 'right';
      
      const closeButton = document.createElement('button');
      closeButton.id = 'close-progress-btn';
      closeButton.textContent = 'Close';
      closeButton.style.padding = '8px 16px';
      closeButton.style.backgroundColor = '#3498db';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', () => {
        this.removeDialog(dialog.overlay);
      });
      
      buttonContainer.appendChild(closeButton);
      resultContent.appendChild(buttonContainer);
      
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
     * Handle workflow execution error
     * 
     * @param {Object} dialog - Dialog elements
     * @param {Error} error - Execution error
     */
    handleWorkflowError(dialog, error) {
      const { content } = dialog;
      
      // Clear existing content
      content.innerHTML = '';
      
      // Create error message
      const errorContainer = document.createElement('div');
      errorContainer.style.color = 'red';
      errorContainer.style.margin = '15px 0';
      errorContainer.style.padding = '15px';
      errorContainer.style.backgroundColor = '#ffebee';
      errorContainer.style.borderRadius = '5px';
      errorContainer.style.border = '1px solid #ffcdd2';
      
      const errorTitle = document.createElement('h3');
      errorTitle.textContent = 'Error Executing Workflow';
      errorTitle.style.marginTop = '0';
      errorContainer.appendChild(errorTitle);
      
      const errorMessage = document.createElement('p');
      errorMessage.textContent = error.message;
      errorContainer.appendChild(errorMessage);
      
      content.appendChild(errorContainer);
      
      // Add close button
      const buttonContainer = document.createElement('div');
      buttonContainer.style.marginTop = '20px';
      buttonContainer.style.textAlign = 'right';
      
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.padding = '8px 16px';
      closeButton.style.backgroundColor = '#3498db';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', () => {
        this.removeDialog(dialog.overlay);
      });
      
      buttonContainer.appendChild(closeButton);
      content.appendChild(buttonContainer);
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
     * Show a confirmation dialog
     * 
     * @param {string} message - The confirmation message
     * @param {Function} onConfirm - Function to call when confirmed
     * @param {Function} onCancel - Function to call when cancelled
     * @returns {HTMLElement} The dialog element
     */
    showConfirmDialog(message, onConfirm, onCancel = null) {
      // Create dialog overlay
      const dialogOverlay = document.createElement('div');
      dialogOverlay.className = 'dialog-overlay';
      dialogOverlay.style.position = 'fixed';
      dialogOverlay.style.top = '0';
      dialogOverlay.style.left = '0';
      dialogOverlay.style.width = '100%';
      dialogOverlay.style.height = '100%';
      dialogOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      dialogOverlay.style.zIndex = '1000';
      dialogOverlay.style.display = 'flex';
      dialogOverlay.style.justifyContent = 'center';
      dialogOverlay.style.alignItems = 'center';
      
      // Create dialog content
      const dialog = document.createElement('div');
      dialog.className = 'dialog-content';
      dialog.style.backgroundColor = 'white';
      dialog.style.padding = '20px';
      dialog.style.borderRadius = '5px';
      dialog.style.maxWidth = '400px';
      dialog.style.width = '90%';
      
      // Add message
      const messageElement = document.createElement('p');
      messageElement.textContent = message;
      dialog.appendChild(messageElement);
      
      // Add buttons
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'flex-end';
      buttonContainer.style.marginTop = '20px';
      buttonContainer.style.gap = '10px';
      
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.padding = '8px 16px';
      cancelButton.addEventListener('click', () => {
        this.removeDialog(dialogOverlay);
        if (onCancel) onCancel();
      });
      
      const confirmButton = document.createElement('button');
      confirmButton.textContent = 'Confirm';
      confirmButton.style.padding = '8px 16px';
      confirmButton.style.backgroundColor = '#3498db';
      confirmButton.style.color = 'white';
      confirmButton.style.border = 'none';
      confirmButton.style.borderRadius = '4px';
      confirmButton.style.cursor = 'pointer';
      confirmButton.addEventListener('click', () => {
        this.removeDialog(dialogOverlay);
        onConfirm();
      });
      
      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      dialog.appendChild(buttonContainer);
      
      // Add dialog to overlay
      dialogOverlay.appendChild(dialog);
      
      // Add to document and track
      document.body.appendChild(dialogOverlay);
      this.activeDialogs.add(dialogOverlay);
      
      // Add escape key handler to cancel
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.removeDialog(dialogOverlay);
          if (onCancel) onCancel();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
      
      return dialogOverlay;
    }
    
    /**
     * Escape HTML to prevent XSS when inserting user content
     * 
     * @param {string} unsafe - Potentially unsafe string
     * @returns {string} Safe string with HTML entities escaped
     */
    escapeHtml(unsafe) {
      if (typeof unsafe !== 'string') {
        return '';
      }
      
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
}