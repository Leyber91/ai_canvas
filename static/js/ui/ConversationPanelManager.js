/**
 * ui/ConversationPanelManager.js
 * 
 * Manages the conversation panel for interacting with AI nodes.
 */
export class ConversationPanelManager {
    /**
     * @param {UIManager} uiManager - The parent UI manager
     */
    constructor(uiManager) {
      this.uiManager = uiManager;
    }
    
    /**
     * Initialize the conversation panel manager
     */
    initialize() {
      // Set up event listeners
      this.setupEventListeners();
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
    }
    
    /**
     * Enable chat input for active node
     */
    enableChat() {
      const { elements } = this.uiManager;
      
      // Enable chat input
      if (elements.chatInput) {
        elements.chatInput.disabled = false;
      }
      
      // Enable send button
      if (elements.sendBtn) {
        elements.sendBtn.disabled = false;
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
      
      // Send the message
      conversationManager.sendMessage(messageText);
    }
    
    /**
     * Format a message for display
     * 
     * @param {string} content - Message content
     * @returns {string} Formatted content with Markdown-like formatting
     */
    formatMessage(content) {
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