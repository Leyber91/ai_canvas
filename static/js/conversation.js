/**
 * Conversation.js - Manages the conversation with AI nodes
 */

class ConversationManager {
    constructor() {
        this.activeNodeId = null;
        this.conversations = {}; // nodeId -> conversation history
        this.isProcessing = false;
        
        // DOM elements
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-btn');
        this.activeNodeTitle = document.getElementById('active-node-title');
        this.nodeDetails = document.getElementById('node-details');
        
        // Initialize event listeners
        this.initEventListeners();
    }

    initEventListeners() {
        // Listen for node selection events
        document.addEventListener('nodeSelected', (event) => {
            const nodeData = event.detail;
            this.setActiveNode(nodeData);
        });
        
        document.addEventListener('nodeDeselected', () => {
            this.clearActiveNode();
        });
        
        // Send button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter key in textarea
        this.chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        });
    }

    setActiveNode(nodeData) {
        this.activeNodeId = nodeData.id;
        
        // Update UI
        this.activeNodeTitle.textContent = nodeData.name;
        this.nodeDetails.innerHTML = `
            <p><strong>Backend:</strong> ${nodeData.backend}</p>
            <p><strong>Model:</strong> ${nodeData.model}</p>
            <p><strong>System Message:</strong> ${nodeData.systemMessage}</p>
        `;
        
        // Enable chat input
        this.chatInput.disabled = false;
        this.sendButton.disabled = false;
        
        // Initialize conversation if it doesn't exist
        if (!this.conversations[nodeData.id]) {
            this.conversations[nodeData.id] = [];
        }
        
        // Display conversation history
        this.displayConversation(nodeData.id);
    }

    clearActiveNode() {
        this.activeNodeId = null;
        
        // Update UI
        this.activeNodeTitle.textContent = 'No Active Node';
        this.nodeDetails.innerHTML = '<p>Select a node to view details</p>';
        
        // Disable chat input
        this.chatInput.disabled = true;
        this.sendButton.disabled = true;
        
        // Clear chat messages
        this.chatMessages.innerHTML = '';
    }

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

    addMessageToUI(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(role === 'user' ? 'user-message' : 'assistant-message');
        
        // Format content (handle markdown, code, etc. if needed)
        messageDiv.textContent = content;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async sendMessage() {
        if (!this.activeNodeId || this.isProcessing) return;
        
        const userInput = this.chatInput.value.trim();
        if (!userInput) return;
        
        // Clear input
        this.chatInput.value = '';
        
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
        
        try {
            // Get node data
            const graphManager = window.graphManager;
            const nodeData = graphManager.getNodeData(this.activeNodeId);
            
            // Get parent contexts
            const parentNodes = graphManager.getParentNodes(this.activeNodeId);
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
            
            console.log('Parent contexts:', parentContexts);
            
            // Prepare request data
            // Format conversation history to match the expected format for API
            const formattedHistory = this.conversations[this.activeNodeId]
                .slice(0, -1) // Exclude the message we just added
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
            
            console.log('Formatted conversation history:', formattedHistory);
            
            const requestData = {
                node_id: this.activeNodeId,
                backend: nodeData.backend,
                model: nodeData.model,
                system_message: nodeData.systemMessage,
                parent_contexts: parentContexts,
                conversation_history: formattedHistory,
                user_input: userInput,
                temperature: nodeData.temperature,
                max_tokens: nodeData.maxTokens
            };
            
            console.log('Full request data:', requestData);
            
            // Add loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.classList.add('message', 'assistant-message');
            const loadingIndicator = document.createElement('div');
            loadingIndicator.classList.add('loading');
            loadingDiv.appendChild(loadingIndicator);
            this.chatMessages.appendChild(loadingDiv);
            this.scrollToBottom();
            
            // Send request to backend
            const response = await fetch('/api/node/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            // Remove loading indicator
            this.chatMessages.removeChild(loadingDiv);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract response content based on backend
            let responseContent = '';
            console.log(`Raw response data from ${nodeData.backend}:`, data);
            
            if (nodeData.backend === 'ollama') {
                if (data.message && data.message.content) {
                    responseContent = data.message.content;
                } else {
                    console.error('Unexpected Ollama response format:', data);
                    responseContent = 'No response or unexpected format from Ollama';
                }
            } else if (nodeData.backend === 'groq') {
                if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                    responseContent = data.choices[0].message.content;
                } else {
                    console.error('Unexpected Groq response format:', data);
                    responseContent = 'No response or unexpected format from Groq';
                }
            } else {
                responseContent = 'Unsupported backend';
            }
            
            console.log(`Extracted response content from ${nodeData.backend} (${nodeData.model}):`, responseContent);
            
            // Add assistant message to UI
            this.addMessageToUI('assistant', responseContent);
            
            // Add to conversation history
            this.conversations[this.activeNodeId].push({
                role: 'assistant',
                content: responseContent
            });
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Add error message to UI
            const errorDiv = document.createElement('div');
            errorDiv.classList.add('message', 'assistant-message');
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

    getConversationHistory(nodeId) {
        return this.conversations[nodeId] || [];
    }

    clearConversation(nodeId) {
        if (this.conversations[nodeId]) {
            this.conversations[nodeId] = [];
            
            // If this is the active node, update the UI
            if (this.activeNodeId === nodeId) {
                this.chatMessages.innerHTML = '';
            }
        }
    }

    exportConversations() {
        return this.conversations;
    }

    importConversations(conversationsData) {
        this.conversations = conversationsData;
        
        // If there's an active node, update the UI
        if (this.activeNodeId) {
            this.displayConversation(this.activeNodeId);
        }
    }
}

// Export the ConversationManager
window.ConversationManager = ConversationManager;
