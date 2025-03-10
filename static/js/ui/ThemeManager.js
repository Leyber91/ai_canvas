/**
 * ui/ThemeManager.js
 * 
 * Manages the space-inspired dark theme and UI enhancements for AI Canvas.
 * Coordinates various theme modules for animations, UI elements, and theme features.
 */

import { themeState } from './theme/themeState.js';
import { DOMElementFinder } from './theme/utils/DOMElementFinder.js';
import { EventListenerSetup } from './theme/events/EventListenerSetup.js';
import { SpaceBackground } from './theme/background/SpaceBackground.js';
import { UIAnimations } from './theme/animations/UIAnimations.js';
import { WorkflowPanelManager } from './theme/panels/WorkflowPanelManager.js';
import { ConversationPanelManager } from './theme/panels/ConversationPanelManager.js';
import { NodeChatDialogManager } from './theme/chat/NodeChatDialogManager.js';
import { CytoscapeThemeManager } from './theme/cytoscape/CytoscapeThemeManager.js';
import { ExecutionUIManager } from './theme/execution/ExecutionUIManager.js';
import { TooltipManager } from './theme/tooltips/TooltipManager.js';

export class ThemeManager {
  /**
   * @param {UIManager} uiManager - Parent UI Manager instance
   */
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.eventBus = uiManager.eventBus;
    
    // Initialize theme state
    this.state = themeState;
    
    // DOM element references
    this.elements = {};
    
    // Current active node chat
    this.currentNodeChat = null;
    
    // Store ripple effect timeouts for cleanup
    this.rippleTimeouts = [];
    
    // Sub-managers
    this.domFinder = new DOMElementFinder();
    this.eventSetup = null; // Initialized after DOM elements are found
    this.backgroundManager = new SpaceBackground();
    this.animationManager = new UIAnimations();
    this.workflowPanelManager = null; // Initialized after DOM elements are found
    this.conversationPanelManager = null; // Initialized after DOM elements are found
    this.nodeChatManager = null; // Initialized after DOM elements are found
    this.cytoscapeThemeManager = null; // Initialized after Cytoscape is available
    this.executionUIManager = null; // Initialized after DOM elements are found
    this.tooltipManager = null; // Initialized after DOM elements are found
    
    // Bind methods
    this.handleNodeSelected = this.handleNodeSelected.bind(this);
    this.handleNodeDeselected = this.handleNodeDeselected.bind(this);
    this.handleNodeExecuting = this.handleNodeExecuting.bind(this);
    this.handleNodeCompleted = this.handleNodeCompleted.bind(this);
    this.handleNodeError = this.handleNodeError.bind(this);
  }
  
  /**
   * Initialize theme manager and set up event listeners
   */
  initialize() {
    // Find DOM elements
    this.elements = this.domFinder.findElements();
    
    // Initialize sub-managers that need DOM elements
    this.eventSetup = new EventListenerSetup(this, this.elements, this.eventBus);
    this.workflowPanelManager = new WorkflowPanelManager(this.elements, this.eventBus);
    this.conversationPanelManager = new ConversationPanelManager(this.elements, this.eventBus);
    this.nodeChatManager = new NodeChatDialogManager(this, this.elements, this.eventBus);
    this.executionUIManager = new ExecutionUIManager(this, this.elements, this.eventBus);
    this.tooltipManager = new TooltipManager(this.elements.tooltip);
    
    // Set up event listeners
    this.eventSetup.setupEventListeners();
    
    // Initialize the space background
    this.backgroundManager.initializeSpaceBackground();
    
    // Initialize animations
    this.animationManager.initializeAnimations();
    
    // Initialize panels
    this.workflowPanelManager.initialize();
    this.conversationPanelManager.initialize();
    
    // Initialize node chat dialog
    this.nodeChatManager.initialize();
    
    // Apply Cytoscape theme
    this.applyCytoscapeTheme();
    
    console.log('Theme Manager initialized');
    
    // Publish theme initialized event
    this.eventBus.publish('theme:initialized', { theme: 'dark-space' });
  }
  
  /**
   * Apply Cytoscape theme styling
   */
  applyCytoscapeTheme() {
    // We'll apply this when Cytoscape is initialized in GraphManager
    if (!this.uiManager.graphManager || !this.uiManager.graphManager.cy) {
      console.warn('Cytoscape instance not available yet, deferring theme application');
      
      // Set a retry timeout
      setTimeout(() => {
        if (this.uiManager.graphManager && this.uiManager.graphManager.cy) {
          this.cytoscapeThemeManager = new CytoscapeThemeManager(
            this.uiManager.graphManager.cy,
            this
          );
          this.cytoscapeThemeManager.applyCytoscapeTheme();
        } else {
          console.warn('Cytoscape still not available after timeout');
        }
      }, 2000);
      
      return;
    }
    
    try {
      this.cytoscapeThemeManager = new CytoscapeThemeManager(
        this.uiManager.graphManager.cy,
        this
      );
      this.cytoscapeThemeManager.applyCytoscapeTheme();
    } catch (error) {
      console.error('Error applying Cytoscape theme:', error);
    }
  }
  
  /**
   * Toggle workflow panel expansion
   */
  toggleWorkflowPanel() {
    if (!this.workflowPanelManager) return;
    
    try {
      this.workflowPanelManager.toggleWorkflowPanel();
      this.state.workflowPanelExpanded = this.workflowPanelManager.isExpanded();
    } catch (error) {
      console.error('Error toggling workflow panel:', error);
    }
  }
  
  /**
   * Toggle conversation panel collapse
   */
  toggleConversationPanel() {
    if (!this.conversationPanelManager) return;
    
    try {
      this.conversationPanelManager.toggleConversationPanel();
      this.state.conversationPanelCollapsed = this.conversationPanelManager.isCollapsed();
    } catch (error) {
      console.error('Error toggling conversation panel:', error);
    }
  }
  
  /**
   * Show node chat dialog
   * 
   * @param {string} nodeId - ID of the node to chat with
   * @param {string} nodeName - Name of the node
   */
  showNodeChatDialog(nodeId, nodeName) {
    if (!this.nodeChatManager) return;
    
    try {
      this.currentNodeChat = nodeId;
      this.nodeChatManager.showNodeChatDialog(nodeId, nodeName);
      this.state.chatDialogOpen = true;
    } catch (error) {
      console.error('Error showing node chat dialog:', error);
    }
  }
  
  /**
   * Hide node chat dialog
   */
  hideNodeChatDialog() {
    if (!this.nodeChatManager) return;
    
    try {
      this.nodeChatManager.hideNodeChatDialog();
      this.currentNodeChat = null;
      this.state.chatDialogOpen = false;
    } catch (error) {
      console.error('Error hiding node chat dialog:', error);
    }
  }
  
  /**
   * Send message from node chat dialog
   */
  sendNodeChatMessage() {
    if (!this.currentNodeChat || !this.nodeChatManager) return;
    
    try {
      this.nodeChatManager.sendNodeChatMessage(this.currentNodeChat);
    } catch (error) {
      console.error('Error sending node chat message:', error);
    }
  }
  
  /**
   * Show result modal
   * 
   * @param {string} nodeId - ID of the node
   * @param {string} result - Result content
   */
  showResultModal(nodeId, result) {
    if (!this.executionUIManager) return;
    
    try {
      this.executionUIManager.showResultModal(nodeId, result, this.getNodeName(nodeId));
    } catch (error) {
      console.error('Error showing result modal:', error);
    }
  }
  
  /**
   * Hide result modal
   */
  hideResultModal() {
    if (!this.executionUIManager) return;
    
    try {
      this.executionUIManager.hideResultModal();
    } catch (error) {
      console.error('Error hiding result modal:', error);
    }
  }
  
  /**
   * Get node name by ID
   * 
   * @param {string} nodeId - Node ID
   * @returns {string} Node name or ID if not found
   */
  getNodeName(nodeId) {
    if (!this.uiManager.graphManager) return nodeId;
    
    try {
      const node = this.uiManager.graphManager.getNodeData(nodeId);
      return node ? node.name : nodeId;
    } catch (error) {
      console.warn(`Error getting node name for ${nodeId}:`, error);
      return nodeId;
    }
  }
  
  /**
   * Handle node selected event
   * 
   * @param {Object} nodeData - Node data
   */
  handleNodeSelected(nodeData) {
    if (!nodeData || !nodeData.id) {
      console.warn('Invalid node data in handleNodeSelected');
      return;
    }
    
    this.state.activeNodeId = nodeData.id;
    
    // If conversation panel is collapsed, expand it
    if (this.state.conversationPanelCollapsed && this.conversationPanelManager) {
      this.toggleConversationPanel();
    }
    
    // Apply selected styling to the node
    if (this.uiManager.graphManager && this.uiManager.graphManager.cy && this.cytoscapeThemeManager) {
      try {
        const node = this.uiManager.graphManager.cy.$(`#${nodeData.id}`);
        if (node && node.length > 0) {
          this.cytoscapeThemeManager.addNodePulseAnimation(node);
        }
      } catch (error) {
        console.warn(`Error adding pulse animation to node ${nodeData.id}:`, error);
      }
    }
  }
  
  /**
   * Handle node deselected event
   */
  handleNodeDeselected() {
    this.state.activeNodeId = null;
    
    // Remove any node animations
    if (this.uiManager.graphManager?.cy && this.cytoscapeThemeManager) {
      try {
        const nodes = this.uiManager.graphManager.cy.nodes();
        nodes.forEach(node => {
          if (node && node.length > 0) {
            this.cytoscapeThemeManager.removeNodePulseAnimation(node);
          }
        });
      } catch (error) {
        console.warn('Error removing pulse animations:', error);
      }
    }
  }
  
  /**
   * Handle node executing event
   * 
   * @param {Object} data - Event data
   */
  handleNodeExecuting(data) {
    if (!data || !data.nodeId) {
      console.warn('Invalid data in handleNodeExecuting');
      return;
    }
    
    const { nodeId, progress } = data;
    
    // Update execution UI
    if (this.executionUIManager) {
      try {
        this.executionUIManager.updateNodeExecuting(nodeId, progress);
      } catch (error) {
        console.warn(`Error updating execution UI for node ${nodeId}:`, error);
      }
    }
    
    // If workflow panel is not expanded, expand it
    if (!this.state.workflowPanelExpanded) {
      this.toggleWorkflowPanel();
    }
    
    // Apply executing animation to the node
    if (this.uiManager.graphManager?.cy && this.cytoscapeThemeManager) {
      try {
        const node = this.uiManager.graphManager.cy.$(`#${nodeId}`);
        if (node && node.length > 0) {
          this.cytoscapeThemeManager.addNodeExecutingAnimation(node);
        } else {
          console.warn(`Node not found in Cytoscape: ${nodeId}`);
        }
      } catch (error) {
        console.warn(`Error adding executing animation to node ${nodeId}:`, error);
      }
    }
  }
  
  /**
   * Handle node completed event
   * 
   * @param {Object} data - Event data
   */
  handleNodeCompleted(data) {
    if (!data || !data.nodeId) {
      console.warn('Invalid data in handleNodeCompleted');
      return;
    }
    
    const { nodeId, result } = data;
    
    // Update execution UI
    if (this.executionUIManager) {
      try {
        this.executionUIManager.updateNodeCompleted(nodeId, result);
      } catch (error) {
        console.warn(`Error updating completion UI for node ${nodeId}:`, error);
      }
    }
    
    // Remove executing animation and add completed styling
    if (this.uiManager.graphManager?.cy && this.cytoscapeThemeManager) {
      try {
        const node = this.uiManager.graphManager.cy.$(`#${nodeId}`);
        if (node && node.length > 0) {
          this.cytoscapeThemeManager.removeNodeExecutingAnimation(node);
          node.addClass('completed');
        } else {
          console.warn(`Node not found in Cytoscape: ${nodeId}`);
        }
      } catch (error) {
        console.warn(`Error updating completed node ${nodeId}:`, error);
      }
    }
  }
  
  /**
   * Handle node error event
   * 
   * @param {Object} data - Event data
   */
  handleNodeError(data) {
    if (!data || !data.nodeId) {
      console.warn('Invalid data in handleNodeError');
      return;
    }
    
    const { nodeId, error } = data;
    
    // Update execution UI
    if (this.executionUIManager) {
      try {
        this.executionUIManager.updateNodeError(nodeId, error);
      } catch (uiError) {
        console.warn(`Error updating error UI for node ${nodeId}:`, uiError);
      }
    }
    
    // Remove executing animation and add error styling
    if (this.uiManager.graphManager?.cy && this.cytoscapeThemeManager) {
      try {
        const node = this.uiManager.graphManager.cy.$(`#${nodeId}`);
        if (node && node.length > 0) {
          this.cytoscapeThemeManager.removeNodeExecutingAnimation(node);
          node.addClass('error');
        } else {
          console.warn(`Node not found in Cytoscape: ${nodeId}`);
        }
      } catch (cyError) {
        console.warn(`Error updating error node ${nodeId}:`, cyError);
      }
    }
  }
  
  /**
   * Handle workflow executing event
   * 
   * @param {Object} data - Event data
   */
  handleWorkflowExecuting(data) {
    // Reset execution state in UI
    if (this.executionUIManager) {
      try {
        this.executionUIManager.resetExecutionUI();
      } catch (error) {
        console.warn('Error resetting execution UI:', error);
      }
    }
    
    // Expand workflow panel
    if (!this.state.workflowPanelExpanded) {
      this.toggleWorkflowPanel();
    }
    
    // Update execution UI
    if (this.executionUIManager) {
      try {
        this.executionUIManager.handleWorkflowExecuting(data);
      } catch (error) {
        console.warn('Error updating workflow executing UI:', error);
      }
    }
  }
  
  /**
   * Handle workflow completed event
   * 
   * @param {Object} data - Event data
   */
  handleWorkflowCompleted(data) {
    if (!data) {
      console.warn('Invalid data in handleWorkflowCompleted');
      return;
    }
    
    if (this.executionUIManager) {
      try {
        this.executionUIManager.handleWorkflowCompleted(data);
      } catch (error) {
        console.warn('Error updating workflow completed UI:', error);
      }
    }
  }
  
  /**
   * Handle workflow failed event
   * 
   * @param {Object} data - Event data
   */
  handleWorkflowFailed(data) {
    if (!data) {
      console.warn('Invalid data in handleWorkflowFailed');
      return;
    }
    
    if (this.executionUIManager) {
      try {
        this.executionUIManager.handleWorkflowFailed(data);
      } catch (error) {
        console.warn('Error updating workflow failed UI:', error);
      }
    }
  }
  
  /**
   * Show tooltip at specified position
   * 
   * @param {Object} position - Position {x, y}
   * @param {string} content - Tooltip content
   */
  showTooltip(position, content) {
    if (!this.tooltipManager) return;
    
    try {
      this.tooltipManager.showTooltip(position, content);
    } catch (error) {
      console.warn('Error showing tooltip:', error);
    }
  }
  
  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (!this.tooltipManager) return;
    
    try {
      this.tooltipManager.hideTooltip();
    } catch (error) {
      console.warn('Error hiding tooltip:', error);
    }
  }
  
  /**
   * Get tooltip content for node
   * 
   * @param {Object} nodeData - Node data
   * @returns {string} Tooltip HTML content
   */
  getNodeTooltipContent(nodeData) {
    if (!nodeData) return '';
    
    try {
      return `
        <div>
          <strong>${nodeData.name || 'Unknown Node'}</strong><br>
          ${nodeData.backend || ''} / ${nodeData.model || ''}<br>
          Temp: ${nodeData.temperature || 'default'}
        </div>
      `;
    } catch (error) {
      console.warn('Error generating tooltip content:', error);
      return '<div>Node information unavailable</div>';
    }
  }
  
  /**
   * Check if Cytoscape is available
   * 
   * @returns {boolean} True if Cytoscape is available
   */
  isCytoscapeAvailable() {
    return !!(this.uiManager && 
              this.uiManager.graphManager && 
              this.uiManager.graphManager.cy);
  }
  
  /**
   * Clean up resources on destroy
   */
  destroy() {
    // Clean up ripple timeouts
    this.rippleTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    
    // Destroy sub-managers if they have destroy methods
    if (this.cytoscapeThemeManager?.destroy) {
      try {
        this.cytoscapeThemeManager.destroy();
      } catch (error) {
        console.warn('Error destroying cytoscapeThemeManager:', error);
      }
    }
    
    if (this.nodeChatManager?.destroy) {
      try {
        this.nodeChatManager.destroy();
      } catch (error) {
        console.warn('Error destroying nodeChatManager:', error);
      }
    }
    
    if (this.executionUIManager?.destroy) {
      try {
        this.executionUIManager.destroy();
      } catch (error) {
        console.warn('Error destroying executionUIManager:', error);
      }
    }
    
    // Remove any added style elements
    try {
      document.querySelectorAll('style[id^="pulse-"], style[id^="executing-"]').forEach(style => {
        style.remove();
      });
    } catch (error) {
      console.warn('Error removing style elements:', error);
    }
  }
}