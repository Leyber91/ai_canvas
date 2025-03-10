/**
 * ui/registry/DOMElementRegistry.js
 * 
 * Central registry for DOM elements with consistent access patterns.
 * Uses singleton pattern to ensure only one instance exists throughout the application.
 */

export class DOMElementRegistry {
    constructor() {
      // Private registry of elements
      this.elements = {};
      
      // Track which elements have been requested but not found
      this.missingElements = new Set();
      
      // Default element selectors for the application
      this.selectors = {
        // Core UI elements
        'addNodeBtn': '#add-node-btn',
        'saveGraphBtn': '#save-graph-btn',
        'loadGraphBtn': '#load-graph-btn',
        'executeWorkflowBtn': '#execute-workflow-btn',
        
        // Conversation panel elements
        'conversationPanel': '#conversation-panel',
        'activeNodeTitle': '#active-node-title',
        'nodeDetails': '#node-details',
        'chatMessages': '#chat-messages',
        'chatInput': '#chat-input',
        'sendBtn': '#send-btn',
        'panelToggle': '#panel-toggle',
        
        // Modal elements
        'nodeModal': '#node-modal',
        'nodeForm': '#node-form',
        'closeModalBtn': '.close',
        'cancelBtn': '#cancel-btn',
        
        // Form elements
        'backendSelect': '#backend-select',
        'modelSelect': '#model-select',
        'temperatureInput': '#temperature',
        'temperatureValue': '#temperature-value',
        
        // Workflow panel elements
        'workflowPanel': '#workflow-panel',
        'workflowControls': '.workflow-controls',
        'workflowPanelContainer': '.workflow-panel-container',
        
        // Graph elements
        'canvasContainer': '#cy',
        
        // Theme elements
        'themeContainer': '#theme-container',
        'bgCanvas': '#bg-canvas',
        'tooltip': '#tooltip'
      };
    }
    
    /**
     * Get the singleton instance
     * 
     * @returns {DOMElementRegistry} The singleton instance
     */
    static getInstance() {
      if (!DOMElementRegistry.instance) {
        DOMElementRegistry.instance = new DOMElementRegistry();
      }
      return DOMElementRegistry.instance;
    }
    
    /**
     * Register custom selectors
     * 
     * @param {Object} selectors - Map of element keys to selectors
     */
    registerSelectors(selectors) {
      this.selectors = {
        ...this.selectors,
        ...selectors
      };
    }
    
    /**
     * Find an element by key
     * 
     * @param {string} key - Element key
     * @param {boolean} required - Whether the element is required
     * @returns {HTMLElement|null} Found element or null
     */
    findElement(key, required = false) {
      // Return from cache if already found
      if (this.elements[key]) {
        return this.elements[key];
      }
      
      // Get selector for the key
      const selector = this.selectors[key];
      if (!selector) {
        console.warn(`No selector defined for element key: ${key}`);
        return null;
      }
      
      // Try to find the element
      let element = null;
      if (selector.startsWith('#')) {
        // ID selector (faster lookup)
        element = document.getElementById(selector.substring(1));
      } else {
        // CSS selector
        element = document.querySelector(selector);
      }
      
      // Cache the element if found
      if (element) {
        this.elements[key] = element;
        return element;
      }
      
      // Handle missing element
      if (required && !this.missingElements.has(key)) {
        console.error(`Required DOM element not found: ${key} (selector: ${selector})`);
        this.missingElements.add(key);
      } else if (!this.missingElements.has(key)) {
        console.warn(`DOM element not found: ${key} (selector: ${selector})`);
        this.missingElements.add(key);
      }
      
      return null;
    }
    
    /**
     * Find all registered elements
     * 
     * @returns {Object} Map of element keys to DOM elements
     */
    findAllElements() {
      const foundElements = {};
      
      // Try to find each element
      Object.keys(this.selectors).forEach(key => {
        const element = this.findElement(key);
        if (element) {
          foundElements[key] = element;
        }
      });
      
      return foundElements;
    }
    
    /**
     * Get an element by key (find it if not already found)
     * 
     * @param {string} key - Element key
     * @param {boolean} required - Whether the element is required
     * @returns {HTMLElement|null} Element or null if not found
     */
    getElement(key, required = false) {
      return this.findElement(key, required);
    }
    
    /**
     * Get multiple elements by keys
     * 
     * @param {Array<string>} keys - Element keys
     * @param {boolean} required - Whether the elements are required
     * @returns {Object} Map of keys to elements
     */
    getElements(keys, required = false) {
      const result = {};
      
      keys.forEach(key => {
        const element = this.getElement(key, required);
        if (element) {
          result[key] = element;
        }
      });
      
      return result;
    }
    
    /**
     * Check if all required elements are available
     * 
     * @param {Array<string>} keys - Element keys to check
     * @returns {boolean} True if all required elements are available
     */
    checkRequiredElements(keys) {
      return keys.every(key => this.getElement(key, true) !== null);
    }
    
    /**
     * Create an element with attributes and append to DOM
     * 
     * @param {string} key - Element key to register
     * @param {string} tagName - HTML tag name
     * @param {Object} options - Element options (className, id, etc.)
     * @param {HTMLElement} parent - Parent element to append to
     * @returns {HTMLElement} Created element
     */
    createElement(key, tagName, options = {}, parent = null) {
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
      
      // Append to parent if provided
      if (parent) {
        parent.appendChild(element);
      }
      
      // Register the element
      this.elements[key] = element;
      
      // Register selector if id is provided
      if (options.id) {
        this.selectors[key] = `#${options.id}`;
      }
      
      return element;
    }
    
    /**
     * Remove an element from the registry
     * 
     * @param {string} key - Element key
     * @param {boolean} removeFromDOM - Whether to remove from DOM
     */
    removeElement(key, removeFromDOM = false) {
      const element = this.elements[key];
      
      if (element) {
        if (removeFromDOM && element.parentNode) {
          element.parentNode.removeChild(element);
        }
        
        delete this.elements[key];
        this.missingElements.delete(key);
      }
    }
    
    /**
     * Clear missing elements tracking
     */
    clearMissingElements() {
      this.missingElements.clear();
    }
    
    /**
     * Reset the registry (for testing)
     */
    reset() {
      this.elements = {};
      this.clearMissingElements();
    }
  }