/**
 * ui/dialog/GraphSelectionDialog.js
 * 
 * Specialized dialog component for graph selection.
 */

import { DialogComponent } from './DialogComponent.js';
import { DOMHelper } from '../helpers/domHelpers.js';

export class GraphSelectionDialog extends DialogComponent {
  /**
   * @param {DialogManager} dialogManager - Parent dialog manager
   */
  constructor(dialogManager) {
    super(dialogManager);
  }
  
  /**
   * Show the graph selection dialog
   * 
   * @param {Array} graphs - Array of available graphs
   * @returns {HTMLElement} The dialog overlay element
   */
  show(graphs) {
    // Create dialog overlay
    const dialogOverlay = this.createDialogOverlay();
    
    // Create dialog content
    const dialog = this.createDialogContent();
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Select a Graph to Load';
    dialog.appendChild(title);
    
    // Create graph list
    const graphList = this.createGraphList(graphs, dialogOverlay);
    dialog.appendChild(graphList);
    
    // Add cancel button
    this.addCloseButton(dialog, () => {
      this.dialogManager.removeDialog(dialogOverlay);
    });
    
    // Add dialog to overlay
    dialogOverlay.appendChild(dialog);
    
    // Add to document
    document.body.appendChild(dialogOverlay);
    
    // Add escape key handler
    this.addEscapeKeyHandler(dialogOverlay);
    
    return dialogOverlay;
  }
  
  /**
   * Create the graph list container
   * 
   * @param {Array} graphs - Array of available graphs
   * @param {HTMLElement} dialogOverlay - The dialog overlay element
   * @returns {HTMLElement} The graph list container
   */
  createGraphList(graphs, dialogOverlay) {
    const graphList = document.createElement('div');
    graphList.className = 'graph-list';
    
    if (this.themeManager) {
      // Apply custom scrollbar with ThemeManager
      DOMHelper.createCustomScrollbar(graphList);
    } else {
      // Fallback inline styles
      graphList.style.maxHeight = '400px';
      graphList.style.overflowY = 'auto';
      graphList.style.margin = '10px 0';
    }
    
    // Add each graph as an item
    graphs.forEach(graph => {
      const graphItem = this.createGraphItem(graph, dialogOverlay);
      graphList.appendChild(graphItem);
    });
    
    return graphList;
  }
  
  /**
   * Create an individual graph item
   * 
   * @param {Object} graph - Graph data
   * @param {HTMLElement} dialogOverlay - The dialog overlay element
   * @returns {HTMLElement} The graph item element
   */
  createGraphItem(graph, dialogOverlay) {
    const graphItem = document.createElement('div');
    graphItem.className = 'graph-item';
    
    if (this.themeManager) {
      // Add theme class for consistent styling
      graphItem.classList.add('theme-list-item');
      
      // Apply hover effect using DOMHelper
      DOMHelper.applyHoverEffect(graphItem, {
        backgroundColor: this.themeManager.state?.isDarkTheme 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.05)',
        transform: 'translateY(-2px)'
      });
    } else {
      // Fallback inline styles
      Object.assign(graphItem.style, {
        padding: '10px',
        margin: '5px 0',
        border: '1px solid #ddd',
        borderRadius: '3px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      });
      
      // Hover effect
      graphItem.addEventListener('mouseenter', () => {
        graphItem.style.backgroundColor = '#f0f0f0';
      });
      
      graphItem.addEventListener('mouseleave', () => {
        graphItem.style.backgroundColor = '';
      });
    }
    
    // Set graph item content with safe HTML
    graphItem.innerHTML = `
      <strong>${this.escapeHtml(graph.name)}</strong>
      <div>${this.escapeHtml(graph.description || 'No description')}</div>
      <div class="graph-date">
        Created: ${new Date(graph.creation_date).toLocaleString()}
      </div>
    `;
    
    // Add click handler
    graphItem.addEventListener('click', async () => {
      try {
        // Show loading state
        graphItem.style.opacity = '0.7';
        graphItem.innerHTML += '<div class="loading-indicator">Loading...</div>';
        
        // Load the selected graph
        await this.uiManager.graphManager.loadGraphById(graph.id);
        
        // Show success notification
        this.uiManager.showNotification(`Graph "${graph.name}" loaded successfully`);
        
        // Remove dialog
        this.dialogManager.removeDialog(dialogOverlay);
      } catch (error) {
        // Show error in the dialog
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = `Error loading graph: ${error.message}`;
        
        if (!this.themeManager) {
          errorMsg.style.color = 'red';
          errorMsg.style.marginTop = '10px';
        }
        
        graphItem.appendChild(errorMsg);
        
        // Reset loading state
        graphItem.style.opacity = '1';
        const loadingIndicator = graphItem.querySelector('.loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
        
        // Log error with error handler
        this.uiManager.errorHandler.handleError(error, {
          context: 'Loading Graph',
          silent: true
        });
      }
    });
    
    return graphItem;
  }
}