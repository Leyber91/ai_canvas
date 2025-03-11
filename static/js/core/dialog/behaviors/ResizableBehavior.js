/**
 * core/dialog/behaviors/ResizableBehavior.js
 * 
 * Makes dialogs resizable within constraints
 */

export class ResizableBehavior {
  /**
   * Make a dialog resizable
   * 
   * @param {BaseDialog} dialog - Dialog instance
   * @param {Object} options - Resizable options
   * @returns {Object} Behavior API
   */
  static makeResizable(dialog, options = {}) {
    if (!dialog || !dialog.getDialogElement()) {
      console.warn('Cannot make dialog resizable: Invalid dialog');
      return null;
    }
    
    const dialogElement = dialog.getDialogElement();
    
    // Add resizable class to dialog
    dialogElement.classList.add('resizable-dialog');
    
    // Set dialog to absolute positioning if not already
    if (getComputedStyle(dialogElement).position === 'static') {
      dialogElement.style.position = 'absolute';
    }
    
    // Initialize resize state
    const state = {
      isResizing: false,
      initialWidth: 0,
      initialHeight: 0,
      initialX: 0,
      initialY: 0,
      direction: '',
      minWidth: options.minWidth || 200,
      minHeight: options.minHeight || 100,
      maxWidth: options.maxWidth || window.innerWidth * 0.9,
      maxHeight: options.maxHeight || window.innerHeight * 0.9,
      handles: options.handles || ['se', 'e', 's'],
      aspectRatio: options.aspectRatio || null,
      onResizeStart: options.onResizeStart || null,
      onResize: options.onResize || null,
      onResizeEnd: options.onResizeEnd || null,
      handleSize: options.handleSize || 10
    };
    
    // Add resize handles
    const handles = ResizableBehavior.addResizeHandles(dialogElement, state);
    
    // Store initial size
    ResizableBehavior.saveSize(dialogElement);
    
    // Return behavior API
    return {
      // Enable resizing
      enable: () => {
        handles.forEach(handle => {
          handle.style.display = 'block';
        });
        dialogElement.classList.add('resizable-dialog');
      },
      
      // Disable resizing
      disable: () => {
        handles.forEach(handle => {
          handle.style.display = 'none';
        });
        dialogElement.classList.remove('resizable-dialog');
      },
      
      // Clean up resources
      destroy: () => {
        handles.forEach(handle => {
          if (dialogElement.contains(handle)) {
            dialogElement.removeChild(handle);
          }
        });
        dialogElement.classList.remove('resizable-dialog');
      },
      
      // Set minimum size
      setMinSize: (width, height) => {
        state.minWidth = width || state.minWidth;
        state.minHeight = height || state.minHeight;
      },
      
      // Set maximum size
      setMaxSize: (width, height) => {
        state.maxWidth = width || state.maxWidth;
        state.maxHeight = height || state.maxHeight;
      },
      
      // Reset size to original
      resetSize: () => {
        ResizableBehavior.restoreSize(dialogElement);
      },
      
      // Get current state
      getState: () => ({ ...state })
    };
  }
  
  /**
   * Add resize handles to dialog
   * 
   * @param {HTMLElement} dialogElement - Dialog element
   * @param {Object} state - Resize state
   * @returns {Array<HTMLElement>} Created handle elements
   */
  static addResizeHandles(dialogElement, state) {
    const handles = [];
    
    // Create handles for each direction
    state.handles.forEach(direction => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${direction}`;
      handle.dataset.direction = direction;
      
      // Style the handle
      Object.assign(handle.style, {
        position: 'absolute',
        width: `${state.handleSize}px`,
        height: `${state.handleSize}px`,
        backgroundColor: 'transparent',
        zIndex: '10'
      });
      
      // Position the handle based on direction
      switch (direction) {
        case 'e': // East (right)
          Object.assign(handle.style, {
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'ew-resize',
            width: `${state.handleSize}px`,
            height: '100%'
          });
          break;
        case 's': // South (bottom)
          Object.assign(handle.style, {
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'ns-resize',
            width: '100%',
            height: `${state.handleSize}px`
          });
          break;
        case 'se': // Southeast (bottom-right)
          Object.assign(handle.style, {
            bottom: '0',
            right: '0',
            cursor: 'nwse-resize'
          });
          break;
        case 'sw': // Southwest (bottom-left)
          Object.assign(handle.style, {
            bottom: '0',
            left: '0',
            cursor: 'nesw-resize'
          });
          break;
        case 'ne': // Northeast (top-right)
          Object.assign(handle.style, {
            top: '0',
            right: '0',
            cursor: 'nesw-resize'
          });
          break;
        case 'nw': // Northwest (top-left)
          Object.assign(handle.style, {
            top: '0',
            left: '0',
            cursor: 'nwse-resize'
          });
          break;
        case 'n': // North (top)
          Object.assign(handle.style, {
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'ns-resize',
            width: '100%',
            height: `${state.handleSize}px`
          });
          break;
        case 'w': // West (left)
          Object.assign(handle.style, {
            left: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'ew-resize',
            width: `${state.handleSize}px`,
            height: '100%'
          });
          break;
      }
      
      // Add mousedown event listener
      handle.addEventListener('mousedown', (e) => {
        ResizableBehavior.handleResizeStart(e, dialogElement, direction, state);
      });
      
      // Add handle to dialog
      dialogElement.appendChild(handle);
      handles.push(handle);
    });
    
    // Add mousemove and mouseup event listeners to document
    document.addEventListener('mousemove', (e) => {
      ResizableBehavior.handleResize(e, dialogElement, state);
    });
    
    document.addEventListener('mouseup', () => {
      ResizableBehavior.handleResizeEnd(dialogElement, state);
    });
    
    return handles;
  }
  
  /**
   * Handle resize start
   * 
   * @param {Event} e - Mouse event
   * @param {HTMLElement} dialogElement - Dialog element
   * @param {string} direction - Resize direction
   * @param {Object} state - Resize state
   */
  static handleResizeStart(e, dialogElement, direction, state) {
    e.preventDefault();
    e.stopPropagation();
    
    // Get current size and position
    const rect = dialogElement.getBoundingClientRect();
    
    // Store initial values
    state.initialWidth = rect.width;
    state.initialHeight = rect.height;
    state.initialX = e.clientX;
    state.initialY = e.clientY;
    state.direction = direction;
    state.isResizing = true;
    
    // Add resizing class
    dialogElement.classList.add('resizing');
    
    // Call onResizeStart callback if provided
    if (typeof state.onResizeStart === 'function') {
      state.onResizeStart(dialogElement, {
        width: rect.width,
        height: rect.height,
        direction
      });
    }
  }
  
  /**
   * Handle resize
   * 
   * @param {Event} e - Mouse event
   * @param {HTMLElement} dialogElement - Dialog element
   * @param {Object} state - Resize state
   */
  static handleResize(e, dialogElement, state) {
    if (!state.isResizing) return;
    
    e.preventDefault();
    
    // Calculate deltas
    const dx = e.clientX - state.initialX;
    const dy = e.clientY - state.initialY;
    
    // Calculate new dimensions based on direction
    let newWidth = state.initialWidth;
    let newHeight = state.initialHeight;
    
    // Update width based on horizontal direction
    if (state.direction.includes('e')) {
      newWidth = state.initialWidth + dx;
    } else if (state.direction.includes('w')) {
      newWidth = state.initialWidth - dx;
    }
    
    // Update height based on vertical direction
    if (state.direction.includes('s')) {
      newHeight = state.initialHeight + dy;
    } else if (state.direction.includes('n')) {
      newHeight = state.initialHeight - dy;
    }
    
    // Apply aspect ratio if needed
    if (state.aspectRatio) {
      if (state.direction.includes('e') || state.direction.includes('w')) {
        newHeight = newWidth / state.aspectRatio;
      } else if (state.direction.includes('s') || state.direction.includes('n')) {
        newWidth = newHeight * state.aspectRatio;
      }
    }
    
    // Apply constraints
    newWidth = Math.max(state.minWidth, Math.min(newWidth, state.maxWidth));
    newHeight = Math.max(state.minHeight, Math.min(newHeight, state.maxHeight));
    
    // Apply new dimensions
    dialogElement.style.width = `${newWidth}px`;
    dialogElement.style.height = `${newHeight}px`;
    
    // Handle position for n and w directions
    if (state.direction.includes('w')) {
      const widthDiff = state.initialWidth - newWidth;
      dialogElement.style.left = `${dialogElement.offsetLeft + widthDiff}px`;
    }
    
    if (state.direction.includes('n')) {
      const heightDiff = state.initialHeight - newHeight;
      dialogElement.style.top = `${dialogElement.offsetTop + heightDiff}px`;
    }
    
    // Call onResize callback if provided
    if (typeof state.onResize === 'function') {
      state.onResize(dialogElement, {
        width: newWidth,
        height: newHeight,
        direction: state.direction
      });
    }
  }
  
  /**
   * Handle resize end
   * 
   * @param {HTMLElement} dialogElement - Dialog element
   * @param {Object} state - Resize state
   */
  static handleResizeEnd(dialogElement, state) {
    if (!state.isResizing) return;
    
    // Reset resizing state
    state.isResizing = false;
    state.direction = '';
    
    // Remove resizing class
    dialogElement.classList.remove('resizing');
    
    // Save new size
    ResizableBehavior.saveSize(dialogElement);
    
    // Call onResizeEnd callback if provided
    if (typeof state.onResizeEnd === 'function') {
      const rect = dialogElement.getBoundingClientRect();
      state.onResizeEnd(dialogElement, {
        width: rect.width,
        height: rect.height
      });
    }
  }
  
  /**
   * Save dialog size
   * 
   * @param {HTMLElement} dialogElement - Dialog element
   */
  static saveSize(dialogElement) {
    const rect = dialogElement.getBoundingClientRect();
    
    dialogElement.dataset.lastWidth = rect.width;
    dialogElement.dataset.lastHeight = rect.height;
  }
  
  /**
   * Restore dialog size
   * 
   * @param {HTMLElement} dialogElement - Dialog element
   */
  static restoreSize(dialogElement) {
    const lastWidth = parseFloat(dialogElement.dataset.lastWidth);
    const lastHeight = parseFloat(dialogElement.dataset.lastHeight);
    
    if (!isNaN(lastWidth) && !isNaN(lastHeight)) {
      dialogElement.style.width = `${lastWidth}px`;
      dialogElement.style.height = `${lastHeight}px`;
    }
  }
}
