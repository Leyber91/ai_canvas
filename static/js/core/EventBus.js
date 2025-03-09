/**
 * core/EventBus.js
 * 
 * An enhanced pub/sub event bus that allows components to communicate
 * without direct dependencies, with improved debugging and error recovery.
 */
export class EventBus {
    constructor() {
      this.subscribers = {};
      this.debugMode = false;
      this.warningMode = true; // Always warn about critical issues
      
      // Event history for debugging
      this.eventHistory = [];
      this.maxHistoryLength = 100;
      
      // Track event statistics
      this.eventStats = {
        published: {},
        delivered: {},
        errors: {}
      };
    }
    
    /**
     * Subscribe to an event
     * 
     * @param {string} event - Event name to subscribe to
     * @param {Function} callback - Function to call when event is published
     * @param {Object} context - Context to bind the callback to (this value)
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, callback, context = null) {
      if (!event || typeof event !== 'string') {
        console.error('[EventBus] Invalid event name:', event);
        return () => {}; // Return no-op unsubscribe function
      }
      
      if (!callback || typeof callback !== 'function') {
        console.error('[EventBus] Invalid callback for event:', event);
        return () => {}; // Return no-op unsubscribe function
      }
      
      if (!this.subscribers[event]) {
        this.subscribers[event] = [];
      }
      
      const subscriber = { 
        callback, 
        context,
        subscribedAt: new Date(),
        id: Math.random().toString(36).substring(2, 11) // Generate unique ID for this subscription
      };
      
      this.subscribers[event].push(subscriber);
      
      if (this.debugMode) {
        console.log(`[EventBus] Subscribed to "${event}" (total subscribers: ${this.subscribers[event].length})`);
      }
      
      // Return unsubscribe function
      return () => {
        this.subscribers[event] = this.subscribers[event].filter(s => s !== subscriber);
        if (this.debugMode) {
          console.log(`[EventBus] Unsubscribed from "${event}" (remaining subscribers: ${this.subscribers[event].length})`);
        }
      };
    }
    
    /**
     * Publish an event with data
     * 
     * @param {string} event - Event name to publish
     * @param {any} data - Data to pass to subscribers
     * @returns {boolean} Whether the event was delivered to any subscribers
     */
    publish(event, data = null) {
      // Track event publication
      this.eventStats.published[event] = (this.eventStats.published[event] || 0) + 1;
      
      // Always log workflow events
      const isWorkflowEvent = event.startsWith('workflow:');
      if (isWorkflowEvent || this.debugMode) {
        console.log(`[EventBus] Publishing event: ${event}`, data);
      }
      
      // Add to history
      this.eventHistory.unshift({
        timestamp: new Date(),
        event,
        data,
        subscriberCount: this.subscribers[event]?.length || 0
      });
      
      // Trim history if needed
      if (this.eventHistory.length > this.maxHistoryLength) {
        this.eventHistory.length = this.maxHistoryLength;
      }
      
      // Check if there are subscribers
      if (!this.subscribers[event] || this.subscribers[event].length === 0) {
        if (this.warningMode && isWorkflowEvent) {
          console.warn(`[EventBus] No subscribers for workflow event: ${event}`);
        }
        return false;
      }
      
      // Track delivery statistics
      this.eventStats.delivered[event] = (this.eventStats.delivered[event] || 0) + 1;
      
      // Call each subscriber with error isolation
      const subscriberCount = this.subscribers[event].length;
      let successCount = 0;
      
      this.subscribers[event].forEach((subscriber, index) => {
        try {
          // Execute the callback in the proper context
          if (subscriber.context) {
            subscriber.callback.call(subscriber.context, data);
          } else {
            subscriber.callback(data);
          }
          
          successCount++;
          
          if (this.debugMode) {
            console.log(`[EventBus] Delivered "${event}" to subscriber ${index+1}/${subscriberCount}`);
          }
        } catch (error) {
          // Track error statistics
          this.eventStats.errors[event] = (this.eventStats.errors[event] || 0) + 1;
          
          // Provide detailed error information
          console.error(
            `[EventBus] Error in subscriber ${index+1}/${subscriberCount} for event "${event}":`, 
            error,
            '\nSubscriber:', subscriber,
            '\nEvent data:', data
          );
          
          // For critical workflow events, try to handle the error
          if (isWorkflowEvent && event.includes('completed')) {
            console.warn('[EventBus] Critical workflow event delivery failed - attempting recovery');
            this.attemptErrorRecovery(event, data);
          }
        }
      });
      
      // Return delivery success rate
      return successCount > 0;
    }
    
    /**
     * Attempt to recover from errors in critical events
     * 
     * @param {string} event - The event that failed
     * @param {any} data - The event data
     * @private
     */
    attemptErrorRecovery(event, data) {
      // For workflow completion events, attempt to reset execution state
      if (event === 'workflow:completed') {
        try {
          if (window.workflowManager) {
            window.workflowManager.executionState.isExecuting = false;
            console.log('[EventBus] Successfully reset workflow execution state');
          }
        } catch (e) {
          console.error('[EventBus] Recovery attempt failed:', e);
        }
      }
    }
    
    /**
     * Set debug mode on/off
     * 
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
      this.debugMode = enabled;
      console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Set warning mode on/off
     * 
     * @param {boolean} enabled - Whether warning mode should be enabled
     */
    setWarningMode(enabled) {
      this.warningMode = enabled;
    }
    
    /**
     * Clear all subscribers for an event
     * 
     * @param {string} event - Event to clear subscribers for
     */
    clearSubscribers(event) {
      if (event) {
        const count = this.subscribers[event]?.length || 0;
        delete this.subscribers[event];
        if (this.debugMode) {
          console.log(`[EventBus] Cleared ${count} subscribers for event "${event}"`);
        }
      } else {
        this.subscribers = {};
        if (this.debugMode) {
          console.log('[EventBus] Cleared all subscribers for all events');
        }
      }
    }
    
    /**
     * Get event history (for debugging)
     * 
     * @returns {Array} Event history
     */
    getEventHistory() {
      return this.eventHistory;
    }
    
    /**
     * Get event statistics
     * 
     * @returns {Object} Event statistics
     */
    getEventStats() {
      return this.eventStats;
    }
    
    /**
     * Get diagnostic information about the event bus
     * 
     * @returns {Object} Diagnostic information
     */
    getDiagnostics() {
      const eventCounts = {};
      let totalSubscribers = 0;
      
      // Count subscribers per event
      Object.keys(this.subscribers).forEach(event => {
        const count = this.subscribers[event].length;
        eventCounts[event] = count;
        totalSubscribers += count;
      });
      
      return {
        totalEvents: Object.keys(this.subscribers).length,
        totalSubscribers,
        eventsWithNoSubscribers: Object.keys(this.eventStats.published).filter(
          event => !this.subscribers[event] || this.subscribers[event].length === 0
        ),
        subscriberCounts: eventCounts,
        errorRates: Object.keys(this.eventStats.errors).map(event => ({
          event,
          published: this.eventStats.published[event] || 0,
          delivered: this.eventStats.delivered[event] || 0,
          errors: this.eventStats.errors[event] || 0,
          errorRate: this.eventStats.published[event] ? 
            this.eventStats.errors[event] / this.eventStats.published[event] : 0
        }))
      };
    }
  }