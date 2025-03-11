/**
 * core/component/behaviors/ErrorHandlingBehavior.js
 * 
 * Behavior that provides error handling functionality for components.
 * Includes methods for handling errors, showing notifications, and logging.
 */

import { EventBusService } from '../../services/EventBusService.js';

export const ErrorHandlingBehavior = {
  /**
   * Initialize the behavior
   * 
   * @param {BaseComponent} component - Component to initialize with
   */
  initialize(component) {
    // Store component reference
    this.component = component;
    
    // Initialize error tracking
    component._errorHistory = component._errorHistory || [];
    component._maxErrorHistoryLength = 10;
    
    // Bind methods to component context
    if (!component.handleError) {
      component.handleError = this.handleError.bind(component);
    }
    
    if (!component.logError) {
      component.logError = this.logError.bind(component);
    }
    
    if (!component.showErrorNotification) {
      component.showErrorNotification = this.showErrorNotification.bind(component);
    }
  },
  
  /**
   * Clean up when behavior is removed
   * 
   * @param {BaseComponent} component - Component to clean up
   */
  destroy(component) {
    // Clear error history
    component._errorHistory = [];
  },
  
  // Methods to be added to the component
  methods: {
    /**
     * Handle an error with improved context and reporting
     * 
     * @param {Error|string|Object} error - Error object or message
     * @param {string} context - Error context
     * @param {Object} options - Error handling options
     * @param {boolean} options.silent - Whether to suppress notifications
     * @param {boolean} options.rethrow - Whether to rethrow the error
     */
    handleError(error, context = '', options = {}) {
      // Prevent recursive error handling
      if (this._handlingError) {
        console.warn(`[${this.name}] Skipping recursive error handling.`);
        return;
      }
      
      this._handlingError = true;
      
      try {
        // Extract error message
        let errorMessage;
        let errorObject;
        
        if (error instanceof Error) {
          errorMessage = error.message;
          errorObject = error;
        } else if (typeof error === 'string') {
          errorMessage = error;
          errorObject = new Error(error);
        } else if (error && typeof error === 'object') {
          try {
            errorMessage = JSON.stringify(error);
            errorObject = new Error(errorMessage);
            errorObject.originalError = error;
          } catch (e) {
            errorMessage = 'Object error (see console for details)';
            errorObject = new Error(errorMessage);
            errorObject.originalError = error;
            console.error('Full error object:', error);
          }
        } else {
          errorMessage = 'Unknown error occurred';
          errorObject = new Error(errorMessage);
        }
        
        // Add to error history
        this._errorHistory = this._errorHistory || [];
        this._errorHistory.unshift({
          message: errorMessage,
          context,
          timestamp: new Date(),
          error: errorObject
        });
        
        // Trim error history if needed
        if (this._errorHistory.length > this._maxErrorHistoryLength) {
          this._errorHistory.length = this._maxErrorHistoryLength;
        }
        
        // Log the error
        this.logError(errorMessage, context);
        
        // Publish error event if event bus is available
        if (this.eventBus) {
          try {
            EventBusService.publish(
              this.eventBus,
              'error',
              'occurred',
              {
                message: errorMessage,
                context: `${this.name}${context ? `:${context}` : ''}`,
                error: errorObject,
                timestamp: Date.now(),
                component: this.name
              }
            );
          } catch (eventBusError) {
            console.error(`Error publishing to event bus: ${eventBusError.message}`);
          }
        }
        
        // Show notification unless silent option is set
        if (!options.silent) {
          this.showErrorNotification(errorMessage, context);
        }
        
        // Rethrow if requested
        if (options.rethrow) {
          throw errorObject;
        }
      } finally {
        this._handlingError = false;
      }
    },
    
    /**
     * Log an error message
     * 
     * @param {string} message - Error message
     * @param {string} context - Error context
     */
    logError(message, context = '') {
      const errorContext = context ? `[${this.name}:${context}] ` : `[${this.name}] `;
      console.error(`${errorContext}Error: ${message}`);
    },
    
    /**
     * Show an error notification
     * 
     * @param {string} message - Error message
     * @param {string} context - Error context
     * @param {number} duration - Notification duration in ms
     */
    showErrorNotification(message, context = '', duration = 5000) {
      // Format message with context
      const formattedMessage = context ? 
        `Error in ${this.name} (${context}): ${message}` : 
        `Error in ${this.name}: ${message}`;
      
      // Use showNotification if available
      if (typeof this.showNotification === 'function') {
        this.showNotification(formattedMessage, 'error', duration);
      } else if (this.parent && typeof this.parent.showNotification === 'function') {
        this.parent.showNotification(formattedMessage, 'error', duration);
      } else {
        // Fallback to console
        console.error(formattedMessage);
      }
    },
    
    /**
     * Get error history
     * 
     * @returns {Array} Error history
     */
    getErrorHistory() {
      return this._errorHistory || [];
    },
    
    /**
     * Clear error history
     */
    clearErrorHistory() {
      this._errorHistory = [];
    },
    
    /**
     * Set maximum error history length
     * 
     * @param {number} length - Maximum history length
     */
    setMaxErrorHistoryLength(length) {
      this._maxErrorHistoryLength = length;
      
      // Trim if needed
      if (this._errorHistory && this._errorHistory.length > length) {
        this._errorHistory.length = length;
      }
    }
  }
};
