/**
 * core/EnhancedEventBus.js
 * 
 * An improved event bus with better error handling, performance tracking,
 * and integration with the ErrorHandler and EventBusService.
 */
import { EventBusService } from './services/EventBusService.js';

export class EventBus {
    /**
     * Create a new enhanced event bus
     * 
     * @param {ErrorHandler} errorHandler - Error handler for event errors
     */
    constructor(errorHandler = null) {
      this.subscribers = {};
      this.debugMode = false;
      this.warningMode = true;
      this.errorHandler = errorHandler;
      
      // Event history for debugging
      this.eventHistory = [];
      this.maxHistoryLength = 100;
      
      // Track event statistics
      this.eventStats = {
        published: {},
        delivered: {},
        errors: {}
      };
      
      // Performance tracking
      this.performanceStats = {};
      this.trackPerformance = false;
      
      // Bind methods
      this.subscribe = this.subscribe.bind(this);
      this.publish = this.publish.bind(this);
      this.unsubscribe = this.unsubscribe.bind(this);
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
      
      // Map legacy event names to standardized ones
      const standardEvent = EventBusService.getLegacyEventMapping(event);
      
      if (!this.subscribers[standardEvent]) {
        this.subscribers[standardEvent] = [];
      }
      
      const subscriber = { 
        callback, 
        context,
        subscribedAt: new Date(),
        id: Math.random().toString(36).substring(2, 11) // Generate unique ID for this subscription
      };
      
      this.subscribers[standardEvent].push(subscriber);
      
      if (this.debugMode) {
        console.log(`[EventBus] Subscribed to "${standardEvent}" (total subscribers: ${this.subscribers[standardEvent].length})`);
      }
      
      // Return unsubscribe function
      return () => {
        this.unsubscribe(standardEvent, subscriber);
      };
    }
    
    /**
     * Unsubscribe a specific subscriber
     * 
     * @param {string} event - Event name
     * @param {Object} subscriber - Subscriber object
     */
    unsubscribe(event, subscriber) {
      if (!this.subscribers[event]) return;
      
      const index = this.subscribers[event].indexOf(subscriber);
      if (index !== -1) {
        this.subscribers[event].splice(index, 1);
        
        if (this.debugMode) {
          console.log(`[EventBus] Unsubscribed from "${event}" (remaining subscribers: ${this.subscribers[event].length})`);
        }
        
        // Clean up empty subscriber arrays
        if (this.subscribers[event].length === 0) {
          delete this.subscribers[event];
        }
      }
    }
    
    /**
     * Subscribe to an event once
     * 
     * @param {string} event - Event name to subscribe to
     * @param {Function} callback - Function to call when event is published
     * @param {Object} context - Context to bind the callback to (this value)
     * @returns {Function} Unsubscribe function
     */
    subscribeOnce(event, callback, context = null) {
      if (!event || typeof event !== 'string' || !callback || typeof callback !== 'function') {
        return () => {}; // Return no-op unsubscribe function
      }
      
      // Map legacy event names to standardized ones
      const standardEvent = EventBusService.getLegacyEventMapping(event);
      
      // Create a wrapper that unsubscribes after first call
      const wrapperCallback = (data) => {
        unsubscribe(); // Unsubscribe first to prevent recursion issues
        callback.call(context, data);
      };
      
      // Subscribe and get unsubscribe function
      const unsubscribe = this.subscribe(standardEvent, wrapperCallback, context);
      
      return unsubscribe;
    }
    
    /**
     * Publish an event with data
     * 
     * @param {string} event - Event name to publish
     * @param {any} data - Data to pass to subscribers
     * @returns {boolean} Whether the event was delivered to any subscribers
     */
    publish(event, data = null) {
      const startTime = this.trackPerformance ? performance.now() : null;
      
      // Map legacy event names to standardized ones
      const standardEvent = EventBusService.getLegacyEventMapping(event);
      
      // Track event publication
      this.eventStats.published[standardEvent] = (this.eventStats.published[standardEvent] || 0) + 1;
      
      // Always log workflow events
      const isWorkflowEvent = standardEvent.startsWith('workflow:');
      const isDebugEvent = standardEvent.startsWith('debug:');
      
      if ((isWorkflowEvent && !isDebugEvent) || this.debugMode) {
        console.log(`[EventBus] Publishing event: ${standardEvent}`, data);
      }
      
      // Add to history
      this.eventHistory.unshift({
        timestamp: new Date(),
        event: standardEvent,
        originalEvent: event !== standardEvent ? event : undefined,
        data,
        subscriberCount: this.subscribers[standardEvent]?.length || 0
      });
      
      // Trim history if needed
      if (this.eventHistory.length > this.maxHistoryLength) {
        this.eventHistory.length = this.maxHistoryLength;
      }
      
      // Check if there are subscribers
      if (!this.subscribers[standardEvent] || this.subscribers[standardEvent].length === 0) {
        if (this.warningMode && isWorkflowEvent && !isDebugEvent) {
          console.warn(`[EventBus] No subscribers for workflow event: ${standardEvent}`);
        }
        return false;
      }
      
      // Track delivery statistics
      this.eventStats.delivered[standardEvent] = (this.eventStats.delivered[standardEvent] || 0) + 1;
      
      // Call each subscriber with error isolation
      const subscriberCount = this.subscribers[standardEvent].length;
      let successCount = 0;
      
      // Create a safe copy of subscribers to prevent modification during iteration
      const currentSubscribers = [...this.subscribers[standardEvent]];
      
      currentSubscribers.forEach((subscriber, index) => {
        try {
          // Execute the callback in the proper context
          if (subscriber.context) {
            subscriber.callback.call(subscriber.context, data);
          } else {
            subscriber.callback(data);
          }
          
          successCount++;
          
          if (this.debugMode) {
            console.log(`[EventBus] Delivered "${standardEvent}" to subscriber ${index+1}/${subscriberCount}`);
          }
        } catch (error) {
          // Track error statistics
          this.eventStats.errors[standardEvent] = (this.eventStats.errors[standardEvent] || 0) + 1;
          
          // Provide detailed error information
          console.error(
            `[EventBus] Error in subscriber ${index+1}/${subscriberCount} for event "${standardEvent}":`, 
            error
          );
          
          // Use error handler if available
          if (this.errorHandler) {
            this.errorHandler.handleError(error, {
              context: `EventBus:${standardEvent}`,
              silent: true, // Don't show UI notifications for event errors
              source: 'eventBus',
              data: {
                event: standardEvent,
                eventData: data,
                subscriberIndex: index
              }
            });
          }
          
          // For critical workflow events, try to handle the error
          if (isWorkflowEvent && standardEvent.includes('completed')) {
            console.warn('[EventBus] Critical workflow event delivery failed - attempting recovery');
            this.attemptErrorRecovery(standardEvent, data);
          }
        }
      });
      
      // Track performance if enabled
      if (this.trackPerformance && startTime !== null) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (!this.performanceStats[standardEvent]) {
          this.performanceStats[standardEvent] = {
            count: 0,
            totalDuration: 0,
            maxDuration: 0
          };
        }
        
        const stats = this.performanceStats[standardEvent];
        stats.count++;
        stats.totalDuration += duration;
        stats.maxDuration = Math.max(stats.maxDuration, duration);
        
        // Log slow events
        if (duration > 50) {
          console.warn(`[EventBus] Slow event "${standardEvent}" took ${duration.toFixed(2)}ms with ${subscriberCount} subscribers`);
        }
      }
      
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
            
            // Publish recovery event
            this.publish('error:recovered', {
              event,
              message: 'Successfully reset workflow execution state'
            });
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
     * Set performance tracking on/off
     * 
     * @param {boolean} enabled - Whether performance tracking should be enabled
     */
    setPerformanceTracking(enabled) {
      this.trackPerformance = enabled;
      console.log(`[EventBus] Performance tracking ${enabled ? 'enabled' : 'disabled'}`);
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
        // Map legacy event names to standardized ones
        const standardEvent = EventBusService.getLegacyEventMapping(event);
        
        const count = this.subscribers[standardEvent]?.length || 0;
        delete this.subscribers[standardEvent];
        
        if (this.debugMode) {
          console.log(`[EventBus] Cleared ${count} subscribers for event "${standardEvent}"`);
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
     * Get performance statistics
     * 
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
      if (!this.trackPerformance) {
        return { message: 'Performance tracking is disabled' };
      }
      
      // Calculate averages and sort by average duration
      const events = Object.keys(this.performanceStats).map(event => {
        const stats = this.performanceStats[event];
        const averageDuration = stats.count > 0 ? stats.totalDuration / stats.count : 0;
        
        return {
          event,
          count: stats.count,
          averageDuration,
          maxDuration: stats.maxDuration
        };
      });
      
      // Sort by average duration (slowest first)
      events.sort((a, b) => b.averageDuration - a.averageDuration);
      
      return {
        totalEvents: events.length,
        slowestEvents: events.slice(0, 10),
        allEvents: events
      };
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
        })),
        performance: this.trackPerformance ? this.getPerformanceStats() : null
      };
    }

    /**
 * Enhanced publish method with improved error handling and event loop protection
 * 
 * @param {string} event - Event name to publish
 * @param {any} data - Data to pass to subscribers
 * @returns {boolean} Whether the event was delivered to any subscribers
 */
publish(event, data = null) {
  const startTime = this.trackPerformance ? performance.now() : null;
  
  // Add event loop detection
  if (!this._eventStack) this._eventStack = [];
  
  // Check for potential event loops (same event fired multiple times in succession)
  if (this._eventStack.includes(event)) {
    const occurrences = this._eventStack.filter(e => e === event).length;
    
    // If this event has occurred too many times in the stack, we might have a loop
    if (occurrences >= 3) {
      console.warn(`[EventBus] Possible event loop detected: "${event}" fired ${occurrences} times in stack:`, 
        [...this._eventStack]);
      
      // Return early on possible loops
      if (occurrences >= 5) {
        console.error(`[EventBus] Event loop protection: blocking event "${event}" after ${occurrences} occurrences`);
        return false;
      }
    }
  }
  
  // Push this event to the stack
  this._eventStack.push(event);
  
  // Map legacy event names to standardized ones
  const standardEvent = EventBusService.getLegacyEventMapping(event);
  
  // Track event publication
  this.eventStats.published[standardEvent] = (this.eventStats.published[standardEvent] || 0) + 1;
  
  // Always log workflow events
  const isWorkflowEvent = standardEvent.startsWith('workflow:');
  const isDebugEvent = standardEvent.startsWith('debug:');
  
  if ((isWorkflowEvent && !isDebugEvent) || this.debugMode) {
    console.log(`[EventBus] Publishing event: ${standardEvent}`, data);
  }
  
  // Add to history
  this.eventHistory.unshift({
    timestamp: new Date(),
    event: standardEvent,
    originalEvent: event !== standardEvent ? event : undefined,
    data,
    subscriberCount: this.subscribers[standardEvent]?.length || 0
  });
  
  // Trim history if needed
  if (this.eventHistory.length > this.maxHistoryLength) {
    this.eventHistory.length = this.maxHistoryLength;
  }
  
  // Check if there are subscribers
  if (!this.subscribers[standardEvent] || this.subscribers[standardEvent].length === 0) {
    if (this.warningMode && isWorkflowEvent && !isDebugEvent) {
      console.warn(`[EventBus] No subscribers for workflow event: ${standardEvent}`);
    }
    
    // Pop from event stack before returning
    this._eventStack.pop();
    return false;
  }
  
  // Track delivery statistics
  this.eventStats.delivered[standardEvent] = (this.eventStats.delivered[standardEvent] || 0) + 1;
  
  // Call each subscriber with error isolation
  const subscriberCount = this.subscribers[standardEvent].length;
  let successCount = 0;
  
  // Create a safe copy of subscribers to prevent modification during iteration
  const currentSubscribers = [...this.subscribers[standardEvent]];
  
  currentSubscribers.forEach((subscriber, index) => {
    try {
      // Execute the callback in the proper context
      if (subscriber.context) {
        subscriber.callback.call(subscriber.context, data);
      } else {
        subscriber.callback(data);
      }
      
      successCount++;
      
      if (this.debugMode) {
        console.log(`[EventBus] Delivered "${standardEvent}" to subscriber ${index+1}/${subscriberCount}`);
      }
    } catch (error) {
      // Track error statistics
      this.eventStats.errors[standardEvent] = (this.eventStats.errors[standardEvent] || 0) + 1;
      
      // Provide detailed error information
      console.error(
        `[EventBus] Error in subscriber ${index+1}/${subscriberCount} for event "${standardEvent}":`, 
        error
      );
      
      // Use error handler if available
      if (this.errorHandler) {
        this.errorHandler.handleError(error, {
          context: `EventBus:${standardEvent}`,
          silent: true, // Don't show UI notifications for event errors
          source: 'eventBus',
          data: {
            event: standardEvent,
            eventData: data,
            subscriberIndex: index
          }
        });
      }
      
      // No error recovery attempts for events that are already in progress multiple times
      const recoveryInProgress = this._eventStack.filter(e => e === 'error:recovered').length > 0;
      
      // For critical workflow events, try to handle the error, but only if not already recovering
      if (isWorkflowEvent && standardEvent.includes('completed') && !recoveryInProgress) {
        console.warn('[EventBus] Critical workflow event delivery failed - attempting recovery');
        this.attemptErrorRecovery(standardEvent, data);
      }
    }
  });
  
  // Pop from event stack after processing
  this._eventStack.pop();
  
  // Track performance if enabled
  if (this.trackPerformance && startTime !== null) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (!this.performanceStats[standardEvent]) {
      this.performanceStats[standardEvent] = {
        count: 0,
        totalDuration: 0,
        maxDuration: 0
      };
    }
    
    const stats = this.performanceStats[standardEvent];
    stats.count++;
    stats.totalDuration += duration;
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    
    // Log slow events
    if (duration > 50) {
      console.warn(`[EventBus] Slow event "${standardEvent}" took ${duration.toFixed(2)}ms with ${subscriberCount} subscribers`);
    }
  }
  
  // Return delivery success rate
  return successCount > 0;
}

/**
 * Improved error recovery with better safeguards
 * 
 * @param {string} event - The event that failed
 * @param {any} data - The event data
 * @private
 */
attemptErrorRecovery(event, data) {
  // Prevent recursive recovery attempts
  if (this._recoveryAttempts) {
    this._recoveryAttempts++;
    if (this._recoveryAttempts > 2) {
      console.error('[EventBus] Too many recovery attempts, aborting recovery');
      return;
    }
  } else {
    this._recoveryAttempts = 1;
  }
  
  // For workflow completion events, attempt to reset execution state
  if (event === 'workflow:completed') {
    try {
      if (window.workflowManager) {
        // Safely access nested properties
        if (window.workflowManager.executionState) {
          window.workflowManager.executionState.isExecuting = false;
          console.log('[EventBus] Successfully reset workflow execution state');
        } else {
          console.warn('[EventBus] Could not find executionState on workflowManager');
        }
        
        // Publish recovery event with safety
        this.publish('error:recovered', {
          event,
          message: 'Successfully reset workflow execution state'
        });
      }
    } catch (e) {
      console.error('[EventBus] Recovery attempt failed:', e);
    }
  }
  
  // Reset recovery counter after a delay
  setTimeout(() => {
    this._recoveryAttempts = 0;
  }, 5000);
}
    
    /**
     * Reset all statistics
     */
    resetStats() {
      this.eventStats = {
        published: {},
        delivered: {},
        errors: {}
      };
      
      this.performanceStats = {};
      this.eventHistory = [];
      
      console.log('[EventBus] Statistics reset');
    }
}