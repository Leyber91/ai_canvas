/**
 * core/dialog/templates/WorkflowProgressTemplate.js
 * 
 * Template for workflow progress dialog
 * Shows execution progress and results
 */

import { FormatUtils } from '../../utils/FormatUtils.js';
import { StyleUtils } from '../../utils/StyleUtils.js';
import { AnimationUtils } from '../../utils/AnimationUtils.js';

export class WorkflowProgressTemplate {
  /**
   * Render progress dialog
   * 
   * @param {Object} options - Template options
   * @returns {HTMLElement} The rendered content
   */
  static render(options = {}) {
    const {
      title = 'Workflow Execution Progress',
      executionOrder = [],
      nodeData = {},
      initialMessage = 'Analyzing graph and determining execution order...',
      showLoadingSpinner = true
    } = options;
    
    // Create container
    const container = document.createElement('div');
    container.className = 'workflow-progress-dialog-content';
    
    // Add title
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.className = 'workflow-progress-dialog-title';
    
    StyleUtils.applyStyles(titleElement, {
      margin: '0 0 15px 0',
      padding: '0 0 10px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    });
    
    container.appendChild(titleElement);
    
    // Add initial loading state
    if (showLoadingSpinner) {
      const loadingContainer = WorkflowProgressTemplate.createLoadingSpinner(initialMessage);
      container.appendChild(loadingContainer);
    }
    
    // Add execution order section if provided
    if (executionOrder && executionOrder.length > 0) {
      WorkflowProgressTemplate.addExecutionOrderSection(container, executionOrder, nodeData);
    }
    
    return container;
  }
  
  /**
   * Update with execution results
   * 
   * @param {HTMLElement} container - Container element
   * @param {Object} results - Execution results
   * @returns {HTMLElement} The updated container
   */
  static update(container, results) {
    if (!container) return null;
    
    const { execution_order, results: nodeResults } = results;
    
    // Remove loading spinner if exists
    const loadingContainer = container.querySelector('.workflow-progress-loading-container');
    if (loadingContainer) {
      container.removeChild(loadingContainer);
    }
    
    // Add execution order section
    WorkflowProgressTemplate.addExecutionOrderSection(container, execution_order);
    
    // Add results section
    WorkflowProgressTemplate.addResultsSection(container, nodeResults);
    
    return container;
  }
  
  /**
   * Update node execution status
   * 
   * @param {HTMLElement} container - Container element
   * @param {string} nodeId - Node ID
   * @param {string} status - Execution status
   * @returns {HTMLElement} The updated container
   */
  static updateProgress(container, nodeId, status) {
    if (!container || !nodeId) return container;
    
    // Find node item in execution order
    const nodeItem = container.querySelector(`[data-node-id="${nodeId}"]`);
    
    if (nodeItem) {
      // Update status
      const statusElement = nodeItem.querySelector('.workflow-progress-node-status');
      
      if (statusElement) {
        statusElement.textContent = status;
        
        // Update status class
        statusElement.className = 'workflow-progress-node-status';
        
        switch (status.toLowerCase()) {
          case 'pending':
            statusElement.classList.add('status-pending');
            break;
          case 'running':
            statusElement.classList.add('status-running');
            break;
          case 'completed':
            statusElement.classList.add('status-completed');
            break;
          case 'error':
            statusElement.classList.add('status-error');
            break;
          case 'skipped':
            statusElement.classList.add('status-skipped');
            break;
        }
      }
    }
    
    return container;
  }
  
  /**
   * Handle execution error
   * 
   * @param {HTMLElement} container - Container element
   * @param {Error} error - Execution error
   * @returns {HTMLElement} The updated container
   */
  static handleError(container, error) {
    if (!container) return null;
    
    // Remove loading spinner if exists
    const loadingContainer = container.querySelector('.workflow-progress-loading-container');
    if (loadingContainer) {
      container.removeChild(loadingContainer);
    }
    
    // Add error section
    WorkflowProgressTemplate.addErrorSection(container, error);
    
    return container;
  }
  
  /**
   * Add execution order section
   * 
   * @param {HTMLElement} container - Container element
   * @param {Array} executionOrder - Execution order array
   * @param {Object} nodeData - Node data by ID
   */
  static addExecutionOrderSection(container, executionOrder, nodeData = {}) {
    // Check if section already exists
    let orderSection = container.querySelector('.workflow-progress-execution-order');
    
    if (!orderSection) {
      // Create section
      orderSection = document.createElement('div');
      orderSection.className = 'workflow-progress-execution-order';
      
      // Create section title
      const sectionTitle = document.createElement('h3');
      sectionTitle.textContent = 'Execution Order:';
      sectionTitle.className = 'workflow-progress-section-title';
      
      StyleUtils.applyStyles(sectionTitle, {
        margin: '15px 0 10px 0',
        fontSize: '16px'
      });
      
      orderSection.appendChild(sectionTitle);
      
      // Create order list
      const orderList = document.createElement('ol');
      orderList.className = 'workflow-progress-order-list';
      
      StyleUtils.applyStyles(orderList, {
        margin: '0',
        padding: '0 0 0 20px'
      });
      
      orderSection.appendChild(orderList);
      
      // Add to container
      container.appendChild(orderSection);
    }
    
    // Get or create order list
    const orderList = orderSection.querySelector('.workflow-progress-order-list');
    
    // Clear existing items if any
    orderList.innerHTML = '';
    
    // Add each node to the list
    executionOrder.forEach((nodeId, index) => {
      const node = nodeData[nodeId] || { name: nodeId };
      const listItem = document.createElement('li');
      listItem.className = 'workflow-progress-node-item';
      listItem.setAttribute('data-node-id', nodeId);
      
      StyleUtils.applyStyles(listItem, {
        margin: '5px 0',
        padding: '5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px'
      });
      
      // Node name
      const nodeName = document.createElement('span');
      nodeName.className = 'workflow-progress-node-name';
      nodeName.textContent = node.name || `Node ${nodeId}`;
      
      // Node status
      const nodeStatus = document.createElement('span');
      nodeStatus.className = 'workflow-progress-node-status status-pending';
      nodeStatus.textContent = 'Pending';
      
      StyleUtils.applyStyles(nodeStatus, {
        fontSize: '0.8em',
        padding: '2px 6px',
        borderRadius: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      });
      
      // Add to list item
      listItem.appendChild(nodeName);
      listItem.appendChild(nodeStatus);
      
      // Add to list
      orderList.appendChild(listItem);
    });
  }
  
  /**
   * Add results section
   * 
   * @param {HTMLElement} container - Container element
   * @param {Object} nodeResults - Results by node ID
   */
  static addResultsSection(container, nodeResults) {
    if (!nodeResults || Object.keys(nodeResults).length === 0) return;
    
    // Check if section already exists
    let resultsSection = container.querySelector('.workflow-progress-results');
    
    if (!resultsSection) {
      // Create section
      resultsSection = document.createElement('div');
      resultsSection.className = 'workflow-progress-results';
      
      // Create section title
      const sectionTitle = document.createElement('h3');
      sectionTitle.textContent = 'Results:';
      sectionTitle.className = 'workflow-progress-section-title';
      
      StyleUtils.applyStyles(sectionTitle, {
        margin: '20px 0 10px 0',
        fontSize: '16px'
      });
      
      resultsSection.appendChild(sectionTitle);
      
      // Add to container
      container.appendChild(resultsSection);
    } else {
      // Clear existing results
      const existingResults = resultsSection.querySelectorAll('.workflow-progress-result-item');
      existingResults.forEach(item => item.remove());
    }
    
    // Add each result
    Object.entries(nodeResults).forEach(([nodeId, result]) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'workflow-progress-result-item';
      resultItem.setAttribute('data-node-id', nodeId);
      
      StyleUtils.applyStyles(resultItem, {
        margin: '10px 0',
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        border: result.startsWith('Error:') ? '1px solid rgba(255, 0, 0, 0.3)' : 'none'
      });
      
      // Result header
      const resultHeader = document.createElement('div');
      resultHeader.className = 'workflow-progress-result-header';
      resultHeader.textContent = `Node: ${nodeId}`;
      
      StyleUtils.applyStyles(resultHeader, {
        fontWeight: 'bold',
        marginBottom: '5px',
        color: result.startsWith('Error:') ? '#ff6b6b' : 'inherit'
      });
      
      // Result content
      const resultContent = document.createElement('div');
      resultContent.className = 'workflow-progress-result-content';
      
      if (result.startsWith('Error:')) {
        resultContent.classList.add('error-result');
        
        StyleUtils.applyStyles(resultContent, {
          color: '#ff6b6b',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '0.9em',
          padding: '5px',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderRadius: '3px',
          maxHeight: '200px',
          overflowY: 'auto'
        });
      } else {
        StyleUtils.applyStyles(resultContent, {
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '0.9em',
          padding: '5px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '3px',
          maxHeight: '200px',
          overflowY: 'auto'
        });
      }
      
      // Create custom scrollbar
      StyleUtils.createCustomScrollbar(resultContent);
      
      resultContent.textContent = result;
      
      // Add to result item
      resultItem.appendChild(resultHeader);
      resultItem.appendChild(resultContent);
      
      // Add to results section
      resultsSection.appendChild(resultItem);
      
      // Update node status in execution order
      WorkflowProgressTemplate.updateProgress(
        container,
        nodeId,
        result.startsWith('Error:') ? 'Error' : 'Completed'
      );
    });
  }
  
  /**
   * Add error section
   * 
   * @param {HTMLElement} container - Container element
   * @param {Error} error - Execution error
   */
  static addErrorSection(container, error) {
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'workflow-progress-error-container';
    
    StyleUtils.applyStyles(errorContainer, {
      margin: '15px 0',
      padding: '15px',
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      borderRadius: '4px',
      border: '1px solid rgba(255, 0, 0, 0.3)'
    });
    
    // Error title
    const errorTitle = document.createElement('h3');
    errorTitle.textContent = 'Error Executing Workflow';
    errorTitle.className = 'workflow-progress-error-title';
    
    StyleUtils.applyStyles(errorTitle, {
      margin: '0 0 10px 0',
      color: '#ff6b6b',
      fontSize: '16px'
    });
    
    // Error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'workflow-progress-error-message';
    errorMessage.textContent = error.message || 'An unknown error occurred';
    
    StyleUtils.applyStyles(errorMessage, {
      marginBottom: '10px',
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
      color: '#ff6b6b'
    });
    
    // Error stack if available
    if (error.stack) {
      const errorStack = document.createElement('div');
      errorStack.className = 'workflow-progress-error-stack';
      
      // Create expandable section
      const expandableSection = WorkflowProgressTemplate.createExpandableSection(
        'Error Details',
        error.stack
      );
      
      errorStack.appendChild(expandableSection);
      errorContainer.appendChild(errorStack);
    }
    
    // Add to error container
    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorMessage);
    
    // Add to main container
    container.appendChild(errorContainer);
  }
  
  /**
   * Create expandable section
   * 
   * @param {string} title - Section title
   * @param {string} content - Section content
   * @returns {HTMLElement} The created section
   */
  static createExpandableSection(title, content) {
    const section = document.createElement('div');
    section.className = 'workflow-progress-expandable-section';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'workflow-progress-expandable-header';
    header.textContent = title;
    
    StyleUtils.applyStyles(header, {
      padding: '5px 10px',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '3px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    });
    
    // Add expand/collapse icon
    const icon = document.createElement('span');
    icon.textContent = '+';
    icon.className = 'workflow-progress-expandable-icon';
    
    StyleUtils.applyStyles(icon, {
      fontWeight: 'bold',
      transition: 'transform 0.2s ease'
    });
    
    header.appendChild(icon);
    
    // Create content
    const contentElement = document.createElement('div');
    contentElement.className = 'workflow-progress-expandable-content';
    contentElement.textContent = content;
    
    StyleUtils.applyStyles(contentElement, {
      padding: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '0 0 3px 3px',
      display: 'none',
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace',
      fontSize: '0.9em',
      maxHeight: '200px',
      overflowY: 'auto'
    });
    
    // Create custom scrollbar
    StyleUtils.createCustomScrollbar(contentElement);
    
    // Add toggle functionality
    header.addEventListener('click', () => {
      const isExpanded = contentElement.style.display !== 'none';
      
      if (isExpanded) {
        contentElement.style.display = 'none';
        icon.textContent = '+';
        icon.style.transform = 'rotate(0deg)';
      } else {
        contentElement.style.display = 'block';
        icon.textContent = '-';
        icon.style.transform = 'rotate(90deg)';
      }
    });
    
    // Add to section
    section.appendChild(header);
    section.appendChild(contentElement);
    
    return section;
  }
  
  /**
   * Create loading spinner
   * 
   * @param {string} message - Loading message
   * @returns {HTMLElement} The created loading spinner
   */
  static createLoadingSpinner(message) {
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'workflow-progress-loading-container';
    
    StyleUtils.applyStyles(loadingContainer, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center'
    });
    
    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = 'workflow-progress-spinner';
    
    StyleUtils.applyStyles(spinner, {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(255, 255, 255, 0.1)',
      borderTopColor: '#3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    });
    
    // Add keyframes for spinner animation
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);
    
    // Create message
    const messageElement = document.createElement('div');
    messageElement.className = 'workflow-progress-loading-message';
    messageElement.textContent = message;
    
    StyleUtils.applyStyles(messageElement, {
      marginTop: '15px',
      color: 'rgba(255, 255, 255, 0.7)'
    });
    
    // Add to container
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(messageElement);
    
    return loadingContainer;
  }
}
