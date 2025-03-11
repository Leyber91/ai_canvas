/**
 * core/dialog/BaseDialog.js
 * 
 * Foundation for all dialog components
 * Provides core dialog functionality with lifecycle hooks
 */

import { StyleUtils } from '../utils/StyleUtils.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';
import { FormatUtils } from '../utils/FormatUtils.js';
import { EventDelegate } from '../events/EventDelegate.js';

export class BaseDialog {
  /**
   * Create a new dialog instance
   * 
   * @param {Object} options - Dialog configuration options
   */
  constructor(options = {}) {
    this.id = options.id || `dialog-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.title = options.title || '';
    this.content = options.content || '';
    this.width = options.width || 'auto';
    this.height = options.height || 'auto';
    this.position = options.position || 'center';
    this.animation = options.animation || 'fade';
    this.closeOnEscape = options.closeOnEscape !== false;
    this.closeOnOverlayClick = options.closeOnOverlayClick !== false;
    this.showCloseButton = options.showCloseButton !== false;
    this.zIndex = options.zIndex || 1000;
    this.className = options.className || '';
    this.onOpen = options.onOpen || null;
    this.onClose = options.onClose || null;
    this.onBeforeClose = options.onBeforeClose || null;
    this.theme = options.theme || null;
    
    // DOM elements
    this.overlay = null;
    this.dialogElement = null;
    this.contentElement = null;
    
    // State
    this.isOpen = false;
    this.eventHandlers = new Map();
    this.cleanupFunctions = [];
  }
  
  /**
   * Show dialog with options
   * 
   * @param {Object} options - Additional options to override constructor options
   * @returns {BaseDialog} This dialog instance for chaining
   */
  show(options = {}) {
    // Merge options
    Object.assign(this, options);
    
    // Create overlay and dialog elements
    this.overlay = this.createOverlay();
    this.dialogElement = this.createDialogElement();
    
    // Add content
    this.contentElement = this.createContent(this.content);
    this.dialogElement.appendChild(this.contentElement);
    
    // Add close button if needed
    if (this.showCloseButton) {
      this.addCloseButton(this.dialogElement, () => this.hide());
    }
    
    // Add dialog to overlay
    this.overlay.appendChild(this.dialogElement);
    
    // Add to document
    document.body.appendChild(this.overlay);
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Apply animation
    this.applyAnimation(this.dialogElement, this.animation);
    
    // Set state
    this.isOpen = true;
    
    // Position dialog
    this.position !== 'center' && this.positionDialog();
    
    // Call onOpen callback
    if (typeof this.onOpen === 'function') {
      this.onOpen(this);
    }
    
    // Trap focus within dialog
    this.trapFocus();
    
    return this;
  }
  
  /**
   * Hide dialog and clean up resources
   * 
   * @param {boolean} skipAnimation - Whether to skip exit animation
   * @returns {Promise} Promise that resolves when dialog is closed
   */
  async hide(skipAnimation = false) {
    if (!this.isOpen) {
      return Promise.resolve();
    }
    
    // Call onBeforeClose callback
    if (typeof this.onBeforeClose === 'function') {
      const shouldClose = await Promise.resolve(this.onBeforeClose(this));
      if (shouldClose === false) {
        return Promise.resolve(false);
      }
    }
    
    // Apply exit animation if not skipped
    if (!skipAnimation && this.animation) {
      await this.applyExitAnimation(this.dialogElement, this.animation);
    }
    
    // Clean up
    this.cleanup();
    
    // Remove from DOM
    if (document.body.contains(this.overlay)) {
      document.body.removeChild(this.overlay);
    }
    
    // Set state
    this.isOpen = false;
    
    // Call onClose callback
    if (typeof this.onClose === 'function') {
      this.onClose(this);
    }
    
    return Promise.resolve(true);
  }
  
  /**
   * Create a semi-transparent overlay
   * 
   * @returns {HTMLElement} The created overlay element
   */
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `${this.id}-title`);
    overlay.setAttribute('aria-describedby', `${this.id}-content`);
    overlay.id = `${this.id}-overlay`;
    
    // Apply styles
    StyleUtils.applyStyles(overlay, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: this.zIndex.toString(),
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(3px)'
    });
    
    // Add click handler for closing on overlay click
    if (this.closeOnOverlayClick) {
      const overlayClickHandler = (e) => {
        if (e.target === overlay) {
          this.hide();
        }
      };
      
      overlay.addEventListener('click', overlayClickHandler);
      this.eventHandlers.set('overlayClick', overlayClickHandler);
    }
    
    return overlay;
  }
  
  /**
   * Create dialog element
   * 
   * @returns {HTMLElement} The created dialog element
   */
  createDialogElement() {
    const dialog = document.createElement('div');
    dialog.className = `dialog ${this.className}`;
    dialog.id = this.id;
    
    // Apply styles
    StyleUtils.applyGlassmorphism(dialog, {
      backgroundColor: 'rgba(18, 22, 36, 0.8)',
      color: '#ffffff',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: typeof this.width === 'number' ? `${this.width}px` : this.width,
      width: '90%',
      maxHeight: typeof this.height === 'number' ? `${this.height}px` : this.height,
      overflowY: 'auto',
      position: 'relative',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    });
    
    // Add title if provided
    if (this.title) {
      const titleElement = document.createElement('h2');
      titleElement.textContent = this.title;
      titleElement.id = `${this.id}-title`;
      titleElement.className = 'dialog-title';
      
      StyleUtils.applyStyles(titleElement, {
        margin: '0 0 15px 0',
        padding: '0 0 10px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      });
      
      dialog.appendChild(titleElement);
    }
    
    return dialog;
  }
  
  /**
   * Create dialog content from template
   * 
   * @param {string|HTMLElement|Function} template - Content template
   * @returns {HTMLElement} The content element
   */
  createContent(template) {
    const content = document.createElement('div');
    content.className = 'dialog-content';
    content.id = `${this.id}-content`;
    
    if (typeof template === 'string') {
      content.innerHTML = template;
    } else if (template instanceof HTMLElement) {
      content.appendChild(template);
    } else if (typeof template === 'function') {
      const result = template(this);
      if (result instanceof HTMLElement) {
        content.appendChild(result);
      } else if (typeof result === 'string') {
        content.innerHTML = result;
      }
    }
    
    return content;
  }
  
  /**
   * Add standard close button
   * 
   * @param {HTMLElement} container - Container to add button to
   * @param {Function} onClose - Close callback
   * @returns {HTMLElement} The created button
   */
  addCloseButton(container, onClose) {
    // Create close button container
    const closeButtonContainer = document.createElement('div');
    closeButtonContainer.className = 'dialog-close-button-container';
    
    StyleUtils.applyStyles(closeButtonContainer, {
      position: 'absolute',
      top: '10px',
      right: '10px'
    });
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'dialog-close-button';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.innerHTML = '&times;';
    
    StyleUtils.applyStyles(closeButton, {
      background: 'none',
      border: 'none',
      color: '#ffffff',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'background-color 0.2s ease'
    });
    
    // Add hover effect
    StyleUtils.applyHoverEffect(closeButton, {
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    });
    
    // Add click handler
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    });
    
    closeButtonContainer.appendChild(closeButton);
    container.appendChild(closeButtonContainer);
    
    return closeButton;
  }
  
  /**
   * Set up escape key handler
   * 
   * @param {Function} callback - Optional callback when escape is pressed
   * @returns {Function} The event handler function
   */
  handleEscapeKey(callback = null) {
    if (!this.closeOnEscape) {
      return null;
    }
    
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hide();
        if (callback) callback();
      }
    };
    
    document.addEventListener('keydown', escapeHandler);
    this.eventHandlers.set('escapeKey', escapeHandler);
    
    return escapeHandler;
  }
  
  /**
   * Position dialog on screen
   * 
   * @param {HTMLElement} element - Element to position
   */
  positionDialog() {
    if (!this.dialogElement) return;
    
    const element = this.dialogElement;
    
    if (this.position === 'center') {
      // Already centered by default with flexbox
      return;
    }
    
    // Reset position styles
    element.style.position = 'absolute';
    
    // Calculate position
    switch (this.position) {
      case 'top':
        element.style.top = '20px';
        element.style.left = '50%';
        element.style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        element.style.bottom = '20px';
        element.style.left = '50%';
        element.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        element.style.left = '20px';
        element.style.top = '50%';
        element.style.transform = 'translateY(-50%)';
        break;
      case 'right':
        element.style.right = '20px';
        element.style.top = '50%';
        element.style.transform = 'translateY(-50%)';
        break;
      case 'top-left':
        element.style.top = '20px';
        element.style.left = '20px';
        break;
      case 'top-right':
        element.style.top = '20px';
        element.style.right = '20px';
        break;
      case 'bottom-left':
        element.style.bottom = '20px';
        element.style.left = '20px';
        break;
      case 'bottom-right':
        element.style.bottom = '20px';
        element.style.right = '20px';
        break;
      default:
        // If position is an object with x, y coordinates
        if (typeof this.position === 'object' && this.position !== null) {
          if ('x' in this.position) {
            element.style.left = typeof this.position.x === 'number' 
              ? `${this.position.x}px` 
              : this.position.x;
          }
          if ('y' in this.position) {
            element.style.top = typeof this.position.y === 'number' 
              ? `${this.position.y}px` 
              : this.position.y;
          }
        }
    }
  }
  
  /**
   * Apply entrance animation
   * 
   * @param {HTMLElement} element - Element to animate
   * @param {string} animation - Animation type
   * @returns {Promise} Promise that resolves when animation completes
   */
  applyAnimation(element, animation) {
    if (!element || !animation) {
      return Promise.resolve();
    }
    
    switch (animation) {
      case 'fade':
        return AnimationUtils.applyFadeIn(element);
      case 'slide-down':
        return AnimationUtils.applySlideIn(element, 'top');
      case 'slide-up':
        return AnimationUtils.applySlideIn(element, 'bottom');
      case 'slide-left':
        return AnimationUtils.applySlideIn(element, 'right');
      case 'slide-right':
        return AnimationUtils.applySlideIn(element, 'left');
      case 'zoom':
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        return new Promise(resolve => {
          setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
            setTimeout(resolve, 300);
          }, 10);
        });
      default:
        if (typeof animation === 'function') {
          return Promise.resolve(animation(element));
        }
        return Promise.resolve();
    }
  }
  
  /**
   * Apply exit animation
   * 
   * @param {HTMLElement} element - Element to animate
   * @param {string} animation - Animation type
   * @returns {Promise} Promise that resolves when animation completes
   */
  applyExitAnimation(element, animation) {
    if (!element || !animation) {
      return Promise.resolve();
    }
    
    switch (animation) {
      case 'fade':
        element.style.opacity = '1';
        element.style.transition = 'opacity 0.3s ease';
        
        return new Promise(resolve => {
          setTimeout(() => {
            element.style.opacity = '0';
            setTimeout(resolve, 300);
          }, 10);
        });
      case 'slide-down':
        element.style.transform = 'translateY(0)';
        element.style.transition = 'transform 0.3s ease';
        
        return new Promise(resolve => {
          setTimeout(() => {
            element.style.transform = 'translateY(100%)';
            setTimeout(resolve, 300);
          }, 10);
        });
      case 'slide-up':
        element.style.transform = 'translateY(0)';
        element.style.transition = 'transform 0.3s ease';
        
        return new Promise(resolve => {
          setTimeout(() => {
            element.style.transform = 'translateY(-100%)';
            setTimeout(resolve, 300);
          }, 10);
        });
      case 'slide-left':
        element.style.transform = 'translateX(0)';
        element.style.transition = 'transform 0.3s ease';
        
        return new Promise(resolve => {
          setTimeout(() => {
            element.style.transform = 'translateX(-100%)';
            setTimeout(resolve, 300);
          }, 10);
        });
      case 'slide-right':
        element.style.transform = 'translateX(0)';
        element.style.transition = 'transform 0.3s ease';
        
        return new Promise(resolve => {
          setTimeout(() => {
            element.style.transform = 'translateX(100%)';
            setTimeout(resolve, 300);
          }, 10);
        });
      case 'zoom':
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        return new Promise(resolve => {
          setTimeout(() => {
            element.style.opacity = '0';
            element.style.transform = 'scale(0.8)';
            setTimeout(resolve, 300);
          }, 10);
        });
      default:
        if (typeof animation === 'function') {
          return Promise.resolve(animation(element, true));
        }
        return Promise.resolve();
    }
  }
  
  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    // Escape key handler
    this.handleEscapeKey();
    
    // Window resize handler for repositioning
    const resizeHandler = () => {
      this.positionDialog();
    };
    
    window.addEventListener('resize', resizeHandler);
    this.eventHandlers.set('resize', resizeHandler);
  }
  
  /**
   * Trap focus within dialog
   */
  trapFocus() {
    if (!this.dialogElement) return;
    
    // Find all focusable elements
    const focusableElements = this.dialogElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus the first element
    firstElement.focus();
    
    // Handle tab key to trap focus
    const tabHandler = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        // Shift + Tab: If focus is on first element, move to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: If focus is on last element, move to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    document.addEventListener('keydown', tabHandler);
    this.eventHandlers.set('tabTrap', tabHandler);
    
    // Store the previously focused element to restore focus when dialog closes
    this.previouslyFocused = document.activeElement;
    
    // Add cleanup function to restore focus
    this.cleanupFunctions.push(() => {
      if (this.previouslyFocused && this.previouslyFocused.focus) {
        this.previouslyFocused.focus();
      }
    });
  }
  
  /**
   * Remove event listeners and DOM elements
   */
  cleanup() {
    // Remove event listeners
    this.eventHandlers.forEach((handler, key) => {
      if (key === 'overlayClick' && this.overlay) {
        this.overlay.removeEventListener('click', handler);
      } else if (key === 'escapeKey' || key === 'tabTrap') {
        document.removeEventListener('keydown', handler);
      } else if (key === 'resize') {
        window.removeEventListener('resize', handler);
      }
    });
    
    // Clear event handlers map
    this.eventHandlers.clear();
    
    // Run cleanup functions
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
  }
  
  /**
   * Update dialog content
   * 
   * @param {string|HTMLElement|Function} content - New content
   * @returns {BaseDialog} This dialog instance for chaining
   */
  setContent(content) {
    if (!this.contentElement) return this;
    
    // Clear existing content
    this.contentElement.innerHTML = '';
    
    // Add new content
    if (typeof content === 'string') {
      this.contentElement.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.contentElement.appendChild(content);
    } else if (typeof content === 'function') {
      const result = content(this);
      if (result instanceof HTMLElement) {
        this.contentElement.appendChild(result);
      } else if (typeof result === 'string') {
        this.contentElement.innerHTML = result;
      }
    }
    
    return this;
  }
  
  /**
   * Update dialog title
   * 
   * @param {string} title - New title
   * @returns {BaseDialog} This dialog instance for chaining
   */
  setTitle(title) {
    this.title = title;
    
    if (this.dialogElement) {
      const titleElement = this.dialogElement.querySelector('.dialog-title');
      
      if (titleElement) {
        titleElement.textContent = title;
      } else if (title) {
        // Create title element if it doesn't exist
        const newTitleElement = document.createElement('h2');
        newTitleElement.textContent = title;
        newTitleElement.id = `${this.id}-title`;
        newTitleElement.className = 'dialog-title';
        
        StyleUtils.applyStyles(newTitleElement, {
          margin: '0 0 15px 0',
          padding: '0 0 10px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        });
        
        // Insert at the beginning of dialog
        this.dialogElement.insertBefore(newTitleElement, this.dialogElement.firstChild);
      }
    }
    
    return this;
  }
  
  /**
   * Set dialog position
   * 
   * @param {string|Object} position - New position
   * @returns {BaseDialog} This dialog instance for chaining
   */
  setPosition(position) {
    this.position = position;
    
    if (this.isOpen) {
      this.positionDialog();
    }
    
    return this;
  }
  
  /**
   * Set dialog z-index
   * 
   * @param {number} zIndex - New z-index
   * @returns {BaseDialog} This dialog instance for chaining
   */
  setZIndex(zIndex) {
    this.zIndex = zIndex;
    
    if (this.overlay) {
      this.overlay.style.zIndex = zIndex.toString();
    }
    
    return this;
  }
  
  /**
   * Add a class to the dialog element
   * 
   * @param {string} className - Class to add
   * @returns {BaseDialog} This dialog instance for chaining
   */
  addClass(className) {
    if (this.dialogElement) {
      this.dialogElement.classList.add(className);
    }
    
    return this;
  }
  
  /**
   * Remove a class from the dialog element
   * 
   * @param {string} className - Class to remove
   * @returns {BaseDialog} This dialog instance for chaining
   */
  removeClass(className) {
    if (this.dialogElement) {
      this.dialogElement.classList.remove(className);
    }
    
    return this;
  }
  
  /**
   * Check if dialog is currently open
   * 
   * @returns {boolean} Whether dialog is open
   */
  getIsOpen() {
    return this.isOpen;
  }
  
  /**
   * Get dialog ID
   * 
   * @returns {string} Dialog ID
   */
  getId() {
    return this.id;
  }
  
  /**
   * Get dialog element
   * 
   * @returns {HTMLElement} Dialog element
   */
  getDialogElement() {
    return this.dialogElement;
  }
  
  /**
   * Get content element
   * 
   * @returns {HTMLElement} Content element
   */
  getContentElement() {
    return this.contentElement;
  }
  
  /**
   * Get overlay element
   * 
   * @returns {HTMLElement} Overlay element
   */
  getOverlayElement() {
    return this.overlay;
  }
}
