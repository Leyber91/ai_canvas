/**
 * ui/panel/EnhancedBasePanelManager.js
 * 
 * Enhanced base class for panel managers with improved state management and UI consistency.
 * Integrates with PanelStateManager to provide centralized panel state tracking.
 */
import { BasePanelManager } from './BasePanelManager.js';
import { panelStateManager } from './PanelStateManager.js';
import { PanelUtils } from './PanelUtils.js';

export class EnhancedBasePanelManager extends BasePanelManager {
    /**
     * @param {Object} options - Panel manager configuration
     * @param {Object} options.eventBus - Event bus for pub/sub (optional)
     * @param {Object} options.uiManager - UI Manager reference (optional)
     * @param {string} options.panelType - Type of panel ('workflow', 'conversation', etc.)
     * @param {string} options.eventPrefix - Prefix for panel events
     * @param {Object} options.panelOptions - Additional panel-specific options
     */
    constructor(options = {}) {
        // Initialize the base class with initial expanded state from panel state manager
        const initialExpanded = options.panelType ? 
            panelStateManager.isPanelExpanded(options.panelType) : 
            (options.initialExpanded !== undefined ? options.initialExpanded : true);
            
        super({
            ...options,
            initialExpanded
        });
        
        // Panel options
        this.panelOptions = options.panelOptions || {};
        
        // DOM elements
        this.containerElement = null;
        this.panel = null;
        
        // Bind additional methods
        this.syncWithStateManager = this.syncWithStateManager.bind(this);
        this.handlePanelStateChanged = this.handlePanelStateChanged.bind(this);
    }
    
    /**
     * Initialize the panel manager
     */
    initialize() {
        if (this.initialized) return;
        
        // Create or find container element
        this.createContainerElement();
        
        // Subscribe to panel state changes
        if (this.eventBus) {
            this.eventBus.subscribe('panel:state-changed', this.handlePanelStateChanged);
        }
        
        // Call base initialization
        super.initialize();
        
        // Sync initial state with state manager
        this.syncWithStateManager();
    }
    
    /**
     * Create or find the container element for the panel
     * Can be overridden by subclasses
     */
    createContainerElement() {
        // Default implementation - create a container with standard positioning
        const containerClass = `${this.panelType}-panel-container`;
        
        // Default styles by panel type
        const defaultStyles = {
            workflow: {
                top: '60px',
                right: '20px',
                width: '350px',
                maxHeight: 'calc(100vh - 80px)'
            },
            conversation: {
                top: '60px',
                left: '20px',
                width: '350px',
                maxHeight: 'calc(100vh - 80px)'
            }
        };
        
        // Get styles for this panel type or use empty object
        const styles = defaultStyles[this.panelType] || {};
        
        // Use PanelUtils to find or create container
        this.containerElement = PanelUtils.findOrCreatePanelContainer(
            containerClass, 
            { ...styles, ...(this.panelOptions.containerStyles || {}) }
        );
        
        // Apply custom scrollbar
        PanelUtils.createPanelScrollbar(this.containerElement, this.panelOptions.scrollbarOptions);
    }
    
    /**
     * Apply the current panel state to the DOM
     * Enhanced to use panel state manager
     */
    applyPanelState() {
        // Get panel element
        const panel = this.getPanelElement();
        if (!panel) return;
        
        // Get current state from state manager
        const expanded = this.panelType ? 
            panelStateManager.isPanelExpanded(this.panelType) : 
            this.expanded;
        
        // Update DOM
        if (expanded) {
            panel.classList.remove('collapsed');
        } else {
            panel.classList.add('collapsed');
        }
        
        // Update title toggle indicator if available
        const panelTitle = panel.querySelector('.panel-title');
        if (panelTitle) {
            PanelUtils.updateToggleIndicator(panelTitle, expanded);
        }
    }
    
    /**
     * Toggle panel expansion state
     * Enhanced to use panel state manager
     */
    togglePanel() {
        if (this.panelType) {
            // Use state manager to toggle state
            panelStateManager.togglePanelExpanded(this.panelType);
            
            // Update local state
            this.expanded = panelStateManager.isPanelExpanded(this.panelType);
        } else {
            // Fallback to direct toggle
            this.expanded = !this.expanded;
            
            // Update DOM
            this.applyPanelState();
        }
        
        // Publish event
        this.publishToggleEvent();
    }
    
    /**
     * Sync panel state with state manager
     */
    syncWithStateManager() {
        if (!this.panelType) return;
        
        // Get current state from state manager
        const expanded = panelStateManager.isPanelExpanded(this.panelType);
        
        // Update local state if different
        if (this.expanded !== expanded) {
            this.expanded = expanded;
            this.applyPanelState();
        }
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
        
        // Publish toggle event
        this.publishToggleEvent();
    }
    
    /**
     * Override isExpanded to use state manager
     * 
     * @returns {boolean} Whether the panel is expanded
     */
    isExpanded() {
        return this.panelType ? 
            panelStateManager.isPanelExpanded(this.panelType) : 
            this.expanded;
    }
    
    /**
     * Clean up resources on destroy
     */
    destroy() {
        // Unsubscribe from panel state changes
        if (this.eventBus) {
            this.eventBus.unsubscribe('panel:state-changed', this.handlePanelStateChanged);
        }
        
        // Call base destroy
        super.destroy();
    }
}