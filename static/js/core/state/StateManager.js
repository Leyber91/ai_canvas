/**
 * core/state/StateManager.js
 * 
 * Centralized state management system with subscription capabilities.
 * Provides a single source of truth for application state.
 */

export class StateManager {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} options.eventBus - Event bus for state change notifications
   * @param {Object} options.initialState - Initial state values
   */
  constructor(options = {}) {
    this.eventBus = options.eventBus;
    
    // Initialize state storage
    this.state = {
      // Panel states
      panels: {
        workflow: { expanded: false },
        conversation: { expanded: true },
        ...(options.initialState?.panels || {})
      },
      
      // UI state
      ui: {
        theme: 'space',
        darkMode: true,
        ...(options.initialState?.ui || {})
      },
      
      // Application state
      app: {
        initialized: false,
        loading: false,
        ...(options.initialState?.app || {})
      },
      
      // User preferences
      preferences: {
        ...(options.initialState?.preferences || {})
      },
      
      // Custom state sections
      custom: {
        ...(options.initialState?.custom || {})
      }
    };
    
    // Subscription registry
    this.subscribers = {
      // Global state change subscribers
      global: [],
      
      // Section-specific subscribers
      panels: {},
      ui: {},
      app: {},
      preferences: {},
      custom: {}
    };
    
    // Bind methods
    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }
  
  /**
   * Get a state value by path
   * 
   * @param {string} path - State path (e.g., 'panels.workflow.expanded')
   * @param {any} defaultValue - Default value if path not found
   * @returns {any} State value
   */
  getState(path, defaultValue = null) {
    // Handle empty path
    if (!path) return this.state;
    
    // Split path into parts
    const parts = path.split('.');
    let current = this.state;
    
    // Traverse path
    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  }
  
  /**
   * Set a state value by path
   * 
   * @param {string} path - State path (e.g., 'panels.workflow.expanded')
   * @param {any} value - New state value
   * @param {boolean} silent - Whether to suppress notifications
   * @returns {StateManager} This instance for chaining
   */
  setState(path, value, silent = false) {
    // Handle empty path
    if (!path) {
      console.warn('[StateManager] Cannot set state with empty path');
      return this;
    }
    
    // Split path into parts
    const parts = path.split('.');
    const lastPart = parts.pop();
    let current = this.state;
    
    // Create path if it doesn't exist
    for (const part of parts) {
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Check if value actually changed
    const oldValue = current[lastPart];
    const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(value);
    
    // Update value
    current[lastPart] = value;
    
    // Notify subscribers if value changed and not silent
    if (hasChanged && !silent) {
      this.notifySubscribers(path, value, oldValue);
    }
    
    return this;
  }
  
  /**
   * Subscribe to state changes
   * 
   * @param {string} path - State path to subscribe to (empty for all changes)
   * @param {Function} callback - Callback function(newValue, oldValue, path)
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (typeof callback !== 'function') {
      console.warn('[StateManager] Cannot subscribe with non-function callback');
      return () => {};
    }
    
    // Create subscriber object
    const subscriber = { callback, id: Math.random().toString(36).substring(2, 11) };
    
    // Handle global subscription
    if (!path) {
      this.subscribers.global.push(subscriber);
      return () => this.unsubscribe(null, subscriber);
    }
    
    // Get section and key from path
    const parts = path.split('.');
    const section = parts[0];
    
    // Ensure section exists in subscribers
    if (!this.subscribers[section]) {
      this.subscribers[section] = {};
    }
    
    // Store subscriber
    if (!this.subscribers[section][path]) {
      this.subscribers[section][path] = [];
    }
    this.subscribers[section][path].push(subscriber);
    
    // Return unsubscribe function
    return () => this.unsubscribe(path, subscriber);
  }
  
  /**
   * Unsubscribe from state changes
   * 
   * @param {string} path - State path
   * @param {Object} subscriber - Subscriber object
   */
  unsubscribe(path, subscriber) {
    // Handle global unsubscription
    if (!path) {
      const index = this.subscribers.global.indexOf(subscriber);
      if (index !== -1) {
        this.subscribers.global.splice(index, 1);
      }
      return;
    }
    
    // Get section and key from path
    const parts = path.split('.');
    const section = parts[0];
    
    // Check if section and path exist
    if (!this.subscribers[section] || !this.subscribers[section][path]) {
      return;
    }
    
    // Remove subscriber
    const index = this.subscribers[section][path].indexOf(subscriber);
    if (index !== -1) {
      this.subscribers[section][path].splice(index, 1);
    }
    
    // Clean up empty arrays
    if (this.subscribers[section][path].length === 0) {
      delete this.subscribers[section][path];
    }
  }
  
  /**
   * Notify subscribers of state changes
   * 
   * @param {string} path - State path that changed
   * @param {any} newValue - New state value
   * @param {any} oldValue - Old state value
   * @private
   */
  notifySubscribers(path, newValue, oldValue) {
    // Get section from path
    const parts = path.split('.');
    const section = parts[0];
    
    // Notify global subscribers
    this.subscribers.global.forEach(subscriber => {
      try {
        subscriber.callback(newValue, oldValue, path);
      } catch (error) {
        console.error(`[StateManager] Error in global subscriber: ${error.message}`);
      }
    });
    
    // Notify section subscribers
    if (this.subscribers[section]) {
      // Notify exact path subscribers
      if (this.subscribers[section][path]) {
        this.subscribers[section][path].forEach(subscriber => {
          try {
            subscriber.callback(newValue, oldValue, path);
          } catch (error) {
            console.error(`[StateManager] Error in path subscriber: ${error.message}`);
          }
        });
      }
      
      // Notify parent path subscribers
      let currentPath = path;
      while (currentPath.includes('.')) {
        currentPath = currentPath.substring(0, currentPath.lastIndexOf('.'));
        if (this.subscribers[section][currentPath]) {
          const pathValue = this.getState(currentPath);
          this.subscribers[section][currentPath].forEach(subscriber => {
            try {
              subscriber.callback(pathValue, null, currentPath);
            } catch (error) {
              console.error(`[StateManager] Error in parent path subscriber: ${error.message}`);
            }
          });
        }
      }
    }
    
    // Publish state change event if event bus available
    if (this.eventBus) {
      try {
        this.eventBus.publish(`state:changed:${path}`, {
          path,
          newValue,
          oldValue,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error(`[StateManager] Error publishing state change: ${error.message}`);
      }
    }
  }
  
  /**
   * Get panel state
   * 
   * @param {string} panelType - Panel type
   * @returns {Object} Panel state
   */
  getPanelState(panelType) {
    return this.getState(`panels.${panelType}`, { expanded: true });
  }
  
  /**
   * Set panel state
   * 
   * @param {string} panelType - Panel type
   * @param {Object} state - New panel state
   * @returns {StateManager} This instance for chaining
   */
  setPanelState(panelType, state) {
    // Get current state
    const currentState = this.getPanelState(panelType);
    
    // Merge with new state
    const newState = { ...currentState, ...state };
    
    // Update state
    this.setState(`panels.${panelType}`, newState);
    
    // Publish panel state changed event if event bus available
    if (this.eventBus) {
      this.eventBus.publish('panel:state-changed', {
        panelType,
        state: newState
      });
    }
    
    return this;
  }
  
  /**
   * Check if a panel is expanded
   * 
   * @param {string} panelType - Panel type
   * @returns {boolean} Whether the panel is expanded
   */
  isPanelExpanded(panelType) {
    return this.getState(`panels.${panelType}.expanded`, true);
  }
  
  /**
   * Set panel expanded state
   * 
   * @param {string} panelType - Panel type
   * @param {boolean} expanded - Whether the panel should be expanded
   * @returns {StateManager} This instance for chaining
   */
  setPanelExpanded(panelType, expanded) {
    return this.setPanelState(panelType, { expanded });
  }
  
  /**
   * Toggle panel expanded state
   * 
   * @param {string} panelType - Panel type
   * @returns {boolean} New expanded state
   */
  togglePanelExpanded(panelType) {
    const currentExpanded = this.isPanelExpanded(panelType);
    this.setPanelExpanded(panelType, !currentExpanded);
    return !currentExpanded;
  }
  
  /**
   * Reset state to initial values
   * 
   * @param {string} section - Optional section to reset
   * @returns {StateManager} This instance for chaining
   */
  resetState(section = null) {
    if (section) {
      // Reset specific section
      const initialSection = {
        panels: {
          workflow: { expanded: false },
          conversation: { expanded: true }
        },
        ui: {
          theme: 'space',
          darkMode: true
        },
        app: {
          initialized: false,
          loading: false
        },
        preferences: {},
        custom: {}
      }[section] || {};
      
      this.setState(section, initialSection);
    } else {
      // Reset all state
      this.state = {
        panels: {
          workflow: { expanded: false },
          conversation: { expanded: true }
        },
        ui: {
          theme: 'space',
          darkMode: true
        },
        app: {
          initialized: false,
          loading: false
        },
        preferences: {},
        custom: {}
      };
      
      // Notify global subscribers
      this.subscribers.global.forEach(subscriber => {
        try {
          subscriber.callback(this.state, null, '');
        } catch (error) {
          console.error(`[StateManager] Error in global subscriber during reset: ${error.message}`);
        }
      });
      
      // Publish state reset event if event bus available
      if (this.eventBus) {
        this.eventBus.publish('state:reset', {
          timestamp: Date.now()
        });
      }
    }
    
    return this;
  }
  
  /**
   * Get all state
   * 
   * @returns {Object} Complete state object
   */
  getAllState() {
    return { ...this.state };
  }
}

// Create singleton instance
export const stateManager = new StateManager();
