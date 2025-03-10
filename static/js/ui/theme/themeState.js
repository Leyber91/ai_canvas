/**
 * ui/theme/themeState.js
 * 
 * Shared state for theme management across all components.
 * Integrated with PanelStateManager for panel state consistency.
 */
import { panelStateManager } from '../panel/PanelStateManager.js';

export const themeState = {
    // Theme state
    isDarkTheme: true,
    
    // Panel states via getters/setters for integration with panelStateManager
    get workflowPanelExpanded() {
        return panelStateManager.isPanelExpanded('workflow');
    },
    set workflowPanelExpanded(value) {
        panelStateManager.setPanelExpanded('workflow', value);
    },
    
    get conversationPanelCollapsed() {
        return !panelStateManager.isPanelExpanded('conversation');
    },
    set conversationPanelCollapsed(value) {
        panelStateManager.setPanelExpanded('conversation', !value);
    },
    
    // Other theme properties
    chatDialogOpen: false,
    activeNodeId: null,
    
    // Animation timing
    animationDuration: 300, // ms
};
  
export default themeState;