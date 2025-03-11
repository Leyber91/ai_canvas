/**
 * core/component/behaviors/EventBehavior.js
 * 
 * Behavior that provides event handling functionality for components.
 * Includes methods for subscribing to events, publishing events,
 * and managing DOM event listeners.
 */

import { EventBusService } from '../../services/EventBusService.js';

export const EventBehavior = {
  /**
   * Initialize the behavior
   * 
   * @param {BaseComponent} component - Component to initialize with
   */
  initialize(component) {
    // Store component reference
    this.component = component;
    
    // Initialize event tracking
    component._eventSubscriptions = component._eventSubscriptions || [];
    component._domEventListeners = component._domEventListeners || [];
    
    // Bind methods to component context
    if (!component.subscribe) {
      component.subscribe = this.subscribe.bind(component);
    }
    
    if (!component.publish) {
      component.publish = this.publish.bind(component);
    }
    
    if (!component.unsubscribe) {
      component.unsubscribe = this.unsubscribe.bind(component);
    }
    
    if (!component.setupEventListeners) {
      component.setupEventListeners = this.setupEventListeners.bind(component);
    }
    
    if (!component.cleanupEventListeners) {
      component.cleanupEventListeners = this.cleanupEventListeners.bind(component);
    }
  },
  
  /**
   * Clean up when behavior is removed
   * 
   * @param {BaseComponent} component - Component to clean up
   */
  destroy(component) {
    // Clean up event subscriptions
    this.cleanupEventListeners.call(component);
  },
  
  // Methods to be added to the component
  methods: {
    /**
     * Subscribe to an event with automatic cleanup
     * 
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} context - Handler context (defaults to this component)
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, handler, context = null) {
      if (!this.eventBus) {
        console.warn(`[${this.name}] Cannot subscribe to event "${event}": No event bus available`);
        return () => {};
      }
      
      // Use provided context or this component
      const handlerContext = context || this;
      
      // Create bound handler
      const boundHandler = handler.bind(handlerContext);
      
      // Subscribe to event
      this.eventBus.subscribe(event, boundHandler, handlerContext);
      
      // Store subscription for cleanup
      this._eventSubscriptions = this._eventSubscriptions || [];
      const subscription = { event, handler: boundHandler, context: handlerContext };
      this._eventSubscriptions.push(subscription);
      
      // Return unsubscribe function
      return () => this.unsubscribe(subscription);
    },
    
    /**
     * Unsubscribe from an event
     * 
     * @param {Object} subscription - Subscription object
     */
    unsubscribe(subscription) {
      if (!this.eventBus || !subscription) return;
      
      // Unsubscribe from event bus
      this.eventBus.unsubscribe(
        subscription.event,
        subscription.handler,
        subscription.context
      );
      
      // Remove from subscriptions list
      const index = this._eventSubscriptions.indexOf(subscription);
      if (index !== -1) {
        this._eventSubscriptions.splice(index, 1);
      }
    },
    
    /**
     * Publish an event
     * 
     * @param {string} category - Event category
     * @param {string} action - Event action
     * @param {Object} data - Event data
     * @returns {boolean} Whether the event was delivered
     */
    publish(category, action, data = {}) {
      if (!this.eventBus) {
        console.warn(`[${this.name}] Cannot publish event "${category}:${action}": No event bus available`);
        return false;
      }
      
      // Add component info to event data
      const enhancedData = {
        ...data,
        component: this.name,
        timestamp: Date.now()
      };
      
      // Publish event using EventBusService
      return EventBusService.publish(
        this.eventBus,
        category,
        action,
        enhancedData
      );
    },
    
    /**
     * Set up DOM event listeners
     * This is a placeholder that should be overridden by components
     */
    setupEventListeners() {
      // To be implemented by components
    },
    
    /**
     * Add a DOM event listener with automatic cleanup
     * 
     * @param {HTMLElement} element - Element to add listener to
     * @param {string} eventType - Event type (e.g., 'click')
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     * @returns {Object} Listener reference for cleanup
     */
    addDOMEventListener(element, eventType, handler, options = {}) {
      if (!element) return null;
      
      // Bind handler to component
      const boundHandler = handler.bind(this);
      
      // Add event listener
      element.addEventListener(eventType, boundHandler, options);
      
      // Store for cleanup
      this._domEventListeners = this._domEventListeners || [];
      const listener = { element, eventType, handler: boundHandler, options };
      this._domEventListeners.push(listener);
      
      return listener;
    },
    
    /**
     * Remove a DOM event listener
     * 
     * @param {Object} listener - Listener reference
     */
    removeDOMEventListener(listener) {
      if (!listener || !listener.element) return;
      
      // Remove event listener
      listener.element.removeEventListener(
        listener.eventType,
        listener.handler,
        listener.options
      );
      
      // Remove from listeners list
      const index = this._domEventListeners.indexOf(listener);
      if (index !== -1) {
        this._domEventListeners.splice(index, 1);
      }
    },
    
    /**
     * Clean up all event listeners
     */
    cleanupEventListeners() {
      // Clean up event bus subscriptions
      if (this._eventSubscriptions) {
        this._eventSubscriptions.forEach(subscription => {
          if (this.eventBus) {
            this.eventBus.unsubscribe(
              subscription.event,
              subscription.handler,
              subscription.context
            );
          }
        });
        this._eventSubscriptions = [];
      }
      
      // Clean up DOM event listeners
      if (this._domEventListeners) {
        this._domEventListeners.forEach(listener => {
          if (listener.element) {
            listener.element.removeEventListener(
              listener.eventType,
              listener.handler,
              listener.options
            );
          }
        });
        this._domEventListeners = [];
      }
    }
  }
};
