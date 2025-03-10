/**
 * ui/panel/PanelStateManager.js
 * 
 * Centralized manager for panel states across the application.
 * Provides a single source of truth for panel expansion states.
 */
export class PanelStateManager {
    /**
     * @param {Object} options - Configuration options
     * @param {Object} options.eventBus - Event bus for state change notifications
     * @param {Object} options.initialStates - Initial panel states
     */
    constructor(options = {}) {
        this.eventBus = options.eventBus;
        
        // Initialize panel states with defaults and any provided initial states
        this.panelStates = {
            workflow: { expanded: false },
            conversation: { expanded: true },
            ...((options.initialStates || {}))
        };
    }
    
    /**
     * Get the state for a specific panel
     * 
     * @param {string} panelType - The panel type identifier
     * @returns {Object} Panel state object
     */
    getPanelState(panelType) {
        return this.panelStates[panelType] || { expanded: true };
    }
    
    /**
     * Set the state for a specific panel
     * 
     * @param {string} panelType - The panel type identifier
     * @param {Object} state - New state object to merge
     */
    setPanelState(panelType, state) {
        // Ensure panel type exists in state
        if (!this.panelStates[panelType]) {
            this.panelStates[panelType] = { expanded: true };
        }
        
        // Merge the new state
        this.panelStates[panelType] = {
            ...this.panelStates[panelType],
            ...state
        };
        
        // Publish state change event if event bus available
        if (this.eventBus) {
            this.eventBus.publish(`panel:state-changed`, {
                panelType,
                state: this.panelStates[panelType]
            });
        }
    }
    
    /**
     * Toggle the expanded state of a panel
     * 
     * @param {string} panelType - The panel type identifier
     * @returns {boolean} The new expanded state
     */
    togglePanelExpanded(panelType) {
        const currentState = this.getPanelState(panelType);
        const newExpandedState = !currentState.expanded;
        
        this.setPanelState(panelType, { expanded: newExpandedState });
        
        return newExpandedState;
    }
    
    /**
     * Set the expanded state of a panel
     * 
     * @param {string} panelType - The panel type identifier
     * @param {boolean} expanded - The new expanded state
     */
    setPanelExpanded(panelType, expanded) {
        this.setPanelState(panelType, { expanded });
    }
    
    /**
     * Get the expanded state of a panel
     * 
     * @param {string} panelType - The panel type identifier
     * @returns {boolean} Whether the panel is expanded
     */
    isPanelExpanded(panelType) {
        return this.getPanelState(panelType).expanded;
    }
}

// Create singleton instance
export const panelStateManager = new PanelStateManager();