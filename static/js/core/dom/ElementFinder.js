/**
 * core/dom/ElementFinder.js
 * 
 * Modernized implementation of element finding logic with improved caching,
 * error handling, and selector management.
 */

import { ElementCache } from './ElementCache.js';
import { Selectors } from './Selectors.js';

export class ElementFinder {
  /**
   * @param {Object} options - Configuration options
   * @param {boolean} options.strictMode - Whether to throw errors for missing elements (default: false)
   * @param {boolean} options.enableWarnings - Whether to log warnings for missing elements (default: true)
   * @param {string} options.appRootSelector - Selector for the application root element (default: 'body')
   */
  constructor(options = {}) {
    this.options = {
      strictMode: false,
      enableWarnings: true,
      appRootSelector: 'body',
      ...options
    };
    
    // Initialize element cache
    this.cache = new ElementCache();
    
    // Initialize selectors registry
    this.selectors = new Selectors();
  }
  
  /**
   * Find a specific element by key or selector
   * 
   * @param {string} key - Element key for caching and error reporting
   * @param {string|Function} selector - CSS selector or function that returns an element
   * @param {boolean} required - Whether the element is required
   * @returns {HTMLElement|null} - Found element or null if not found
   */
  findElement(key, selector, required = false) {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // If no selector provided, try to get it from the registry
    if (!selector && key) {
      selector = this.selectors.get(key);
      if (!selector) {
        this.handleError(`No selector defined for key: ${key}`);
        return null;
      }
    }
    
    let element = null;
    
    // Handle different selector types
    if (typeof selector === 'function') {
      // If selector is a function, call it to get the element
      try {
        element = selector();
      } catch (error) {
        this.handleError(`Error calling selector function for ${key}:`, error);
      }
    } else if (typeof selector === 'string') {
      // Handle ID selector (starts with #)
      if (selector.startsWith('#')) {
        element = document.getElementById(selector.substring(1));
      } else {
        // Handle other CSS selectors
        element = document.querySelector(selector);
      }
    } else if (selector instanceof HTMLElement) {
      // If selector is already an element, use it directly
      element = selector;
    }
    
    // Cache the result if found
    if (element) {
      this.cache.set(key, element);
    } else {
      // Handle missing element
      this.handleMissingElement(key, selector, required);
    }
    
    return element;
  }
  
  /**
   * Find elements by key or selector
   * 
   * @param {string} key - Element key for caching and error reporting
   * @param {string} selector - CSS selector
   * @param {boolean} required - Whether at least one element is required
   * @returns {NodeList|Array} - Found elements or empty array if none found
   */
  findElements(key, selector, required = false) {
    // Check cache first
    const cacheKey = `${key}[]`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // If no selector provided, try to get it from the registry
    if (!selector && key) {
      selector = this.selectors.get(key);
      if (!selector) {
        this.handleError(`No selector defined for key: ${key}`);
        return [];
      }
    }
    
    let elements = [];
    
    // Handle different selector types
    if (typeof selector === 'function') {
      // If selector is a function, call it to get the elements
      try {
        elements = selector();
      } catch (error) {
        this.handleError(`Error calling selector function for ${key}:`, error);
      }
    } else if (typeof selector === 'string') {
      // Use querySelectorAll for all CSS selectors
      elements = document.querySelectorAll(selector);
    }
    
    // Cache the result if elements found
    if (elements.length > 0) {
      this.cache.set(cacheKey, elements);
    } else if (required) {
      // Handle missing elements
      this.handleMissingElement(key, selector, required, true);
    }
    
    return elements;
  }
  
  /**
   * Find an element by ID
   * 
   * @param {string} id - Element ID
   * @param {boolean} required - Whether the element is required
   * @returns {HTMLElement|null} - Found element or null if not found
   */
  getElementById(id, required = false) {
    return this.findElement(id, `#${id}`, required);
  }
  
  /**
   * Find elements using a CSS selector
   * 
   * @param {string} selector - CSS selector
   * @param {string} key - Optional key for caching and error reporting
   * @param {boolean} required - Whether the element is required
   * @returns {HTMLElement|null} - Found element or null if not found
   */
  querySelector(selector, key = selector, required = false) {
    return this.findElement(key, selector, required);
  }
  
  /**
   * Find all elements matching a CSS selector
   * 
   * @param {string} selector - CSS selector
   * @param {string} key - Optional key for caching and error reporting
   * @param {boolean} required - Whether at least one element is required
   * @returns {NodeList} - Found elements
   */
  querySelectorAll(selector, key = selector, required = false) {
    return this.findElements(key, selector, required);
  }
  
  /**
   * Handle a missing element
   * 
   * @param {string} key - Element key
   * @param {string|Function} selector - Selector used to find the element
   * @param {boolean} required - Whether the element is required
   * @param {boolean} multiple - Whether this was looking for multiple elements
   * @private
   */
  handleMissingElement(key, selector, required, multiple = false) {
    const selectorStr = typeof selector === 'function' ? 'function()' : selector;
    const message = multiple ? 
      `No elements found for selector "${selectorStr}" (${key})` :
      `Element not found for selector "${selectorStr}" (${key})`;
    
    if (required && this.options.strictMode) {
      throw new Error(message);
    } else if (this.options.enableWarnings) {
      console.warn(message);
    }
  }
  
  /**
   * Handle an error during element finding
   * 
   * @param {string} message - Error message prefix
   * @param {Error} error - Original error (optional)
   * @private
   */
  handleError(message, error) {
    const fullMessage = error ? `${message} ${error.message}` : message;
    
    if (this.options.strictMode) {
      throw new Error(fullMessage);
    } else if (this.options.enableWarnings) {
      console.error(fullMessage, error);
    }
  }
  
  /**
   * Static method to create and initialize an instance
   * 
   * @param {Object} options - Configuration options
   * @returns {ElementFinder} - Initialized instance
   */
  static create(options = {}) {
    return new ElementFinder(options);
  }
}
