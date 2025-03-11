/**
 * ui/managers/BaseManager.js
 * 
 * Compatibility wrapper around BaseComponent for UI managers.
 * Maintains backward compatibility while using the new component system.
 */
import { DOMElementRegistry } from '../registry/DOMElementRegistry.js';
import { BaseComponent } from '../../core/component/BaseComponent.js';
import { EventBehavior } from '../../core/component/behaviors/EventBehavior.js';
import { DOMBehavior } from '../../core/component/behaviors/DOMBehavior.js';
import { ErrorHandlingBehavior } from '../../core/component/behaviors/ErrorHandlingBehavior.js';

export class BaseManager {
  /**
   * @param {Object} options - Manager options
   * @param {DOMElementRegistry} options.registry - Element registry (optional)
   * @param {UIManager} options.uiManager - Parent UI manager (optional)
   * @param {EventBus} options.eventBus - Event bus (optional)
   */
  constructor(options = {}) {
    // Store original options
    this.options = options;
    
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
    
    // Create internal component
    this._component = new BaseComponent({
      name: options.name || this.constructor.name,
      eventBus: this.eventBus,
      parent: this.uiManager,
      behaviors: [
        EventBehavior,
        DOMBehavior,
        ErrorHandlingBehavior
      ]
    });
    
    // Forward component properties to this manager
    this.elements = this._component.elements;
    this.initialized = false;
    
    // Bind methods to preserve this context
    this.findElement = this.findElement.bind(this);
    this.findElements = this.findElements.bind(this);
    this.handleError = this.handleError.bind(this);
  }
  
  /**
   * Initialize the manager
   */
  initialize() {
    if (this.initialized) return;
    
    try {
      // Initialize component first
      this._component.initialize();
      
      // Find DOM elements
      this.findDOMElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Subscribe to events
      this.subscribeToEvents();
      
      this.initialized = true;
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
    
    // Try to find element using component's findElement
    const element = this._component.findElement(key, required);
    
    // If not found, try registry as fallback
    if (!element && this.registry) {
      const registryElement = this.registry.getElement(key, required);
      
      // Cache locally if found
      if (registryElement) {
        this.elements[key] = registryElement;
        return registryElement;
      }
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
    // Use component's findElements if it accepts array of keys
    if (Array.isArray(keys)) {
      const result = {};
      
      keys.forEach(key => {
        const element = this.findElement(key, required);
        if (element) {
          result[key] = element;
        }
      });
      
      return result;
    }
    
    // Otherwise, delegate to component's findElements
    return this._component.findElements(keys, required);
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
    // Delegate to component's createElement
    return this._component.createElement(tagName, options, children);
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
    // Bind the handler to this instance if not already bound
    const boundHandler = handler.bind ? handler.bind(this) : handler;
    
    // Delegate to component's addEventListenerWithCleanup
    return this._component.addEventListenerWithCleanup(element, eventType, boundHandler, options);
  }
  
  /**
   * Subscribe to event bus with automatic cleanup
   * 
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Cleanup function
   */
  subscribeWithCleanup(eventName, handler) {
    // Bind the handler to this instance if not already bound
    const boundHandler = handler.bind ? handler.bind(this) : handler;
    
    // Delegate to component's subscribeWithCleanup
    return this._component.subscribeWithCleanup(eventName, boundHandler);
  }
  
  /**
   * Log an error message
   * 
   * @param {string} message - Error message
   * @param {string} context - Error context
   */
  logError(message, context = '') {
    // Delegate to component's logError
    if (this._component.logError) {
      this._component.logError(message, context);
    } else {
      const errorContext = context ? `[${this.constructor.name}:${context}] ` : `[${this.constructor.name}] `;
      console.error(`${errorContext}${message}`);
    }
  }
  
  /**
   * Handle an error with improved recursion prevention and better error object handling
   * 
   * @param {Error|string|Object} error - Error object or message
   * @param {string} context - Error context
   */
  handleError(error, context = '') {
    // Delegate to component's handleError
    this._component.handleError(error, context);
  }
  
  /**
   * Show a notification if UIManager is available
   * 
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Notification duration in ms
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Delegate to component's showNotification
    this._component.showNotification(message, type, duration);
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Delegate to component's destroy
    this._component.destroy();
    
    // Clear references
    this.initialized = false;
  }
}
