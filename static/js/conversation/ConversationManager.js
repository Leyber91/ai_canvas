/**
 * conversation/ConversationManager.js
 * 
 * Manages conversations with AI nodes, including message history,
 * sending messages, and displaying responses.
 */
export class ConversationManager {
    constructor(apiClient, eventBus, graphManager) {
      this.apiClient = apiClient;
      this.eventBus = eventBus;
      this.graphManager = graphManager;
      
      this.activeNodeId = null;
      this.conversations = {}; // nodeId -> conversation history
      this.isProcessing = false;
      
      // DOM elements
      this.chatMessages = document.getElementById('chat-messages');
      this.chatInput = document.getElementById('chat-input');
      this.sendButton = document.getElementById('send-btn');
      this.activeNodeTitle = document.getElementById('active-node-title');
      this.nodeDetails = document.getElementById('node-details');
      
      // Subscribe to events
      this.subscribeToEvents();
    }
    
    /**
     * Initialize the conversation manager
     */
    async initialize() {
      console.log('Conversation Manager initialized');
    }
    
    /**
     * Subscribe to events
     */
    subscribeToEvents() {
      // Listen for node selection events
      this.eventBus.subscribe('node:selected', this.handleNodeSelected, this);
      this.eventBus.subscribe('node:deselected', this.handleNodeDeselected, this);
      
      // Listen for graph events
      this.eventBus.subscribe('graph:cleared', this.handleGraphCleared, this);
    }
    
    /**
     * Handle node selected event
     * 
     * @param {Object} nodeData - Selected node data
     */
    handleNodeSelected(nodeData) {
      this.setActiveNode(nodeData);
    }
    
    /**
     * Handle node deselected event
     */
    handleNodeDeselected() {
      this.clearActiveNode();
    }
    
    /**
     * Handle graph cleared event
     */
    handleGraphCleared() {
      // Clear all conversations
      this.conversations = {};
      this.clearActiveNode();
    }
    
    /**
     * Set the active node for conversation
     * 
     * @param {Object} nodeData - Node data
     */
    setActiveNode(nodeData) {
      this.activeNodeId = nodeData.id;
      
      // Initialize conversation if it doesn't exist
      if (!this.conversations[nodeData.id]) {
        this.conversations[nodeData.id] = [];
      }
      
      // Display conversation history
      this.displayConversation(nodeData.id);
      
      // Enable chat input
      this.chatInput.disabled = false;
      this.sendButton.disabled = false;
      
      // Publish conversation activated event
      this.eventBus.publish('conversation:activated', { nodeId: nodeData.id });
    }
    
    /**
     * Clear the active node
     */
    clearActiveNode() {
      this.activeNodeId = null;
      
      // Disable chat input
      this.chatInput.disabled = true;
      this.sendButton.disabled = true;
      
      // Clear chat messages
      this.chatMessages.innerHTML = '';
      
      // Publish conversation deactivated event
      this.eventBus.publish('conversation:deactivated');
    }
    
    /**
     * Display conversation for a node
     * 
     * @param {string} nodeId - Node ID
     */
    displayConversation(nodeId) {
      // Clear chat messages
      this.chatMessages.innerHTML = '';
      
      // Display conversation history
      const conversation = this.conversations[nodeId] || [];
      conversation.forEach(message => {
        this.addMessageToUI(message.role, message.content);
      });
      
      // Scroll to bottom
      this.scrollToBottom();
    }
    
    /**
     * Add a message to the UI
     * 
     * @param {string} role - Message role ('user' or 'assistant')
     * @param {string} content - Message content
     */
    addMessageToUI(role, content) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message');
      messageDiv.classList.add(role === 'user' ? 'user-message' : 'assistant-message');
      
      // Support basic markdown formatting
      let formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
        .replace(/`([^`]+)`/g, '<code>$1</code>')          // Inline code
        .replace(/\n/g, '<br>');                           // Line breaks
        
      messageDiv.innerHTML = formattedContent;
      
      this.chatMessages.appendChild(messageDiv);
      this.scrollToBottom();
    }
    
    /**
     * Scroll the chat to the bottom
     */
    scrollToBottom() {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    /**
     * Send a message to the active node
     * 
     * @param {string} userInput - User message
     */
    async sendMessage(userInput) {
      if (!this.activeNodeId || this.isProcessing) return;
      
      if (!userInput.trim()) return;
      
      // Add user message to UI
      this.addMessageToUI('user', userInput);
      
      // Add to conversation history
      if (!this.conversations[this.activeNodeId]) {
        this.conversations[this.activeNodeId] = [];
      }
      
      this.conversations[this.activeNodeId].push({
        role: 'user',
        content: userInput
      });
      
      // Set processing state
      this.isProcessing = true;
      this.sendButton.disabled = true;
      this.chatInput.disabled = true;
      
      // Publish message sent event
      this.eventBus.publish('message:sent', { 
        nodeId: this.activeNodeId, 
        content: userInput 
      });
      
      try {
        // Get node data
        const nodeData = this.graphManager.getNodeData(this.activeNodeId);
        
        // Get parent contexts
        const parentNodes = this.graphManager.getParentNodes(this.activeNodeId);
        console.log('Parent nodes:', parentNodes);
        
        const parentContexts = parentNodes.map(parent => {
          if (!parent || !parent.id) {
            console.error('Invalid parent node:', parent);
            return { node_id: 'unknown', last_response: '' };
          }
          
          const parentConversation = this.conversations[parent.id] || [];
          console.log(`Conversation history for parent ${parent.id}:`, parentConversation);
          
          // Find the last assistant message
          const assistantMessages = parentConversation.filter(msg => msg.role === 'assistant');
          const lastResponse = assistantMessages.length > 0 ? 
            (assistantMessages[assistantMessages.length - 1].content || '') : '';
          
          return {
            node_id: parent.id,
            last_response: lastResponse
          };
        });
        
        // Format conversation history for API request
        const conversationHistory = this.conversations[this.activeNodeId]
          .slice(0, -1) // Exclude the message we just added
          .map(msg => ({
            role: msg.role,
            content: msg.content
          }));
        
        // Create a message div for the assistant's response
        const assistantMessageDiv = document.createElement('div');
        assistantMessageDiv.classList.add('message', 'assistant-message');
        
        // Initially show a typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        assistantMessageDiv.appendChild(typingIndicator);
        
        this.chatMessages.appendChild(assistantMessageDiv);
        this.scrollToBottom();
        
        // Determine if we should use streaming (only for Ollama)
        const useStreaming = nodeData.backend === 'ollama';
        
        // Prepare request data
        const requestData = {
          node_id: this.activeNodeId,
          backend: nodeData.backend,
          model: nodeData.model,
          system_message: nodeData.systemMessage,
          parent_contexts: parentContexts,
          conversation_history: conversationHistory,
          user_input: userInput,
          temperature: nodeData.temperature,
          max_tokens: nodeData.maxTokens,
          stream: useStreaming
        };
        
        // Process based on backend and streaming option
        if (useStreaming) {
          // Handle streaming response for Ollama
          let fullContent = '';
          const textContainer = document.createElement('div');
          
          try {
            // Make streaming request
            await this.apiClient.stream('/node/chat', requestData, {
              onChunk: (chunk) => {
                // Accumulate content
                fullContent += chunk;
                
                // Format content for display
                let formattedContent = fullContent
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`([^`]+)`/g, '<code>$1</code>')
                  .replace(/\n/g, '<br>');
                
                // Update UI
                assistantMessageDiv.innerHTML = '';
                textContainer.innerHTML = formattedContent;
                assistantMessageDiv.appendChild(textContainer);
                this.scrollToBottom();
              },
              onComplete: (content) => {
                // Add to conversation history
                this.conversations[this.activeNodeId].push({
                  role: 'assistant',
                  content: fullContent
                });
                
                // Publish message received event
                this.eventBus.publish('message:received', {
                  nodeId: this.activeNodeId,
                  content: fullContent
                });
              },
              onError: (error) => {
                console.error('Error in stream:', error);
                assistantMessageDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
              }
            });
          } catch (error) {
            console.error('Error setting up stream:', error);
            assistantMessageDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
          }
        } else {
          // Handle non-streaming response (e.g., for Groq)
          try {
            const response = await this.apiClient.post('/node/chat', requestData);
            
            // Extract response content based on backend
            let responseContent = '';
            
            if (nodeData.backend === 'ollama') {
              if (response.message && response.message.content) {
                responseContent = response.message.content;
              } else if (response.error) {
                throw new Error(response.error);
              } else {
                console.error('Unexpected Ollama response format:', response);
                responseContent = 'No response or unexpected format from Ollama';
              }
            } else if (nodeData.backend === 'groq') {
              if (response.choices && response.choices.length > 0 && response.choices[0].message && response.choices[0].message.content) {
                responseContent = response.choices[0].message.content;
              } else if (response.error) {
                // Handle error object which could be a string or an object with a message property
                const errorMessage = typeof response.error === 'string' 
                  ? response.error 
                  : (response.error.message || JSON.stringify(response.error));
                throw new Error(errorMessage);
              } else {
                console.error('Unexpected Groq response format:', response);
                responseContent = 'No response or unexpected format from Groq';
              }
            } else {
              responseContent = 'Unsupported backend';
            }
            
            // Replace typing indicator with actual content
            assistantMessageDiv.innerHTML = '';
            
            // Format content for display
            let formattedContent = responseContent
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code>$1</code>')
              .replace(/\n/g, '<br>');
            
            assistantMessageDiv.innerHTML = formattedContent;
            
            // Add to conversation history
            this.conversations[this.activeNodeId].push({
              role: 'assistant',
              content: responseContent
            });
            
            // Publish message received event
            this.eventBus.publish('message:received', {
              nodeId: this.activeNodeId,
              content: responseContent
            });
          } catch (error) {
            console.error('Error sending message:', error);
            
            // Show error in UI
            assistantMessageDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
        
        // Add error message to UI
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('message', 'assistant-message', 'error');
        errorDiv.textContent = `Error: ${error.message}`;
        this.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
      } finally {
        // Reset processing state
        this.isProcessing = false;
        this.sendButton.disabled = false;
        this.chatInput.disabled = false;
        this.chatInput.focus();
      }
    }
    
    /**
     * Get conversation history for a node
     * 
     * @param {string} nodeId - Node ID
     * @returns {Array} Conversation history
     */
    getConversationHistory(nodeId) {
      return this.conversations[nodeId] || [];
    }
    
    /**
     * Clear conversation for a node
     * 
     * @param {string} nodeId - Node ID
     */
    clearConversation(nodeId) {
      if (this.conversations[nodeId]) {
        this.conversations[nodeId] = [];
        
        // If this is the active node, update the UI
        if (this.activeNodeId === nodeId) {
          this.chatMessages.innerHTML = '';
        }
        
        // Publish conversation cleared event
        this.eventBus.publish('conversation:cleared', { nodeId });
      }
    }
    
    /**
     * Export all conversations
     * 
     * @returns {Object} All conversations
     */
    exportConversations() {
      return this.conversations;
    }
    
    /**
     * Import conversations
     * 
     * @param {Object} conversationsData - Conversations to import
     */
    importConversations(conversationsData) {
      this.conversations = conversationsData;
      
      // If there's an active node, update the UI
      if (this.activeNodeId) {
        this.displayConversation(this.activeNodeId);
      }
      
      // Publish conversations imported event
      this.eventBus.publish('conversations:imported');
    }
    
    /**
     * Save a conversation to the server
     * 
     * @param {string} nodeId - Node ID
     * @returns {Promise<Object>} Saved conversation data
     */
    async saveConversation(nodeId) {
      try {
        const conversation = this.conversations[nodeId];
        if (!conversation || conversation.length === 0) {
          return null;
        }
        
        // Create or update conversation in the database
        const response = await this.apiClient.post(`/nodes/${nodeId}/conversations`, {
          messages: conversation
        });
        
        return response.data;
      } catch (error) {
        console.error('Error saving conversation:', error);
        throw error;
      }
    }
    
    /**
     * Load a conversation from the server
     * 
     * @param {string} nodeId - Node ID
     * @returns {Promise<Array>} Loaded conversation history
     */
    async loadConversation(nodeId) {
      try {
        const response = await this.apiClient.get(`/nodes/${nodeId}/conversations`);
        
        if (response.status === 'success' && response.data && response.data.length > 0) {
          // Get the most recent conversation
          const conversationData = response.data[0];
          
          // Update the conversation history
          this.conversations[nodeId] = conversationData.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          
          // If this is the active node, update the UI
          if (this.activeNodeId === nodeId) {
            this.displayConversation(nodeId);
          }
          
          return this.conversations[nodeId];
        }
        
        return [];
      } catch (error) {
        console.error('Error loading conversation:', error);
        throw error;
      }
    }
  }