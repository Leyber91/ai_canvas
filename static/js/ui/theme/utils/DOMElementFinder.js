/**
 * ui/theme/utils/DOMElementFinder.js
 * 
 * Utility class to find and cache DOM elements needed by the theme
 */

export class DOMElementFinder {
    /**
     * Find DOM elements needed for the theme
     * @returns {Object} Object containing all required DOM elements
     */
    findElements() {
      const elements = {};
      
      // Main structural elements
      elements.body = document.body;
      elements.header = document.querySelector('header');
      elements.conversationPanel = document.getElementById('conversation-panel');
      elements.panelToggle = document.getElementById('panel-toggle');
      elements.workflowPanel = document.getElementById('workflow-panel');
      elements.workflowPanelHeader = document.getElementById('workflow-panel-header');
      elements.executionSteps = document.getElementById('execution-steps');
      elements.executionResults = document.getElementById('execution-results');
      elements.nodeChatDialog = document.getElementById('node-chat-dialog');
      elements.tooltip = document.getElementById('custom-tooltip');
      
      // Buttons with ripple effect
      elements.rippleButtons = document.querySelectorAll('.ripple-btn');
      
      // Progress and status elements
      elements.executionProgressFill = document.getElementById('execution-progress-fill');
      elements.executionProgressText = document.getElementById('execution-progress-text');
      elements.executionStatusBadge = document.getElementById('execution-status-badge');
      elements.executionStatusText = document.getElementById('execution-status-text');
      
      // Chat elements
      elements.nodeChatTitle = document.getElementById('node-chat-title');
      elements.nodeChatMessages = document.getElementById('node-chat-messages');
      elements.nodeChatInput = document.getElementById('node-chat-input');
      elements.nodeChatSend = document.getElementById('node-chat-send');
      elements.closeChatBtn = document.getElementById('close-chat-btn');
      
      // Modal elements
      elements.resultModal = document.getElementById('result-modal');
      elements.resultModalTitle = document.getElementById('result-modal-title');
      elements.resultModalContent = document.getElementById('result-modal-content');
      elements.closeResultModal = document.getElementById('close-result-modal');
      
      return elements;
    }
  }