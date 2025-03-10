/**
 * conversation/ConversationManager.js
 * 
 * Manages conversations with AI nodes, including message history,
 * sending messages, and displaying responses.
 */
export class ConversationManager {
  /**
   * Create a new ConversationManager
   * 
   * @param {APIClient} apiClient - API client for backend communication
   * @param {EventBus} eventBus - Event bus for pub/sub
   * @param {GraphManager} graphManager - Graph manager for node data access
   */
  constructor(apiClient, eventBus, graphManager) {
    this.apiClient = apiClient;
    this.eventBus = eventBus;
    this.graphManager = graphManager;
    
    this.activeNodeId = null;
    this.conversations = {}; // nodeId -> conversation history
    this.isProcessing = false;
    
    // Bind methods
    this.handleNodeSelected = this.handleNodeSelected.bind(this);
    this.handleNodeDeselected = this.handleNodeDeselected.bind(this);
    this.handleGraphCleared = this.handleGraphCleared.bind(this);
    this.setActiveNode = this.setActiveNode.bind(this);
    this.clearActiveNode = this.clearActiveNode.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    
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
    this.eventBus.subscribe('node:selected', this.handleNodeSelected);
    this.eventBus.subscribe('node:deselected', this.handleNodeDeselected);
    
    // Listen for graph events
    this.eventBus.subscribe('graph:cleared', this.handleGraphCleared);
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
    
    // Publish conversation activated event
    this.eventBus.publish('conversation:activated', { 
      nodeId: nodeData.id,
      history: this.conversations[nodeData.id]
    });
  }
  
  /**
   * Clear the active node
   */
  clearActiveNode() {
    this.activeNodeId = null;
    
    // Publish conversation deactivated event
    this.eventBus.publish('conversation:deactivated');
  }
  
  /**
   * Send a message to the active node
   * 
   * @param {string} userInput - User message
   * @param {Function} callback - Callback function for the response
   * @returns {Promise<Object>} Response data
   */
  async sendMessage(userInput, callback) {
    if (!this.activeNodeId || this.isProcessing) {
      if (callback) callback(null);
      return null;
    }
    
    if (!userInput.trim()) {
      if (callback) callback(null);
      return null;
    }
    
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
      const parentContexts = parentNodes.map(parent => {
        if (!parent || !parent.id) {
          console.error('Invalid parent node:', parent);
          return { node_id: 'unknown', last_response: '' };
        }
        
        const parentConversation = this.conversations[parent.id] || [];
        
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
      
      let responseContent = '';
      
      // Process based on backend and streaming option
      if (useStreaming) {
        // Handle streaming response for Ollama
        let fullContent = '';
        
        try {
          // Make streaming request
          await this.apiClient.stream('/api/node/chat', requestData, {
            onChunk: (chunk) => {
              // Accumulate content
              fullContent += chunk;
            },
            onComplete: (content) => {
              // Store final result
              responseContent = fullContent;
              
              // Add to conversation history
              this.addAssistantMessage(responseContent);
              
              // Call callback if provided
              if (callback) {
                callback({
                  role: 'assistant',
                  content: responseContent
                });
              }
            },
            onError: (error) => {
              console.error('Error in stream:', error);
              
              // Call callback with error if provided
              if (callback) {
                callback({
                  role: 'system',
                  content: `Error: ${error.message}`
                });
              }
            }
          });
        } catch (error) {
          console.error('Error setting up stream:', error);
          
          // Add error to history
          this.addSystemMessage(`Error: ${error.message}`);
          
          // Call callback with error if provided
          if (callback) {
            callback({
              role: 'system',
              content: `Error: ${error.message}`
            });
          }
        }
      } else {
        // Handle non-streaming response (e.g., for Groq)
        try {
          const response = await this.apiClient.post('/api/node/chat', requestData);
          
          // Extract response content based on backend
          if (nodeData.backend === 'ollama') {
            if (response.message && response.message.content) {
              responseContent = response.message.content;
            } else if (response.error) {
              throw new Error(response.error);
            } else {
              console.error('Unexpected Ollama response format:', response);
              throw new Error('No response or unexpected format from Ollama');
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
              throw new Error('No response or unexpected format from Groq');
            }
          } else {
            responseContent = 'Unsupported backend';
          }
          
          // Add to conversation history
          this.addAssistantMessage(responseContent);
          
          // Call callback if provided
          if (callback) {
            callback({
              role: 'assistant',
              content: responseContent
            });
          }
        } catch (error) {
          console.error('Error sending message:', error);
          
          // Add error to history
          this.addSystemMessage(`Error: ${error.message}`);
          
          // Call callback with error if provided
          if (callback) {
            callback({
              role: 'system',
              content: `Error: ${error.message}`
            });
          }
        }
      }
      
      return {
        role: 'assistant',
        content: responseContent
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error to history
      this.addSystemMessage(`Error: ${error.message}`);
      
      // Call callback with error if provided
      if (callback) {
        callback({
          role: 'system',
          content: `Error: ${error.message}`
        });
      }
      
      return {
        role: 'system',
        content: `Error: ${error.message}`
      };
    } finally {
      // Reset processing state
      this.isProcessing = false;
    }
  }
  
  /**
   * Add an assistant message to the active node's conversation
   * 
   * @param {string} content - Message content
   */
  addAssistantMessage(content) {
    if (!this.activeNodeId) return;
    
    if (!this.conversations[this.activeNodeId]) {
      this.conversations[this.activeNodeId] = [];
    }
    
    this.conversations[this.activeNodeId].push({
      role: 'assistant',
      content
    });
    
    // Publish message received event
    this.eventBus.publish('message:received', {
      nodeId: this.activeNodeId,
      content
    });
  }
  
  /**
   * Add a system message to the active node's conversation
   * 
   * @param {string} content - Message content
   */
  addSystemMessage(content) {
    if (!this.activeNodeId) return;
    
    if (!this.conversations[this.activeNodeId]) {
      this.conversations[this.activeNodeId] = [];
    }
    
    this.conversations[this.activeNodeId].push({
      role: 'system',
      content
    });
    
    // Publish system message event
    this.eventBus.publish('message:system', {
      nodeId: this.activeNodeId,
      content
    });
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
      const response = await this.apiClient.post(`/api/nodes/${nodeId}/conversations`, {
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
      const response = await this.apiClient.get(`/api/nodes/${nodeId}/conversations`);
      
      if (response.status === 'success' && response.data && response.data.length > 0) {
        // Get the most recent conversation
        const conversationData = response.data[0];
        
        // Update the conversation history
        this.conversations[nodeId] = conversationData.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // Publish conversation loaded event
        this.eventBus.publish('conversation:loaded', {
          nodeId,
          conversation: this.conversations[nodeId]
        });
        
        return this.conversations[nodeId];
      }
      
      return [];
    } catch (error) {
      console.error('Error loading conversation:', error);
      throw error;
    }
  }
}