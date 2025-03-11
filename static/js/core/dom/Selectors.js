/**
 * core/dom/Selectors.js
 * 
 * Registry of selector definitions for consistent DOM element access.
 * Centralizes selector management and provides lookup functionality.
 */

export class Selectors {
  constructor() {
    // Selector definitions by category
    this.definitions = {
      core: {},
      workflow: {},
      conversation: {},
      modals: {},
      controls: {},
      theme: {},
      custom: {}
    };
    
    // Initialize with default selectors
    this.registerDefaults();
  }
  
  /**
   * Register selectors for a specific category
   * 
   * @param {string} category - Category name (core, workflow, conversation, etc.)
   * @param {Object} definitions - Map of element keys to selectors
   * @returns {Selectors} - This instance for chaining
   */
  register(category, definitions) {
    if (!this.definitions[category]) {
      this.definitions[category] = {};
    }
    
    Object.assign(this.definitions[category], definitions);
    return this;
  }
  
  /**
   * Get a selector by key
   * 
   * @param {string} key - Element key
   * @returns {string|null} - Selector or null if not found
   */
  get(key) {
    // Search through all categories
    for (const category in this.definitions) {
      if (this.definitions[category][key]) {
        return this.definitions[category][key];
      }
    }
    
    return null;
  }
  
  /**
   * Find an element using a selector key
   * 
   * @param {string} key - Element key
   * @returns {HTMLElement|null} - Found element or null
   */
  find(key) {
    const selector = this.get(key);
    if (!selector) return null;
    
    return typeof selector === 'function' 
      ? selector()
      : document.querySelector(selector);
  }
  
  /**
   * Find all elements for a selector key
   * 
   * @param {string} key - Element key
   * @returns {NodeList|Array} - Found elements or empty array
   */
  findAll(key) {
    const selector = this.get(key);
    if (!selector) return [];
    
    return typeof selector === 'function'
      ? selector()
      : document.querySelectorAll(selector);
  }
  
  /**
   * Get all selectors for a category
   * 
   * @param {string} category - Category name
   * @returns {Object} - Map of keys to selectors
   */
  getCategory(category) {
    return this.definitions[category] || {};
  }
  
  /**
   * Get all registered selectors
   * 
   * @returns {Object} - Map of all selectors by category
   */
  getAll() {
    return this.definitions;
  }
  
  /**
   * Get all selector keys
   * 
   * @returns {Array<string>} - Array of all selector keys
   */
  getKeys() {
    const keys = [];
    
    for (const category in this.definitions) {
      keys.push(...Object.keys(this.definitions[category]));
    }
    
    return keys;
  }
  
  /**
   * Check if a selector key is registered
   * 
   * @param {string} key - Element key
   * @returns {boolean} - True if key is registered
   */
  has(key) {
    return this.get(key) !== null;
  }
  
  /**
   * Register default selectors
   * 
   * @private
   */
  registerDefaults() {
    // Core UI elements
    this.register('core', {
      'app-root': '#app-root',
      'main-container': '#main-container',
      'graph-container': '#graph-container',
      'sidebar': '#sidebar',
      'header': 'header',
      'footer': 'footer'
    });
    
    // Workflow-related elements
    this.register('workflow', {
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
    this.register('conversation', {
      'conversation-panel': '#conversation-panel',
      'chat-messages': '#chat-messages',
      'chat-input': '#chat-input',
      'send-btn': '#send-btn',
      'active-node-title': '#active-node-title',
      'node-details': '#node-details',
      'panel-toggle': '#panel-toggle'
    });
    
    // Modal-related elements
    this.register('modals', {
      'node-modal': '#node-modal',
      'node-form': '#node-form',
      'close-modal-btn': '.close',
      'cancel-btn': '#cancel-btn',
      'save-btn': '#save-btn'
    });
    
    // Control elements
    this.register('controls', {
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
  }
}
