/**
 * core/constants/EventTypes.js
 * 
 * Constants for event names used throughout the application.
 * Centralizes all event names to prevent typos and enhance consistency.
 */

// Panel events
export const PANEL_EVENTS = {
    TOGGLED: 'toggled',
    EXPANDED: 'expanded',
    COLLAPSED: 'collapsed',
    CONTENT_UPDATED: 'content-updated',
    INITIALIZED: 'initialized'
  };
  
  // Conversation events
  export const CONVERSATION_EVENTS = {
    MESSAGE_SENT: 'message-sent',
    MESSAGE_RECEIVED: 'message-received',
    ACTIVATED: 'activated',
    DEACTIVATED: 'deactivated',
    CLEARED: 'cleared'
  };
  
  // Workflow events
  export const WORKFLOW_EVENTS = {
    EXECUTING: 'executing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    STOPPED: 'stopped',
    NODE_EXECUTING: 'node-executing',
    NODE_COMPLETED: 'node-completed',
    NODE_ERROR: 'node-error',
    VALIDATED: 'validated',
    INVALID: 'invalid',
    CYCLES_DETECTED: 'cycles-detected',
    CYCLES_BROKEN: 'cycles-broken'
  };
  
  // Graph events
  export const GRAPH_EVENTS = {
    LOADED: 'loaded',
    SAVED: 'saved',
    CLEARED: 'cleared',
    MODIFIED: 'modified',
    NODE_ADDED: 'node-added',
    NODE_REMOVED: 'node-removed',
    EDGE_ADDED: 'edge-added',
    EDGE_REMOVED: 'edge-removed',
    NODE_SELECTED: 'node-selected',
    NODE_DESELECTED: 'node-deselected',
    EDGE_SELECTED: 'edge-selected'
  };
  
  // API events
  export const API_EVENTS = {
    REQUEST_START: 'request-start',
    REQUEST_END: 'request-end',
    REQUEST_SUCCESS: 'request-success',
    REQUEST_ERROR: 'request-error'
  };
  
  // Error events
  export const ERROR_EVENTS = {
    OCCURRED: 'occurred',
    HANDLED: 'handled',
    RECOVERED: 'recovered'
  };
  
  // UI events
  export const UI_EVENTS = {
    THEME_CHANGED: 'theme-changed',
    NOTIFICATION_SHOWN: 'notification-shown',
    MODAL_OPENED: 'modal-opened',
    MODAL_CLOSED: 'modal-closed'
  };