/**
 * ui/panel/PanelStateManager.js
 * 
 * Compatibility wrapper around the new StateManager.
 * Maintains backward compatibility while using the new state management system.
 */
import { stateManager } from '../../core/state/StateManager.js';
export class PanelStateManager {
    /**
     * @param {Object} options - Configuration options
     * @param {Object} options.eventBus - Event bus for state change notifications
     * @param {Object} options.initialStates - Initial panel states
     */
    constructor(options = {}) {
        this.eventBus = options.eventBus;
        
        // Initialize panel states with defaults and any provided initial states
        // This is kept for backward compatibility, but we'll use StateManager internally
        this.panelStates = {
            workflow: { expanded: false },
            conversation: { expanded: true },
            ...((options.initialStates || {}))
        };
        
        // Sync initial states with the new StateManager
        this.syncWithStateManager();
    }
    
    /**
     * Sync panel states with the new StateManager
     * @private
     */
    syncWithStateManager() {
        // For each panel type, sync the state with the new StateManager
        Object.entries(this.panelStates).forEach(([panelType, state]) => {
            // Only set if different to avoid circular updates
            if (stateManager.isPanelExpanded(panelType) !== state.expanded) {
                stateManager.setPanelExpanded(panelType, state.expanded);
            }
        });
    }
    
    /**
     * Get the state for a specific panel
     * 
     * @param {string} panelType - The panel type identifier
     * @returns {Object} Panel state object
     */
    getPanelState(panelType) {
        // Get state from the new StateManager
        const expanded = stateManager.isPanelExpanded(panelType);
        
        // Update local state for backward compatibility
        if (!this.panelStates[panelType]) {
            this.panelStates[panelType] = { expanded: true };
        } else {
            this.panelStates[panelType].expanded = expanded;
        }
        
        return this.panelStates[panelType];
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
        
        // Update the new StateManager
        if (state.expanded !== undefined) {
            stateManager.setPanelExpanded(panelType, state.expanded);
        }
        
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
        // Use the new StateManager to toggle
        const newExpandedState = stateManager.togglePanelExpanded(panelType);
        
        // Update local state for backward compatibility
        this.panelStates[panelType] = this.panelStates[panelType] || { expanded: true };
        this.panelStates[panelType].expanded = newExpandedState;
        
        // Publish state change event if event bus available
        if (this.eventBus) {
            this.eventBus.publish(`panel:state-changed`, {
                panelType,
                state: this.panelStates[panelType]
            });
        }
        
        return newExpandedState;
    }
    
    /**
     * Set the expanded state of a panel
     * 
     * @param {string} panelType - The panel type identifier
     * @param {boolean} expanded - The new expanded state
     */
    setPanelExpanded(panelType, expanded) {
        // Use the new StateManager
        stateManager.setPanelExpanded(panelType, expanded);
        
        // Update local state for backward compatibility
        this.panelStates[panelType] = this.panelStates[panelType] || { expanded: true };
        this.panelStates[panelType].expanded = expanded;
        
        // Publish state change event if event bus available
        if (this.eventBus) {
            this.eventBus.publish(`panel:state-changed`, {
                panelType,
                state: this.panelStates[panelType]
            });
        }
    }
    
    /**
     * Get the expanded state of a panel
     * 
     * @param {string} panelType - The panel type identifier
     * @returns {boolean} Whether the panel is expanded
     */
    isPanelExpanded(panelType) {
        // Use the new StateManager
        return stateManager.isPanelExpanded(panelType);
    }
}

// Create singleton instance
export const panelStateManager = new PanelStateManager();
