/**
 * ui/ConversationPanelManager.js
 * 
 * Manages the conversation panel for interacting with AI nodes.
 * Extends the BasePanelManager for consistent panel behavior.
 * Fixed to prevent duplicate messages and handle message events correctly.
 */
import { BasePanelManager } from './panel/BasePanelManager.js';
import { FormatHelpers } from './helpers/formatHelpers.js';
import { CONVERSATION_EVENTS } from '../core/constants/EventTypes.js';
import { EventBusService } from '../core/services/EventBusService.js';

export class ConversationPanelManager extends BasePanelManager {
  /**
   * @param {UIManager} uiManager - The parent UI manager
   */
  constructor(uiManager) {
    super({
      uiManager,
      panelType: 'conversation',
      eventPrefix: 'conversation',
      initialExpanded: true // Conversation panel starts expanded by default
    });
    
    // Track message IDs to prevent duplication
    this.processedMessageIds = new Set();
    
    // Bind conversation-specific methods
    this.sendMessage = this.sendMessage.bind(this);
    this.addMessageToUI = this.addMessageToUI.bind(this);
    this.handleSendClick = this.handleSendClick.bind(this);
    this.handleChatInputKeyDown = this.handleChatInputKeyDown.bind(this);
    this.handleMessageSent = this.handleMessageSent.bind(this);
    this.handleMessageReceived = this.handleMessageReceived.bind(this);
  }
  
  /**
   * Find DOM elements needed by this manager
   */
  findDOMElements() {
    // Register custom selectors if needed
    if (this.uiManager && this.uiManager.registry) {
      this.uiManager.registry.registerSelectors({
        'panelToggle': '#panel-toggle',
        'conversationPanel': '#conversation-panel'
      });
    }
    
    // Find required elements
    const elementKeys = [
      'conversationPanel',
      'activeNodeTitle',
      'nodeDetails',
      'chatMessages',
      'chatInput',
      'sendBtn',
      'panelToggle'
    ];
    
    this.elements = this.findElements(elementKeys);
    
    // Validate required elements
    const missingRequiredElements = ['chatMessages', 'chatInput', 'sendBtn']
      .filter(key => !this.elements[key]);
      
    if (missingRequiredElements.length > 0) {
      this.handleError(
        new Error(`Missing required DOM elements: ${missingRequiredElements.join(', ')}`), 
        'findDOMElements'
      );
    }
  }
  
  /**
   * Set up event listeners for conversation panel
   */
  setupEventListeners() {
    // Send button click
    this.addEventListenerWithCleanup(
      this.elements.sendBtn,
      'click',
      this.handleSendClick
    );
    
    // Chat input enter key
    this.addEventListenerWithCleanup(
      this.elements.chatInput,
      'keydown',
      this.handleChatInputKeyDown
    );
    
    // Panel toggle button
    this.addEventListenerWithCleanup(
      this.elements.panelToggle,
      'click',
      () => this.togglePanel()
    );
  }
  
  /**
   * Subscribe to conversation events
   */
  subscribeToEvents() {
    if (!this.eventBus) return;
    
    // Subscribe to message events - only use the new event system to avoid duplicates
    this.subscribeWithCleanup(
      EventBusService.getConversationEventName(CONVERSATION_EVENTS.MESSAGE_RECEIVED),
      this.handleMessageReceived
    );
    
    // Don't subscribe to message-sent events as we're already handling our own messages
    
    // Unsubscribe from legacy events if we're reinitializing
    if (this.eventBus.unsubscribe) {
      this.eventBus.unsubscribe('message:sent', this.handleMessageSent);
      this.eventBus.unsubscribe('message:received', this.handleMessageReceived);
    }
  }
  
  /**
   * Handle send button click
   */
  handleSendClick() {
    this.sendMessage();
  }
  
  /**
   * Handle chat input keydown
   * 
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleChatInputKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  /**
   * Handle message sent event
   * 
   * @param {Object} data - Event data
   */
  handleMessageSent(data) {
    // We handle our own message sending directly in sendMessage()
    // This is just a placeholder for completeness
    console.log('Message sent event handled by ConversationPanelManager');
  }
  
  /**
   * Handle message received event
   * 
   * @param {Object} data - Event data
   */
  handleMessageReceived(data) {
    try {
      // This will be called when a message is received from anywhere
      // in the application, we only care about our active node
      if (!data || !data.nodeId || data.nodeId !== this.uiManager.conversationManager.activeNodeId) {
        return;
      }
      
      // Generate a message ID to prevent duplication
      const messageId = `${data.nodeId}-${Date.now()}-${data.content.substring(0, 20)}`;
      
      // Check if we've already processed this message
      if (this.processedMessageIds.has(messageId)) {
        console.log('Duplicate message detected, skipping');
        return;
      }
      
      // Track this message as processed
      this.processedMessageIds.add(messageId);
      
      // Remove typing indicator if exists
      const typingIndicators = document.querySelectorAll('.typing-indicator');
      typingIndicators.forEach(indicator => {
        const parent = indicator.closest('.message');
        if (parent) {
          parent.parentNode.removeChild(parent);
        }
      });
      
      // Add assistant response to UI
      this.addMessageToUI('assistant', data.content);
      
      // Limit the size of processed message IDs to prevent memory leaks
      if (this.processedMessageIds.size > 100) {
        // Keep the 50 most recent IDs
        const idsArray = Array.from(this.processedMessageIds);
        this.processedMessageIds = new Set(idsArray.slice(idsArray.length - 50));
      }
    } catch (error) {
      this.handleError(error, 'handleMessageReceived');
    }
  }
  
  /**
   * Apply theme styling from ThemeManager
   */
  applyThemeStyling() {
    const themeManager = this.themeManager;
    if (!themeManager || !themeManager.state) return;
    
    const conversationPanel = this.findElement('conversationPanel');
    if (conversationPanel) {
      // Apply collapse state from theme manager
      this.expanded = !themeManager.state.conversationPanelCollapsed;
      this.applyPanelState();
    }
  }
  
  /**
   * Enable chat input for active node
   */
  enableChat() {
    try {
      // Enable chat input
      if (this.elements.chatInput) {
        this.elements.chatInput.disabled = false;
        this.elements.chatInput.placeholder = "Type your message here...";
      }
      
      // Enable send button
      if (this.elements.sendBtn) {
        this.elements.sendBtn.disabled = false;
      }
      
      // If panel is collapsed, expand it
      if (!this.expanded) {
        this.expandPanel();
      }
    } catch (error) {
      this.handleError(error, 'enableChat');
    }
  }
  
  /**
   * Disable chat input when no node is selected
   */
  disableChat() {
    try {
      // Disable chat input
      if (this.elements.chatInput) {
        this.elements.chatInput.disabled = true;
        this.elements.chatInput.placeholder = "Select a node to chat with...";
      }
      
      // Disable send button
      if (this.elements.sendBtn) {
        this.elements.sendBtn.disabled = true;
      }
    } catch (error) {
      this.handleError(error, 'disableChat');
    }
  }
  
  /**
   * Send a message to the active node
   */
  sendMessage() {
    try {
      const conversationManager = this.uiManager.conversationManager;
      
      // Get the active node ID
      const nodeId = conversationManager.activeNodeId;
      if (!nodeId) {
        this.showNotification('Please select a node to chat with.', 'error');
        return;
      }
      
      // Ensure we have the chat input element
      if (!this.elements.chatInput) {
        this.handleError(new Error('Chat input element not found'), 'sendMessage');
        return;
      }
      
      // Get the message
      const messageText = this.elements.chatInput.value.trim();
      if (!messageText) {
        return;
      }
      
      // Clear the input
      this.elements.chatInput.value = '';
      
      // Add user message to UI - handle this directly here
      this.addMessageToUI('user', messageText);
      
      // Show typing indicator
      const typingIndicator = this.showTypingIndicator();
      
      // Send the message
      conversationManager.sendMessage(messageText, (response) => {
        // The response will be handled by the message:received event handler
        // But we need to handle failure cases here
        if (!response) {
          // Remove typing indicator if there was no response
          if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
          }
          
          // Add error message
          this.addMessageToUI('system', 'Error: No response received.');
        }
      });
    } catch (error) {
      this.handleError(error, 'sendMessage');
    }
  }
  
  /**
   * Format a message for display
   * 
   * @param {string} content - Message content
   * @returns {string} Formatted content with Markdown-like formatting
   */
  formatMessage(content) {
    // Use theme manager's format helper if available
    const themeManager = this.themeManager;
    if (themeManager && typeof themeManager.formatMessageContent === 'function') {
      return themeManager.formatMessageContent(content);
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
    try {
      const chatMessages = this.findElement('chatMessages');
      if (!chatMessages) return;
      
      const messageDiv = this.createElement('div', {
        className: `message ${role === 'user' ? 'user-message' : (role === 'system' ? 'system-message' : 'assistant-message')}`
      });
      
      // Format message content
      const formattedContent = this.formatMessage(content);
      messageDiv.innerHTML = formattedContent;
      
      chatMessages.appendChild(messageDiv);
      this.scrollToBottom();
    } catch (error) {
      this.handleError(error, 'addMessageToUI');
    }
  }
  
  /**
   * Scroll the chat to the bottom
   */
  scrollToBottom() {
    try {
      const chatMessages = this.findElement('chatMessages');
      if (!chatMessages) return;
      
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      this.handleError(error, 'scrollToBottom');
    }
  }
  
  /**
   * Clear the chat messages area
   */
  clearMessages() {
    try {
      const chatMessages = this.findElement('chatMessages');
      if (!chatMessages) return;
      
      chatMessages.innerHTML = '';
      
      // Reset processed message IDs
      this.processedMessageIds = new Set();
    } catch (error) {
      this.handleError(error, 'clearMessages');
    }
  }
  
  /**
   * Create a typing indicator
   * 
   * @returns {HTMLElement} The typing indicator element
   */
  createTypingIndicator() {
    const typingIndicator = this.createElement('div', {
      className: 'typing-indicator',
      innerHTML: '<span></span><span></span><span></span>'
    });
    
    return typingIndicator;
  }
  
  /**
   * Show the typing indicator
   * 
   * @returns {HTMLElement} The message div containing the indicator
   */
  showTypingIndicator() {
    try {
      const chatMessages = this.findElement('chatMessages');
      if (!chatMessages) return null;
      
      // Remove any existing typing indicators
      const existingIndicators = chatMessages.querySelectorAll('.typing-indicator');
      existingIndicators.forEach(indicator => {
        const parent = indicator.closest('.message');
        if (parent) {
          parent.parentNode.removeChild(parent);
        }
      });
      
      // Create a message div for the assistant's response
      const assistantMessageDiv = this.createElement('div', {
        className: 'message assistant-message typing-message'
      });
      
      // Add typing indicator
      const typingIndicator = this.createTypingIndicator();
      assistantMessageDiv.appendChild(typingIndicator);
      
      chatMessages.appendChild(assistantMessageDiv);
      this.scrollToBottom();
      
      return assistantMessageDiv;
    } catch (error) {
      this.handleError(error, 'showTypingIndicator');
      return null;
    }
  }
  
  /**
   * Legacy method for backward compatibility
   * @deprecated Use togglePanel() instead
   */
  toggleConversationPanel() {
    this.togglePanel();
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Clear any message data
    this.clearMessages();
    
    // Reset processed message IDs
    this.processedMessageIds = new Set();
    
    // Call base class destroy to clean up event listeners
    super.destroy();
  }
}