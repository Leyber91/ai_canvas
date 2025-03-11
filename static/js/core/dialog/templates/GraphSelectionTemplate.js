/**
 * core/dialog/templates/GraphSelectionTemplate.js
 * 
 * Template for graph selection dialog
 * Displays list of graphs with selection capability
 */

import { FormatUtils } from '../../utils/FormatUtils.js';
import { StyleUtils } from '../../utils/StyleUtils.js';
import { AnimationUtils } from '../../utils/AnimationUtils.js';

export class GraphSelectionTemplate {
  /**
   * Render graph selection list
   * 
   * @param {Array} graphs - Array of graph objects
   * @param {Object} options - Template options
   * @returns {HTMLElement} The rendered content
   */
  static render(graphs = [], options = {}) {
    const {
      onSelect = null,
      onCreateNew = null,
      showSearch = true,
      showSort = true,
      showCreateButton = true,
      emptyMessage = 'No graphs available',
      selectedId = null,
      title = 'Select a Graph',
      listHeight = '400px',
      itemClass = '',
      listClass = '',
      searchPlaceholder = 'Search graphs...',
      createButtonText = 'Create New Graph',
      sortOptions = [
        { value: 'name', label: 'Name (A-Z)' },
        { value: 'name-desc', label: 'Name (Z-A)' },
        { value: 'date', label: 'Newest First' },
        { value: 'date-asc', label: 'Oldest First' }
      ]
    } = options;
    
    // Create container
    const container = document.createElement('div');
    container.className = 'graph-selection-dialog-content';
    
    // Add title if provided
    if (title) {
      const titleElement = document.createElement('h2');
      titleElement.textContent = title;
      titleElement.className = 'graph-selection-dialog-title';
      
      StyleUtils.applyStyles(titleElement, {
        margin: '0 0 15px 0',
        padding: '0 0 10px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      });
      
      container.appendChild(titleElement);
    }
    
    // Add search box if enabled
    if (showSearch) {
      GraphSelectionTemplate.createSearchBox(
        container,
        graphs,
        searchPlaceholder
      );
    }
    
    // Add sort options if enabled
    if (showSort) {
      GraphSelectionTemplate.createSortOptions(
        container,
        sortOptions
      );
    }
    
    // Create graph list
    const graphListContainer = document.createElement('div');
    graphListContainer.className = `graph-selection-list-container ${listClass}`;
    
    StyleUtils.applyStyles(graphListContainer, {
      maxHeight: listHeight,
      overflowY: 'auto',
      marginTop: '15px',
      marginBottom: '15px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '4px'
    });
    
    // Create custom scrollbar
    StyleUtils.createCustomScrollbar(graphListContainer);
    
    // Add graph items or empty message
    if (graphs && graphs.length > 0) {
      const graphList = document.createElement('div');
      graphList.className = 'graph-selection-list';
      graphList.setAttribute('role', 'listbox');
      graphList.setAttribute('aria-label', 'Available graphs');
      
      // Add each graph item
      graphs.forEach(graph => {
        const isSelected = selectedId && graph.id === selectedId;
        const graphItem = GraphSelectionTemplate.createGraphItem(
          graph,
          isSelected,
          onSelect,
          itemClass
        );
        graphList.appendChild(graphItem);
      });
      
      graphListContainer.appendChild(graphList);
    } else {
      // Show empty message
      const emptyContainer = document.createElement('div');
      emptyContainer.className = 'graph-selection-empty';
      emptyContainer.textContent = emptyMessage;
      
      StyleUtils.applyStyles(emptyContainer, {
        padding: '20px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.5)'
      });
      
      graphListContainer.appendChild(emptyContainer);
    }
    
    container.appendChild(graphListContainer);
    
    // Add create new graph button if enabled
    if (showCreateButton) {
      GraphSelectionTemplate.createNewGraphButton(
        container,
        onCreateNew,
        createButtonText
      );
    }
    
    return container;
  }
  
  /**
   * Create a graph item
   * 
   * @param {Object} graph - Graph data
   * @param {boolean} isSelected - Whether the item is selected
   * @param {Function} onSelect - Selection callback
   * @param {string} itemClass - Additional item class
   * @returns {HTMLElement} The created graph item
   */
  static createGraphItem(graph, isSelected, onSelect, itemClass) {
    const graphItem = document.createElement('div');
    graphItem.className = `graph-selection-item ${itemClass} ${isSelected ? 'selected' : ''}`;
    graphItem.setAttribute('role', 'option');
    graphItem.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    graphItem.setAttribute('data-graph-id', graph.id);
    graphItem.setAttribute('tabindex', '0');
    
    // Apply styles
    StyleUtils.applyStyles(graphItem, {
      padding: '15px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      position: 'relative'
    });
    
    // Apply hover effect
    StyleUtils.applyHoverEffect(graphItem, {
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    });
    
    // Add selected styles if selected
    if (isSelected) {
      StyleUtils.applyStyles(graphItem, {
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderLeft: '3px solid #3498db'
      });
    }
    
    // Create graph item content
    const graphName = document.createElement('div');
    graphName.className = 'graph-selection-item-name';
    graphName.textContent = graph.name || 'Untitled Graph';
    
    StyleUtils.applyStyles(graphName, {
      fontWeight: 'bold',
      marginBottom: '5px'
    });
    
    const graphDescription = document.createElement('div');
    graphDescription.className = 'graph-selection-item-description';
    graphDescription.textContent = graph.description || 'No description';
    
    StyleUtils.applyStyles(graphDescription, {
      fontSize: '0.9em',
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '5px'
    });
    
    const graphDate = document.createElement('div');
    graphDate.className = 'graph-selection-item-date';
    
    // Format date
    const dateText = graph.creation_date 
      ? FormatUtils.formatTimestamp(graph.creation_date)
      : 'Unknown date';
    
    graphDate.textContent = `Created: ${dateText}`;
    
    StyleUtils.applyStyles(graphDate, {
      fontSize: '0.8em',
      color: 'rgba(255, 255, 255, 0.5)'
    });
    
    // Add content to item
    graphItem.appendChild(graphName);
    graphItem.appendChild(graphDescription);
    graphItem.appendChild(graphDate);
    
    // Add node count if available
    if (graph.node_count !== undefined) {
      const graphStats = document.createElement('div');
      graphStats.className = 'graph-selection-item-stats';
      graphStats.textContent = `${graph.node_count} nodes`;
      
      if (graph.edge_count !== undefined) {
        graphStats.textContent += ` • ${graph.edge_count} edges`;
      }
      
      StyleUtils.applyStyles(graphStats, {
        fontSize: '0.8em',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: '5px'
      });
      
      graphItem.appendChild(graphStats);
    }
    
    // Add click handler
    graphItem.addEventListener('click', () => {
      GraphSelectionTemplate.handleSelect(graph, onSelect);
    });
    
    // Add keyboard handler for accessibility
    graphItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        GraphSelectionTemplate.handleSelect(graph, onSelect);
      }
    });
    
    return graphItem;
  }
  
  /**
   * Handle graph selection
   * 
   * @param {Object} graph - Selected graph
   * @param {Function} callback - Selection callback
   */
  static handleSelect(graph, callback) {
    if (typeof callback === 'function') {
      callback(graph);
    }
  }
  
  /**
   * Create search box
   * 
   * @param {HTMLElement} container - Container element
   * @param {Array} graphs - Array of graph objects
   * @param {string} placeholder - Search placeholder text
   * @returns {HTMLElement} The created search box
   */
  static createSearchBox(container, graphs, placeholder) {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'graph-selection-search-container';
    
    StyleUtils.applyStyles(searchContainer, {
      marginBottom: '15px',
      position: 'relative'
    });
    
    // Create search icon
    const searchIcon = document.createElement('div');
    searchIcon.className = 'graph-selection-search-icon';
    searchIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;
    
    StyleUtils.applyStyles(searchIcon, {
      position: 'absolute',
      left: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'rgba(255, 255, 255, 0.5)'
    });
    
    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = placeholder;
    searchInput.className = 'graph-selection-search-input';
    
    StyleUtils.applyStyles(searchInput, {
      width: '100%',
      padding: '10px 10px 10px 35px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      fontSize: '14px'
    });
    
    // Add search functionality
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const graphItems = container.querySelectorAll('.graph-selection-item');
      
      graphItems.forEach(item => {
        const graphId = item.getAttribute('data-graph-id');
        const graph = graphs.find(g => g.id === graphId);
        
        if (!graph) return;
        
        const nameMatch = graph.name && graph.name.toLowerCase().includes(searchTerm);
        const descMatch = graph.description && graph.description.toLowerCase().includes(searchTerm);
        
        if (nameMatch || descMatch) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
      
      // Show/hide empty message
      const visibleItems = Array.from(graphItems).filter(item => item.style.display !== 'none');
      const emptyMessage = container.querySelector('.graph-selection-empty');
      
      if (visibleItems.length === 0 && !emptyMessage) {
        const noResults = document.createElement('div');
        noResults.className = 'graph-selection-empty';
        noResults.textContent = `No graphs matching "${e.target.value}"`;
        
        StyleUtils.applyStyles(noResults, {
          padding: '20px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)'
        });
        
        const listContainer = container.querySelector('.graph-selection-list-container');
        
        if (listContainer) {
          // Clear list container
          listContainer.innerHTML = '';
          listContainer.appendChild(noResults);
        }
      } else if (visibleItems.length > 0 && emptyMessage) {
        emptyMessage.remove();
      }
    });
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    container.appendChild(searchContainer);
    
    return searchContainer;
  }
  
  /**
   * Create sort options
   * 
   * @param {HTMLElement} container - Container element
   * @param {Array} sortOptions - Sort options
   * @returns {HTMLElement} The created sort options
   */
  static createSortOptions(container, sortOptions) {
    const sortContainer = document.createElement('div');
    sortContainer.className = 'graph-selection-sort-container';
    
    StyleUtils.applyStyles(sortContainer, {
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center'
    });
    
    // Create sort label
    const sortLabel = document.createElement('label');
    sortLabel.textContent = 'Sort by:';
    sortLabel.htmlFor = 'graph-selection-sort';
    
    StyleUtils.applyStyles(sortLabel, {
      marginRight: '10px',
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)'
    });
    
    // Create sort select
    const sortSelect = document.createElement('select');
    sortSelect.id = 'graph-selection-sort';
    sortSelect.className = 'graph-selection-sort-select';
    
    StyleUtils.applyStyles(sortSelect, {
      padding: '5px 10px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      fontSize: '14px'
    });
    
    // Add sort options
    sortOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      sortSelect.appendChild(optionElement);
    });
    
    // Add sort functionality
    sortSelect.addEventListener('change', (e) => {
      const sortValue = e.target.value;
      const graphList = container.querySelector('.graph-selection-list');
      
      if (!graphList) return;
      
      const graphItems = Array.from(graphList.querySelectorAll('.graph-selection-item'));
      
      // Sort graph items
      graphItems.sort((a, b) => {
        const aId = a.getAttribute('data-graph-id');
        const bId = b.getAttribute('data-graph-id');
        
        const aGraph = graphs.find(g => g.id === aId);
        const bGraph = graphs.find(g => g.id === bId);
        
        if (!aGraph || !bGraph) return 0;
        
        switch (sortValue) {
          case 'name':
            return (aGraph.name || '').localeCompare(bGraph.name || '');
          case 'name-desc':
            return (bGraph.name || '').localeCompare(aGraph.name || '');
          case 'date':
            return new Date(bGraph.creation_date || 0) - new Date(aGraph.creation_date || 0);
          case 'date-asc':
            return new Date(aGraph.creation_date || 0) - new Date(bGraph.creation_date || 0);
          default:
            return 0;
        }
      });
      
      // Reorder graph items
      graphItems.forEach(item => {
        graphList.appendChild(item);
      });
    });
    
    sortContainer.appendChild(sortLabel);
    sortContainer.appendChild(sortSelect);
    container.appendChild(sortContainer);
    
    return sortContainer;
  }
  
  /**
   * Create new graph button
   * 
   * @param {HTMLElement} container - Container element
   * @param {Function} callback - Create callback
   * @param {string} buttonText - Button text
   * @returns {HTMLElement} The created button
   */
  static createNewGraphButton(container, callback, buttonText) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'graph-selection-create-container';
    
    StyleUtils.applyStyles(buttonContainer, {
      textAlign: 'center',
      marginTop: '20px'
    });
    
    const button = document.createElement('button');
    button.textContent = buttonText;
    button.className = 'graph-selection-create-button';
    
    StyleUtils.applyStyles(button, {
      padding: '10px 20px',
      backgroundColor: '#4caf50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background-color 0.2s ease'
    });
    
    // Add hover effect
    StyleUtils.applyHoverEffect(button, {
      backgroundColor: '#45a049'
    });
    
    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Create ripple effect
      AnimationUtils.createRippleEffect(e);
      
      if (typeof callback === 'function') {
        callback();
      }
    });
    
    buttonContainer.appendChild(button);
    container.appendChild(buttonContainer);
    
    return buttonContainer;
  }
}
