/**
 * ui/ConversationPanelManager.js
 * 
 * Manages the conversation panel for interacting with AI nodes.
 * Enhanced with ThemeManager integration for consistent styling.
 */
import { FormatHelpers } from './helpers/formatHelpers.js';

export class ConversationPanelManager {
    /**
     * @param {UIManager} uiManager - The parent UI manager
     */
    constructor(uiManager) {
      this.uiManager = uiManager;
      this.themeManager = uiManager.themeManager;
      this.collapsed = false;
    }
    
    /**
     * Initialize the conversation panel manager
     */
    initialize() {
      // Set up event listeners
      this.setupEventListeners();
      
      // Apply theme styles if ThemeManager is available
      this.applyThemeStyles();
    }
    
    /**
     * Apply theme styles from ThemeManager
     */
    applyThemeStyles() {
      if (!this.themeManager) return;
      
      const conversationPanel = document.getElementById('conversation-panel');
      if (conversationPanel) {
        // Apply glassmorphism effect if supported by ThemeManager
        if (this.themeManager.state) {
          this.collapsed = this.themeManager.state.conversationPanelCollapsed;
          
          if (this.collapsed) {
            conversationPanel.classList.add('collapsed');
          } else {
            conversationPanel.classList.remove('collapsed');
          }
        }
      }
    }
    
    /**
     * Set up event listeners for conversation panel
     */
    setupEventListeners() {
      const { elements } = this.uiManager;
      
      // Send button click
      if (elements.sendBtn) {
        elements.sendBtn.addEventListener('click', () => this.sendMessage());
      }
      
      // Chat input enter key
      if (elements.chatInput) {
        elements.chatInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
          }
        });
      }
      
      // Panel toggle button
      const panelToggle = document.getElementById('panel-toggle');
      if (panelToggle) {
        panelToggle.addEventListener('click', () => this.togglePanel());
      }
    }
    
    /**
     * Toggle conversation panel collapse/expand
     */
    togglePanel() {
      const conversationPanel = document.getElementById('conversation-panel');
      if (!conversationPanel) return;
      
      this.collapsed = !this.collapsed;
      
      if (this.collapsed) {
        conversationPanel.classList.add('collapsed');
      } else {
        conversationPanel.classList.remove('collapsed');
      }
      
      // Update ThemeManager state if available
      if (this.themeManager && this.themeManager.state) {
        this.themeManager.state.conversationPanelCollapsed = this.collapsed;
      }
      
      // Use ThemeManager's toggle method if available
      if (this.themeManager && typeof this.themeManager.toggleConversationPanel === 'function') {
        this.themeManager.toggleConversationPanel();
      }
      
      // Publish event for other components
      this.uiManager.eventBus.publish('conversation:panel-toggled', {
        collapsed: this.collapsed
      });
    }
    
    /**
     * Enable chat input for active node
     */
    enableChat() {
      const { elements } = this.uiManager;
      
      // Enable chat input
      if (elements.chatInput) {
        elements.chatInput.disabled = false;
        elements.chatInput.placeholder = "Type your message here...";
      }
      
      // Enable send button
      if (elements.sendBtn) {
        elements.sendBtn.disabled = false;
      }
      
      // If panel is collapsed, expand it
      if (this.collapsed) {
        this.togglePanel();
      }
    }
    
    /**
     * Disable chat input when no node is selected
     */
    disableChat() {
      const { elements } = this.uiManager;
      
      // Disable chat input
      if (elements.chatInput) {
        elements.chatInput.disabled = true;
        elements.chatInput.placeholder = "Select a node to chat with...";
      }
      
      // Disable send button
      if (elements.sendBtn) {
        elements.sendBtn.disabled = true;
      }
    }
    
    /**
     * Send a message to the active node
     */
    sendMessage() {
      const { elements, conversationManager } = this.uiManager;
      
      // Get the active node ID
      const nodeId = conversationManager.activeNodeId;
      if (!nodeId) {
        this.uiManager.showNotification('Please select a node to chat with.', 'error');
        return;
      }
      
      // Ensure we have the chat input element
      if (!elements.chatInput) {
        console.error('Chat input element not found');
        return;
      }
      
      // Get the message
      const messageText = elements.chatInput.value.trim();
      if (!messageText) {
        return;
      }
      
      // Clear the input
      elements.chatInput.value = '';
      
      // Add user message to UI
      this.addMessageToUI('user', messageText);
      
      // Show typing indicator
      const typingIndicator = this.showTypingIndicator();
      
      // Send the message
      conversationManager.sendMessage(messageText, nodeId, (response) => {
        // Remove typing indicator
        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.parentNode.removeChild(typingIndicator);
        }
        
        // Add assistant response to UI
        if (response && response.content) {
          this.addMessageToUI('assistant', response.content);
        } else {
          this.addMessageToUI('system', 'Error: No response received.');
        }
      });
    }
    
    /**
     * Format a message for display
     * 
     * @param {string} content - Message content
     * @returns {string} Formatted content with Markdown-like formatting
     */
    formatMessage(content) {
      // Use theme manager's format helper if available
      if (this.themeManager && typeof this.themeManager.formatMessageContent === 'function') {
        return this.themeManager.formatMessageContent(content);
      }
      
      // Or use FormatHelpers if available
      if (FormatHelpers && typeof FormatHelpers.formatMessageContent === 'function') {
        return FormatHelpers.formatMessageContent(content);
      }
      
      // Fallback to basic formatting
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
        .replace(/`([^`]+)`/g, '<code>$1</code>')          // Inline code
        .replace(/\n/g, '<br>');                           // Line breaks
    }
    
    /**
     * Add a message to the UI
     * 
     * @param {string} role - Message role ('user' or 'assistant')
     * @param {string} content - Message content
     */
    addMessageToUI(role, content) {
      const { elements } = this.uiManager;
      
      // Ensure we have the chat messages container element
      if (!elements.chatMessages) {
        console.error('Chat messages container element not found');
        return;
      }
      
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message');
      messageDiv.classList.add(role === 'user' ? 'user-message' : 'assistant-message');
      
      // Format message content
      const formattedContent = this.formatMessage(content);
      messageDiv.innerHTML = formattedContent;
      
      elements.chatMessages.appendChild(messageDiv);
      this.scrollToBottom();
    }
    
    /**
     * Scroll the chat to the bottom
     */
    scrollToBottom() {
      const { elements } = this.uiManager;
      
      // Ensure we have the chat messages container element
      if (!elements.chatMessages) {
        return;
      }
      
      elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
    
    /**
     * Clear the chat messages area
     */
    clearMessages() {
      const { elements } = this.uiManager;
      
      // Ensure we have the chat messages container element
      if (!elements.chatMessages) {
        return;
      }
      
      elements.chatMessages.innerHTML = '';
    }
    
    /**
     * Create a typing indicator
     * 
     * @returns {HTMLElement} The typing indicator element
     */
    createTypingIndicator() {
      const typingIndicator = document.createElement('div');
      typingIndicator.classList.add('typing-indicator');
      typingIndicator.innerHTML = '<span></span><span></span><span></span>';
      return typingIndicator;
    }
    
    /**
     * Show the typing indicator
     * 
     * @returns {HTMLElement} The message div containing the indicator
     */
    showTypingIndicator() {
      const { elements } = this.uiManager;
      
      // Ensure we have the chat messages container element
      if (!elements.chatMessages) {
        console.error('Chat messages container element not found');
        return null;
      }
      
      // Create a message div for the assistant's response
      const assistantMessageDiv = document.createElement('div');
      assistantMessageDiv.classList.add('message', 'assistant-message');
      
      // Add typing indicator
      const typingIndicator = this.createTypingIndicator();
      assistantMessageDiv.appendChild(typingIndicator);
      
      elements.chatMessages.appendChild(assistantMessageDiv);
      this.scrollToBottom();
      
      return assistantMessageDiv;
    }
}