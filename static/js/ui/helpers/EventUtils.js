/**
 * ui/helpers/EventUtils.js
 * 
 * Utility functions for handling DOM events and interactions.
 * 
 * This is a compatibility wrapper around the new core/events implementation.
 */

import { EventDelegate } from '../../core/events/EventDelegate.js';
import { AnimationUtils } from '../../core/utils/AnimationUtils.js';

export const EventUtils = {
    /**
     * Create a ripple effect on button click
     * 
     * @param {Event} e - Click event
     * @returns {number} Timeout ID for cleanup
     */
    createRippleEffect(e) {
      return AnimationUtils.createRippleEffect(e);
    },
    
    /**
     * Make an element draggable
     * 
     * @param {HTMLElement} element - Element to make draggable
     * @param {HTMLElement} handle - Element to use as drag handle
     */
    makeDraggable(element, handle) {
      if (!element || !handle) return;
      
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      
      handle.onmousedown = dragMouseDown;
      
      function dragMouseDown(e) {
        e.preventDefault();
        
        // Get mouse position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        
        // Add active class for styling
        handle.classList.add('dragging');
      }
      
      function elementDrag(e) {
        e.preventDefault();
        
        // Calculate new position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Ensure the element stays within viewport bounds
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        const maxTop = window.innerHeight - element.offsetHeight;
        const maxLeft = window.innerWidth - element.offsetWidth;
        
        element.style.top = Math.max(0, Math.min(newTop, maxTop)) + "px";
        element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + "px";
      }
      
      function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
        
        // Remove active class
        handle.classList.remove('dragging');
      }
    },
    
    /**
     * Create a debounced function
     * 
     * @param {Function} func - Function to debounce
     * @param {number} wait - Debounce wait time in ms
     * @param {boolean} immediate - Whether to trigger on the leading edge
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300, immediate = false) {
      return EventDelegate.debounce(func, wait, immediate);
    },
    
    /**
     * Create a throttled function
     * 
     * @param {Function} func - Function to throttle
     * @param {number} limit - Throttle limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
      return EventDelegate.throttle(func, limit);
    },
    
    /**
     * Add event listener with automatic cleanup
     * 
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     * @returns {Function} Cleanup function
     */
    addEventListenerWithCleanup(element, event, handler, options = {}) {
      return EventDelegate.addEventListenerWithCleanup(element, event, handler, options);
    },
    
    /**
     * Create a resizable element
     * 
     * @param {HTMLElement} element - Element to make resizable
     * @param {Object} options - Resize options
     */
    makeResizable(element, options = {}) {
      if (!element) return;
      
      const defaultOptions = {
        minWidth: 200,
        minHeight: 100,
        maxWidth: window.innerWidth,
        maxHeight: window.innerHeight,
        handles: ['se', 'e', 's'] // se = southeast (bottom-right), etc.
      };
      
      const config = { ...defaultOptions, ...options };
      
      // Create resize handles
      config.handles.forEach(handlePos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${handlePos}`;
        
        // Style the handle based on position
        const handleStyle = {
          position: 'absolute',
          width: '10px',
          height: '10px'
        };
        
        switch(handlePos) {
          case 'e': // East (right)
            Object.assign(handleStyle, {
              right: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'ew-resize',
              width: '5px',
              height: '100%'
            });
            break;
          case 's': // South (bottom)
            Object.assign(handleStyle, {
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              cursor: 'ns-resize',
              width: '100%',
              height: '5px'
            });
            break;
          case 'se': // Southeast (bottom-right)
            Object.assign(handleStyle, {
              bottom: '0',
              right: '0',
              cursor: 'nwse-resize'
            });
            break;
        }
        
        Object.assign(handle.style, handleStyle);
        element.appendChild(handle);
        
        // Make the handle draggable for resizing
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Initial dimensions
          const initialWidth = element.offsetWidth;
          const initialHeight = element.offsetHeight;
          const initialX = e.clientX;
          const initialY = e.clientY;
          
          const onMouseMove = (moveEvent) => {
            // Calculate new dimensions
            let newWidth = initialWidth;
            let newHeight = initialHeight;
            
            if (handlePos.includes('e')) {
              newWidth = initialWidth + (moveEvent.clientX - initialX);
            }
            
            if (handlePos.includes('s')) {
              newHeight = initialHeight + (moveEvent.clientY - initialY);
            }
            
            // Apply constraints
            newWidth = Math.max(config.minWidth, Math.min(newWidth, config.maxWidth));
            newHeight = Math.max(config.minHeight, Math.min(newHeight, config.maxHeight));
            
            // Apply new dimensions
            element.style.width = `${newWidth}px`;
            element.style.height = `${newHeight}px`;
          };
          
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };
          
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });
      });
      
      // Ensure element has position for absolute positioning of handles
      if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
      }
    },
    
    /**
     * Handle click outside of an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Function} callback - Callback function when clicked outside
     * @returns {Function} Cleanup function
     */
    handleClickOutside(element, callback) {
      return EventDelegate.handleClickOutside(element, callback);
    },
    
    /**
     * Delegate an event to child elements matching a selector
     * 
     * @param {HTMLElement} element - Parent element to attach the event listener to
     * @param {string} eventType - Event type (e.g., 'click', 'input')
     * @param {string} selector - CSS selector for target elements
     * @param {Function} handler - Event handler function
     * @returns {Function} - Cleanup function to remove the event listener
     */
    delegate(element, eventType, selector, handler) {
      return EventDelegate.delegate(element, eventType, selector, handler);
    },
    
    /**
     * Create a one-time event listener
     * 
     * @param {HTMLElement} element - Element to attach the event listener to
     * @param {string} eventType - Event type (e.g., 'click', 'input')
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     * @returns {Function} - Cleanup function to remove the event listener
     */
    once(element, eventType, handler, options = {}) {
      return EventDelegate.once(element, eventType, handler, options);
    },
    
    /**
     * Create a passive event listener
     * 
     * @param {HTMLElement} element - Element to attach the event listener to
     * @param {string} eventType - Event type (e.g., 'scroll', 'touchstart')
     * @param {Function} handler - Event handler function
     * @returns {Function} - Cleanup function to remove the event listener
     */
    passive(element, eventType, handler) {
      return EventDelegate.passive(element, eventType, handler);
    },
    
    /**
     * Create a multi-event listener
     * 
     * @param {HTMLElement} element - Element to attach the event listeners to
     * @param {string[]} eventTypes - Array of event types
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     * @returns {Function} - Cleanup function to remove all event listeners
     */
    multiEvent(element, eventTypes, handler, options = {}) {
      return EventDelegate.multiEvent(element, eventTypes, handler, options);
    },
    
    /**
     * Create an observable object that can be watched for changes
     * 
     * @param {Object} target - Object to make observable
     * @returns {Proxy} - Observable proxy object
     */
    createObservable(target) {
      return EventDelegate.createObservable(target);
    }
  };
  
  export default EventUtils;
