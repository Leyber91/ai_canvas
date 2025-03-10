/**
 * core/EventEmitter.js
 * 
 * A simple event emitter implementation for component-to-component communication.
 * Allows components to communicate without direct dependencies.
 */
export class EventEmitter {
    constructor() {
        this._events = {};
    }
    
    /**
     * Subscribe to an event
     * 
     * @param {string} event - Event name
     * @param {Function} listener - Event listener function
     * @param {Object} context - Context to bind the listener to
     * @returns {Object} Subscription object with unsubscribe method
     */
    on(event, listener, context) {
        if (typeof event !== 'string') {
            throw new Error('Event name must be a string');
        }
        
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }
        
        // Create event array if it doesn't exist
        if (!this._events[event]) {
            this._events[event] = [];
        }
        
        // Create listener object
        const listenerObj = {
            fn: listener,
            context: context || this
        };
        
        // Add to listeners
        this._events[event].push(listenerObj);
        
        // Return subscription object
        return {
            unsubscribe: () => this.off(event, listener)
        };
    }
    
    /**
     * Unsubscribe from an event
     * 
     * @param {string} event - Event name
     * @param {Function} listener - Event listener function to remove
     * @returns {boolean} Whether the listener was removed
     */
    off(event, listener) {
        if (!this._events[event]) {
            return false;
        }
        
        const index = this._events[event].findIndex(l => l.fn === listener);
        
        if (index !== -1) {
            this._events[event].splice(index, 1);
            
            // Remove event array if empty
            if (this._events[event].length === 0) {
                delete this._events[event];
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Subscribe to an event for a single occurrence
     * 
     * @param {string} event - Event name
     * @param {Function} listener - Event listener function
     * @param {Object} context - Context to bind the listener to
     * @returns {Object} Subscription object with unsubscribe method
     */
    once(event, listener, context) {
        // Create a wrapper that calls the listener and unsubscribes
        const wrapper = (...args) => {
            this.off(event, wrapper);
            listener.apply(context || this, args);
        };
        
        // Store the original listener for unsubscribe functionality
        wrapper.originalListener = listener;
        
        // Subscribe the wrapper
        return this.on(event, wrapper, context);
    }
    
    /**
     * Emit an event with data
     * 
     * @param {string} event - Event name
     * @param {*} data - Data to pass to listeners
     * @returns {boolean} Whether any listeners were called
     */
    emit(event, data) {
        if (!this._events[event]) {
            return false;
        }
        
        const listeners = [...this._events[event]];
        
        for (const listener of listeners) {
            try {
                listener.fn.call(listener.context, data);
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        }
        
        return listeners.length > 0;
    }
    
    /**
     * Get the number of listeners for an event
     * 
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        return this._events[event] ? this._events[event].length : 0;
    }
    
    /**
     * Get all event names with listeners
     * 
     * @returns {Array} Array of event names
     */
    eventNames() {
        return Object.keys(this._events);
    }
    
    /**
     * Remove all listeners for a specific event or all events
     * 
     * @param {string} [event] - Event name (omit to remove all listeners)
     */
    removeAllListeners(event) {
        if (event) {
            delete this._events[event];
        } else {
            this._events = {};
        }
    }
}