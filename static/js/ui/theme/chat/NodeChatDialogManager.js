/**
 * ui/theme/chat/NodeChatDialogManager.js
 * 
 * Manages the node chat dialog UI and interactions
 */

import { EventUtils } from '../../helpers/EventUtils.js';
import { FormatHelpers } from '../../helpers/formatHelpers.js';

export class NodeChatDialogManager {
  /**
   * @param {ThemeManager} themeManager - Parent theme manager
   * @param {Object} elements - DOM elements
   * @param {EventBus} eventBus - Event bus for pub/sub
   */
  constructor(themeManager, elements, eventBus) {
    this.themeManager = themeManager;
    this.elements = elements;
    this.eventBus = eventBus;
  }
  
  /**
   * Initialize node chat dialog
   */
  initialize() {
    // Make sure the dialog is hidden
    if (this.elements.nodeChatDialog) {
      this.elements.nodeChatDialog.style.display = 'none';
    }
    
    // Apply glassmorphism effects if needed
    this.applyGlassmorphism();
  }
  
  /**
   * Apply glassmorphism effect to chat dialog
   */
  applyGlassmorphism() {
    if (!this.elements.nodeChatDialog) return;
    
    // Add glassmorphism class if it doesn't have it
    if (!this.elements.nodeChatDialog.classList.contains('glassmorphism')) {
      this.elements.nodeChatDialog.classList.add('glassmorphism');
    }
  }
  
  /**
   * Show node chat dialog
   * 
   * @param {string} nodeId - ID of the node to chat with
   * @param {string} nodeName - Name of the node
   */
  showNodeChatDialog(nodeId, nodeName) {
    if (!this.elements.nodeChatDialog) return;
    
    // Set title
    this.elements.nodeChatTitle.textContent = `Chat with ${nodeName}`;
    
    // Clear input
    this.elements.nodeChatInput.value = '';
    
    // Show dialog with a fade-in animation
    this.elements.nodeChatDialog.style.display = 'block';
    this.elements.nodeChatDialog.style.opacity = '0';
    
    // Position the dialog - center it initially
    const canvasContainer = document.querySelector('.canvas-container');
    if (canvasContainer) {
      const rect = canvasContainer.getBoundingClientRect();
      this.elements.nodeChatDialog.style.position = 'absolute';
      this.elements.nodeChatDialog.style.left = `${rect.width / 2 - 300}px`;
      this.elements.nodeChatDialog.style.bottom = '80px';
      this.elements.nodeChatDialog.style.width = '600px';
      this.elements.nodeChatDialog.style.zIndex = '100';
    }
    
    // Make dialog draggable
    this.makeDraggable(this.elements.nodeChatDialog, this.elements.nodeChatTitle);
    
    // Animate fade in
    setTimeout(() => {
      this.elements.nodeChatDialog.style.opacity = '1';
      this.elements.nodeChatDialog.style.transition = 'opacity 0.3s ease-in-out';
    }, 10);
    
    // Load conversation history
    this.loadNodeChatHistory(nodeId);
    
    // Focus input
    setTimeout(() => {
      this.elements.nodeChatInput.focus();
    }, 300);
    
    // Publish event for other components
    this.eventBus.publish('node:chat-opened', {
      nodeId,
      nodeName
    });
  }
  
  /**
   * Hide node chat dialog
   */
  hideNodeChatDialog() {
    if (!this.elements.nodeChatDialog) return;
    
    // Animate fade out
    this.elements.nodeChatDialog.style.opacity = '0';
    
    // Hide after animation
    setTimeout(() => {
      this.elements.nodeChatDialog.style.display = 'none';
    }, 300);
    
    // Publish event for other components
    this.eventBus.publish('node:chat-closed', {});
  }
  
  /**
   * Load node chat history
   * 
   * @param {string} nodeId - ID of the node
   */
  loadNodeChatHistory(nodeId) {
    // Clear messages
    this.elements.nodeChatMessages.innerHTML = '';
    
    // Check for conversation manager
    if (!this.themeManager.uiManager.conversationManager) {
      console.warn('Conversation manager not available');
      this.addNodeChatMessage('system', 'Chat history could not be loaded.');
      return;
    }
    
    // Get conversation history
    const history = this.themeManager.uiManager.conversationManager.getConversationHistory(nodeId);
    
    if (!history || history.length === 0) {
      // Add welcome message
      this.addNodeChatMessage('assistant', `I am ${this.themeManager.getNodeName(nodeId)} node. How can I assist with your workflow?`);
      return;
    }
    
    // Add messages from history
    history.forEach(msg => {
      this.addNodeChatMessage(msg.role, msg.content);
    });
    
    // Scroll to bottom
    this.scrollChatToBottom();
  }
  
  /**
   * Send message from node chat dialog
   * 
   * @param {string} nodeId - ID of the node to chat with
   */
  sendNodeChatMessage(nodeId) {
    if (!this.elements.nodeChatInput || !nodeId) return;
    
    const message = this.elements.nodeChatInput.value.trim();
    if (!message) return;
    
    // Add message to UI
    this.addNodeChatMessage('user', message);
    
    // Clear input
    this.elements.nodeChatInput.value = '';
    
    // Show typing indicator
    this.showTypingIndicator();
    
    // Send message to conversation manager
    if (this.themeManager.uiManager.conversationManager) {
      this.themeManager.uiManager.conversationManager.sendMessage(
        message,
        nodeId,
        this.handleNodeChatResponse.bind(this)
      );
    } else {
      // Simulate response if no conversation manager
      setTimeout(() => {
        this.handleNodeChatResponse({
          content: "I'm sorry, I couldn't process your message. The conversation system appears to be unavailable.",
          role: 'assistant'
        });
      }, 1000);
    }
  }
  
  /**
   * Add message to node chat dialog
   * 
   * @param {string} role - Message role (user/assistant/system)
   * @param {string} content - Message content
   */
  addNodeChatMessage(role, content) {
    if (!this.elements.nodeChatMessages) return;
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}-message`;
    
    // Format message content with links, code, etc.
    const formattedContent = FormatHelpers.formatMessageContent(content);
    messageEl.innerHTML = formattedContent;
    
    // Add message to dialog
    this.elements.nodeChatMessages.appendChild(messageEl);
    
    // Scroll to bottom
    this.scrollChatToBottom();
  }
  
  /**
   * Show typing indicator in chat
   */
  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message assistant-message typing-indicator-container';
    indicator.id = 'typing-indicator';
    
    // Create typing animation
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      typingIndicator.appendChild(dot);
    }
    
    indicator.appendChild(typingIndicator);
    this.elements.nodeChatMessages.appendChild(indicator);
    this.scrollChatToBottom();
  }
  
  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  /**
   * Handle response from node chat
   * 
   * @param {Object} response - Response object
   */
  handleNodeChatResponse(response) {
    // Hide typing indicator
    this.hideTypingIndicator();
    
    // Add response to UI
    if (response && response.content) {
      this.addNodeChatMessage('assistant', response.content);
    } else {
      this.addNodeChatMessage('system', 'Error: No response received.');
    }
  }
  
  /**
   * Scroll chat to bottom
   */
  scrollChatToBottom() {
    if (!this.elements.nodeChatMessages) return;
    
    this.elements.nodeChatMessages.scrollTop = this.elements.nodeChatMessages.scrollHeight;
  }
  
  /**
   * Make an element draggable
   * 
   * @param {HTMLElement} element - Element to make draggable
   * @param {HTMLElement} handle - Element to use as drag handle
   */
  makeDraggable(element, handle) {
    if (!element || !handle) return;
    EventUtils.makeDraggable(element, handle);
  }
}