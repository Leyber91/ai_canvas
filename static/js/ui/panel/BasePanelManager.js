/**
 * ui/panel/BasePanelManager.js
 * 
 * Enhanced base class for panel managers with common toggling and state management functionality.
 * Updated to use standardized event patterns via EventBusService.
 */
import { EventBusService } from '../../core/services/EventBusService.js';
import { PANEL_EVENTS } from '../../core/constants/EventTypes.js';

export class BasePanelManager {
    /**
     * @param {Object} options - Panel manager configuration
     * @param {Object} options.elements - DOM elements (optional)
     * @param {Object} options.eventBus - Event bus for pub/sub (optional)
     * @param {Object} options.uiManager - UI Manager reference (optional)
     * @param {string} options.panelType - Type of panel ('workflow', 'conversation', etc.)
     * @param {string} options.panelSelector - CSS selector for the panel (optional)
     * @param {string} options.eventPrefix - Prefix for panel events
     * @param {Object} options.themeManager - Theme manager reference (optional)
     * @param {boolean} options.initialExpanded - Whether panel starts expanded
     */
    constructor(options = {}) {
        // Core dependencies
        this.elements = options.elements || {};
        this.eventBus = options.eventBus || (options.uiManager ? options.uiManager.eventBus : null);
        this.uiManager = options.uiManager || null;
        this.themeManager = options.themeManager || (options.uiManager ? options.uiManager.themeManager : null);
        
        // Panel configuration
        this.panelType = options.panelType || 'panel';
        this.panelSelector = options.panelSelector || null;
        this.eventPrefix = options.eventPrefix || this.panelType;
        
        // Panel state
        this.expanded = options.initialExpanded !== undefined ? options.initialExpanded : true;
        this.initialized = false;
        
        // Bind methods
        this.togglePanel = this.togglePanel.bind(this);
        this.expandPanel = this.expandPanel.bind(this);
        this.collapsePanel = this.collapsePanel.bind(this);
        this.findElement = this.findElement.bind(this);
        this.findElements = this.findElements.bind(this);
        this.showNotification = this.showNotification.bind(this);
        this.handleError = this.handleError.bind(this);
        this.publishToggleEvent = this.publishToggleEvent.bind(this);
    }
    
    /**
     * Initialize the panel manager
     */
    initialize() {
        if (this.initialized) return;
        
        // Find DOM elements
        this.findDOMElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Apply initial panel state
        this.applyPanelState();
        
        // Apply theme styling if available
        this.applyThemeStyling();
        
        // Subscribe to events
        this.subscribeToEvents();
        
        this.initialized = true;
        
        // Publish panel initialized event
        this.publishEvent(PANEL_EVENTS.INITIALIZED, { expanded: this.expanded });
    }
    
    /**
     * Find DOM elements - To be implemented by subclasses
     */
    findDOMElements() {
        // Base implementation does nothing
    }
    
    /**
     * Set up event listeners - To be implemented by subclasses
     */
    setupEventListeners() {
        // Base implementation does nothing
    }
    
    /**
     * Subscribe to events - To be implemented by subclasses
     */
    subscribeToEvents() {
        // Base implementation does nothing
    }
    
    /**
     * Toggle panel expansion state
     */
    togglePanel() {
        this.expanded = !this.expanded;
        this.applyPanelState();
        this.publishToggleEvent();
        
        // Update theme manager state if available
        this.updateThemeState();
    }
    
    /**
     * Expand the panel
     */
    expandPanel() {
        if (!this.expanded) {
            this.togglePanel();
        } else {
            // If already expanded, just publish the event
            this.publishEvent(PANEL_EVENTS.EXPANDED);
        }
    }
    
    /**
     * Collapse the panel
     */
    collapsePanel() {
        if (this.expanded) {
            this.togglePanel();
        } else {
            // If already collapsed, just publish the event
            this.publishEvent(PANEL_EVENTS.COLLAPSED);
        }
    }
    
    /**
     * Apply the current panel state to the DOM
     */
    applyPanelState() {
        const panel = this.getPanelElement();
        if (!panel) return;
        
        if (this.expanded) {
            panel.classList.remove('collapsed');
        } else {
            panel.classList.add('collapsed');
        }
    }
    
    /**
     * Apply theme styling to the panel
     * To be implemented or extended by subclasses
     */
    applyThemeStyling() {
        // Base implementation does nothing
        const themeManager = this.themeManager;
        if (!themeManager || !themeManager.state) return;
        
        // Apply theme-specific panel styles if supported
        const panel = this.getPanelElement();
        if (panel && themeManager.getPanelStyles) {
            const styles = themeManager.getPanelStyles(this.panelType);
            Object.assign(panel.style, styles);
        }
    }
    
    /**
     * Get the panel DOM element
     * 
     * @returns {HTMLElement} The panel element
     */
    getPanelElement() {
        // Try to get from elements object
        if (this.elements && this.elements[`${this.panelType}Panel`]) {
            return this.elements[`${this.panelType}Panel`];
        }
        
        // Try to get by ID
        if (this.panelSelector) {
            return document.querySelector(this.panelSelector) || document.getElementById(this.panelSelector);
        }
        
        return null;
    }
    
    /**
     * Find a DOM element using the registry or direct DOM access
     * 
     * @param {string} key - Element key
     * @param {boolean} required - Whether the element is required
     * @returns {HTMLElement|null} Found element or null
     */
    findElement(key, required = false) {
        if (this.uiManager && this.uiManager.registry) {
            return this.uiManager.registry.findElement(key, required);
        }
        
        // Fallback to direct DOM access
        const selector = key.startsWith('#') ? key : `#${key}`;
        const element = document.querySelector(selector);
        
        if (!element && required) {
            console.error(`Required element not found: ${key}`);
        }
        
        return element;
    }
    
    /**
     * Find multiple DOM elements
     * 
     * @param {Array<string>} keys - Element keys to find
     * @returns {Object} Map of keys to elements
     */
    findElements(keys) {
        const elements = {};
        
        for (const key of keys) {
            elements[key] = this.findElement(key);
        }
        
        return elements;
    }
    
    /**
     * Check if the panel is expanded
     * 
     * @returns {boolean} True if expanded
     */
    isExpanded() {
        return this.expanded;
    }
    
    /**
     * Check if the panel is collapsed
     * 
     * @returns {boolean} True if collapsed
     */
    isCollapsed() {
        return !this.expanded;
    }
    
    /**
     * Publish a panel event with standardized naming
     * 
     * @param {string} action - The action type from PANEL_EVENTS
     * @param {Object} additionalData - Additional data to include
     */
    publishEvent(action, additionalData = {}) {
        if (!this.eventBus) return;
        
        // Use EventBusService to standardize the event name
        EventBusService.publish(
            this.eventBus,
            this.panelType,
            `panel-${action}`,
            {
                panelType: this.panelType,
                expanded: this.expanded,
                ...additionalData
            }
        );
    }
    
    /**
     * Publish panel toggle event
     */
    publishToggleEvent() {
        this.publishEvent(PANEL_EVENTS.TOGGLED, {
            collapsed: !this.expanded
        });
    }
    
    /**
     * Subscribe to a panel event
     * 
     * @param {string} action - The action type from PANEL_EVENTS
     * @param {Function} callback - Callback function
     * @param {Object} context - Callback context
     * @returns {Function} Unsubscribe function
     */
    subscribeToEvent(action, callback, context = null) {
        if (!this.eventBus) return () => {};
        
        return EventBusService.subscribeToPanelEvent(
            this.eventBus,
            this.panelType,
            action,
            callback,
            context || this
        );
    }
    
    /**
     * Update theme manager state with current panel state
     */
    updateThemeState() {
        if (!this.themeManager || !this.themeManager.state) return;
        
        if (this.panelType === 'workflow') {
            this.themeManager.state.workflowPanelExpanded = this.expanded;
        } else if (this.panelType === 'conversation') {
            this.themeManager.state.conversationPanelCollapsed = !this.expanded;
        }
        
        // Call theme manager's update method if available
        if (typeof this.themeManager.updatePanelState === 'function') {
            this.themeManager.updatePanelState(this.panelType, this.expanded);
        }
    }
    
    /**
     * Show a notification message
     * 
     * @param {string} message - Message to show
     * @param {string} type - Notification type (success, error, info, warning)
     * @param {number} duration - Duration in ms
     */
    showNotification(message, type = 'info', duration = 3000) {
        if (this.uiManager && this.uiManager.showNotification) {
            this.uiManager.showNotification(message, type, duration);
        } else {
            const logMethod = type === 'error' ? console.error : 
                             type === 'warning' ? console.warn : console.log;
            logMethod(`[${this.panelType}] ${message}`);
        }
    }
    
    /**
     * Handle errors with appropriate logging and notifications
     * 
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    handleError(error, context) {
        const errorMessage = `Error in ${this.panelType} panel (${context}): ${error.message}`;
        console.error(errorMessage, error);
        
        if (this.eventBus) {
            EventBusService.publish(
                this.eventBus,
                'error',
                'occurred',
                {
                    error,
                    context: `${this.panelType}:${context}`,
                    message: errorMessage,
                    panelType: this.panelType
                }
            );
        }
        
        this.showNotification(errorMessage, 'error');
    }
    
    /**
     * Subscribe to an event with automatic cleanup
     * 
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    subscribeWithCleanup(event, handler) {
        if (!this.eventBus) return;
        
        // Store original handler for cleanup
        this._eventHandlers = this._eventHandlers || {};
        this._eventHandlers[event] = handler;
        
        this.eventBus.subscribe(event, handler, this);
    }
    
    /**
     * Add an event listener with automatic cleanup
     * 
     * @param {HTMLElement} element - Element to attach listener to
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    addEventListenerWithCleanup(element, event, handler) {
        if (!element) return;
        
        // Store for cleanup
        this._domEventListeners = this._domEventListeners || [];
        this._domEventListeners.push({ element, event, handler });
        
        element.addEventListener(event, handler);
    }
    
    /**
     * Create an element with specified attributes
     * 
     * @param {string} tagName - HTML tag name
     * @param {Object} options - Element options
     * @returns {HTMLElement} Created element
     */
    createElement(tagName, options = {}) {
        const element = document.createElement(tagName);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.id) {
            element.id = options.id;
        }
        
        if (options.innerHTML !== undefined) {
            element.innerHTML = options.innerHTML;
        }
        
        if (options.textContent !== undefined) {
            element.textContent = options.textContent;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.style) {
            Object.assign(element.style, options.style);
        }
        
        return element;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Clean up event subscriptions
        if (this.eventBus && this._eventHandlers) {
            for (const [event, handler] of Object.entries(this._eventHandlers)) {
                this.eventBus.unsubscribe(event, handler);
            }
        }
        
        // Clean up DOM event listeners
        if (this._domEventListeners) {
            for (const { element, event, handler } of this._domEventListeners) {
                if (element) {
                    element.removeEventListener(event, handler);
                }
            }
        }
        
        this.initialized = false;
    }
}