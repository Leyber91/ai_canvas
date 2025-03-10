/**
 * ui/theme/themeState.js
 * 
 * Shared state for theme management across all components
 */

export const themeState = {
    // Theme state
    isDarkTheme: true,
    workflowPanelExpanded: false,
    conversationPanelCollapsed: false,
    chatDialogOpen: false,
    activeNodeId: null,
    
    // Animation timing
    animationDuration: 300, // ms
  };
  
  export default themeState;