/**
 * core/component/behaviors/DOMBehavior.js
 * 
 * Behavior that provides DOM manipulation functionality for components.
 * Includes methods for finding elements, creating elements, and applying styles.
 */

import { StyleUtils } from '../../utils/StyleUtils.js';

export const DOMBehavior = {
  /**
   * Initialize the behavior
   * 
   * @param {BaseComponent} component - Component to initialize with
   */
  initialize(component) {
    // Store component reference
    this.component = component;
    
    // Initialize DOM element cache
    component._domCache = component._domCache || {};
    
    // Bind methods to component context
    if (!component.findElement) {
      component.findElement = this.findElement.bind(component);
    }
    
    if (!component.findElements) {
      component.findElements = this.findElements.bind(component);
    }
    
    if (!component.createElement) {
      component.createElement = this.createElement.bind(component);
    }
    
    if (!component.applyStyles) {
      component.applyStyles = this.applyStyles.bind(component);
    }
    
    if (!component.clearDOMCache) {
      component.clearDOMCache = this.clearDOMCache.bind(component);
    }
  },
  
  /**
   * Clean up when behavior is removed
   * 
   * @param {BaseComponent} component - Component to clean up
   */
  destroy(component) {
    // Clear DOM cache
    component._domCache = {};
  },
  
  // Methods to be added to the component
  methods: {
    /**
     * Find an element by key or selector
     * 
     * @param {string} key - Element key or selector
     * @param {boolean} required - Whether the element is required
     * @returns {HTMLElement|null} Found element or null
     */
    findElement(key, required = false) {
      // Try to get from local cache first
      if (this._domCache && this._domCache[key]) {
        return this._domCache[key];
      }
      
      let element = null;
      
      // Try to use elementFinder if available
      if (this.elementFinder) {
        element = this.elementFinder.findElement(key, key, required);
      } else {
        // Fallback to direct DOM access
        try {
          if (key.startsWith('#')) {
            element = document.getElementById(key.substring(1));
          } else if (key.startsWith('.')) {
            element = document.querySelector(key);
          } else {
            // Try as ID first, then as selector
            element = document.getElementById(key) || document.querySelector(key);
          }
        } catch (error) {
          if (required) {
            this.handleError(error, `findElement(${key})`);
          }
        }
      }
      
      // Cache element if found
      if (element) {
        this._domCache = this._domCache || {};
        this._domCache[key] = element;
      } else if (required) {
        this.handleError(`Required element not found: ${key}`, 'findElement');
      }
      
      return element;
    },
    
    /**
     * Find multiple elements by key or selector
     * 
     * @param {Array<string>|string} keys - Element keys or selector
     * @param {boolean} required - Whether at least one element is required
     * @returns {Object|NodeList|Array} Found elements
     */
    findElements(keys, required = false) {
      // Handle array of keys
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
      
      // Handle single selector for multiple elements
      const key = keys;
      const cacheKey = `${key}[]`;
      
      // Try to get from local cache first
      if (this._domCache && this._domCache[cacheKey]) {
        return this._domCache[cacheKey];
      }
      
      let elements = null;
      
      // Try to use elementFinder if available
      if (this.elementFinder) {
        elements = this.elementFinder.findElements(key, key, required);
      } else {
        // Fallback to direct DOM access
        try {
          elements = document.querySelectorAll(key);
        } catch (error) {
          if (required) {
            this.handleError(error, `findElements(${key})`);
          }
        }
      }
      
      // Cache elements if found
      if (elements && elements.length > 0) {
        this._domCache = this._domCache || {};
        this._domCache[cacheKey] = elements;
      } else if (required) {
        this.handleError(`Required elements not found: ${key}`, 'findElements');
      }
      
      return elements || [];
    },
    
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
        this.applyStyles(element, options.style);
      }
      
      // Add event listeners
      if (options.events) {
        Object.entries(options.events).forEach(([event, handler]) => {
          // Use addEventListenerWithCleanup if available
          if (typeof this.addEventListenerWithCleanup === 'function') {
            this.addEventListenerWithCleanup(element, event, handler);
          } else if (typeof this.addDOMEventListener === 'function') {
            this.addDOMEventListener(element, event, handler);
          } else {
            // Fallback to direct event listener
            const boundHandler = handler.bind(this);
            element.addEventListener(event, boundHandler);
          }
        });
      }
      
      // Append children
      children.forEach(child => {
        if (child) {
          element.appendChild(child);
        }
      });
      
      // Cache element with key if provided
      if (options.key) {
        this._domCache = this._domCache || {};
        this._domCache[options.key] = element;
      }
      
      return element;
    },
    
    /**
     * Apply styles to an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} styles - CSS styles object
     * @returns {HTMLElement} The styled element
     */
    applyStyles(element, styles) {
      if (!element || !styles) return element;
      
      return StyleUtils.applyStyles(element, styles);
    },
    
    /**
     * Apply glassmorphism effect to an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Glassmorphism options
     * @returns {HTMLElement} The styled element
     */
    applyGlassmorphism(element, options = {}) {
      if (!element) return element;
      
      return StyleUtils.applyGlassmorphism(element, options);
    },
    
    /**
     * Create a custom scrollbar for an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Scrollbar options
     * @returns {HTMLElement} The element with custom scrollbar
     */
    createCustomScrollbar(element, options = {}) {
      if (!element) return element;
      
      return StyleUtils.createCustomScrollbar(element, options);
    },
    
    /**
     * Clear the DOM element cache
     * 
     * @param {string} key - Optional key to clear specific element
     */
    clearDOMCache(key = null) {
      if (!this._domCache) return;
      
      if (key) {
        delete this._domCache[key];
        // Also clear array version if it exists
        delete this._domCache[`${key}[]`];
      } else {
        this._domCache = {};
      }
    },
    
    /**
     * Get the DOM element cache
     * 
     * @returns {Object} DOM element cache
     */
    getDOMCache() {
      return this._domCache || {};
    }
  }
};
