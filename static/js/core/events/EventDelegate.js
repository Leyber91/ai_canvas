/**
 * core/events/EventDelegate.js
 * 
 * Event delegation utilities for efficient DOM event handling.
 * Provides methods for event delegation, debouncing, and throttling.
 */

export class EventDelegate {
  /**
   * Delegate an event to child elements matching a selector
   * 
   * @param {HTMLElement} element - Parent element to attach the event listener to
   * @param {string} eventType - Event type (e.g., 'click', 'input')
   * @param {string} selector - CSS selector for target elements
   * @param {Function} handler - Event handler function
   * @returns {Function} - Cleanup function to remove the event listener
   */
  static delegate(element, eventType, selector, handler) {
    if (!element || !eventType || !selector || !handler) {
      console.warn('EventDelegate.delegate: Missing required parameters');
      return () => {};
    }
    
    // Create delegated event handler
    const delegatedHandler = (event) => {
      // Find the closest matching element
      const target = event.target.closest(selector);
      
      // If a matching element was found and it's a child of the container
      if (target && element.contains(target)) {
        // Call the handler with the matching element as context
        handler.call(target, event, target);
      }
    };
    
    // Attach the delegated handler
    element.addEventListener(eventType, delegatedHandler);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(eventType, delegatedHandler);
    };
  }
  
  /**
   * Add event listener with automatic cleanup
   * 
   * @param {HTMLElement} element - Element to attach the event listener to
   * @param {string} eventType - Event type (e.g., 'click', 'input')
   * @param {Function} handler - Event handler function
   * @param {Object} options - Event listener options
   * @returns {Function} - Cleanup function to remove the event listener
   */
  static addEventListenerWithCleanup(element, eventType, handler, options = {}) {
    if (!element) return () => {};
    
    element.addEventListener(eventType, handler, options);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(eventType, handler, options);
    };
  }
  
  /**
   * Create an observable object that can be watched for changes
   * 
   * @param {Object} target - Object to make observable
   * @returns {Proxy} - Observable proxy object
   */
  static createObservable(target) {
    // Store observers
    const observers = new Map();
    
    // Create proxy handler
    const handler = {
      set(obj, prop, value) {
        // Get old value
        const oldValue = obj[prop];
        
        // Set the new value
        obj[prop] = value;
        
        // Notify observers for this property
        if (observers.has(prop)) {
          observers.get(prop).forEach(callback => {
            try {
              callback(value, oldValue, prop);
            } catch (error) {
              console.error(`Error in observer for ${prop}:`, error);
            }
          });
        }
        
        // Notify observers for all properties
        if (observers.has('*')) {
          observers.get('*').forEach(callback => {
            try {
              callback(value, oldValue, prop);
            } catch (error) {
              console.error(`Error in observer for *:`, error);
            }
          });
        }
        
        return true;
      }
    };
    
    // Create proxy
    const proxy = new Proxy(target, handler);
    
    // Add observe method
    proxy.observe = (prop, callback) => {
      if (!observers.has(prop)) {
        observers.set(prop, new Set());
      }
      
      observers.get(prop).add(callback);
      
      // Return unobserve function
      return () => {
        if (observers.has(prop)) {
          observers.get(prop).delete(callback);
          
          if (observers.get(prop).size === 0) {
            observers.delete(prop);
          }
        }
      };
    };
    
    // Add unobserve method
    proxy.unobserve = (prop, callback) => {
      if (observers.has(prop) && callback) {
        observers.get(prop).delete(callback);
        
        if (observers.get(prop).size === 0) {
          observers.delete(prop);
        }
      } else if (observers.has(prop)) {
        observers.delete(prop);
      }
    };
    
    return proxy;
  }
  
  /**
   * Create a debounced function
   * 
   * @param {Function} func - Function to debounce
   * @param {number} wait - Debounce wait time in ms
   * @param {boolean} immediate - Whether to trigger on the leading edge
   * @returns {Function} - Debounced function
   */
  static debounce(func, wait = 300, immediate = false) {
    let timeout;
    
    return function(...args) {
      const context = this;
      const callNow = immediate && !timeout;
      
      // Clear existing timeout
      clearTimeout(timeout);
      
      // Set new timeout
      timeout = setTimeout(() => {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      }, wait);
      
      // Call immediately if needed
      if (callNow) {
        func.apply(context, args);
      }
    };
  }
  
  /**
   * Create a throttled function
   * 
   * @param {Function} func - Function to throttle
   * @param {number} limit - Throttle limit in ms
   * @returns {Function} - Throttled function
   */
  static throttle(func, limit = 300) {
    let inThrottle = false;
    let lastFunc;
    let lastRan;
    
    return function(...args) {
      const context = this;
      
      if (!inThrottle) {
        // If not in throttle, run the function immediately
        func.apply(context, args);
        lastRan = Date.now();
        inThrottle = true;
      } else {
        // If in throttle, schedule the function to run after the limit
        clearTimeout(lastFunc);
        
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }
  
  /**
   * Handle click outside of an element
   * 
   * @param {HTMLElement} element - Target element
   * @param {Function} callback - Callback function when clicked outside
   * @returns {Function} - Cleanup function
   */
  static handleClickOutside(element, callback) {
    if (!element) return () => {};
    
    const listener = (event) => {
      if (element && !element.contains(event.target)) {
        callback(event);
      }
    };
    
    document.addEventListener('click', listener);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('click', listener);
    };
  }
  
  /**
   * Create a one-time event listener
   * 
   * @param {HTMLElement} element - Element to attach the event listener to
   * @param {string} eventType - Event type (e.g., 'click', 'input')
   * @param {Function} handler - Event handler function
   * @param {Object} options - Event listener options
   * @returns {Function} - Cleanup function to remove the event listener
   */
  static once(element, eventType, handler, options = {}) {
    if (!element) return () => {};
    
    // Create a wrapper that removes itself after execution
    const wrappedHandler = (event) => {
      // Remove the event listener
      element.removeEventListener(eventType, wrappedHandler, options);
      
      // Call the original handler
      handler.call(element, event);
    };
    
    // Add the wrapped handler
    element.addEventListener(eventType, wrappedHandler, options);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(eventType, wrappedHandler, options);
    };
  }
  
  /**
   * Create a passive event listener
   * 
   * @param {HTMLElement} element - Element to attach the event listener to
   * @param {string} eventType - Event type (e.g., 'scroll', 'touchstart')
   * @param {Function} handler - Event handler function
   * @returns {Function} - Cleanup function to remove the event listener
   */
  static passive(element, eventType, handler) {
    if (!element) return () => {};
    
    // Add event listener with passive option
    element.addEventListener(eventType, handler, { passive: true });
    
    // Return cleanup function
    return () => {
      element.removeEventListener(eventType, handler);
    };
  }
  
  /**
   * Create a multi-event listener
   * 
   * @param {HTMLElement} element - Element to attach the event listeners to
   * @param {string[]} eventTypes - Array of event types
   * @param {Function} handler - Event handler function
   * @param {Object} options - Event listener options
   * @returns {Function} - Cleanup function to remove all event listeners
   */
  static multiEvent(element, eventTypes, handler, options = {}) {
    if (!element || !Array.isArray(eventTypes)) return () => {};
    
    // Add event listeners for all event types
    eventTypes.forEach(eventType => {
      element.addEventListener(eventType, handler, options);
    });
    
    // Return cleanup function
    return () => {
      eventTypes.forEach(eventType => {
        element.removeEventListener(eventType, handler, options);
      });
    };
  }
}
