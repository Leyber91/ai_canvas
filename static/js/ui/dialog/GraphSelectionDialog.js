/**
 * ui/dialog/GraphSelectionDialog.js
 * 
 * Extends DialogComponent for backward compatibility
 * Uses new GraphSelectionTemplate internally
 */

import { DialogComponent } from './DialogComponent.js';
import { GraphSelectionTemplate } from '../../core/dialog/templates/GraphSelectionTemplate.js';

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
   * @param {Function} onSelect - Callback when a graph is selected
   * @param {Object} options - Additional options
   * @returns {BaseDialog} The dialog instance
   */
  show(graphs, onSelect = null, options = {}) {
    // Default onSelect handler if not provided
    const handleSelect = onSelect || this._createDefaultSelectHandler();
    
    // Create options for the template
    const templateOptions = {
      onSelect: handleSelect,
      onCreateNew: options.onCreateNew || null,
      showSearch: options.showSearch !== false,
      showSort: options.showSort !== false,
      showCreateButton: options.showCreateButton !== false,
      emptyMessage: options.emptyMessage || 'No graphs available',
      selectedId: options.selectedId || null,
      title: options.title || 'Select a Graph',
      listHeight: options.listHeight || '400px',
      itemClass: options.itemClass || '',
      listClass: options.listClass || '',
      searchPlaceholder: options.searchPlaceholder || 'Search graphs...',
      createButtonText: options.createButtonText || 'Create New Graph',
      sortOptions: options.sortOptions || [
        { value: 'name', label: 'Name (A-Z)' },
        { value: 'name-desc', label: 'Name (Z-A)' },
        { value: 'date', label: 'Newest First' },
        { value: 'date-asc', label: 'Oldest First' }
      ]
    };
    
    // Create content using the template
    const content = GraphSelectionTemplate.render(graphs, templateOptions);
    
    // Show dialog with the content
    return super.show({
      title: options.dialogTitle || 'Select a Graph',
      content,
      closeOnEscape: options.closeOnEscape !== false,
      closeOnOverlayClick: options.closeOnOverlayClick !== false,
      showCloseButton: options.showCloseButton !== false,
      width: options.width || '600px',
      height: options.height || 'auto',
      className: options.className || 'graph-selection-dialog'
    });
  }
  
  /**
   * Create default select handler
   * 
   * @returns {Function} Default select handler
   * @private
   */
  _createDefaultSelectHandler() {
    return async (graph) => {
      try {
        // Show loading state
        const graphItem = document.querySelector(`[data-graph-id="${graph.id}"]`);
        if (graphItem) {
          graphItem.classList.add('loading');
        }
        
        // Load the selected graph
        await this.uiManager.graphManager.loadGraphById(graph.id);
        
        // Show success notification
        this.uiManager.showNotification(`Graph "${graph.name}" loaded successfully`);
        
        // Hide dialog
        this.hide();
      } catch (error) {
        // Show error
        const graphItem = document.querySelector(`[data-graph-id="${graph.id}"]`);
        if (graphItem) {
          graphItem.classList.remove('loading');
          
          const errorMsg = document.createElement('div');
          errorMsg.className = 'error-message';
          errorMsg.textContent = `Error loading graph: ${error.message}`;
          graphItem.appendChild(errorMsg);
        }
        
        // Log error with error handler
        this.uiManager.errorHandler.handleError(error, {
          context: 'Loading Graph',
          silent: true
        });
      }
    };
  }
  
  /**
   * Update graph list
   * 
   * @param {Array} graphs - New graphs array
   */
  updateGraphList(graphs) {
    if (this.dialog) {
      const content = GraphSelectionTemplate.render(graphs, {
        onSelect: this._createDefaultSelectHandler()
      });
      
      this.dialog.setContent(content);
    }
  }
  
  /**
   * Set selection callback
   * 
   * @param {Function} callback - Selection callback
   */
  setOnSelectCallback(callback) {
    if (this.dialog && typeof callback === 'function') {
      const items = this.dialog.getContentElement().querySelectorAll('.graph-selection-item');
      
      items.forEach(item => {
        const graphId = item.getAttribute('data-graph-id');
        const graph = this.uiManager.graphManager.getGraphById(graphId);
        
        // Remove existing click listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add new click listener
        newItem.addEventListener('click', () => {
          callback(graph);
        });
      });
    }
  }
}
