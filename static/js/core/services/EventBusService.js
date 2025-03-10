/**
 * core/services/EventBusService.js
 * 
 * Service for standardizing event management across the application.
 * Provides helper methods for event names, subscription, and publishing.
 */
import * as EventTypes from '../constants/EventTypes.js';

export class EventBusService {
  /**
   * Get a standardized event name
   * 
   * @param {string} category - Event category (e.g., 'conversation', 'workflow')
   * @param {string} action - Event action (e.g., 'toggled', 'message-sent')
   * @returns {string} Standardized event name
   */
  static getEventName(category, action) {
    return `${category}:${action}`;
  }
  
  /**
   * Get a panel event name
   * 
   * @param {string} panelType - Panel type (e.g., 'conversation', 'workflow')
   * @param {string} action - Panel action from EventTypes.PANEL_EVENTS
   * @returns {string} Panel event name
   */
  static getPanelEventName(panelType, action) {
    return this.getEventName(panelType, `panel-${action}`);
  }
  
  /**
   * Get a conversation event name
   * 
   * @param {string} action - Action from EventTypes.CONVERSATION_EVENTS
   * @returns {string} Conversation event name
   */
  static getConversationEventName(action) {
    return this.getEventName('conversation', action);
  }
  
  /**
   * Get a workflow event name
   * 
   * @param {string} action - Action from EventTypes.WORKFLOW_EVENTS
   * @returns {string} Workflow event name
   */
  static getWorkflowEventName(action) {
    return this.getEventName('workflow', action);
  }
  
  /**
   * Get a graph event name
   * 
   * @param {string} action - Action from EventTypes.GRAPH_EVENTS
   * @returns {string} Graph event name
   */
  static getGraphEventName(action) {
    return this.getEventName('graph', action);
  }
  
  /**
   * Get an API event name
   * 
   * @param {string} action - Action from EventTypes.API_EVENTS
   * @returns {string} API event name
   */
  static getApiEventName(action) {
    return this.getEventName('api', action);
  }
  
  /**
   * Get an error event name
   * 
   * @param {string} action - Action from EventTypes.ERROR_EVENTS
   * @returns {string} Error event name
   */
  static getErrorEventName(action) {
    return this.getEventName('error', action);
  }
  
  /**
   * Get a UI event name
   * 
   * @param {string} action - Action from EventTypes.UI_EVENTS
   * @returns {string} UI event name
   */
  static getUiEventName(action) {
    return this.getEventName('ui', action);
  }
  
  /**
   * Create a standard event data object with metadata
   * 
   * @param {Object} data - Event data
   * @returns {Object} Enhanced event data with metadata
   */
  static createEventData(data = {}) {
    return {
      ...data,
      timestamp: new Date(),
      id: Math.random().toString(36).substring(2, 11)
    };
  }
  
  /**
   * Helper to safely publish an event with standard format
   * 
   * @param {EventBus} eventBus - Event bus instance
   * @param {string} category - Event category
   * @param {string} action - Event action
   * @param {Object} data - Event data
   * @returns {boolean} Whether the event was delivered
   */
  static publish(eventBus, category, action, data = {}) {
    if (!eventBus) {
      console.warn('[EventBusService] No event bus provided for publish');
      return false;
    }
    
    const eventName = this.getEventName(category, action);
    const eventData = this.createEventData(data);
    
    return eventBus.publish(eventName, eventData);
  }
  
  /**
   * Helper to safely subscribe to an event
   * 
   * @param {EventBus} eventBus - Event bus instance
   * @param {string} category - Event category
   * @param {string} action - Event action
   * @param {Function} callback - Event callback
   * @param {Object} context - Callback context
   * @returns {Function} Unsubscribe function
   */
  static subscribe(eventBus, category, action, callback, context = null) {
    if (!eventBus) {
      console.warn('[EventBusService] No event bus provided for subscribe');
      return () => {};
    }
    
    const eventName = this.getEventName(category, action);
    
    return eventBus.subscribe(eventName, callback, context);
  }
  
  /**
   * Helper to safely subscribe to a panel event
   * 
   * @param {EventBus} eventBus - Event bus instance
   * @param {string} panelType - Panel type
   * @param {string} action - Panel action
   * @param {Function} callback - Event callback
   * @param {Object} context - Callback context
   * @returns {Function} Unsubscribe function
   */
  static subscribeToPanelEvent(eventBus, panelType, action, callback, context = null) {
    return this.subscribe(eventBus, panelType, `panel-${action}`, callback, context);
  }
  
  /**
   * Convert legacy event names to standardized ones
   * 
   * @param {string} legacyEvent - Legacy event name
   * @returns {string} Standardized event name or original if no mapping found
   */
  static getLegacyEventMapping(legacyEvent) {
    const mappings = {
      // Panel events
      'conversation:panel-toggled': this.getPanelEventName('conversation', EventTypes.PANEL_EVENTS.TOGGLED),
      'workflow:panel-toggled': this.getPanelEventName('workflow', EventTypes.PANEL_EVENTS.TOGGLED),
      
      // Conversation events
      'message:sent': this.getConversationEventName(EventTypes.CONVERSATION_EVENTS.MESSAGE_SENT),
      'message:received': this.getConversationEventName(EventTypes.CONVERSATION_EVENTS.MESSAGE_RECEIVED),
      'conversation:activated': this.getConversationEventName(EventTypes.CONVERSATION_EVENTS.ACTIVATED),
      'conversation:deactivated': this.getConversationEventName(EventTypes.CONVERSATION_EVENTS.DEACTIVATED),
      'conversation:cleared': this.getConversationEventName(EventTypes.CONVERSATION_EVENTS.CLEARED),
      
      // Graph events
      'node:selected': this.getGraphEventName(EventTypes.GRAPH_EVENTS.NODE_SELECTED),
      'node:deselected': this.getGraphEventName(EventTypes.GRAPH_EVENTS.NODE_DESELECTED),
      'edge:selected': this.getGraphEventName(EventTypes.GRAPH_EVENTS.EDGE_SELECTED)
    };
    
    return mappings[legacyEvent] || legacyEvent;
  }
}