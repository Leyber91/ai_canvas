/**
 * core/panel/BasePanelComponent.js
 * 
 * Base class for panel components with expansion/collapse functionality.
 * Provides common panel operations and state management.
 */

import { BaseComponent } from '../component/BaseComponent.js';
import { EventBehavior } from '../component/behaviors/EventBehavior.js';
import { DOMBehavior } from '../component/behaviors/DOMBehavior.js';
import { ErrorHandlingBehavior } from '../component/behaviors/ErrorHandlingBehavior.js';
import { PANEL_EVENTS } from '../constants/EventTypes.js';

export class BasePanelComponent extends BaseComponent {
  /**
   * @param {Object} options - Panel component configuration
   * @param {string} options.panelType - Type of panel ('workflow', 'conversation', etc.)
   * @param {string} options.panelSelector - CSS selector for the panel (optional)
   * @param {boolean} options.initialExpanded - Whether panel starts expanded
   * @param {Object} options.stateManager - State manager for panel state (optional)
   * @param {Object} options.themeManager - Theme manager reference (optional)
   */
  constructor(options = {}) {
    // Initialize base component
    super({
      ...options,
      name: options.name || `${options.panelType || 'base'}PanelComponent`,
      // Apply standard behaviors
      behaviors: [
        EventBehavior,
        DOMBehavior,
        ErrorHandlingBehavior,
        ...(options.behaviors || [])
      ]
    });
    
    // Panel configuration
    this.panelType = options.panelType || 'panel';
    this.panelSelector = options.panelSelector || `#${this.panelType}-panel`;
    
    // External managers
    this.stateManager = options.stateManager || null;
    this.themeManager = options.themeManager || null;
    
    // Panel state
    this.expanded = options.initialExpanded !== undefined ? 
      options.initialExpanded : 
      (this.stateManager ? this.stateManager.isPanelExpanded(this.panelType) : true);
    
    // Bind panel-specific methods
    this.togglePanel = this.togglePanel.bind(this);
    this.expandPanel = this.expandPanel.bind(this);
    this.collapsePanel = this.collapsePanel.bind(this);
    this.applyPanelState = this.applyPanelState.bind(this);
    this.getPanelElement = this.getPanelElement.bind(this);
  }
  
  /**
   * Initialize the panel component
   * 
   * @returns {BasePanelComponent} This component instance
   */
  initialize() {
    if (this.initialized) return this;
    
    try {
      // Call base initialization
      super.initialize();
      
      // Apply initial panel state
      this.applyPanelState();
      
      // Apply theme styling if available
      this.applyThemeStyling();
      
      // Publish panel initialized event
      this.publish(this.panelType, PANEL_EVENTS.INITIALIZED, { 
        expanded: this.expanded 
      });
    } catch (error) {
      this.handleError(error, 'initialize');
    }
    
    return this;
  }
  
  /**
   * Find DOM elements needed by this panel
   * Override in subclasses
   */
  findDOMElements() {
    // Find panel element
    this.panel = this.findElement(this.panelSelector);
    
    // Find toggle button if available
    this.toggleButton = this.findElement(`${this.panelType}-panel-toggle`);
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Set up toggle button if available
    if (this.toggleButton) {
      this.addEventListenerWithCleanup(this.toggleButton, 'click', this.togglePanel);
    }
    
    // Set up panel title click for toggling if available
    const panelTitle = this.panel ? this.panel.querySelector('.panel-title') : null;
    if (panelTitle) {
      this.addEventListenerWithCleanup(panelTitle, 'click', this.togglePanel);
    }
  }
  
  /**
   * Subscribe to events
   */
  subscribeToEvents() {
    // Subscribe to state changes if state manager is available
    if (this.stateManager && this.eventBus) {
      this.subscribeWithCleanup('panel:state-changed', this.handlePanelStateChanged);
    }
    
    // Subscribe to theme changes if theme manager is available
    if (this.themeManager && this.eventBus) {
      this.subscribeWithCleanup('ui:theme-changed', this.applyThemeStyling);
    }
  }
  
  /**
   * Toggle panel expansion state
   */
  togglePanel() {
    try {
      // Update state
      this.expanded = !this.expanded;
      
      // Update state manager if available
      if (this.stateManager) {
        this.stateManager.setPanelExpanded(this.panelType, this.expanded);
      }
      
      // Apply state to DOM
      this.applyPanelState();
      
      // Publish toggle event
      this.publish(this.panelType, PANEL_EVENTS.TOGGLED, {
        expanded: this.expanded,
        collapsed: !this.expanded
      });
      
      // Update theme manager state if available
      this.updateThemeState();
    } catch (error) {
      this.handleError(error, 'togglePanel');
    }
  }
  
  /**
   * Expand the panel
   */
  expandPanel() {
    if (!this.expanded) {
      this.togglePanel();
    } else {
      // If already expanded, just publish the event
      this.publish(this.panelType, PANEL_EVENTS.EXPANDED);
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
      this.publish(this.panelType, PANEL_EVENTS.COLLAPSED);
    }
  }
  
  /**
   * Apply the current panel state to the DOM
   */
  applyPanelState() {
    const panel = this.getPanelElement();
    if (!panel) return;
    
    // Get current state from state manager if available
    const expanded = this.stateManager ? 
      this.stateManager.isPanelExpanded(this.panelType) : 
      this.expanded;
    
    // Update local state
    this.expanded = expanded;
    
    // Update DOM
    if (expanded) {
      panel.classList.remove('collapsed');
      panel.setAttribute('aria-expanded', 'true');
    } else {
      panel.classList.add('collapsed');
      panel.setAttribute('aria-expanded', 'false');
    }
    
    // Update title toggle indicator if available
    this.updateToggleIndicator();
  }
  
  /**
   * Update toggle indicator in panel title
   */
  updateToggleIndicator() {
    const panel = this.getPanelElement();
    if (!panel) return;
    
    const panelTitle = panel.querySelector('.panel-title');
    if (!panelTitle) return;
    
    // Find or create toggle indicator
    let indicator = panelTitle.querySelector('.toggle-indicator');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'toggle-indicator';
      panelTitle.appendChild(indicator);
    }
    
    // Update indicator text
    indicator.textContent = this.expanded ? '▼' : '►';
    
    // Update expanded attribute
    panelTitle.setAttribute('data-expanded', this.expanded ? 'true' : 'false');
  }
  
  /**
   * Apply theme styling to the panel
   */
  applyThemeStyling() {
    const themeManager = this.themeManager;
    if (!themeManager || !themeManager.state) return;
    
    // Apply theme-specific panel styles if supported
    const panel = this.getPanelElement();
    if (panel && themeManager.getPanelStyles) {
      const styles = themeManager.getPanelStyles(this.panelType);
      this.applyStyles(panel, styles);
    }
  }
  
  /**
   * Get the panel DOM element
   * 
   * @returns {HTMLElement} The panel element
   */
  getPanelElement() {
    // Try to get from elements object
    if (this.panel) {
      return this.panel;
    }
    
    // Try to find by selector
    if (this.panelSelector) {
      this.panel = this.findElement(this.panelSelector);
      return this.panel;
    }
    
    return null;
  }
  
  /**
   * Handle panel state changed event
   * 
   * @param {Object} data - Event data
   */
  handlePanelStateChanged(data) {
    // Only handle events for this panel type
    if (data.panelType !== this.panelType) return;
    
    // Update local state
    this.expanded = data.state.expanded;
    
    // Apply state to DOM
    this.applyPanelState();
  }
  
  /**
   * Update theme manager state with current panel state
   */
  updateThemeState() {
    if (!this.themeManager || !this.themeManager.state) return;
    
    // Call theme manager's update method if available
    if (typeof this.themeManager.updatePanelState === 'function') {
      this.themeManager.updatePanelState(this.panelType, this.expanded);
    }
  }
  
  /**
   * Check if the panel is expanded
   * 
   * @returns {boolean} True if expanded
   */
  isExpanded() {
    return this.stateManager ? 
      this.stateManager.isPanelExpanded(this.panelType) : 
      this.expanded;
  }
  
  /**
   * Check if the panel is collapsed
   * 
   * @returns {boolean} True if collapsed
   */
  isCollapsed() {
    return !this.isExpanded();
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Call base destroy
    super.destroy();
  }
}
