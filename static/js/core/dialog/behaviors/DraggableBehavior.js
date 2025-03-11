/**
 * core/dialog/behaviors/DraggableBehavior.js
 * 
 * Makes dialogs draggable within viewport
 */

export class DraggableBehavior {
  /**
   * Make a dialog draggable
   * 
   * @param {BaseDialog} dialog - Dialog instance
   * @param {HTMLElement|string} handle - Drag handle element or selector
   * @param {Object} options - Draggable options
   * @returns {Object} Behavior API
   */
  static makeDraggable(dialog, handle, options = {}) {
    if (!dialog || !dialog.getDialogElement()) {
      console.warn('Cannot make dialog draggable: Invalid dialog');
      return null;
    }
    
    const dialogElement = dialog.getDialogElement();
    
    // Get handle element
    let handleElement;
    
    if (typeof handle === 'string') {
      // Handle is a selector
      handleElement = dialogElement.querySelector(handle);
      
      if (!handleElement) {
        // If selector doesn't match, try to find element by class or ID
        if (handle.startsWith('.')) {
          handleElement = dialogElement.querySelector(`.${handle.substring(1)}`);
        } else if (handle.startsWith('#')) {
          handleElement = dialogElement.querySelector(`#${handle.substring(1)}`);
        }
      }
    } else if (handle instanceof HTMLElement) {
      // Handle is an element
      handleElement = handle;
    } else {
      // Default to dialog element itself or its header
      handleElement = dialogElement.querySelector('.dialog-title') || dialogElement;
    }
    
    if (!handleElement) {
      console.warn('Cannot make dialog draggable: Invalid handle');
      return null;
    }
    
    // Set cursor style on handle
    handleElement.style.cursor = 'move';
    
    // Add draggable class to dialog
    dialogElement.classList.add('draggable-dialog');
    
    // Set dialog to absolute positioning if not already
    if (getComputedStyle(dialogElement).position === 'static') {
      dialogElement.style.position = 'absolute';
    }
    
    // Initialize drag state
    const state = {
      isDragging: false,
      initialX: 0,
      initialY: 0,
      initialLeft: 0,
      initialTop: 0,
      constraints: options.constraints || null,
      boundingElement: options.boundingElement || window,
      dragStartThreshold: options.dragStartThreshold || 5,
      dragStarted: false,
      dragStartPosition: { x: 0, y: 0 },
      onDragStart: options.onDragStart || null,
      onDrag: options.onDrag || null,
      onDragEnd: options.onDragEnd || null
    };
    
    // Set up event handlers
    const dragStart = (e) => DraggableBehavior.dragStart(e, dialogElement, handleElement, state);
    const drag = (e) => DraggableBehavior.drag(e, dialogElement, state);
    const dragEnd = () => DraggableBehavior.dragEnd(dialogElement, state);
    
    // Add event listeners
    handleElement.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Set constraints
    if (!state.constraints) {
      state.constraints = DraggableBehavior.setConstraints(dialogElement, state.boundingElement);
    }
    
    // Store initial position
    DraggableBehavior.savePosition(dialogElement);
    
    // Return behavior API
    return {
      // Enable dragging
      enable: () => {
        handleElement.addEventListener('mousedown', dragStart);
        handleElement.style.cursor = 'move';
        dialogElement.classList.add('draggable-dialog');
      },
      
      // Disable dragging
      disable: () => {
        handleElement.removeEventListener('mousedown', dragStart);
        handleElement.style.cursor = '';
        dialogElement.classList.remove('draggable-dialog');
      },
      
      // Clean up resources
      destroy: () => {
        handleElement.removeEventListener('mousedown', dragStart);
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
        handleElement.style.cursor = '';
        dialogElement.classList.remove('draggable-dialog');
      },
      
      // Set new constraints
      setConstraints: (newConstraints) => {
        state.constraints = newConstraints || DraggableBehavior.setConstraints(dialogElement, state.boundingElement);
      },
      
      // Reset position to center
      resetPosition: () => {
        dialogElement.style.left = '50%';
        dialogElement.style.top = '50%';
        dialogElement.style.transform = 'translate(-50%, -50%)';
      },
      
      // Get current state
      getState: () => ({ ...state })
    };
  }
  
  /**
   * Handle drag start
   * 
   * @param {Event} e - Mouse event
   * @param {HTMLElement} dialogElement - Dialog element
   * @param {HTMLElement} handleElement - Handle element
   * @param {Object} state - Drag state
   */
  static dragStart(e, dialogElement, handleElement, state) {
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get computed style to handle any CSS transforms
    const computedStyle = window.getComputedStyle(dialogElement);
    const matrix = new DOMMatrix(computedStyle.transform);
    
    // Get current position
    const dialogRect = dialogElement.getBoundingClientRect();
    
    // Store initial position
    state.initialX = e.clientX;
    state.initialY = e.clientY;
    
    // Store initial dialog position
    state.initialLeft = dialogRect.left - matrix.e;
    state.initialTop = dialogRect.top - matrix.f;
    
    // Set dragging state
    state.isDragging = true;
    state.dragStarted = false;
    state.dragStartPosition = { x: e.clientX, y: e.clientY };
    
    // Add active class
    dialogElement.classList.add('dragging');
    
    // Call onDragStart callback if provided
    if (typeof state.onDragStart === 'function') {
      state.onDragStart(dialogElement, state);
    }
  }
  
  /**
   * Handle drag
   * 
   * @param {Event} e - Mouse event
   * @param {HTMLElement} dialogElement - Dialog element
   * @param {Object} state - Drag state
   */
  static drag(e, dialogElement, state) {
    if (!state.isDragging) return;
    
    e.preventDefault();
    
    // Check if we've exceeded the drag start threshold
    if (!state.dragStarted) {
      const dx = Math.abs(e.clientX - state.dragStartPosition.x);
      const dy = Math.abs(e.clientY - state.dragStartPosition.y);
      
      if (Math.sqrt(dx * dx + dy * dy) < state.dragStartThreshold) {
        return;
      }
      
      state.dragStarted = true;
    }
    
    // Calculate new position
    const dx = e.clientX - state.initialX;
    const dy = e.clientY - state.initialY;
    
    let newLeft = state.initialLeft + dx;
    let newTop = state.initialTop + dy;
    
    // Apply constraints if set
    if (state.constraints) {
      if (newLeft < state.constraints.minX) newLeft = state.constraints.minX;
      if (newLeft > state.constraints.maxX) newLeft = state.constraints.maxX;
      if (newTop < state.constraints.minY) newTop = state.constraints.minY;
      if (newTop > state.constraints.maxY) newTop = state.constraints.maxY;
    }
    
    // Update position
    dialogElement.style.left = `${newLeft}px`;
    dialogElement.style.top = `${newTop}px`;
    
    // Remove any transform that might interfere with positioning
    dialogElement.style.transform = 'none';
    
    // Call onDrag callback if provided
    if (typeof state.onDrag === 'function') {
      state.onDrag(dialogElement, { left: newLeft, top: newTop }, state);
    }
  }
  
  /**
   * Handle drag end
   * 
   * @param {HTMLElement} dialogElement - Dialog element
   * @param {Object} state - Drag state
   */
  static dragEnd(dialogElement, state) {
    if (!state.isDragging) return;
    
    // Reset dragging state
    state.isDragging = false;
    
    // Remove active class
    dialogElement.classList.remove('dragging');
    
    // Save new position
    DraggableBehavior.savePosition(dialogElement);
    
    // Call onDragEnd callback if provided
    if (typeof state.onDragEnd === 'function') {
      const rect = dialogElement.getBoundingClientRect();
      state.onDragEnd(dialogElement, { left: rect.left, top: rect.top }, state);
    }
  }
  
  /**
   * Set movement constraints
   * 
   * @param {HTMLElement} dialogElement - Dialog element
   * @param {HTMLElement|Window} boundingElement - Bounding element
   * @returns {Object} Constraints object
   */
  static setConstraints(dialogElement, boundingElement = window) {
    const dialogRect = dialogElement.getBoundingClientRect();
    let boundingRect;
    
    if (boundingElement === window) {
      boundingRect = {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
        width: window.innerWidth,
        height: window.innerHeight
      };
    } else {
      boundingRect = boundingElement.getBoundingClientRect();
    }
    
    // Calculate constraints
    return {
      minX: boundingRect.left,
      maxX: boundingRect.right - dialogRect.width,
      minY: boundingRect.top,
      maxY: boundingRect.bottom - dialogRect.height
    };
  }
  
  /**
   * Save dialog position
   * 
   * @param {HTMLElement} dialogElement - Dialog element
   */
  static savePosition(dialogElement) {
    const rect = dialogElement.getBoundingClientRect();
    
    dialogElement.dataset.lastX = rect.left;
    dialogElement.dataset.lastY = rect.top;
  }
  
  /**
   * Restore dialog position
   * 
   * @param {HTMLElement} dialogElement - Dialog element
   */
  static restorePosition(dialogElement) {
    const lastX = parseFloat(dialogElement.dataset.lastX);
    const lastY = parseFloat(dialogElement.dataset.lastY);
    
    if (!isNaN(lastX) && !isNaN(lastY)) {
      dialogElement.style.left = `${lastX}px`;
      dialogElement.style.top = `${lastY}px`;
      dialogElement.style.transform = 'none';
    }
  }
}
