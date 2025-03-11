/**
 * core/component/BaseComponent.js
 * 
 * Base component class that provides lifecycle management, error handling,
 * and DOM manipulation capabilities. This serves as the foundation for
 * the component-based architecture.
 */

import { ElementFinder } from '../dom/ElementFinder.js';
import { EventBusService } from '../services/EventBusService.js';

export class BaseComponent {
  /**
   * @param {Object} options - Component configuration
   * @param {string} options.name - Component name for identification
   * @param {Object} options.eventBus - Event bus for pub/sub (optional)
   * @param {ElementFinder} options.elementFinder - Element finder (optional)
   * @param {Object} options.parent - Parent component (optional)
   * @param {Object} options.behaviors - Behaviors to apply (optional)
   */
  constructor(options = {}) {
    // Core properties
    this.name = options.name || this.constructor.name;
    this.eventBus = options.eventBus || null;
    this.elementFinder = options.elementFinder || new ElementFinder();
    this.parent = options.parent || null;
    
    // Component state
    this.initialized = false;
    this.destroyed = false;
    this.elements = {};
    
    // Event handling
    this.eventCleanupHandlers = [];
    
    // Error handling
    this.handlingError = false;
    
    // Apply behaviors if provided
    this.behaviors = [];
    if (options.behaviors) {
      this.applyBehaviors(options.behaviors);
    }
    
    // Bind methods to preserve this context
    this.initialize = this.initialize.bind(this);
    this.destroy = this.destroy.bind(this);
    this.handleError = this.handleError.bind(this);
    this.findElement = this.findElement.bind(this);
    this.createElement = this.createElement.bind(this);
  }
  
  /**
   * Initialize the component
   * 
   * @returns {BaseComponent} This component instance
   */
  initialize() {
    if (this.initialized) return this;
    
    try {
      // Initialize behaviors first
      this.initializeBehaviors();
      
      // Find DOM elements
      this.findDOMElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Subscribe to events
      this.subscribeToEvents();
      
      // Mark as initialized
      this.initialized = true;
      
      // Publish component initialized event if event bus is available
      if (this.eventBus) {
        EventBusService.publish(
          this.eventBus,
          'component',
          'initialized',
          { component: this.name }
        );
      }
    } catch (error) {
      this.handleError(error, 'initialize');
    }
    
    return this;
  }
  
  /**
   * Initialize behaviors
   * @private
   */
  initializeBehaviors() {
    for (const behavior of this.behaviors) {
      if (typeof behavior.initialize === 'function') {
        behavior.initialize(this);
      }
    }
  }
  
  /**
   * Apply behaviors to this component
   * 
   * @param {Array|Object} behaviors - Behavior(s) to apply
   * @returns {BaseComponent} This component instance
   */
  applyBehaviors(behaviors) {
    // Handle single behavior
    if (!Array.isArray(behaviors)) {
      behaviors = [behaviors];
    }
    
    for (const behavior of behaviors) {
      // Skip if behavior is already applied
      if (this.behaviors.includes(behavior)) continue;
      
      // Add behavior to list
      this.behaviors.push(behavior);
      
      // Apply behavior methods to this component
      if (behavior.methods) {
        for (const [methodName, method] of Object.entries(behavior.methods)) {
          // Don't override existing methods
          if (this[methodName] === undefined) {
            this[methodName] = method.bind(this);
          }
        }
      }
      
      // Initialize behavior if component is already initialized
      if (this.initialized && typeof behavior.initialize === 'function') {
        behavior.initialize(this);
      }
    }
    
    return this;
  }
  
  /**
   * Find DOM elements needed by this component
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
   * Find an element by key or selector
   * 
   * @param {string} key - Element key or selector
   * @param {boolean} required - Whether the element is required
   * @returns {HTMLElement|null} Found element or null
   */
  findElement(key, required = false) {
    // Try to get from local cache first
    if (this.elements[key]) {
      return this.elements[key];
    }
    
    // Find element using element finder
    const element = this.elementFinder.findElement(key, key, required);
    
    // Cache locally if found
    if (element) {
      this.elements[key] = element;
    }
    
    return element;
  }
  
  /**
   * Find multiple elements by key or selector
   * 
   * @param {string} key - Element key or selector
   * @param {boolean} required - Whether at least one element is required
   * @returns {NodeList|Array} Found elements
   */
  findElements(key, required = false) {
    // Try to get from local cache first
    const cacheKey = `${key}[]`;
    if (this.elements[cacheKey]) {
      return this.elements[cacheKey];
    }
    
    // Find elements using element finder
    const elements = this.elementFinder.findElements(key, key, required);
    
    // Cache locally if found
    if (elements && elements.length > 0) {
      this.elements[cacheKey] = elements;
    }
    
    return elements;
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
        this.addEventListenerWithCleanup(element, event, handler);
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
   * Handle an error with improved recursion prevention
   * 
   * @param {Error|string|Object} error - Error object or message
   * @param {string} context - Error context
   */
  handleError(error, context = '') {
    // Prevent recursive error handling
    if (this.handlingError) {
      console.warn(`[${this.name}] Skipping recursive error handling.`);
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
      
      const errorContext = context ? `[${this.name}:${context}] ` : `[${this.name}] `;
      
      console.error(`${errorContext}Error: ${errorMessage}`);
      
      // Only publish to event bus if we have one available
      if (this.eventBus) {
        try {
          EventBusService.publish(
            this.eventBus,
            'error',
            'occurred',
            {
              message: errorMessage,
              context: `${this.name}${context ? `:${context}` : ''}`,
              error: error instanceof Error ? error : new Error(errorMessage),
              timestamp: Date.now(),
              component: this.name
            }
          );
        } catch (eventBusError) {
          // If publishing to the event bus itself causes an error, just log it
          console.error(`Error publishing to event bus: ${eventBusError.message}`);
        }
      }
      
      // Delegate to error handling behavior if available
      for (const behavior of this.behaviors) {
        if (behavior.handleError) {
          behavior.handleError.call(this, error, context);
          break; // Only use the first error handler
        }
      }
    } finally {
      this.handlingError = false;
    }
  }
  
  /**
   * Show a notification if parent component or notification system is available
   * 
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Notification duration in ms
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Try to use parent's notification system
    if (this.parent && this.parent.showNotification) {
      this.parent.showNotification(message, type, duration);
      return;
    }
    
    // Fallback to console
    const logMethod = type === 'error' ? console.error : 
                     type === 'warning' ? console.warn : console.log;
    logMethod(`[${this.name}] ${message}`);
    
    // Publish notification event if event bus is available
    if (this.eventBus) {
      EventBusService.publish(
        this.eventBus,
        'ui',
        'notification-shown',
        {
          message,
          type,
          duration,
          source: this.name
        }
      );
    }
  }
  
  /**
   * Clean up resources and destroy the component
   */
  destroy() {
    if (this.destroyed) return;
    
    try {
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
      
      // Destroy behaviors
      for (const behavior of this.behaviors) {
        if (typeof behavior.destroy === 'function') {
          behavior.destroy(this);
        }
      }
      
      // Clear element references
      this.elements = {};
      
      // Mark as destroyed
      this.destroyed = true;
      this.initialized = false;
      
      // Publish component destroyed event if event bus is available
      if (this.eventBus) {
        EventBusService.publish(
          this.eventBus,
          'component',
          'destroyed',
          { component: this.name }
        );
      }
    } catch (error) {
      console.error(`[${this.name}] Error during destroy:`, error);
    }
  }
}
