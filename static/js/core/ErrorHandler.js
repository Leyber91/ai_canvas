/**
 * core/ErrorHandler.js
 * 
 * Enhanced error handling service with detailed logging,
 * user-friendly messages, and recovery strategies
 */
export class ErrorHandler {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.errorLog = [];
      this.maxLogSize = 100;
      this.suppressedErrors = new Set(); // For duplicate error suppression
      this.suppressionTimeoutMs = 5000; // Time before allowing a similar error again
    }
    
    /**
     * Handle an error
     * 
     * @param {Error} error - The error object
     * @param {Object} options - Additional context about the error
     * @param {boolean} options.silent - Whether to suppress UI notifications
     * @param {string} options.context - Where the error occurred
     * @param {Function} options.recover - Optional recovery function to attempt
     */
    handleError(error, options = {}) {
      // Generate an error fingerprint based on message and context
      const errorFingerprint = `${options.context || 'Unknown'}:${error.message}`;
      
      // Check if this exact error was recently shown and should be suppressed
      if (this.suppressedErrors.has(errorFingerprint)) {
        return;
      }
      
      // Create error record with metadata
      const errorRecord = {
        timestamp: new Date(),
        error: error,
        message: error.message || String(error),
        stack: error.stack,
        context: options.context || 'Unknown',
        source: options.source,
        lineno: options.lineno,
        colno: options.colno,
        request: error.request, // For API errors
        response: error.response, // For API errors
        data: error.data, // For API errors with response data
        status: error.status // HTTP status code for API errors
      };
      
      // Enhance error with additional useful info
      this.enhanceErrorInfo(errorRecord);
      
      // Log the error
      console.error(`[Error] ${errorRecord.context}: ${errorRecord.message}`, error);
      
      // Add to error log
      this.errorLog.unshift(errorRecord);
      if (this.errorLog.length > this.maxLogSize) {
        this.errorLog.length = this.maxLogSize;
      }
      
      // Temporarily suppress similar errors
      this.suppressedErrors.add(errorFingerprint);
      setTimeout(() => {
        this.suppressedErrors.delete(errorFingerprint);
      }, this.suppressionTimeoutMs);
      
      // Publish error event
      this.eventBus.publish('error', errorRecord);
      
      // Display user notification unless silent is true
      if (!options.silent) {
        this.showErrorNotification(errorRecord);
      }
      
      // Try to recover if a recovery function was provided
      if (typeof options.recover === 'function') {
        try {
          options.recover(errorRecord);
        } catch (recoveryError) {
          console.error('Error in recovery function:', recoveryError);
        }
      }
    }
    
    /**
     * Enhance error with additional useful information
     * 
     * @param {Object} errorRecord - The error record to enhance
     */
    enhanceErrorInfo(errorRecord) {
      // For API errors, extract more useful information
      if (errorRecord.response && errorRecord.data) {
        const apiData = errorRecord.data;
        
        // Some APIs send detailed error messages in specific formats
        if (apiData.detail) {
          errorRecord.enhancedMessage = apiData.detail;
        } else if (apiData.message) {
          errorRecord.enhancedMessage = apiData.message;
        } else if (apiData.error) {
          errorRecord.enhancedMessage = typeof apiData.error === 'string' ? 
            apiData.error : JSON.stringify(apiData.error);
        }
        
        // Extract validation errors if available
        if (apiData.errors || apiData.validation_errors) {
          errorRecord.validationErrors = apiData.errors || apiData.validation_errors;
        }
      }
      
      // Categorize the error for better handling
      this.categorizeError(errorRecord);
    }
    
    /**
     * Categorize error by type
     * 
     * @param {Object} errorRecord - The error record to categorize 
     */
    categorizeError(errorRecord) {
      // Determine error category based on various signals
      if (errorRecord.status) {
        if (errorRecord.status === 401 || errorRecord.status === 403) {
          errorRecord.category = 'auth';
        } else if (errorRecord.status === 404) {
          errorRecord.category = 'notFound';
        } else if (errorRecord.status >= 500) {
          errorRecord.category = 'server';
        } else {
          errorRecord.category = 'api';
        }
      } else if (errorRecord.message.includes('Network') || 
                 errorRecord.message.includes('network') ||
                 errorRecord.message.includes('Failed to fetch')) {
        errorRecord.category = 'network';
      } else if (errorRecord.context.includes('Database') || 
                 errorRecord.message.includes('database')) {
        errorRecord.category = 'database';
      } else {
        errorRecord.category = 'unknown';
      }
    }
    
    /**
     * Show a user-friendly error notification
     * 
     * @param {Object} errorRecord - The error record to display
     */
    showErrorNotification(errorRecord) {
      const category = errorRecord.category || 'unknown';
      let errorTitle = 'Error';
      let errorMessage = errorRecord.enhancedMessage || errorRecord.message;
      
      // Create more user-friendly messages based on error category
      switch (category) {
        case 'network':
          errorTitle = 'Connection Error';
          errorMessage = 'There was a problem connecting to the server. Please check your internet connection and try again.';
          break;
        case 'auth':
          errorTitle = 'Authentication Error';
          errorMessage = 'You do not have permission to perform this action or your session may have expired.';
          break;
        case 'notFound':
          errorTitle = 'Not Found';
          errorMessage = 'The requested resource could not be found. It may have been deleted or moved.';
          break;
        case 'server':
          errorTitle = 'Server Error';
          errorMessage = 'The server encountered an error processing your request. Please try again later.';
          break;
        case 'database':
          errorTitle = 'Data Error';
          errorMessage = 'There was a problem accessing or saving data. Please try again later.';
          break;
      }
      
      // Add context if available and not already in the message
      const contextPrefix = errorRecord.context && !errorMessage.includes(errorRecord.context) ? 
        `[${errorRecord.context}] ` : '';
      
      // Create alert element
      const alertDiv = document.createElement('div');
      alertDiv.className = 'error-alert';
      alertDiv.innerHTML = `
        <div class="error-alert-header">
          <span class="error-alert-title">${errorTitle}</span>
          <span class="error-alert-close">&times;</span>
        </div>
        <div class="error-alert-body">
          ${contextPrefix}${errorMessage}
        </div>
      `;
      
      // Add style to the alert
      alertDiv.style.position = 'fixed';
      alertDiv.style.bottom = '20px';
      alertDiv.style.right = '20px';
      alertDiv.style.width = '300px';
      alertDiv.style.padding = '10px';
      alertDiv.style.backgroundColor = '#fff';
      alertDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      alertDiv.style.borderLeft = '5px solid #e74c3c';
      alertDiv.style.borderRadius = '3px';
      alertDiv.style.zIndex = '9999';
      
      // Style for header
      const header = alertDiv.querySelector('.error-alert-header');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.marginBottom = '10px';
      
      // Style for title
      const title = alertDiv.querySelector('.error-alert-title');
      title.style.fontWeight = 'bold';
      
      // Style for close button
      const closeBtn = alertDiv.querySelector('.error-alert-close');
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontWeight = 'bold';
      
      // Add close functionality
      closeBtn.addEventListener('click', () => {
        if (document.body.contains(alertDiv)) {
          document.body.removeChild(alertDiv);
        }
      });
      
      // Auto-close after 8 seconds
      setTimeout(() => {
        if (document.body.contains(alertDiv)) {
          document.body.removeChild(alertDiv);
        }
      }, 8000);
      
      // Add to document
      document.body.appendChild(alertDiv);
    }
    
    /**
     * Get recent errors (for debugging)
     * 
     * @returns {Array} Recent errors
     */
    getRecentErrors() {
      return this.errorLog;
    }
    
    /**
     * Clear error log
     */
    clearErrors() {
      this.errorLog = [];
    }
    
    /**
     * Suggest a recovery action based on the error
     * 
     * @param {Object} errorRecord - The error record
     * @returns {Object|null} Recovery action info or null if no recovery available
     */
    suggestRecovery(errorRecord) {
      const category = errorRecord.category || 'unknown';
      
      switch (category) {
        case 'network':
          return {
            action: 'retry',
            message: 'Check your internet connection and try again',
            callback: () => {
              // Could offer to retry the failed operation
              window.location.reload();
            }
          };
        case 'auth':
          return {
            action: 'reauth',
            message: 'Please re-authenticate to continue',
            callback: () => {
              // Could redirect to login
              window.location.href = '/login';
            }
          };
        case 'server':
          if (errorRecord.context.includes('Graph') || errorRecord.message.includes('graph')) {
            return {
              action: 'localSave',
              message: 'Save your work locally instead',
              callback: () => {
                // Trigger local save logic
                this.eventBus.publish('graph:save-local');
              }
            };
          }
          break;
      }
      
      return null;
    }
  }