/**
 * ui/utils/DOMElementFinder.js
 * 
 * Enhanced DOM Element Finder that provides a centralized registry for all DOM elements.
 * Features caching, error handling, and dependency injection for DOM elements.
 */

export class DOMElementFinder {
    /**
     * @param {Object} options - Configuration options
     * @param {boolean} options.strictMode - Whether to throw errors for missing elements (default: false)
     * @param {boolean} options.enableWarnings - Whether to log warnings for missing elements (default: true)
     * @param {boolean} options.enableCache - Whether to cache element references (default: true)
     * @param {string} options.appRootSelector - Selector for the application root element (default: 'body')
     */
    constructor(options = {}) {
      this.options = {
        strictMode: false,
        enableWarnings: true,
        enableCache: true,
        appRootSelector: 'body',
        ...options
      };
      
      // Element cache
      this.elementCache = new Map();
      
      // Element definitions by category
      this.elementDefinitions = {
        core: {},
        workflow: {},
        conversation: {},
        modals: {},
        controls: {},
        theme: {},
        custom: {}
      };
      
      // Element references by manager
      this.managerElements = new Map();
      
      // Element dependency map
      this.dependencies = new Map();
    }
    
    /**
     * Register element definitions by category
     * 
     * @param {string} category - Category name (core, workflow, conversation, etc.)
     * @param {Object} definitions - Map of element keys to selectors
     * @returns {DOMElementFinder} - This instance for chaining
     */
    registerElements(category, definitions) {
      if (!this.elementDefinitions[category]) {
        this.elementDefinitions[category] = {};
      }
      
      Object.assign(this.elementDefinitions[category], definitions);
      
      // Clear cache for these elements to ensure fresh lookups
      if (this.options.enableCache) {
        Object.keys(definitions).forEach(key => {
          this.elementCache.delete(key);
        });
      }
      
      return this;
    }
    
    /**
     * Register elements for a specific manager
     * 
     * @param {string} managerName - Name of the manager (e.g., 'UIManager', 'ThemeManager')
     * @param {string[]} elementKeys - Array of element keys this manager uses
     * @returns {DOMElementFinder} - This instance for chaining
     */
    registerManager(managerName, elementKeys) {
      if (!this.managerElements.has(managerName)) {
        this.managerElements.set(managerName, new Set());
      }
      
      const managerSet = this.managerElements.get(managerName);
      elementKeys.forEach(key => managerSet.add(key));
      
      return this;
    }
    
    /**
     * Register a dependency between managers
     * 
     * @param {string} dependentManager - Name of the dependent manager
     * @param {string} dependencyManager - Name of the manager being depended on
     * @returns {DOMElementFinder} - This instance for chaining
     */
    registerDependency(dependentManager, dependencyManager) {
      if (!this.dependencies.has(dependentManager)) {
        this.dependencies.set(dependentManager, new Set());
      }
      
      this.dependencies.get(dependentManager).add(dependencyManager);
      
      return this;
    }
    
    /**
     * Find all registered elements and create an elements object
     * 
     * @returns {Object} - Object containing all found elements
     */
    findAllElements() {
      const elements = {};
      
      // Combine all element definitions
      const allDefinitions = {};
      Object.values(this.elementDefinitions).forEach(categoryDefs => {
        Object.assign(allDefinitions, categoryDefs);
      });
      
      // Find each element
      Object.entries(allDefinitions).forEach(([key, selector]) => {
        elements[key] = this.findElement(key, selector);
      });
      
      return elements;
    }
    
    /**
     * Find elements for a specific manager
     * 
     * @param {string} managerName - Name of the manager
     * @returns {Object} - Object containing elements needed by this manager
     */
    findElementsForManager(managerName) {
      const elements = {};
      
      // Get elements directly registered to this manager
      if (this.managerElements.has(managerName)) {
        this.managerElements.get(managerName).forEach(key => {
          // Find the selector for this key
          let selector = null;
          for (const category in this.elementDefinitions) {
            if (this.elementDefinitions[category][key]) {
              selector = this.elementDefinitions[category][key];
              break;
            }
          }
          
          if (selector) {
            elements[key] = this.findElement(key, selector);
          }
        });
      }
      
      // Add elements from dependencies
      if (this.dependencies.has(managerName)) {
        this.dependencies.get(managerName).forEach(depManager => {
          // Recursively get elements from dependency
          const depElements = this.findElementsForManager(depManager);
          // Only add elements that don't already exist
          Object.entries(depElements).forEach(([key, element]) => {
            if (!elements[key]) {
              elements[key] = element;
            }
          });
        });
      }
      
      return elements;
    }
    
    /**
     * Find a specific element by key or selector
     * 
     * @param {string} key - Element key for caching and error reporting
     * @param {string|Function} selector - CSS selector or function that returns an element
     * @param {boolean} forceRefresh - Whether to bypass cache and force a fresh lookup
     * @returns {HTMLElement|null} - Found element or null if not found
     */
    findElement(key, selector, forceRefresh = false) {
      // Check cache first if enabled and not forcing refresh
      if (this.options.enableCache && !forceRefresh && this.elementCache.has(key)) {
        return this.elementCache.get(key);
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
      
      // Cache the result if caching is enabled
      if (this.options.enableCache && element) {
        this.elementCache.set(key, element);
      }
      
      // Handle missing element
      if (!element) {
        this.handleMissingElement(key, selector);
      }
      
      return element;
    }
    
    /**
     * Find elements by key or selector
     * 
     * @param {string} key - Element key for caching and error reporting
     * @param {string} selector - CSS selector
     * @param {boolean} forceRefresh - Whether to bypass cache and force a fresh lookup
     * @returns {NodeList|Array} - Found elements or empty array if none found
     */
    findElements(key, selector, forceRefresh = false) {
      // Check cache first if enabled and not forcing refresh
      if (this.options.enableCache && !forceRefresh && this.elementCache.has(`${key}[]`)) {
        return this.elementCache.get(`${key}[]`);
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
      
      // Cache the result if caching is enabled
      if (this.options.enableCache && elements.length > 0) {
        this.elementCache.set(`${key}[]`, elements);
      }
      
      // Handle missing elements
      if (elements.length === 0) {
        this.handleMissingElement(key, selector, true);
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
      const originalStrictMode = this.options.strictMode;
      
      // Temporarily change strict mode based on required flag
      this.options.strictMode = required;
      
      const element = this.findElement(id, `#${id}`);
      
      // Restore original strict mode
      this.options.strictMode = originalStrictMode;
      
      return element;
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
      const originalStrictMode = this.options.strictMode;
      
      // Temporarily change strict mode based on required flag
      this.options.strictMode = required;
      
      const element = this.findElement(key, selector);
      
      // Restore original strict mode
      this.options.strictMode = originalStrictMode;
      
      return element;
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
      const originalStrictMode = this.options.strictMode;
      
      // Temporarily change strict mode based on required flag
      this.options.strictMode = required;
      
      const elements = this.findElements(key, selector);
      
      // Restore original strict mode
      this.options.strictMode = originalStrictMode;
      
      return elements;
    }
    
    /**
     * Handle a missing element
     * 
     * @param {string} key - Element key
     * @param {string|Function} selector - Selector used to find the element
     * @param {boolean} multiple - Whether this was looking for multiple elements
     */
    handleMissingElement(key, selector, multiple = false) {
      const selectorStr = typeof selector === 'function' ? 'function()' : selector;
      const message = multiple ? 
        `No elements found for selector "${selectorStr}" (${key})` :
        `Element not found for selector "${selectorStr}" (${key})`;
      
      if (this.options.strictMode) {
        throw new Error(message);
      } else if (this.options.enableWarnings) {
        console.warn(message);
      }
    }
    
    /**
     * Handle an error during element finding
     * 
     * @param {string} message - Error message prefix
     * @param {Error} error - Original error
     */
    handleError(message, error) {
      if (this.options.strictMode) {
        throw new Error(`${message} ${error.message}`);
      } else if (this.options.enableWarnings) {
        console.error(message, error);
      }
    }
    
    /**
     * Clear the element cache for a specific key or all keys
     * 
     * @param {string} key - Optional element key to clear
     * @returns {DOMElementFinder} - This instance for chaining
     */
    clearCache(key = null) {
      if (key) {
        this.elementCache.delete(key);
        this.elementCache.delete(`${key}[]`);
      } else {
        this.elementCache.clear();
      }
      
      return this;
    }
    
    /**
     * Refresh the element cache for a specific key or all keys
     * 
     * @param {string} key - Optional element key to refresh
     * @returns {DOMElementFinder} - This instance for chaining
     */
    refreshCache(key = null) {
      // If no key, refresh all elements
      if (!key) {
        // Get all element definitions
        const allDefinitions = {};
        Object.values(this.elementDefinitions).forEach(categoryDefs => {
          Object.assign(allDefinitions, categoryDefs);
        });
        
        // Refresh each element
        Object.entries(allDefinitions).forEach(([elemKey, selector]) => {
          this.findElement(elemKey, selector, true);
        });
        
        return this;
      }
      
      // Find the selector for this key
      let selector = null;
      for (const category in this.elementDefinitions) {
        if (this.elementDefinitions[category][key]) {
          selector = this.elementDefinitions[category][key];
          break;
        }
      }
      
      if (selector) {
        this.findElement(key, selector, true);
      }
      
      return this;
    }
    
    /**
     * Create element getter functions for a manager
     * 
     * @param {Object} manager - Manager instance
     * @param {string} managerName - Name of the manager
     * @returns {Object} - Object with getter functions
     */
    createElementGetters(manager, managerName) {
      const getters = {};
      
      // Get all element keys for this manager
      const keys = new Set();
      if (this.managerElements.has(managerName)) {
        this.managerElements.get(managerName).forEach(key => keys.add(key));
      }
      
      // Add elements from dependencies
      if (this.dependencies.has(managerName)) {
        this.dependencies.get(managerName).forEach(depManager => {
          if (this.managerElements.has(depManager)) {
            this.managerElements.get(depManager).forEach(key => keys.add(key));
          }
        });
      }
      
      // Create a getter for each key
      keys.forEach(key => {
        const camelCaseKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
        const getterName = `get${camelCaseKey.charAt(0).toUpperCase() + camelCaseKey.slice(1)}Element`;
        
        getters[getterName] = () => {
          // Find the selector for this key
          let selector = null;
          for (const category in this.elementDefinitions) {
            if (this.elementDefinitions[category][key]) {
              selector = this.elementDefinitions[category][key];
              break;
            }
          }
          
          if (selector) {
            return this.findElement(key, selector);
          }
          
          return null;
        };
      });
      
      return getters;
    }
    
    /**
     * Define standard core elements
     * 
     * @returns {DOMElementFinder} - This instance for chaining
     */
    defineStandardElements() {
      // Core UI elements
      this.registerElements('core', {
        'app-root': '#app-root',
        'main-container': '#main-container',
        'graph-container': '#graph-container',
        'sidebar': '#sidebar',
        'header': 'header',
        'footer': 'footer'
      });
      
      // Workflow-related elements
      this.registerElements('workflow', {
        'workflow-panel': '#workflow-panel',
        'workflow-panel-container': '.workflow-panel-container',
        'workflow-controls': '.workflow-controls',
        'execute-workflow-btn': '#execute-workflow-btn',
        'stop-execution-btn': '#stop-execution-btn',
        'validate-workflow-btn': '#validate-workflow-btn',
        'workflow-status': '.workflow-status',
        'workflow-progress': '.workflow-progress',
        'workflow-results': '.workflow-results'
      });
      
      // Conversation-related elements
      this.registerElements('conversation', {
        'conversation-panel': '#conversation-panel',
        'chat-messages': '#chat-messages',
        'chat-input': '#chat-input',
        'send-btn': '#send-btn',
        'active-node-title': '#active-node-title',
        'node-details': '#node-details',
        'panel-toggle': '#panel-toggle'
      });
      
      // Modal-related elements
      this.registerElements('modals', {
        'node-modal': '#node-modal',
        'node-form': '#node-form',
        'close-modal-btn': '.close',
        'cancel-btn': '#cancel-btn',
        'save-btn': '#save-btn'
      });
      
      // Control elements
      this.registerElements('controls', {
        'add-node-btn': '#add-node-btn',
        'save-graph-btn': '#save-graph-btn',
        'load-graph-btn': '#load-graph-btn',
        'clear-graph-btn': '#clear-graph-btn',
        'reset-db-btn': '#reset-db-btn',
        'backend-select': '#backend-select',
        'model-select': '#model-select',
        'temperature-input': '#temperature',
        'temperature-value': '#temperature-value'
      });
      
      return this;
    }
    
    /**
     * Initialize the element finder with standard elements and managers
     * 
     * @returns {DOMElementFinder} - This instance for chaining
     */
    initialize() {
      // Define standard elements
      this.defineStandardElements();
      
      // Register standard managers
      this.registerManager('UIManager', [
        'app-root', 'main-container', 'graph-container', 'add-node-btn', 
        'save-graph-btn', 'load-graph-btn', 'execute-workflow-btn', 
        'node-modal', 'node-form', 'close-modal-btn', 'cancel-btn',
        'backend-select', 'model-select', 'temperature-input', 'temperature-value',
        'active-node-title', 'node-details', 'chat-messages', 'chat-input', 'send-btn',
        'workflow-controls'
      ]);
      
      this.registerManager('ThemeManager', [
        'conversation-panel', 'workflow-panel', 'workflow-panel-container'
      ]);
      
      this.registerManager('ConversationPanelManager', [
        'conversation-panel', 'chat-messages', 'chat-input', 'send-btn', 'panel-toggle'
      ]);
      
      this.registerManager('WorkflowPanelManager', [
        'workflow-panel', 'workflow-panel-container', 'execute-workflow-btn',
        'stop-execution-btn', 'validate-workflow-btn', 'workflow-status',
        'workflow-progress', 'workflow-results'
      ]);
      
      this.registerManager('NodeModalManager', [
        'node-modal', 'node-form', 'close-modal-btn', 'cancel-btn', 'save-btn',
        'backend-select', 'model-select', 'temperature-input', 'temperature-value'
      ]);
      
      // Register dependencies
      this.registerDependency('ThemeManager', 'UIManager');
      this.registerDependency('ConversationPanelManager', 'UIManager');
      this.registerDependency('WorkflowPanelManager', 'UIManager');
      this.registerDependency('NodeModalManager', 'UIManager');
      
      return this;
    }
    
    /**
     * Static method to create and initialize an instance
     * 
     * @param {Object} options - Configuration options
     * @returns {DOMElementFinder} - Initialized instance
     */
    static create(options = {}) {
      return new DOMElementFinder(options).initialize();
    }
  }