/**
 * ui/theme/themeState.js
 * 
 * Compatibility wrapper around core/theme/ThemeState
 * Maintains backward compatibility with same API
 */

import { themeState as coreThemeState } from '../../core/theme/ThemeState.js';
import { panelStateManager } from '../panel/PanelStateManager.js';

// Create a proxy object that maintains the original API
// but delegates to the core implementation
const themeStateProxy = {
  // Forward isDarkTheme to core implementation
  get isDarkTheme() {
    return coreThemeState.isDarkTheme;
  },
  set isDarkTheme(value) {
    coreThemeState.isDarkTheme = value;
  },
  
  // Maintain panel state integration
  get workflowPanelExpanded() {
    return panelStateManager.isPanelExpanded('workflow');
  },
  set workflowPanelExpanded(value) {
    panelStateManager.setPanelExpanded('workflow', value);
    coreThemeState.workflowPanelExpanded = value;
  },
  
  get conversationPanelCollapsed() {
    return !panelStateManager.isPanelExpanded('conversation');
  },
  set conversationPanelCollapsed(value) {
    panelStateManager.setPanelExpanded('conversation', !value);
    coreThemeState.conversationPanelCollapsed = value;
  },
  
  // Forward other properties to core implementation
  get chatDialogOpen() {
    return coreThemeState._state.chatDialogOpen || false;
  },
  set chatDialogOpen(value) {
    coreThemeState._state.chatDialogOpen = value;
  },
  
  get activeNodeId() {
    return coreThemeState.activeNodeId;
  },
  set activeNodeId(value) {
    coreThemeState.activeNodeId = value;
  },
  
  get animationDuration() {
    return 300; // Keep original default for backward compatibility
  },
  
  // Add subscription method for backward compatibility
  subscribe(property, callback) {
    return coreThemeState.subscribe(property, callback);
  }
};

// Export the proxy as themeState
export const themeState = themeStateProxy;
export default themeState;
