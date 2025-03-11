/**
 * ui/theme/cytoscape/CytoscapeThemeManager.js
 * 
 * Manages Cytoscape graph styling and node animations
 */

export class CytoscapeThemeManager {
    /**
     * @param {Object} cy - Cytoscape instance
     * @param {ThemeManager} themeManager - Parent theme manager
     */
    constructor(cy, themeManager) {
      this.cy = cy;
      this.themeManager = themeManager;
      
      // Track style elements for cleanup
      this.styleElements = [];
    }
    
    /**
     * Apply Cytoscape theme styling
     */
    applyCytoscapeTheme() {
      if (!this.cy) {
        console.warn('Cytoscape instance not available for theme application');
        return;
      }
      
      // Define the style
      const spaceThemeStyle = [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(name)',
            'color': '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '14px',
            'width': '160px',
            'height': '80px',
            'shape': 'round-rectangle',
            'text-wrap': 'ellipsis',
            'text-max-width': '140px',
            'border-width': '2px',
            'border-color': '#ffffff',
            'border-opacity': 0.2,
            'text-outline-width': 2,
            'text-outline-color': 'data(color)',
            'text-outline-opacity': 1
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#4FD1C5',
            'target-arrow-color': '#4FD1C5',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.8,
            'target-arrow-shape': 'triangle-backcurve',
            'arrow-scale': 1.2,
            'line-style': 'solid'
          }
        },
        {
          selector: '.ollama-node',
          style: {
            'background-color': '#4d21b3',
            'border-width': 2,
            'border-color': '#7b2ffa',
          }
        },
        {
          selector: '.groq-node',
          style: {
            'background-color': '#2175b3',
            'border-width': 2,
            'border-color': '#2f8afa',
          }
        },
        {
          selector: '.selected',
          style: {
            'border-width': 3,
            'border-color': '#ffffff',
            'border-opacity': 0.8,
            'box-shadow': '0 0 15px #ffffff'
          }
        },
        {
          selector: '.hovered',
          style: {
            'border-width': 2,
            'border-color': '#4FD1C5',
            'border-opacity': 0.8
          }
        },
        {
          selector: '.executing',
          style: {
            'border-width': 3,
            'border-color': '#3498db',
            'border-opacity': 1
          }
        },
        {
          selector: '.completed',
          style: {
            'border-width': 3,
            'border-color': '#10B981',
            'border-opacity': 1
          }
        },
        {
          selector: '.error',
          style: {
            'border-width': 3,
            'border-color': '#ef4444',
            'border-opacity': 1
          }
        },
        {
          selector: 'edge.executing',
          style: {
            'line-color': '#3498db',
            'target-arrow-color': '#3498db',
            'width': 4
          }
        },
        {
          selector: 'edge.completed',
          style: {
            'line-color': '#10B981',
            'target-arrow-color': '#10B981',
            'width': 4
          }
        },
        {
          selector: 'edge.error',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'width': 4
          }
        },
        {
          selector: '.cycle',
          style: {
            'border-width': 3,
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'border-color': '#f59e0b',
            'border-opacity': 0.8
          }
        }
      ];
      
      try {
        // Apply the style
        this.cy.style(spaceThemeStyle);
        
        // Set up event handlers
        this.setupCytoscapeEventHandlers();
      } catch (error) {
        console.error('Error applying Cytoscape theme:', error);
      }
    }
    
    /**
     * Set up Cytoscape event handlers
     */
    setupCytoscapeEventHandlers() {
      if (!this.cy) {
        console.warn('Cannot set up Cytoscape event handlers: missing cy instance');
        return;
      }
      
      try {
        // Add node hover effect
        this.cy.on('mouseover', 'node', event => {
          try {
            const node = event.target;
            if (node && node.addClass) {
              node.addClass('hovered');
            
              // Show tooltip with node info if the node has data
              if (node.data && typeof node.data === 'function') {
                this.themeManager.showTooltip(
                  event.renderedPosition, 
                  this.themeManager.getNodeTooltipContent(node.data())
                );
              }
            }
          } catch (error) {
            console.warn('Error in node mouseover handler:', error);
          }
        });
        
        this.cy.on('mouseout', 'node', event => {
          try {
            const node = event.target;
            if (node && node.removeClass) {
              node.removeClass('hovered');
            }
            
            // Hide tooltip
            this.themeManager.hideTooltip();
          } catch (error) {
            console.warn('Error in node mouseout handler:', error);
          }
        });
        
        // Add node double-click to open chat
        this.cy.on('dblclick', 'node', event => {
          try {
            const node = event.target;
            if (node && node.id && typeof node.id === 'function') {
              const nodeId = node.id();
              const nodeName = node.data ? node.data('name') : nodeId;
              this.themeManager.showNodeChatDialog(nodeId, nodeName);
              event.preventDefault(); // Prevent default behavior
            }
          } catch (error) {
            console.warn('Error in node dblclick handler:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up Cytoscape event handlers:', error);
      }
    }
    
/**
 * Improved removeNodePulseAnimation method with better error handling
 * and Cytoscape compatibility checks
 * 
 * @param {Object} node - Cytoscape node
 */
removeNodePulseAnimation(node) {
  // Safety check for valid node
  if (!node || !node.length || typeof node.id !== 'function') {
    console.warn('Invalid node passed to removeNodePulseAnimation');
    return;
  }
  
  try {
    const nodeId = node.id();
    const styleId = `pulse-${nodeId}`;
    
    // Remove style element
    const styleEl = document.getElementById(styleId);
    if (styleEl) {
      styleEl.remove();
      
      // Remove from tracked elements
      const index = this.styleElements.indexOf(styleId);
      if (index > -1) {
        this.styleElements.splice(index, 1);
      }
    }
    
    // Remove animation style - using more compatible approach
    try {
      // First check if style method exists
      if (typeof node.style === 'function') {
        // Use style() with animation: undefined to remove it
        // This is more compatible than removeStyle
        node.style('animation', '');
      }
    } catch (removeStyleError) {
      console.warn(`Error removing style from node ${nodeId}:`, removeStyleError);
    }
  } catch (error) {
    console.error(`Error removing pulse animation:`, error);
  }
}

/**
 * Improved addNodePulseAnimation with proper Cytoscape style application
 * 
 * @param {Object} node - Cytoscape node
 */
addNodePulseAnimation(node) {
  // Safety check for valid node
  if (!node || !node.length || typeof node.id !== 'function') {
    console.warn('Invalid node passed to addNodePulseAnimation');
    return;
  }
  
  try {
    // First remove any existing animation
    this.removeNodePulseAnimation(node);
    
    // Create keyframe animation for this specific node
    const nodeId = node.id();
    const styleId = `pulse-${nodeId}`;
    
    // Check if style already exists
    if (document.getElementById(styleId)) {
      return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pulse-${nodeId} {
        0% { border-width: 2px; border-opacity: 0.2; }
        50% { border-width: 4px; border-opacity: 0.6; }
        100% { border-width: 2px; border-opacity: 0.2; }
      }
    `;
    
    document.head.appendChild(style);
    this.styleElements.push(styleId);
    
    // Apply individual styles instead of animation property
    // This is more compatible with Cytoscape
    if (typeof node.style === 'function') {
      node.style({
        'border-width': 2,
        'border-color': '#ffffff',
        'border-opacity': 0.2
      });
      
      // Add a CSS class for animation instead of directly setting animation property
      this.safelyAddClass(node, 'pulse-animated');
    }
  } catch (error) {
    console.error(`Error adding pulse animation to node:`, error);
  }
}

/**
 * Improved version to handle executing animation
 * 
 * @param {Object} node - Cytoscape node
 */
addNodeExecutingAnimation(node) {
  // Safety check for valid node
  if (!node || !node.length || typeof node.id !== 'function') {
    console.warn('Invalid node passed to addNodeExecutingAnimation');
    return;
  }
  
  try {
    // First remove any existing animations
    this.removeNodePulseAnimation(node);
    
    // Add executing class
    node.removeClass('completed error');
    node.addClass('executing');
    
    // Create keyframe animation for this specific node
    const nodeId = node.id();
    const styleId = `executing-${nodeId}`;
    
    // Check if style already exists
    if (document.getElementById(styleId)) {
      return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes executing-${nodeId} {
        0% { border-width: 2px; border-opacity: 0.8; }
        50% { border-width: 5px; border-opacity: 1; }
        100% { border-width: 2px; border-opacity: 0.8; }
      }
      
      #${nodeId}.executing {
        animation: executing-${nodeId} 1s infinite;
      }
    `;
    
    document.head.appendChild(style);
    this.styleElements.push(styleId);
    
    // Apply styles separately instead of as one style object
    node.style('border-width', 2);
    node.style('border-color', '#3498db');
    node.style('border-opacity', 0.8);
  } catch (error) {
    console.error(`Error adding executing animation to node:`, error);
  }
}

/**
 * Improved version with better error handling
 * 
 * @param {Object} node - Cytoscape node
 */
removeNodeExecutingAnimation(node) {
  // Safety check for valid node
  if (!node || !node.length || typeof node.id !== 'function') {
    console.warn('Invalid node passed to removeNodeExecutingAnimation');
    return;
  }
  
  try {
    const nodeId = node.id();
    const styleId = `executing-${nodeId}`;
    
    // Remove style element
    const styleEl = document.getElementById(styleId);
    if (styleEl) {
      styleEl.remove();
      
      // Remove from tracked elements
      const index = this.styleElements.indexOf(styleId);
      if (index > -1) {
        this.styleElements.splice(index, 1);
      }
    }
    
    // Remove animation via class removal rather than style removal
    node.removeClass('executing');
    
    // Reset border styles
    if (typeof node.style === 'function') {
      node.style('border-width', 2);
      node.style('border-color', '#ffffff');
      node.style('border-opacity', 0.2);
    }
  } catch (error) {
    console.error(`Error removing executing animation:`, error);
  }
}
    /**
     * Apply class to node with safety checks
     * 
     * @param {Object} node - Cytoscape node
     * @param {string} className - CSS class to add
     * @returns {boolean} Success
     */
    safelyAddClass(node, className) {
      if (!node || !node.length || typeof node.addClass !== 'function') {
        return false;
      }
      
      try {
        node.addClass(className);
        return true;
      } catch (error) {
        console.warn(`Error adding class ${className} to node:`, error);
        return false;
      }
    }
    
    /**
     * Remove class from node with safety checks
     * 
     * @param {Object} node - Cytoscape node
     * @param {string} className - CSS class to remove
     * @returns {boolean} Success
     */
    safelyRemoveClass(node, className) {
      if (!node || !node.length || typeof node.removeClass !== 'function') {
        return false;
      }
      
      try {
        node.removeClass(className);
        return true;
      } catch (error) {
        console.warn(`Error removing class ${className} from node:`, error);
        return false;
      }
    }
    
    /**
     * Mark node as completed with safety checks
     * 
     * @param {string} nodeId - ID of the node to mark
     */
    markNodeCompleted(nodeId) {
      if (!this.cy || !nodeId) {
        return;
      }
      
      try {
        const node = this.cy.$(`#${nodeId}`);
        if (node && node.length > 0) {
          this.removeNodeExecutingAnimation(node);
          this.safelyAddClass(node, 'completed');
        }
      } catch (error) {
        console.warn(`Error marking node ${nodeId} as completed:`, error);
      }
    }
    
    /**
     * Mark node as error with safety checks
     * 
     * @param {string} nodeId - ID of the node to mark
     */
    markNodeError(nodeId) {
      if (!this.cy || !nodeId) {
        return;
      }
      
      try {
        const node = this.cy.$(`#${nodeId}`);
        if (node && node.length > 0) {
          this.removeNodeExecutingAnimation(node);
          this.safelyAddClass(node, 'error');
        }
      } catch (error) {
        console.warn(`Error marking node ${nodeId} as error:`, error);
      }
    }
    
    /**
     * Check if node exists in the graph
     * 
     * @param {string} nodeId - Node ID to check
     * @returns {boolean} True if node exists
     */
    nodeExists(nodeId) {
      if (!this.cy || !nodeId) {
        return false;
      }
      
      try {
        const node = this.cy.$(`#${nodeId}`);
        return node && node.length > 0;
      } catch (error) {
        console.warn(`Error checking if node ${nodeId} exists:`, error);
        return false;
      }
    }
    
    /**
     * Clean up resources on destroy
     */
    destroy() {
      // Remove all created style elements
      this.styleElements.forEach(styleId => {
        const styleEl = document.getElementById(styleId);
        if (styleEl) {
          styleEl.remove();
        }
      });
      
      // Clear array
      this.styleElements = [];
      
      // Remove event listeners
      if (this.cy) {
        try {
          this.cy.off('mouseover', 'node');
          this.cy.off('mouseout', 'node');
          this.cy.off('dblclick', 'node');
        } catch (error) {
          console.warn('Error removing Cytoscape event listeners:', error);
        }
      }
    }
  }