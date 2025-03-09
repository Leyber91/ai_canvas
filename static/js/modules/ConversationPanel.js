import { BaseManager } from '../managers/base/BaseManager.js';
import { EVENTS } from '../constants/eventTypes.js';
import { CLASSES } from '../constants/classNames.js';
import { MESSAGES } from '../constants/messageTemplates.js';
import { SELECTORS } from '../constants/elementSelectors.js';
import { formatMessage } from '../helpers/formatHelpers.js';

/**
 * Module for the conversation panel
 */
export class ConversationPanel extends BaseManager {
  /**
   * @param {UIManager} uiManager - Parent UI manager
   */
  constructor(uiManager) {
    super(uiManager);
    
    // Track current conversation
    this.activeNodeId = null;
    this.typingIndicator = null;
  }
  
  /**
   * Initialize the conversation panel
   */
  initialize() {
    super.initialize();
  }
  
  /**
   * Find DOM elements needed for this module
   */
  findElements() {
    this.elements = {
      panel: this.findElement(SELECTORS.CONVERSATION_PANEL),
      activeNodeTitle: this.findElement(SELECTORS.CHAT.ACTIVE_NODE_TITLE),
      nodeDetails: this.findElement(SELECTORS.CHAT.NODE_DETAILS),
      chatMessages: this.findElement(SELECTORS.CHAT.CONTAINER),
      chatInput: this.findElement(SELECTORS.CHAT.INPUT),
      sendBtn: this.findElement(SELECTORS.CHAT.SEND_BUTTON),
      panelToggle: this.findElement(SELECTORS.PANEL_TOGGLE)
    };
  }
  
  /**
   * Set up event listeners
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
    
    // Panel toggle click
    this.addEventListenerWithCleanup(
      this.elements.panelToggle,
      'click',
      this.handlePanelToggleClick
    );
  }
  
  /**
   * Subscribe to event bus events
   */
  subscribeToEvents() {
    this.subscribeWithCleanup(EVENTS.NODE.SELECTED, this.handleNodeSelected);
    this.subscribeWithCleanup(EVENTS.NODE.DESELECTED, this.handleNodeDeselected);
    this.subscribeWithCleanup(EVENTS.CONVERSATION.CLEARED, this.handleConversationCleared);
    this.subscribeWithCleanup(EVENTS.CONVERSATION.MESSAGE_ADDED, this.handleMessageAdded);
    this.subscribeWithCleanup(EVENTS.CONVERSATION.DISPLAYED, this.handleConversationDisplayed);
  }
  
  /**
   * Handle send button click
   * 
   * @param {Event} event - Click event
   */
  handleSendClick(event) {
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
   * Handle panel toggle click
   * 
   * @param {Event} event - Click event
   */
  handlePanelToggleClick(event) {
    this.togglePanel();
  }
  
  /**
   * Handle node selected event
   * 
   * @param {Object} data - Event data
   */
  handleNodeSelected(data) {
    this.activeNodeId = data.id;
    
    // Update UI
    if (this.elements.activeNodeTitle) {
      this.elements.activeNodeTitle.textContent = data.nodeData.name || 'Unknown Node';
    }
    
    if (this.elements.nodeDetails) {
      this.elements.nodeDetails.innerHTML = `
        <p><strong>Backend:</strong> ${data.nodeData.backend || 'Unknown'}</p>
        <p><strong>Model:</strong> ${data.nodeData.model || 'Unknown'}</p>
        <p><strong>System Message:</strong> ${data.nodeData.systemMessage || 'None'}</p>
      `;
    }
    
    // Enable chat input
    this.enableChat();
    
    // Load conversation for this node
    this.displayConversation(data.id);
  }
  
  /**
   * Handle node deselected event
   */
  handleNodeDeselected() {
    this.activeNodeId = null;
    
    // Update UI
    if (this.elements.activeNodeTitle) {
      this.elements.activeNodeTitle.textContent = MESSAGES.PLACEHOLDERS.NO_ACTIVE_NODE;
    }
    
    if (this.elements.nodeDetails) {
      this.elements.nodeDetails.innerHTML = `<p>${MESSAGES.PLACEHOLDERS.SELECT_NODE_DETAILS}</p>`;
    }
    
    // Disable chat input
    this.disableChat();
    
    // Clear messages
    this.clearMessages();
  }
  
  /**
   * Handle conversation cleared event
   * 
   * @param {Object} data - Event data
   */
  handleConversationCleared(data) {
    // Only clear if this is the active node
    if (data.nodeId === this.activeNodeId) {
      this.clearMessages();
    }
  }
  
  /**
   * Handle message added event
   * 
   * @param {Object} data - Event data
   */
  handleMessageAdded(data) {
    // Only add message if this is the active node
    if (data.nodeId === this.activeNodeId) {
      this.addMessageToUI(data.message.role, data.message.content);
    }
  }
  
  /**
   * Handle conversation displayed event
   * 
   * @param {Object} data - Event data
   */
  handleConversationDisplayed(data) {
    // Only display if this is the active node
    if (data.nodeId === this.activeNodeId) {
      this.displayConversation(data.nodeId);
    }
  }
  
  /**
   * Send a message
   */
  sendMessage() {
    try {
      // Check for active node
      if (!this.activeNodeId) {
        this.showNotification(MESSAGES.ERRORS.NODE_NOT_SELECTED, 'error');
        return;
      }
      
      // Get message text
      const messageText = this.elements.chatInput.value.trim();
      if (!messageText) {
        return;
      }
      
      // Clear input
      this.elements.chatInput.value = '';
      
      // Add message to UI
      this.addMessageToUI('user', messageText);
      
      // Show typing indicator
      this.showTypingIndicator();
      
      // Send message to conversation manager
      this.uiManager.conversationManager.sendMessage(messageText, this.activeNodeId, response => {
        // Hide typing indicator
        this.hideTypingIndicator();
        
        // Add response to UI
        if (response && response.content) {
          this.addMessageToUI('assistant', response.content);
        } else {
          console.error('No response content:', response);
        }
      });
    } catch (error) {
      this.handleError(error, 'sendMessage');
    }
  }
  
  /**
   * Enable chat input
   */
  enableChat() {
    if (this.elements.chatInput) {
      this.elements.chatInput.disabled = false;
    }
    
    if (this.elements.sendBtn) {
      this.elements.sendBtn.disabled = false;
    }
  }
  
  /**
   * Disable chat input
   */
  disableChat() {
    if (this.elements.chatInput) {
      this.elements.chatInput.disabled = true;
    }
    
    if (this.elements.sendBtn) {
      this.elements.sendBtn.disabled = true;
    }
  }
  
  /**
   * Add a message to the UI
   * 
   * @param {string} role - Message role ('user' or 'assistant')
   * @param {string} content - Message content
   */
  addMessageToUI(role, content) {
    try {
      if (!this.elements.chatMessages) {
        this.logError(MESSAGES.ERRORS.CHAT_ELEMENT_NOT_FOUND, 'addMessageToUI');
        return;
      }
      
      const messageDiv = this.createElement('div', {
        className: `${CLASSES.MESSAGES.MESSAGE} ${role === 'user' ? CLASSES.MESSAGES.USER : CLASSES.MESSAGES.ASSISTANT}`
      });
      
      // Format message content
      const formattedContent = formatMessage(content);
      messageDiv.innerHTML = formattedContent;
      
      this.elements.chatMessages.appendChild(messageDiv);
      this.scrollToBottom();
    } catch (error) {
      this.handleError(error, 'addMessageToUI');
    }
  }
  
  /**
   * Show typing indicator
   * 
   * @returns {HTMLElement} The message div containing the indicator
   */
  showTypingIndicator() {
    try {
      if (!this.elements.chatMessages) {
        this.logError(MESSAGES.ERRORS.CHAT_ELEMENT_NOT_FOUND, 'showTypingIndicator');
        return null;
      }
      
      // Create a message div for the assistant's response
      const assistantMessageDiv = this.createElement('div', {
        className: `${CLASSES.MESSAGES.MESSAGE} ${CLASSES.MESSAGES.ASSISTANT}`
      });
      
      // Add typing indicator
      const typingIndicator = this.createElement('div', {
        className: CLASSES.MESSAGES.TYPING
      }, [
        this.createElement('span'),
        this.createElement('span'),
        this.createElement('span')
      ]);
      
      assistantMessageDiv.appendChild(typingIndicator);
      
      this.elements.chatMessages.appendChild(assistantMessageDiv);
      this.scrollToBottom();
      
      // Store reference to typing indicator
      this.typingIndicator = assistantMessageDiv;
      
      return assistantMessageDiv;
    } catch (error) {
      this.handleError(error, 'showTypingIndicator');
      return null;
    }
  }
  
  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    try {
      if (this.typingIndicator) {
        if (this.elements.chatMessages.contains(this.typingIndicator)) {
          this.elements.chatMessages.removeChild(this.typingIndicator);
        }
        this.typingIndicator = null;
      }
    } catch (error) {
      this.handleError(error, 'hideTypingIndicator');
    }
  }
  
  /**
   * Clear all messages
   */
  clearMessages() {
    try {
      if (this.elements.chatMessages) {
        this.elements.chatMessages.innerHTML = '';
      }
    } catch (error) {
      this.handleError(error, 'clearMessages');
    }
  }
  
  /**
   * Display a conversation
   * 
   * @param {string} nodeId - Node ID
   */
  displayConversation(nodeId) {
    try {
      // Clear existing messages
      this.clearMessages();
      
      // Get conversation from manager
      const conversation = this.uiManager.conversationManager.getConversationHistory(nodeId);
      
      if (!conversation || conversation.length === 0) {
        // No messages yet
        return;
      }
      
      // Add each message to UI
      conversation.forEach(message => {
        this.addMessageToUI(message.role, message.content);
      });
    } catch (error) {
      this.handleError(error, 'displayConversation');
    }
  }
  
  /**
   * Scroll chat to bottom
   */
  scrollToBottom() {
    try {
      if (this.elements.chatMessages) {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
      }
    } catch (error) {
      this.handleError(error, 'scrollToBottom');
    }
  }
  
  /**
   * Toggle panel collapse/expand
   */
  togglePanel() {
    try {
      if (this.elements.panel) {
        this.elements.panel.classList.toggle(CLASSES.CONVERSATION_PANEL.COLLAPSED);
        
        const isCollapsed = this.elements.panel.classList.contains(CLASSES.CONVERSATION_PANEL.COLLAPSED);
        
        // Publish event
        if (this.eventBus) {
          this.eventBus.publish(EVENTS.CONVERSATION.PANEL_TOGGLED, {
            collapsed: isCollapsed
          });
        }
      }
    } catch (error) {
      this.handleError(error, 'togglePanel');
    }
  }
  
  /**
   * Get the active node ID
   * 
   * @returns {string|null} Active node ID
   */
  getActiveNodeId() {
    return this.activeNodeId;
  }
}