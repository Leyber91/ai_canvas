/**
 * core/panel/DraggablePanelManager.js
 * 
 * Manages draggable panels in the application
 * Allows panels to be moved, resized, and positioned
 */

export class DraggablePanelManager {
  /**
   * Create a new DraggablePanelManager
   * 
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element for panels
   * @param {Function} options.onPositionChange - Callback when panel position changes
   * @param {Function} options.onResize - Callback when panel is resized
   */
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onPositionChange = options.onPositionChange || (() => {});
    this.onResize = options.onResize || (() => {});
    
    this.panels = new Map();
    this.activePanel = null;
    this.initialX = 0;
    this.initialY = 0;
    this.initialLeft = 0;
    this.initialTop = 0;
    
    // Bind methods
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the manager
   */
  initialize() {
    // Add global event listeners
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchend', this.handleTouchEnd);
  }
  
  /**
   * Create a draggable panel
   * 
   * @param {Object} options - Panel options
   * @param {string} options.id - Unique panel ID
   * @param {string} options.title - Panel title
   * @param {HTMLElement} options.content - Panel content element
   * @param {Object} options.position - Initial position {x, y}
   * @param {Object} options.size - Initial size {width, height}
   * @param {boolean} options.resizable - Whether panel is resizable
   * @param {boolean} options.minimizable - Whether panel can be minimized
   * @param {boolean} options.maximizable - Whether panel can be maximized
   * @param {boolean} options.closable - Whether panel can be closed
   * @returns {HTMLElement} The created panel element
   */
  createPanel(options) {
    const {
      id,
      title = 'Panel',
      content,
      position = { x: 100, y: 100 },
      size = { width: 300, height: 400 },
      resizable = true,
      minimizable = true,
      maximizable = true,
      closable = true
    } = options;
    
    // Create panel element
    const panel = document.createElement('div');
    panel.id = id;
    panel.className = 'draggable-panel';
    panel.style.left = `${position.x}px`;
    panel.style.top = `${position.y}px`;
    panel.style.width = `${size.width}px`;
    panel.style.height = `${size.height}px`;
    
    if (!resizable) {
      panel.style.resize = 'none';
    }
    
    // Create panel header
    const header = document.createElement('div');
    header.className = 'draggable-panel-header';
    
    const titleElement = document.createElement('div');
    titleElement.className = 'draggable-panel-title';
    titleElement.textContent = title;
    
    const controls = document.createElement('div');
    controls.className = 'draggable-panel-controls';
    
    if (minimizable) {
      const minimizeButton = document.createElement('button');
      minimizeButton.className = 'panel-control-button minimize-button';
      minimizeButton.innerHTML = '&#8211;';
      minimizeButton.title = 'Minimize';
      minimizeButton.addEventListener('click', () => this.minimizePanel(id));
      controls.appendChild(minimizeButton);
    }
    
    if (maximizable) {
      const maximizeButton = document.createElement('button');
      maximizeButton.className = 'panel-control-button maximize-button';
      maximizeButton.innerHTML = '&#9744;';
      maximizeButton.title = 'Maximize';
      maximizeButton.addEventListener('click', () => this.maximizePanel(id));
      controls.appendChild(maximizeButton);
    }
    
    if (closable) {
      const closeButton = document.createElement('button');
      closeButton.className = 'panel-control-button close-button';
      closeButton.innerHTML = '&#10005;';
      closeButton.title = 'Close';
      closeButton.addEventListener('click', () => this.closePanel(id));
      controls.appendChild(closeButton);
    }
    
    header.appendChild(titleElement);
    header.appendChild(controls);
    
    // Create panel content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'draggable-panel-content';
    
    if (content) {
      if (typeof content === 'string') {
        contentContainer.innerHTML = content;
      } else {
        contentContainer.appendChild(content);
      }
    }
    
    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(contentContainer);
    
    // Add event listeners for dragging
    header.addEventListener('mousedown', (e) => this.handleMouseDown(e, panel));
    header.addEventListener('touchstart', (e) => this.handleTouchStart(e, panel));
    
    // Add to container
    this.container.appendChild(panel);
    
    // Store panel reference
    this.panels.set(id, {
      element: panel,
      header,
      contentContainer,
      state: {
        isMinimized: false,
        isMaximized: false,
        originalSize: { ...size },
        originalPosition: { ...position }
      }
    });
    
    return panel;
  }
  
  /**
   * Handle mouse down event to start dragging
   * 
   * @param {MouseEvent} e - Mouse event
   * @param {HTMLElement} panel - Panel element
   */
  handleMouseDown(e, panel) {
    if (e.target.closest('.panel-control-button')) {
      return;
    }
    
    e.preventDefault();
    
    this.activePanel = panel;
    this.initialX = e.clientX;
    this.initialY = e.clientY;
    this.initialLeft = parseInt(panel.style.left) || 0;
    this.initialTop = parseInt(panel.style.top) || 0;
    
    document.addEventListener('mousemove', this.handleMouseMove);
  }
  
  /**
   * Handle mouse move event during dragging
   * 
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    if (!this.activePanel) return;
    
    e.preventDefault();
    
    const dx = e.clientX - this.initialX;
    const dy = e.clientY - this.initialY;
    
    const newLeft = this.initialLeft + dx;
    const newTop = this.initialTop + dy;
    
    this.activePanel.style.left = `${newLeft}px`;
    this.activePanel.style.top = `${newTop}px`;
    
    // Call position change callback
    this.onPositionChange({
      id: this.activePanel.id,
      position: { x: newLeft, y: newTop }
    });
  }
  
  /**
   * Handle mouse up event to stop dragging
   */
  handleMouseUp() {
    if (!this.activePanel) return;
    
    document.removeEventListener('mousemove', this.handleMouseMove);
    this.activePanel = null;
  }
  
  /**
   * Handle touch start event to start dragging on touch devices
   * 
   * @param {TouchEvent} e - Touch event
   * @param {HTMLElement} panel - Panel element
   */
  handleTouchStart(e, panel) {
    if (e.target.closest('.panel-control-button')) {
      return;
    }
    
    const touch = e.touches[0];
    
    this.activePanel = panel;
    this.initialX = touch.clientX;
    this.initialY = touch.clientY;
    this.initialLeft = parseInt(panel.style.left) || 0;
    this.initialTop = parseInt(panel.style.top) || 0;
    
    document.addEventListener('touchmove', this.handleTouchMove);
  }
  
  /**
   * Handle touch move event during dragging on touch devices
   * 
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (!this.activePanel) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    
    const dx = touch.clientX - this.initialX;
    const dy = touch.clientY - this.initialY;
    
    const newLeft = this.initialLeft + dx;
    const newTop = this.initialTop + dy;
    
    this.activePanel.style.left = `${newLeft}px`;
    this.activePanel.style.top = `${newTop}px`;
    
    // Call position change callback
    this.onPositionChange({
      id: this.activePanel.id,
      position: { x: newLeft, y: newTop }
    });
  }
  
  /**
   * Handle touch end event to stop dragging on touch devices
   */
  handleTouchEnd() {
    if (!this.activePanel) return;
    
    document.removeEventListener('touchmove', this.handleTouchMove);
    this.activePanel = null;
  }
  
  /**
   * Minimize a panel
   * 
   * @param {string} id - Panel ID
   */
  minimizePanel(id) {
    const panel = this.panels.get(id);
    if (!panel) return;
    
    const { element, state } = panel;
    
    if (state.isMinimized) {
      // Restore from minimized state
      element.style.height = `${state.originalSize.height}px`;
      element.querySelector('.draggable-panel-content').style.display = 'block';
      element.querySelector('.minimize-button').innerHTML = '&#8211;';
      state.isMinimized = false;
    } else {
      // Minimize
      state.originalSize.height = parseInt(element.style.height);
      element.style.height = 'auto';
      element.querySelector('.draggable-panel-content').style.display = 'none';
      element.querySelector('.minimize-button').innerHTML = '&#9744;';
      state.isMinimized = true;
    }
    
    // Call resize callback
    this.onResize({
      id,
      size: {
        width: parseInt(element.style.width),
        height: parseInt(element.style.height)
      }
    });
  }
  
  /**
   * Maximize a panel
   * 
   * @param {string} id - Panel ID
   */
  maximizePanel(id) {
    const panel = this.panels.get(id);
    if (!panel) return;
    
    const { element, state } = panel;
    
    if (state.isMaximized) {
      // Restore from maximized state
      element.style.left = `${state.originalPosition.x}px`;
      element.style.top = `${state.originalPosition.y}px`;
      element.style.width = `${state.originalSize.width}px`;
      element.style.height = `${state.originalSize.height}px`;
      element.querySelector('.maximize-button').innerHTML = '&#9744;';
      state.isMaximized = false;
    } else {
      // Save current position and size
      state.originalPosition = {
        x: parseInt(element.style.left),
        y: parseInt(element.style.top)
      };
      state.originalSize = {
        width: parseInt(element.style.width),
        height: parseInt(element.style.height)
      };
      
      // Maximize
      element.style.left = '0';
      element.style.top = '0';
      element.style.width = '100%';
      element.style.height = '100%';
      element.querySelector('.maximize-button').innerHTML = '&#9635;';
      state.isMaximized = true;
    }
    
    // Call resize callback
    this.onResize({
      id,
      size: {
        width: parseInt(element.style.width),
        height: parseInt(element.style.height)
      }
    });
  }
  
  /**
   * Close a panel
   * 
   * @param {string} id - Panel ID
   */
  closePanel(id) {
    const panel = this.panels.get(id);
    if (!panel) return;
    
    panel.element.remove();
    this.panels.delete(id);
  }
  
  /**
   * Get a panel by ID
   * 
   * @param {string} id - Panel ID
   * @returns {Object|null} Panel object or null if not found
   */
  getPanel(id) {
    return this.panels.get(id) || null;
  }
  
  /**
   * Set panel position
   * 
   * @param {string} id - Panel ID
   * @param {Object} position - Position {x, y}
   */
  setPanelPosition(id, position) {
    const panel = this.panels.get(id);
    if (!panel) return;
    
    panel.element.style.left = `${position.x}px`;
    panel.element.style.top = `${position.y}px`;
  }
  
  /**
   * Set panel size
   * 
   * @param {string} id - Panel ID
   * @param {Object} size - Size {width, height}
   */
  setPanelSize(id, size) {
    const panel = this.panels.get(id);
    if (!panel) return;
    
    panel.element.style.width = `${size.width}px`;
    panel.element.style.height = `${size.height}px`;
  }
  
  /**
   * Set panel content
   * 
   * @param {string} id - Panel ID
   * @param {HTMLElement|string} content - Panel content
   */
  setPanelContent(id, content) {
    const panel = this.panels.get(id);
    if (!panel) return;
    
    const contentContainer = panel.contentContainer;
    
    // Clear existing content
    contentContainer.innerHTML = '';
    
    // Add new content
    if (typeof content === 'string') {
      contentContainer.innerHTML = content;
    } else {
      contentContainer.appendChild(content);
    }
  }
  
  /**
   * Set panel title
   * 
   * @param {string} id - Panel ID
   * @param {string} title - Panel title
   */
  setPanelTitle(id, title) {
    const panel = this.panels.get(id);
    if (!panel) return;
    
    const titleElement = panel.header.querySelector('.draggable-panel-title');
    titleElement.textContent = title;
  }
  
  /**
   * Bring panel to front
   * 
   * @param {string} id - Panel ID
   */
  bringToFront(id) {
    const panel = this.panels.get(id);
    if (!panel) return;
    
    // Get highest z-index
    let maxZ = 0;
    this.panels.forEach(p => {
      const zIndex = parseInt(getComputedStyle(p.element).zIndex) || 0;
      maxZ = Math.max(maxZ, zIndex);
    });
    
    // Set z-index higher than all others
    panel.element.style.zIndex = maxZ + 1;
  }
  
  /**
   * Save panel positions and sizes to localStorage
   * 
   * @param {string} storageKey - localStorage key
   */
  savePanelState(storageKey = 'draggablePanelState') {
    const state = {};
    
    this.panels.forEach((panel, id) => {
      state[id] = {
        position: {
          x: parseInt(panel.element.style.left),
          y: parseInt(panel.element.style.top)
        },
        size: {
          width: parseInt(panel.element.style.width),
          height: parseInt(panel.element.style.height)
        },
        isMinimized: panel.state.isMinimized,
        isMaximized: panel.state.isMaximized
      };
    });
    
    localStorage.setItem(storageKey, JSON.stringify(state));
  }
  
  /**
   * Load panel positions and sizes from localStorage
   * 
   * @param {string} storageKey - localStorage key
   */
  loadPanelState(storageKey = 'draggablePanelState') {
    const stateJson = localStorage.getItem(storageKey);
    if (!stateJson) return;
    
    try {
      const state = JSON.parse(stateJson);
      
      Object.entries(state).forEach(([id, panelState]) => {
        const panel = this.panels.get(id);
        if (!panel) return;
        
        // Apply position and size
        this.setPanelPosition(id, panelState.position);
        this.setPanelSize(id, panelState.size);
        
        // Apply minimized/maximized state
        if (panelState.isMinimized) {
          this.minimizePanel(id);
        } else if (panelState.isMaximized) {
          this.maximizePanel(id);
        }
      });
    } catch (error) {
      console.error('Error loading panel state:', error);
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Remove global event listeners
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('touchmove', this.handleTouchMove);
    
    // Remove all panels
    this.panels.forEach((panel, id) => {
      this.closePanel(id);
    });
    
    this.panels.clear();
  }
}

// Create singleton instance
export const draggablePanelManager = new DraggablePanelManager();
