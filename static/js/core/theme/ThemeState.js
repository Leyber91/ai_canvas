/**
 * core/theme/ThemeState.js
 * 
 * State management for theme-related properties
 * Tracks theme state and notifies subscribers of changes
 */

export class ThemeState {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} options.eventBus - Event bus for state change notifications
   * @param {Object} options.initialState - Initial state values
   */
  constructor(options = {}) {
    this.eventBus = options.eventBus;
    
    // Initialize state
    this._state = {
      currentTheme: 'dark',
      isDarkTheme: true,
      useSystemTheme: false,
      workflowPanelExpanded: false,
      conversationPanelCollapsed: false,
      activeNodeId: null,
      highlightedElements: new Set(),
      ...(options.initialState || {})
    };
    
    // Subscribers
    this.subscribers = new Map();
    
    // Bind methods
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.notifySubscribers = this.notifySubscribers.bind(this);
    this.resetState = this.resetState.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
    this.applySnapshot = this.applySnapshot.bind(this);
  }
  
  /**
   * Get current theme
   * 
   * @returns {string} Current theme name
   */
  get currentTheme() {
    return this._state.currentTheme;
  }
  
  /**
   * Set current theme
   * 
   * @param {string} value - Theme name
   */
  set currentTheme(value) {
    const oldValue = this._state.currentTheme;
    if (oldValue !== value) {
      this._state.currentTheme = value;
      this.notifySubscribers('currentTheme', value, oldValue);
    }
  }
  
  /**
   * Get dark theme flag
   * 
   * @returns {boolean} Whether dark theme is active
   */
  get isDarkTheme() {
    return this._state.isDarkTheme;
  }
  
  /**
   * Set dark theme flag
   * 
   * @param {boolean} value - Dark theme flag
   */
  set isDarkTheme(value) {
    const oldValue = this._state.isDarkTheme;
    if (oldValue !== value) {
      this._state.isDarkTheme = value;
      this.notifySubscribers('isDarkTheme', value, oldValue);
    }
  }
  
  /**
   * Get system theme preference flag
   * 
   * @returns {boolean} Whether to use system theme preference
   */
  get useSystemTheme() {
    return this._state.useSystemTheme;
  }
  
  /**
   * Set system theme preference flag
   * 
   * @param {boolean} value - System theme preference flag
   */
  set useSystemTheme(value) {
    const oldValue = this._state.useSystemTheme;
    if (oldValue !== value) {
      this._state.useSystemTheme = value;
      this.notifySubscribers('useSystemTheme', value, oldValue);
    }
  }
  
  /**
   * Get workflow panel expanded state
   * 
   * @returns {boolean} Whether workflow panel is expanded
   */
  get workflowPanelExpanded() {
    return this._state.workflowPanelExpanded;
  }
  
  /**
   * Set workflow panel expanded state
   * 
   * @param {boolean} value - Expanded state
   */
  set workflowPanelExpanded(value) {
    const oldValue = this._state.workflowPanelExpanded;
    if (oldValue !== value) {
      this._state.workflowPanelExpanded = value;
      this.notifySubscribers('workflowPanelExpanded', value, oldValue);
      
      // Publish panel state event
      if (this.eventBus) {
        this.eventBus.publish('panel:state-changed', {
          panelType: 'workflow',
          state: { expanded: value }
        });
      }
    }
  }
  
  /**
   * Get conversation panel collapsed state
   * 
   * @returns {boolean} Whether conversation panel is collapsed
   */
  get conversationPanelCollapsed() {
    return this._state.conversationPanelCollapsed;
  }
  
  /**
   * Set conversation panel collapsed state
   * 
   * @param {boolean} value - Collapsed state
   */
  set conversationPanelCollapsed(value) {
    const oldValue = this._state.conversationPanelCollapsed;
    if (oldValue !== value) {
      this._state.conversationPanelCollapsed = value;
      this.notifySubscribers('conversationPanelCollapsed', value, oldValue);
      
      // Publish panel state event
      if (this.eventBus) {
        this.eventBus.publish('panel:state-changed', {
          panelType: 'conversation',
          state: { expanded: !value }
        });
      }
    }
  }
  
  /**
   * Get active node ID
   * 
   * @returns {string|null} Active node ID
   */
  get activeNodeId() {
    return this._state.activeNodeId;
  }
  
  /**
   * Set active node ID
   * 
   * @param {string|null} value - Node ID
   */
  set activeNodeId(value) {
    const oldValue = this._state.activeNodeId;
    if (oldValue !== value) {
      this._state.activeNodeId = value;
      this.notifySubscribers('activeNodeId', value, oldValue);
    }
  }
  
  /**
   * Get highlighted elements
   * 
   * @returns {Set} Set of highlighted element IDs
   */
  get highlightedElements() {
    return this._state.highlightedElements;
  }
  
  /**
   * Add highlighted element
   * 
   * @param {string} elementId - Element ID
   */
  addHighlightedElement(elementId) {
    if (!this._state.highlightedElements.has(elementId)) {
      this._state.highlightedElements.add(elementId);
      this.notifySubscribers('highlightedElements', this._state.highlightedElements, null);
    }
  }
  
  /**
   * Remove highlighted element
   * 
   * @param {string} elementId - Element ID
   */
  removeHighlightedElement(elementId) {
    if (this._state.highlightedElements.has(elementId)) {
      this._state.highlightedElements.delete(elementId);
      this.notifySubscribers('highlightedElements', this._state.highlightedElements, null);
    }
  }
  
  /**
   * Clear all highlighted elements
   */
  clearHighlightedElements() {
    if (this._state.highlightedElements.size > 0) {
      this._state.highlightedElements.clear();
      this.notifySubscribers('highlightedElements', this._state.highlightedElements, null);
    }
  }
  
  /**
   * Subscribe to property changes
   * 
   * @param {string} property - Property name
   * @param {Function} callback - Callback function(newValue, oldValue)
   * @returns {Function} Unsubscribe function
   */
  subscribe(property, callback) {
    if (typeof callback !== 'function') {
      console.warn('Cannot subscribe with non-function callback');
      return () => {};
    }
    
    // Get subscribers for this property
    if (!this.subscribers.has(property)) {
      this.subscribers.set(property, new Set());
    }
    
    const propertySubscribers = this.subscribers.get(property);
    propertySubscribers.add(callback);
    
    // Return unsubscribe function
    return () => this.unsubscribe(property, callback);
  }
  
  /**
   * Unsubscribe from property changes
   * 
   * @param {string} property - Property name
   * @param {Function} callback - Callback function
   */
  unsubscribe(property, callback) {
    if (!this.subscribers.has(property)) {
      return;
    }
    
    const propertySubscribers = this.subscribers.get(property);
    propertySubscribers.delete(callback);
    
    // Clean up empty subscriber sets
    if (propertySubscribers.size === 0) {
      this.subscribers.delete(property);
    }
  }
  
  /**
   * Notify subscribers of property change
   * 
   * @private
   * @param {string} property - Property name
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  notifySubscribers(property, newValue, oldValue) {
    // Skip if no subscribers
    if (!this.subscribers.has(property)) {
      return;
    }
    
    // Notify all subscribers
    const propertySubscribers = this.subscribers.get(property);
    propertySubscribers.forEach(callback => {
      try {
        callback(newValue, oldValue);
      } catch (error) {
        console.error(`Error in theme state subscriber for ${property}:`, error);
      }
    });
    
    // Publish state change event
    if (this.eventBus) {
      this.eventBus.publish(`theme:state-changed:${property}`, {
        property,
        newValue,
        oldValue
      });
    }
  }
  
  /**
   * Reset state to default values
   */
  resetState() {
    const defaultState = {
      currentTheme: 'dark',
      isDarkTheme: true,
      useSystemTheme: false,
      workflowPanelExpanded: false,
      conversationPanelCollapsed: false,
      activeNodeId: null,
      highlightedElements: new Set()
    };
    
    // Apply default state
    this.applySnapshot(defaultState);
  }
  
  /**
   * Get current state snapshot
   * 
   * @returns {Object} State snapshot
   */
  getSnapshot() {
    // Create a copy of the state
    const snapshot = { ...this._state };
    
    // Convert Set to Array for serialization
    snapshot.highlightedElements = Array.from(this._state.highlightedElements);
    
    return snapshot;
  }
  
  /**
   * Apply state snapshot
   * 
   * @param {Object} snapshot - State snapshot
   */
  applySnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      console.warn('Invalid state snapshot');
      return;
    }
    
    // Apply each property
    Object.entries(snapshot).forEach(([key, value]) => {
      // Handle special cases
      if (key === 'highlightedElements') {
        // Convert Array back to Set
        this._state.highlightedElements.clear();
        if (Array.isArray(value)) {
          value.forEach(id => this._state.highlightedElements.add(id));
        }
        this.notifySubscribers('highlightedElements', this._state.highlightedElements, null);
      } else {
        // Use property setters for other properties
        if (key in this && this[key] !== value) {
          this[key] = value;
        }
      }
    });
  }
}

// Create singleton instance
export const themeState = new ThemeState();
