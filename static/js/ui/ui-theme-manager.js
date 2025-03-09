/**
 * ui/ThemeManager.js
 * 
 * Manages the space-inspired dark theme and UI enhancements for AI Canvas.
 * Handles animations, dynamic UI elements, and theme-specific features.
 */
export class ThemeManager {
    /**
     * @param {UIManager} uiManager - Parent UI Manager instance
     */
    constructor(uiManager) {
      this.uiManager = uiManager;
      this.eventBus = uiManager.eventBus;
      
      // Theme state
      this.isDarkTheme = true;
      this.workflowPanelExpanded = false;
      this.conversationPanelCollapsed = false;
      this.chatDialogOpen = false;
      this.activeNodeId = null;
      
      // DOM element references
      this.elements = {};
      
      // Animation timing
      this.animationDuration = 300; // ms
      
      // Current active node chat
      this.currentNodeChat = null;
  
      // Store ripple effect timeouts for cleanup
      this.rippleTimeouts = [];
    }
    
    /**
     * Initialize theme manager and set up event listeners
     */
    initialize() {
      // Find DOM elements
      this.findElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize the star background
      this.initializeSpaceBackground();
      
      // Initialize animations
      this.initializeAnimations();
      
      // Initialize the workflow panel
      this.initializeWorkflowPanel();
      
      // Initialize the conversation panel
      this.initializeConversationPanel();
      
      // Initialize node chat dialog
      this.initializeNodeChatDialog();
      
      // Apply Cytoscape theme
      this.applyCytoscapeTheme();
      
      console.log('Theme Manager initialized');
      
      // Publish theme initialized event
      this.eventBus.publish('theme:initialized', { theme: 'dark-space' });
    }
    
    /**
     * Find DOM elements needed for the theme
     */
    findElements() {
      // Main structural elements
      this.elements.body = document.body;
      this.elements.header = document.querySelector('header');
      this.elements.conversationPanel = document.getElementById('conversation-panel');
      this.elements.panelToggle = document.getElementById('panel-toggle');
      this.elements.workflowPanel = document.getElementById('workflow-panel');
      this.elements.workflowPanelHeader = document.getElementById('workflow-panel-header');
      this.elements.executionSteps = document.getElementById('execution-steps');
      this.elements.executionResults = document.getElementById('execution-results');
      this.elements.nodeChatDialog = document.getElementById('node-chat-dialog');
      this.elements.tooltip = document.getElementById('custom-tooltip');
      
      // Buttons with ripple effect
      this.elements.rippleButtons = document.querySelectorAll('.ripple-btn');
      
      // Progress and status elements
      this.elements.executionProgressFill = document.getElementById('execution-progress-fill');
      this.elements.executionProgressText = document.getElementById('execution-progress-text');
      this.elements.executionStatusBadge = document.getElementById('execution-status-badge');
      this.elements.executionStatusText = document.getElementById('execution-status-text');
      
      // Chat elements
      this.elements.nodeChatTitle = document.getElementById('node-chat-title');
      this.elements.nodeChatMessages = document.getElementById('node-chat-messages');
      this.elements.nodeChatInput = document.getElementById('node-chat-input');
      this.elements.nodeChatSend = document.getElementById('node-chat-send');
      this.elements.closeChatBtn = document.getElementById('close-chat-btn');
      
      // Modal elements
      this.elements.resultModal = document.getElementById('result-modal');
      this.elements.resultModalTitle = document.getElementById('result-modal-title');
      this.elements.resultModalContent = document.getElementById('result-modal-content');
      this.elements.closeResultModal = document.getElementById('close-result-modal');
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Collapse/expand workflow panel
      if (this.elements.workflowPanelHeader) {
        this.elements.workflowPanelHeader.addEventListener('click', () => {
          this.toggleWorkflowPanel();
        });
      }
      
      // Collapse/expand conversation panel
      if (this.elements.panelToggle) {
        this.elements.panelToggle.addEventListener('click', () => {
          this.toggleConversationPanel();
        });
      }
      
      // Close node chat dialog
      if (this.elements.closeChatBtn) {
        this.elements.closeChatBtn.addEventListener('click', () => {
          this.hideNodeChatDialog();
        });
      }
      
      // Node chat send button
      if (this.elements.nodeChatSend) {
        this.elements.nodeChatSend.addEventListener('click', () => {
          this.sendNodeChatMessage();
        });
      }
      
      // Node chat input enter key
      if (this.elements.nodeChatInput) {
        this.elements.nodeChatInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendNodeChatMessage();
          }
        });
      }
      
      // Close result modal
      if (this.elements.closeResultModal) {
        this.elements.closeResultModal.addEventListener('click', () => {
          this.hideResultModal();
        });
      }
      
      // Add ripple effect to buttons
      this.elements.rippleButtons.forEach(button => {
        button.addEventListener('click', (e) => this.createRippleEffect(e));
      });
      
      // Subscribe to node events
      this.eventBus.subscribe('node:selected', this.handleNodeSelected.bind(this));
      this.eventBus.subscribe('node:deselected', this.handleNodeDeselected.bind(this));
      this.eventBus.subscribe('node:executing', this.handleNodeExecuting.bind(this));
      this.eventBus.subscribe('node:completed', this.handleNodeCompleted.bind(this));
      this.eventBus.subscribe('node:error', this.handleNodeError.bind(this));
      
      // Subscribe to workflow events
      this.eventBus.subscribe('workflow:executing', this.handleWorkflowExecuting.bind(this));
      this.eventBus.subscribe('workflow:completed', this.handleWorkflowCompleted.bind(this));
      this.eventBus.subscribe('workflow:failed', this.handleWorkflowFailed.bind(this));
      
      // Escape key handling for modals
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          // Close any open modals or dialogs
          if (this.chatDialogOpen) {
            this.hideNodeChatDialog();
          }
          if (this.elements.resultModal.style.display === 'block') {
            this.hideResultModal();
          }
        }
      });
    }
    
    /**
     * Initialize space background effects
     */
    initializeSpaceBackground() {
      // Create and animate nebula effects
      const nebulaElements = document.querySelectorAll('.space-nebula');
      
      nebulaElements.forEach((nebula, index) => {
        // Set random initial position
        const randomX = Math.random() * 10 - 5;
        const randomY = Math.random() * 10 - 5;
        
        // Apply subtle animation
        nebula.style.animation = `
          nebula-float-${index} ${30 + index * 10}s infinite ease-in-out,
          nebula-pulse-${index} ${15 + index * 5}s infinite ease-in-out
        `;
        
        // Create keyframe animations
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
          @keyframes nebula-float-${index} {
            0%, 100% { transform: translate(${randomX}px, ${randomY}px); }
            50% { transform: translate(${-randomX}px, ${-randomY}px); }
          }
          @keyframes nebula-pulse-${index} {
            0%, 100% { opacity: 0.03; filter: blur(80px); }
            50% { opacity: 0.08; filter: blur(70px); }
          }
        `;
        document.head.appendChild(styleSheet);
      });
    }
    
    /**
     * Initialize animations for UI elements
     */
    initializeAnimations() {
      // Add entry animations to key UI elements
      const animateElements = document.querySelectorAll('.fade-in, .slide-in-right, .slide-in-up');
      
      animateElements.forEach(element => {
        // Add visibility: hidden to prevent FOUC
        element.style.visibility = 'hidden';
        
        // Set timeout to start animation after a short delay
        setTimeout(() => {
          element.style.visibility = 'visible';
        }, 100);
      });
    }
    
    /**
     * Initialize the workflow panel
     */
    initializeWorkflowPanel() {
      // Initially collapsed
      this.workflowPanelExpanded = false;
      
      // Make sure the panel is in the correct initial state
      if (this.elements.workflowPanel) {
        this.elements.workflowPanel.classList.remove('expanded');
      }
    }
    
    /**
     * Initialize the conversation panel
     */
    initializeConversationPanel() {
      // Initially expanded
      this.conversationPanelCollapsed = false;
      
      // Make sure the panel is in the correct initial state
      if (this.elements.conversationPanel) {
        this.elements.conversationPanel.classList.remove('collapsed');
      }
    }
    
    /**
     * Initialize node chat dialog
     */
    initializeNodeChatDialog() {
      // Initially hidden
      this.chatDialogOpen = false;
      
      // Make sure the dialog is hidden
      if (this.elements.nodeChatDialog) {
        this.elements.nodeChatDialog.style.display = 'none';
      }
    }
    
    /**
     * Apply Cytoscape theme styling
     */
    applyCytoscapeTheme() {
      // We'll apply this when Cytoscape is initialized in GraphManager
      // This function will be called by UIManager after Cytoscape is ready
      
      if (!this.uiManager.graphManager || !this.uiManager.graphManager.cy) {
        console.warn('Cytoscape instance not available yet, deferring theme application');
        return;
      }
      
      const cy = this.uiManager.graphManager.cy;
      
      // Define the style
      const spaceThemeStyle = [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(name)',
            'color': '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '14px',
            'width': '160px',
            'height': '80px',
            'shape': 'round-rectangle',
            'text-wrap': 'ellipsis',
            'text-max-width': '140px',
            'border-width': '2px',
            'border-color': '#ffffff',
            'border-opacity': 0.2,
            'text-outline-width': 2,
            'text-outline-color': 'data(color)',
            'text-outline-opacity': 1
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#4FD1C5',
            'target-arrow-color': '#4FD1C5',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.8,
            'target-arrow-shape': 'triangle-backcurve',
            'arrow-scale': 1.2,
            'line-style': 'solid'
          }
        },
        {
          selector: '.ollama-node',
          style: {
            'background-color': '#4d21b3',
            'border-width': 2,
            'border-color': '#7b2ffa',
          }
        },
        {
          selector: '.groq-node',
          style: {
            'background-color': '#2175b3',
            'border-width': 2,
            'border-color': '#2f8afa',
          }
        },
        {
          selector: '.selected',
          style: {
            'border-width': 3,
            'border-color': '#ffffff',
            'border-opacity': 0.8,
            'box-shadow': '0 0 15px #ffffff'
          }
        },
        {
          selector: '.hovered',
          style: {
            'border-width': 2,
            'border-color': '#4FD1C5',
            'border-opacity': 0.8
          }
        },
        {
          selector: '.executing',
          style: {
            'border-width': 3,
            'border-color': '#3498db',
            'border-opacity': 1
          }
        },
        {
          selector: '.completed',
          style: {
            'border-width': 3,
            'border-color': '#10B981',
            'border-opacity': 1
          }
        },
        {
          selector: '.error',
          style: {
            'border-width': 3,
            'border-color': '#ef4444',
            'border-opacity': 1
          }
        },
        {
          selector: 'edge.executing',
          style: {
            'line-color': '#3498db',
            'target-arrow-color': '#3498db',
            'width': 4
          }
        },
        {
          selector: 'edge.completed',
          style: {
            'line-color': '#10B981',
            'target-arrow-color': '#10B981',
            'width': 4
          }
        },
        {
          selector: 'edge.error',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'width': 4
          }
        },
        {
          selector: '.cycle',
          style: {
            'border-width': 3,
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'border-color': '#f59e0b',
            'border-opacity': 0.8
          }
        }
      ];
      
      // Apply the style
      cy.style(spaceThemeStyle);
      
      // Add node hover effect
      cy.on('mouseover', 'node', event => {
        const node = event.target;
        node.addClass('hovered');
        
        // Show tooltip with node info
        this.showTooltip(event.renderedPosition, this.getNodeTooltipContent(node.data()));
      });
      
      cy.on('mouseout', 'node', event => {
        const node = event.target;
        node.removeClass('hovered');
        
        // Hide tooltip
        this.hideTooltip();
      });
      
      // Add node double-click to open chat
      cy.on('dblclick', 'node', event => {
        const node = event.target;
        this.showNodeChatDialog(node.id(), node.data('name'));
        event.preventDefault(); // Prevent default behavior
      });
    }
    
    /**
     * Toggle workflow panel expansion
     */
    toggleWorkflowPanel() {
      if (!this.elements.workflowPanel) return;
      
      this.workflowPanelExpanded = !this.workflowPanelExpanded;
      
      if (this.workflowPanelExpanded) {
        this.elements.workflowPanel.classList.add('expanded');
      } else {
        this.elements.workflowPanel.classList.remove('expanded');
      }
      
      // Publish event for other components
      this.eventBus.publish('workflow:panel-toggled', {
        expanded: this.workflowPanelExpanded
      });
    }
    
    /**
     * Toggle conversation panel collapse
     */
    toggleConversationPanel() {
      if (!this.elements.conversationPanel) return;
      
      this.conversationPanelCollapsed = !this.conversationPanelCollapsed;
      
      if (this.conversationPanelCollapsed) {
        this.elements.conversationPanel.classList.add('collapsed');
      } else {
        this.elements.conversationPanel.classList.remove('collapsed');
      }
      
      // Publish event for other components
      this.eventBus.publish('conversation:panel-toggled', {
        collapsed: this.conversationPanelCollapsed
      });
    }
    
    /**
     * Show node chat dialog
     * 
     * @param {string} nodeId - ID of the node to chat with
     * @param {string} nodeName - Name of the node
     */
    showNodeChatDialog(nodeId, nodeName) {
      if (!this.elements.nodeChatDialog) return;
      
      // Set active node
      this.currentNodeChat = nodeId;
      
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
      
      this.chatDialogOpen = true;
      
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
        this.currentNodeChat = null;
      }, 300);
      
      this.chatDialogOpen = false;
      
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
      if (!this.uiManager.conversationManager) {
        console.warn('Conversation manager not available');
        this.addNodeChatMessage('system', 'Chat history could not be loaded.');
        return;
      }
      
      // Get conversation history
      const history = this.uiManager.conversationManager.getConversationHistory(nodeId);
      
      if (!history || history.length === 0) {
        // Add welcome message
        this.addNodeChatMessage('assistant', `I am ${this.getNodeName(nodeId)} node. How can I assist with your workflow?`);
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
      const formattedContent = this.formatMessageContent(content);
      messageEl.innerHTML = formattedContent;
      
      // Add message to dialog
      this.elements.nodeChatMessages.appendChild(messageEl);
      
      // Scroll to bottom
      this.scrollChatToBottom();
    }
    
    /**
     * Format message content with links, code, etc.
     * 
     * @param {string} content - Raw message content
     * @returns {string} Formatted HTML content
     */
    formatMessageContent(content) {
      return content
        // Code blocks
        .replace(/```([^`]*?)```/gs, '<pre class="code-block">$1</pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
        // Bold
        .replace(/\*\*([^*]*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*([^*]*?)\*|_([^_]*?)_/g, (match, p1, p2) => `<em>${p1 || p2}</em>`)
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Line breaks
        .replace(/\n/g, '<br>');
    }
    
    /**
     * Scroll chat to bottom
     */
    scrollChatToBottom() {
      if (!this.elements.nodeChatMessages) return;
      
      this.elements.nodeChatMessages.scrollTop = this.elements.nodeChatMessages.scrollHeight;
    }
    
    /**
     * Send message from node chat dialog
     */
    sendNodeChatMessage() {
      if (!this.elements.nodeChatInput || !this.currentNodeChat) return;
      
      const message = this.elements.nodeChatInput.value.trim();
      if (!message) return;
      
      // Add message to UI
      this.addNodeChatMessage('user', message);
      
      // Clear input
      this.elements.nodeChatInput.value = '';
      
      // Show typing indicator
      this.showTypingIndicator();
      
      // Send message to conversation manager
      if (this.uiManager.conversationManager) {
        this.uiManager.conversationManager.sendMessage(
          message,
          this.currentNodeChat,
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
     * Show result modal
     * 
     * @param {string} nodeId - ID of the node
     * @param {string} result - Result content
     */
    showResultModal(nodeId, result) {
      if (!this.elements.resultModal) return;
      
      // Set title
      this.elements.resultModalTitle.textContent = `Result for ${this.getNodeName(nodeId)}`;
      
      // Set content
      this.elements.resultModalContent.textContent = result;
      
      // Show modal
      this.elements.resultModal.style.display = 'block';
    }
    
    /**
     * Hide result modal
     */
    hideResultModal() {
      if (!this.elements.resultModal) return;
      
      this.elements.resultModal.style.display = 'none';
    }
    
    /**
     * Get node name by ID
     * 
     * @param {string} nodeId - Node ID
     * @returns {string} Node name or ID if not found
     */
    getNodeName(nodeId) {
      if (!this.uiManager.graphManager) return nodeId;
      
      const node = this.uiManager.graphManager.getNodeData(nodeId);
      return node ? node.name : nodeId;
    }
    
    /**
     * Handle node selected event
     * 
     * @param {Object} nodeData - Node data
     */
    handleNodeSelected(nodeData) {
      this.activeNodeId = nodeData.id;
      
      // If conversation panel is collapsed, expand it
      if (this.conversationPanelCollapsed) {
        this.toggleConversationPanel();
      }
      
      // Apply selected styling to the node
      if (this.uiManager.graphManager && this.uiManager.graphManager.cy) {
        const node = this.uiManager.graphManager.cy.$(`#${nodeData.id}`);
        if (node.length > 0) {
          // Add a subtle pulse animation
          this.addNodePulseAnimation(node);
        }
      }
    }
    
    /**
     * Handle node deselected event
     */
    handleNodeDeselected() {
      this.activeNodeId = null;
      
      // Remove any node animations
      if (this.uiManager.graphManager && this.uiManager.graphManager.cy) {
        this.uiManager.graphManager.cy.nodes().forEach(node => {
          this.removeNodePulseAnimation(node);
        });
      }
    }
    
    /**
     * Handle node executing event
     * 
     * @param {Object} data - Event data
     */
    handleNodeExecuting(data) {
      const { nodeId, progress } = data;
      
      // Update progress UI
      if (this.elements.executionProgressFill && typeof progress === 'number') {
        const percentage = Math.round(progress * 100);
        this.elements.executionProgressFill.style.width = `${percentage}%`;
        
        if (this.elements.executionProgressText) {
          this.elements.executionProgressText.textContent = `${percentage}%`;
        }
      }
      
      // Update status UI
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge executing';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Executing';
        }
      }
      
      // Update node in execution steps
      this.updateExecutionStep(nodeId, 'executing');
      
      // If workflow panel is not expanded, expand it
      if (!this.workflowPanelExpanded) {
        this.toggleWorkflowPanel();
      }
      
      // Apply executing animation to the node
      if (this.uiManager.graphManager && this.uiManager.graphManager.cy) {
        const node = this.uiManager.graphManager.cy.$(`#${nodeId}`);
        if (node.length > 0) {
          this.addNodeExecutingAnimation(node);
        }
      }
    }
    
    /**
     * Handle node completed event
     * 
     * @param {Object} data - Event data
     */
    handleNodeCompleted(data) {
      const { nodeId, result } = data;
      
      // Update node in execution steps
      this.updateExecutionStep(nodeId, 'completed');
      
      // Add result to results section
      this.addExecutionResult(nodeId, result);
      
      // Remove executing animation and add completed styling
      if (this.uiManager.graphManager && this.uiManager.graphManager.cy) {
        const node = this.uiManager.graphManager.cy.$(`#${nodeId}`);
        if (node.length > 0) {
          this.removeNodeExecutingAnimation(node);
          node.addClass('completed');
        }
      }
    }
    
    /**
     * Handle node error event
     * 
     * @param {Object} data - Event data
     */
    handleNodeError(data) {
      const { nodeId, error } = data;
      
      // Update node in execution steps
      this.updateExecutionStep(nodeId, 'error');
      
      // Add error to results section
      this.addExecutionResult(nodeId, `Error: ${error}`, true);
      
      // Remove executing animation and add error styling
      if (this.uiManager.graphManager && this.uiManager.graphManager.cy) {
        const node = this.uiManager.graphManager.cy.$(`#${nodeId}`);
        if (node.length > 0) {
          this.removeNodeExecutingAnimation(node);
          node.addClass('error');
        }
      }
    }
    
    /**
     * Handle workflow executing event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowExecuting(data) {
      // Reset execution state in UI
      this.resetExecutionUI();
      
      // Expand workflow panel
      if (!this.workflowPanelExpanded) {
        this.toggleWorkflowPanel();
      }
      
      // Update status
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge executing';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Executing';
        }
      }
      
      // Initialize execution steps UI based on execution plan
      this.initializeExecutionSteps(data.executionPlan || []);
    }
    
    /**
     * Handle workflow completed event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowCompleted(data) {
      // Update status
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge completed';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Completed';
        }
      }
      
      // Update progress to 100%
      if (this.elements.executionProgressFill) {
        this.elements.executionProgressFill.style.width = '100%';
        
        if (this.elements.executionProgressText) {
          this.elements.executionProgressText.textContent = '100%';
        }
      }
      
      // Add completed class to progress bar
      if (this.elements.executionProgressFill.parentElement) {
        this.elements.executionProgressFill.parentElement.classList.add('completed');
      }
    }
    
    /**
     * Handle workflow failed event
     * 
     * @param {Object} data - Event data
     */
    handleWorkflowFailed(data) {
      // Update status
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge error';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Failed';
        }
      }
      
      // Add error class to progress bar
      if (this.elements.executionProgressFill.parentElement) {
        this.elements.executionProgressFill.parentElement.classList.add('error');
      }
      
      // Add error message to results
      const errorDiv = document.createElement('div');
      errorDiv.className = 'execution-error';
      errorDiv.innerHTML = `<strong>Execution Error:</strong> ${data.error}`;
      
      // Add to execution results if it exists
      if (this.elements.executionResults) {
        this.elements.executionResults.innerHTML = '';
        this.elements.executionResults.appendChild(errorDiv);
      }
    }
    
    /**
     * Reset execution UI
     */
    resetExecutionUI() {
      // Reset progress
      if (this.elements.executionProgressFill) {
        this.elements.executionProgressFill.style.width = '0%';
        
        if (this.elements.executionProgressText) {
          this.elements.executionProgressText.textContent = '0%';
        }
        
        // Remove status classes
        if (this.elements.executionProgressFill.parentElement) {
          this.elements.executionProgressFill.parentElement.classList.remove('completed', 'error');
        }
      }
      
      // Reset status
      if (this.elements.executionStatusBadge) {
        this.elements.executionStatusBadge.className = 'status-badge waiting';
        
        if (this.elements.executionStatusText) {
          this.elements.executionStatusText.textContent = 'Ready';
        }
      }
      
      // Clear execution steps
      if (this.elements.executionSteps) {
        this.elements.executionSteps.innerHTML = '';
      }
      
      // Clear execution results
      if (this.elements.executionResults) {
        this.elements.executionResults.innerHTML = '<div class="empty-results">No results yet</div>';
      }
      
      // Reset node styling in graph
      if (this.uiManager.graphManager && this.uiManager.graphManager.cy) {
        this.uiManager.graphManager.cy.nodes().removeClass('executing completed error');
        this.uiManager.graphManager.cy.edges().removeClass('executing completed error');
      }
    }
    
    /**
     * Initialize execution steps UI
     * 
     * @param {Array} executionPlan - Order of node execution
     */
    initializeExecutionSteps(executionPlan) {
      if (!this.elements.executionSteps) return;
      
      // Clear existing steps
      this.elements.executionSteps.innerHTML = '';
      
      // If no plan provided, try to get it from topological sort
      if (!executionPlan || executionPlan.length === 0) {
        if (this.uiManager.workflowManager && this.uiManager.workflowManager.topologicalSorter) {
          executionPlan = this.uiManager.workflowManager.topologicalSorter.computeTopologicalSort() || [];
        }
        
        // If still no plan, show message
        if (!executionPlan || executionPlan.length === 0) {
          this.elements.executionSteps.innerHTML = '<div class="empty-steps">No execution steps planned</div>';
          return;
        }
      }
      
      // Create steps for each node
      executionPlan.forEach((nodeId, index) => {
        const nodeData = this.uiManager.graphManager ? 
          this.uiManager.graphManager.getNodeData(nodeId) : null;
        
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item';
        stepItem.dataset.nodeId = nodeId;
        
        const stepNumber = document.createElement('div');
        stepNumber.className = 'step-number';
        stepNumber.textContent = (index + 1).toString();
        
        const stepDetails = document.createElement('div');
        stepDetails.className = 'step-details';
        
        const stepName = document.createElement('div');
        stepName.className = 'step-name';
        stepName.textContent = nodeData ? nodeData.name : `Node ${nodeId}`;
        
        const stepModel = document.createElement('div');
        stepModel.className = 'step-model';
        stepModel.textContent = nodeData ? 
          `${nodeData.backend} / ${nodeData.model}` : '';
        
        const stepStatus = document.createElement('div');
        stepStatus.className = 'step-status';
        stepStatus.textContent = 'Pending';
        
        // Assemble step item
        stepDetails.appendChild(stepName);
        stepDetails.appendChild(stepModel);
        stepItem.appendChild(stepNumber);
        stepItem.appendChild(stepDetails);
        stepItem.appendChild(stepStatus);
        
        this.elements.executionSteps.appendChild(stepItem);
      });
    }
    
    /**
     * Update the status of an execution step
     * 
     * @param {string} nodeId - Node ID
     * @param {string} status - New status (executing, completed, error)
     */
    updateExecutionStep(nodeId, status) {
      if (!this.elements.executionSteps) return;
      
      const stepItem = this.elements.executionSteps.querySelector(`[data-node-id="${nodeId}"]`);
      if (!stepItem) return;
      
      // Update status class
      stepItem.className = `step-item ${status}`;
      
      // Update status text
      const statusEl = stepItem.querySelector('.step-status');
      if (statusEl) {
        statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      }
      
      // If this step is executing, scroll it into view
      if (status === 'executing') {
        stepItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    
    /**
     * Add an execution result to the results section
     * 
     * @param {string} nodeId - Node ID
     * @param {string} result - Result content
     * @param {boolean} isError - Whether this is an error result
     */
    addExecutionResult(nodeId, result, isError = false) {
      if (!this.elements.executionResults) return;
      
      // Remove empty results placeholder if present
      const emptyResults = this.elements.executionResults.querySelector('.empty-results');
      if (emptyResults) {
        emptyResults.remove();
      }
      
      // Get node data
      const nodeData = this.uiManager.graphManager ? 
        this.uiManager.graphManager.getNodeData(nodeId) : null;
      
      // Create result item
      const resultItem = document.createElement('div');
      resultItem.className = isError ? 'result-item error' : 'result-item';
      resultItem.dataset.nodeId = nodeId;
      
      // Create result header
      const resultHeader = document.createElement('h5');
      resultHeader.textContent = nodeData ? nodeData.name : `Node ${nodeId}`;
      
      // Create result content
      const resultContent = document.createElement('pre');
      resultContent.className = 'result-content';
      
      // Limit content length for display
      const displayResult = result.length > 300 ? 
        result.substring(0, 300) + '...' : result;
      
      resultContent.textContent = displayResult;
      
      // Add to result item
      resultItem.appendChild(resultHeader);
      resultItem.appendChild(resultContent);
      
      // Add view full button if truncated
      if (result.length > 300) {
        const viewButton = document.createElement('button');
        viewButton.className = 'show-full-result-btn';
        viewButton.textContent = 'View Full Result';
        viewButton.addEventListener('click', () => {
          this.showResultModal(nodeId, result);
        });
        
        resultItem.appendChild(viewButton);
      }
      
      // Add to results container
      this.elements.executionResults.appendChild(resultItem);
    }
    
    /**
     * Add pulse animation to selected node
     * 
     * @param {Object} node - Cytoscape node
     */
    addNodePulseAnimation(node) {
      // First remove any existing animation
      this.removeNodePulseAnimation(node);
      
      // Create keyframe animation for this specific node
      const nodeId = node.id();
      const styleId = `pulse-${nodeId}`;
      
      // Check if style already exists
      if (document.getElementById(styleId)) {
        return;
      }
      
      // Create style element
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes pulse-${nodeId} {
          0% { border-width: 2px; border-opacity: 0.2; }
          50% { border-width: 4px; border-opacity: 0.6; }
          100% { border-width: 2px; border-opacity: 0.2; }
        }
      `;
      
      document.head.appendChild(style);
      
      // Apply animation in Cytoscape
      node.style({
        'border-width': 2,
        'border-color': '#ffffff',
        'border-opacity': 0.2,
        'animation': `pulse-${nodeId} 1.5s infinite`
      });
    }
    
    /**
     * Remove pulse animation from node
     * 
     * @param {Object} node - Cytoscape node
     */
    removeNodePulseAnimation(node) {
      const nodeId = node.id();
      const styleId = `pulse-${nodeId}`;
      
      // Remove style element
      const styleEl = document.getElementById(styleId);
      if (styleEl) {
        styleEl.remove();
      }
      
      // Remove animation style
      node.removeStyle('animation');
    }
    
    /**
     * Add executing animation to node
     * 
     * @param {Object} node - Cytoscape node
     */
    addNodeExecutingAnimation(node) {
      // First remove any existing animations
      this.removeNodePulseAnimation(node);
      
      // Add executing class
      node.removeClass('completed error');
      node.addClass('executing');
      
      // Create keyframe animation for this specific node
      const nodeId = node.id();
      const styleId = `executing-${nodeId}`;
      
      // Check if style already exists
      if (document.getElementById(styleId)) {
        return;
      }
      
      // Create style element
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes executing-${nodeId} {
          0% { border-width: 2px; border-opacity: 0.8; }
          50% { border-width: 5px; border-opacity: 1; }
          100% { border-width: 2px; border-opacity: 0.8; }
        }
      `;
      
      document.head.appendChild(style);
      
      // Apply animation in Cytoscape
      node.style({
        'border-width': 2,
        'border-color': '#3498db',
        'border-opacity': 0.8,
        'animation': `executing-${nodeId} 1s infinite`
      });
    }
    
    /**
     * Remove executing animation from node
     * 
     * @param {Object} node - Cytoscape node
     */
    removeNodeExecutingAnimation(node) {
      const nodeId = node.id();
      const styleId = `executing-${nodeId}`;
      
      // Remove style element
      const styleEl = document.getElementById(styleId);
      if (styleEl) {
        styleEl.remove();
      }
      
      // Remove animation style
      node.removeStyle('animation');
    }
    
    /**
     * Create ripple effect for buttons
     * 
     * @param {Event} e - Click event
     */
    createRippleEffect(e) {
      const button = e.currentTarget;
      const ripple = document.createElement('span');
      
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.classList.add('ripple');
      
      // Remove existing ripples
      const existingRipple = button.querySelector('.ripple');
      if (existingRipple) {
        existingRipple.remove();
      }
      
      button.appendChild(ripple);
      
      // Remove ripple after animation
      const timeout = setTimeout(() => {
        ripple.remove();
        
        // Remove from tracked timeouts
        const index = this.rippleTimeouts.indexOf(timeout);
        if (index > -1) {
          this.rippleTimeouts.splice(index, 1);
        }
      }, 600);
      
      // Track timeout for cleanup
      this.rippleTimeouts.push(timeout);
    }
    
    /**
     * Make an element draggable
     * 
     * @param {HTMLElement} element - Element to make draggable
     * @param {HTMLElement} handle - Element to use as drag handle
     */
    makeDraggable(element, handle) {
      if (!element || !handle) return;
      
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      
      handle.onmousedown = dragMouseDown;
      
      function dragMouseDown(e) {
        e.preventDefault();
        
        // Get mouse position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
      
      function elementDrag(e) {
        e.preventDefault();
        
        // Calculate new position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
      }
      
      function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
    
    /**
     * Show tooltip at specified position
     * 
     * @param {Object} position - Position {x, y}
     * @param {string} content - Tooltip content
     */
    showTooltip(position, content) {
      if (!this.elements.tooltip) return;
      
      this.elements.tooltip.innerHTML = content;
      this.elements.tooltip.style.left = `${position.x + 10}px`;
      this.elements.tooltip.style.top = `${position.y + 10}px`;
      this.elements.tooltip.classList.add('visible');
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip() {
      if (!this.elements.tooltip) return;
      
      this.elements.tooltip.classList.remove('visible');
    }
    
    /**
     * Get tooltip content for node
     * 
     * @param {Object} nodeData - Node data
     * @returns {string} Tooltip HTML content
     */
    getNodeTooltipContent(nodeData) {
      if (!nodeData) return '';
      
      return `
        <div>
          <strong>${nodeData.name || 'Unknown Node'}</strong><br>
          ${nodeData.backend || ''} / ${nodeData.model || ''}<br>
          Temp: ${nodeData.temperature || 'default'}
        </div>
      `;
    }
    
    /**
     * Clean up resources on destroy
     */
    destroy() {
      // Clean up ripple timeouts
      this.rippleTimeouts.forEach(timeout => {
        clearTimeout(timeout);
      });
      
      // Remove any added style elements
      document.querySelectorAll('style[id^="pulse-"], style[id^="executing-"]').forEach(style => {
        style.remove();
      });
    }
  }