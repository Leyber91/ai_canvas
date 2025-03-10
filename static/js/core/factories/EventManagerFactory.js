/**
 * core/factories/EventManagerFactory.js
 * 
 * Factory for creating and managing event-related components.
 * Handles the creation and configuration of event buses and error handlers.
 */
import { EventBus } from '../EventBus.js';
import { ErrorHandler } from '../ErrorHandler.js';

export class EventManagerFactory {
  /**
   * Create an event system with all related components
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} options.debug - Enable debug mode
   * @param {boolean} options.trackPerformance - Enable performance tracking
   * @returns {Object} Event system components
   */
  static createEventSystem(options = {}) {
    // Create error handler first
    const errorHandler = new ErrorHandler();
    
    // Create event bus with error handler
    const eventBus = new EventBus(errorHandler);
    
    // Configure event bus based on options
    if (options.debug) {
      eventBus.setDebugMode(true);
    }
    
    if (options.trackPerformance) {
      eventBus.setPerformanceTracking(true);
    }
    
    // Connect error handler to event bus
    errorHandler.eventBus = eventBus;
    
    return {
      errorHandler,
      eventBus
    };
  }
  
  /**
   * Upgrade a legacy event bus to the enhanced version
   * 
   * @param {Object} legacyEventBus - Legacy event bus object
   * @param {ErrorHandler} errorHandler - Error handler
   * @returns {EventBus} Enhanced event bus
   */
  static upgradeEventBus(legacyEventBus, errorHandler = null) {
    // Create new enhanced event bus
    const EventBus = new EventBus(errorHandler);
    
    // Transfer existing subscribers if available
    if (legacyEventBus && legacyEventBus.subscribers) {
      Object.keys(legacyEventBus.subscribers).forEach(event => {
        const subscribers = legacyEventBus.subscribers[event];
        if (Array.isArray(subscribers)) {
          subscribers.forEach(subscriber => {
            EventBus.subscribe(event, subscriber.callback, subscriber.context);
          });
        }
      });
      
      console.log(`[EventManagerFactory] Upgraded event bus with ${Object.keys(legacyEventBus.subscribers).length} event types`);
    }
    
    return EventBus;
  }
  
  /**
   * Create a compatible facade around the enhanced event bus
   * to ensure backward compatibility with code expecting a simple event bus
   * 
   * @param {EventBus} EventBus - Enhanced event bus
   * @returns {Object} Compatibility facade
   */
  static createCompatibilityFacade(EventBus) {
    return {
      // Core methods that match the original API
      subscribe: EventBus.subscribe.bind(EventBus),
      publish: EventBus.publish.bind(EventBus),
      
      // Add more methods as needed for compatibility
      clearSubscribers: EventBus.clearSubscribers.bind(EventBus),
      
      // Access to the enhanced version
      enhanced: EventBus
    };
  }
}