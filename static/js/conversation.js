/**
 * Conversation.js - Manages the conversation with AI nodes
 */

class ConversationManager {
    constructor() {
        this.activeNodeId = null;
        this.conversations = {}; // nodeId -> conversation history
        this.isProcessing = false;
        
        // DOM elements
        this.chatMessages = document.getElementById('conversation-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-btn');
        this.activeNodeTitle = document.getElementById('conversation-title');
        this.nodeDetails = document.getElementById('node-details');
        
        // Initialize event listeners
        this.initEventListeners();
        
        console.log('ConversationManager initialized with elements:', {
            chatMessages: this.chatMessages,
            chatInput: this.chatInput,
            sendButton: this.sendButton,
            activeNodeTitle: this.activeNodeTitle
        });
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
        
        // Support basic markdown formatting
        let formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
            .replace(/`([^`]+)`/g, '<code>$1</code>')          // Inline code
            .replace(/\n/g, '<br>');                          // Line breaks
            
        messageDiv.innerHTML = formattedContent;
        
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
            
            const requestData = {
                node_id: this.activeNodeId,
                backend: nodeData.backend,
                model: nodeData.model,
                system_message: nodeData.systemMessage,
                parent_contexts: parentContexts,
                conversation_history: formattedHistory,
                user_input: userInput,
                temperature: nodeData.temperature,
                max_tokens: nodeData.maxTokens,
                stream: useStreaming
            };
            
            console.log('Full request data:', requestData);
            
            if (useStreaming) {
                // Handle streaming response for Ollama
                let fullContent = '';
                
                // Create a text container to replace the typing indicator
                const textContainer = document.createElement('div');
                
                // Set up EventSource for streaming
                const response = await fetch('/api/node/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Handle streaming response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                // Replace typing indicator with text container
                assistantMessageDiv.innerHTML = '';
                assistantMessageDiv.appendChild(textContainer);
                
                // Process the stream
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        break;
                    }
                    
                    // Decode the chunk
                    const chunk = decoder.decode(value, { stream: true });
                    
                    // Process the chunk (which may contain multiple SSE events)
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            
                            try {
                                // Check if it's an error message
                                if (data.includes('"error":')) {
                                    const errorObj = JSON.parse(data);
                                    throw new Error(errorObj.error);
                                }
                                
                                // Add the content to our accumulated response
                                fullContent += data;
                                
                                // Update the UI with the new content
                                // Support basic markdown formatting
                                let formattedContent = fullContent
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
                                    .replace(/`([^`]+)`/g, '<code>$1</code>')          // Inline code
                                    .replace(/\n/g, '<br>');                          // Line breaks
                                
                                textContainer.innerHTML = formattedContent;
                                this.scrollToBottom();
                            } catch (e) {
                                console.error('Error processing stream chunk:', e);
                            }
                        }
                    }
                }
                
                // Add to conversation history
                this.conversations[this.activeNodeId].push({
                    role: 'assistant',
                    content: fullContent
                });
                
            } else {
                // Non-streaming response (e.g., for Groq)
                const response = await fetch('/api/node/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                
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
                    } else if (data.error) {
                        throw new Error(data.error);
                    } else {
                        console.error('Unexpected Ollama response format:', data);
                        responseContent = 'No response or unexpected format from Ollama';
                    }
                } else if (nodeData.backend === 'groq') {
                    console.log('Raw Groq response:', data);
                    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                        responseContent = data.choices[0].message.content;
                    } else if (data.error) {
                        // Handle error object which could be a string or an object with a message property
                        const errorMessage = typeof data.error === 'string' 
                            ? data.error 
                            : (data.error.message || JSON.stringify(data.error));
                        throw new Error(errorMessage);
                    } else {
                        console.error('Unexpected Groq response format:', data);
                        responseContent = 'No response or unexpected format from Groq';
                    }
                } else {
                    responseContent = 'Unsupported backend';
                }
                
                console.log(`Extracted response content from ${nodeData.backend} (${nodeData.model}):`, responseContent);
                
                // Replace typing indicator with actual content
                assistantMessageDiv.innerHTML = '';
                
                // Support basic markdown formatting
                let formattedContent = responseContent
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
                    .replace(/`([^`]+)`/g, '<code>$1</code>')          // Inline code
                    .replace(/\n/g, '<br>');                          // Line breaks
                
                assistantMessageDiv.innerHTML = formattedContent;
                
                // Add to conversation history
                this.conversations[this.activeNodeId].push({
                    role: 'assistant',
                    content: responseContent
                });
            }
            
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
