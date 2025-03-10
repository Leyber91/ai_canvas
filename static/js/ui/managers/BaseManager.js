/**
 * ui/managers/BaseManager.js
 * 
 * Base class for UI managers with common functionality for DOM access,
 * event handling, and error management.
 */
import { DOMElementRegistry } from '../registry/DOMElementRegistry.js';

export class BaseManager {
  /**
   * @param {Object} options - Manager options
   * @param {DOMElementRegistry} options.registry - Element registry (optional)
   * @param {UIManager} options.uiManager - Parent UI manager (optional)
   * @param {EventBus} options.eventBus - Event bus (optional)
   */
  constructor(options = {}) {
    // Option 1: Use provided UIManager
    if (options.uiManager) {
      this.uiManager = options.uiManager;
      this.eventBus = options.uiManager.eventBus;
      this.registry = options.registry || DOMElementRegistry.getInstance();
    } 
    // Option 2: Use specific components
    else {
      this.uiManager = null;
      this.eventBus = options.eventBus || null;
      this.registry = options.registry || DOMElementRegistry.getInstance();
    }
    
    // Store event cleanup handlers
    this.eventCleanupHandlers = [];
    
    // Local elements cache
    this.elements = {};
    
    // Error handling control flag to prevent recursion
    this.handlingError = false;
    
    // Bind methods to preserve this context
    this.findElement = this.findElement.bind(this);
    this.findElements = this.findElements.bind(this);
    this.handleError = this.handleError.bind(this);
  }
  
  /**
   * Initialize the manager
   */
  initialize() {
    try {
      // Find DOM elements
      this.findDOMElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Subscribe to events
      this.subscribeToEvents();
    } catch (error) {
      this.handleError(error, 'initialize');
    }
  }
  
  /**
   * Find DOM elements needed by this manager
   * Override in subclasses
   */
  findDOMElements() {
    // To be implemented by subclasses
  }
  
  /**
   * Set up event listeners
   * Override in subclasses
   */
  setupEventListeners() {
    // To be implemented by subclasses
  }
  
  /**
   * Subscribe to events
   * Override in subclasses
   */
  subscribeToEvents() {
    // To be implemented by subclasses
  }
  
  /**
   * Find an element by key
   * 
   * @param {string} key - Element key
   * @param {boolean} required - Whether the element is required
   * @returns {HTMLElement|null} Found element or null
   */
  findElement(key, required = false) {
    // Try to get from local cache first
    if (this.elements[key]) {
      return this.elements[key];
    }
    
    // Find element in registry
    const element = this.registry.getElement(key, required);
    
    // Cache locally if found
    if (element) {
      this.elements[key] = element;
    }
    
    return element;
  }
  
  /**
   * Find multiple elements by keys
   * 
   * @param {Array<string>} keys - Element keys
   * @param {boolean} required - Whether the elements are required
   * @returns {Object} Map of keys to elements
   */
  findElements(keys, required = false) {
    const result = {};
    
    keys.forEach(key => {
      const element = this.findElement(key, required);
      if (element) {
        result[key] = element;
      }
    });
    
    return result;
  }
  
  /**
   * Create an HTML element
   * 
   * @param {string} tagName - HTML tag name
   * @param {Object} options - Element options (className, id, etc.)
   * @param {Array} children - Child elements to append
   * @returns {HTMLElement} Created element
   */
  createElement(tagName, options = {}, children = []) {
    const element = document.createElement(tagName);
    
    // Apply options
    if (options.className) {
      element.className = options.className;
    }
    
    if (options.id) {
      element.id = options.id;
    }
    
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([attr, value]) => {
        element.setAttribute(attr, value);
      });
    }
    
    if (options.innerHTML !== undefined) {
      element.innerHTML = options.innerHTML;
    }
    
    if (options.textContent !== undefined) {
      element.textContent = options.textContent;
    }
    
    if (options.style) {
      Object.assign(element.style, options.style);
    }
    
    // Add event listeners
    if (options.events) {
      Object.entries(options.events).forEach(([event, handler]) => {
        element.addEventListener(event, handler);
      });
    }
    
    // Append children
    children.forEach(child => {
      if (child) {
        element.appendChild(child);
      }
    });
    
    // Register element with a key if provided
    if (options.key) {
      this.elements[options.key] = element;
    }
    
    return element;
  }
  
  /**
   * Add event listener with automatic cleanup
   * 
   * @param {HTMLElement} element - Element to add listener to
   * @param {string} eventType - Event type (e.g., 'click')
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   * @returns {Function} Cleanup function
   */
  addEventListenerWithCleanup(element, eventType, handler, options = {}) {
    if (!element) return () => {};
    
    // Bind the handler to this instance if not already bound
    const boundHandler = handler.bind ? handler.bind(this) : handler;
    
    // Add event listener
    element.addEventListener(eventType, boundHandler, options);
    
    // Create cleanup function
    const cleanup = () => {
      element.removeEventListener(eventType, boundHandler, options);
    };
    
    // Store for later cleanup
    this.eventCleanupHandlers.push(cleanup);
    
    return cleanup;
  }
  
  /**
   * Subscribe to event bus with automatic cleanup
   * 
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Cleanup function
   */
  subscribeWithCleanup(eventName, handler) {
    if (!this.eventBus) return () => {};
    
    // Bind the handler to this instance if not already bound
    const boundHandler = handler.bind ? handler.bind(this) : handler;
    
    // Subscribe to event
    this.eventBus.subscribe(eventName, boundHandler, this);
    
    // Create cleanup function
    const cleanup = () => {
      this.eventBus.unsubscribe(eventName, boundHandler, this);
    };
    
    // Store for later cleanup
    this.eventCleanupHandlers.push(cleanup);
    
    return cleanup;
  }
  
  /**
   * Log an error message
   * 
   * @param {string} message - Error message
   * @param {string} context - Error context
   */
  logError(message, context = '') {
    const errorContext = context ? `[${this.constructor.name}:${context}] ` : `[${this.constructor.name}] `;
    console.error(`${errorContext}${message}`);
  }
  
  /**
   * Handle an error with improved recursion prevention and better error object handling
   * 
   * @param {Error|string|Object} error - Error object or message
   * @param {string} context - Error context
   */
  handleError(error, context = '') {
    // Prevent recursive error handling
    if (this.handlingError) {
      console.warn(`[${this.constructor.name}] Skipping recursive error handling.`);
      return;
    }
    
    this.handlingError = true;
    
    try {
      // Improved error message extraction
      let errorMessage;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle plain objects better
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          errorMessage = 'Object error (see console for details)';
          console.error('Full error object:', error);
        }
      } else {
        errorMessage = 'Unknown error occurred';
      }
      
      const errorContext = context ? `[${this.constructor.name}:${context}] ` : `[${this.constructor.name}] `;
      
      console.error(`${errorContext}Error: ${errorMessage}`);
      
      // Only publish to event bus if we have one available, 
      // and we're not already handling an error from the event bus
      if (this.eventBus) {
        try {
          this.eventBus.publish('error', {
            message: errorMessage,
            context: `${this.constructor.name}${context ? `:${context}` : ''}`,
            error: error instanceof Error ? error : new Error(errorMessage),
            timestamp: Date.now()
          });
        } catch (eventBusError) {
          // If publishing to the event bus itself causes an error, just log it
          console.error(`Error publishing to event bus: ${eventBusError.message}`);
        }
      }
    } finally {
      this.handlingError = false;
    }
  }
  
  /**
   * Show a notification if UIManager is available
   * 
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Notification duration in ms
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (this.uiManager && this.uiManager.showNotification) {
      this.uiManager.showNotification(message, type, duration);
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Clean up event listeners
    this.eventCleanupHandlers.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn(`Error during cleanup: ${error.message}`);
      }
    });
    
    // Clear event cleanup handlers
    this.eventCleanupHandlers = [];
    
    // Clear element references
    this.elements = {};
  }
}