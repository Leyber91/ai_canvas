/**
 * ui/panel/BasePanelManager.js
 * 
 * Compatibility wrapper around BasePanelComponent.
 * Maintains backward compatibility while using the new component system.
 */
import { BaseManager } from '../managers/BaseManager.js';
import { BasePanelComponent } from '../../core/panel/BasePanelComponent.js';
import { stateManager } from '../../core/state/StateManager.js';
import { EventBusService } from '../../core/services/EventBusService.js';
import { PANEL_EVENTS } from '../../core/constants/EventTypes.js';

export class BasePanelManager extends BaseManager {
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
        // Initialize base manager
        super(options);
        
        // Panel configuration
        this.panelType = options.panelType || 'panel';
        this.panelSelector = options.panelSelector || null;
        this.eventPrefix = options.eventPrefix || this.panelType;
        this.themeManager = options.themeManager || (options.uiManager ? options.uiManager.themeManager : null);
        
        // Create internal panel component
        this._panelComponent = new BasePanelComponent({
            name: `${this.panelType}PanelComponent`,
            eventBus: this.eventBus,
            parent: this,
            panelType: this.panelType,
            panelSelector: this.panelSelector,
            initialExpanded: options.initialExpanded,
            stateManager: stateManager,
            themeManager: this.themeManager
        });
        
        // Panel state (delegated to component)
        this.expanded = this._panelComponent.expanded;
        
        // Bind methods
        this.togglePanel = this.togglePanel.bind(this);
        this.expandPanel = this.expandPanel.bind(this);
        this.collapsePanel = this.collapsePanel.bind(this);
        this.publishToggleEvent = this.publishToggleEvent.bind(this);
    }
    
    /**
     * Initialize the panel manager
     */
    initialize() {
        if (this.initialized) return;
        
        // Initialize panel component first
        this._panelComponent.initialize();
        
        // Call base initialization
        super.initialize();
        
        // Sync state with component
        this.expanded = this._panelComponent.expanded;
        
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
        // Delegate to panel component
        this._panelComponent.togglePanel();
        
        // Sync state with component
        this.expanded = this._panelComponent.expanded;
        
        // Publish event for backward compatibility
        this.publishToggleEvent();
    }
    
    /**
     * Expand the panel
     */
    expandPanel() {
        // Delegate to panel component
        this._panelComponent.expandPanel();
        
        // Sync state with component
        this.expanded = this._panelComponent.expanded;
    }
    
    /**
     * Collapse the panel
     */
    collapsePanel() {
        // Delegate to panel component
        this._panelComponent.collapsePanel();
        
        // Sync state with component
        this.expanded = this._panelComponent.expanded;
    }
    
    /**
     * Apply the current panel state to the DOM
     */
    applyPanelState() {
        // Delegate to panel component
        this._panelComponent.applyPanelState();
        
        // Sync state with component
        this.expanded = this._panelComponent.expanded;
    }
    
    /**
     * Apply theme styling to the panel
     * To be implemented or extended by subclasses
     */
    applyThemeStyling() {
        // Delegate to panel component
        this._panelComponent.applyThemeStyling();
    }
    
    /**
     * Get the panel DOM element
     * 
     * @returns {HTMLElement} The panel element
     */
    getPanelElement() {
        // Delegate to panel component
        return this._panelComponent.getPanelElement();
    }
    
    
    /**
     * Check if the panel is expanded
     * 
     * @returns {boolean} True if expanded
     */
    isExpanded() {
        // Delegate to panel component
        return this._panelComponent.isExpanded();
    }
    
    /**
     * Check if the panel is collapsed
     * 
     * @returns {boolean} True if collapsed
     */
    isCollapsed() {
        // Delegate to panel component
        return this._panelComponent.isCollapsed();
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
        // Delegate to panel component
        this._panelComponent.updateThemeState();
    }
    
    
    
    /**
     * Clean up resources
     */
    destroy() {
        // Destroy panel component
        this._panelComponent.destroy();
        
        // Call base destroy
        super.destroy();
    }
}
