/**
 * ui/panel/EnhancedBasePanelManager.js
 * 
 * Enhanced base class for panel managers with improved state management and UI consistency.
 * Integrates with both PanelStateManager and the new StateManager for centralized state tracking.
 */
import { BasePanelManager } from './BasePanelManager.js';
import { panelStateManager } from './PanelStateManager.js';
import { PanelUtils } from './PanelUtils.js';
import { stateManager } from '../../core/state/StateManager.js';

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
        // Get initial expanded state from both state managers for compatibility
        // Prefer the new StateManager if available
        const initialExpanded = options.panelType ? 
            (stateManager.isPanelExpanded(options.panelType) || 
             panelStateManager.isPanelExpanded(options.panelType)) : 
            (options.initialExpanded !== undefined ? options.initialExpanded : true);
            
        super({
            ...options,
            initialExpanded
        });
        
        // Panel options
        this.panelOptions = options.panelOptions || {};
        
        // DOM elements
        this.containerElement = null;
        
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
        
        // Subscribe to panel state changes from both state managers
        if (this.eventBus) {
            this.subscribeWithCleanup('panel:state-changed', this.handlePanelStateChanged);
            this.subscribeWithCleanup('state:changed:panels.' + this.panelType, this.handlePanelStateChanged);
        }
        
        // Call base initialization
        super.initialize();
        
        // Sync initial state with state managers
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
     * Enhanced to use both state managers
     */
    applyPanelState() {
        // Get panel element
        const panel = this.getPanelElement();
        if (!panel) return;
        
        // Get current state from state managers (prefer new StateManager)
        const expanded = this.isExpanded();
        
        // Update local state
        this.expanded = expanded;
        
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
     * Enhanced to use both state managers
     */
    togglePanel() {
        if (this.panelType) {
            // Use both state managers to toggle state
            stateManager.togglePanelExpanded(this.panelType);
            panelStateManager.togglePanelExpanded(this.panelType);
            
            // Update local state
            this.expanded = this.isExpanded();
        } else {
            // Fallback to direct toggle
            this.expanded = !this.expanded;
            
            // Update DOM
            this.applyPanelState();
        }
        
        // Publish event
        this.publishToggleEvent();
        
        // Call base class method to ensure component is updated
        super.togglePanel();
    }
    
    /**
     * Sync panel state with state managers
     */
    syncWithStateManager() {
        if (!this.panelType) return;
        
        // Get current state from state managers (prefer new StateManager)
        const expanded = this.isExpanded();
        
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
        // Handle events from both state managers
        if (data.panelType && data.panelType !== this.panelType) return;
        
        // For new StateManager events
        if (data.path && data.path.includes(this.panelType)) {
            // Update local state
            this.expanded = data.newValue.expanded;
        } 
        // For legacy PanelStateManager events
        else if (data.state) {
            // Update local state
            this.expanded = data.state.expanded;
        }
        
        // Apply state to DOM
        this.applyPanelState();
        
        // Publish toggle event
        this.publishToggleEvent();
    }
    
    /**
     * Override isExpanded to use both state managers
     * 
     * @returns {boolean} Whether the panel is expanded
     */
    isExpanded() {
        if (!this.panelType) return this.expanded;
        
        // Try new StateManager first, then fall back to legacy PanelStateManager
        return stateManager.isPanelExpanded(this.panelType) || 
               panelStateManager.isPanelExpanded(this.panelType);
    }
    
    /**
     * Clean up resources on destroy
     */
    destroy() {
        // Call base destroy which will handle unsubscribing
        super.destroy();
    }
}
