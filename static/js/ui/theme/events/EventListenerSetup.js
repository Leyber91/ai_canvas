/**
 * ui/theme/events/EventListenerSetup.js
 * 
 * Sets up all event listeners for the theme manager
 */

import { EventUtils } from '../../helpers/EventUtils.js';

export class EventListenerSetup {
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
   * Set up all event listeners
   */
  setupEventListeners() {
    this.setupPanelListeners();
    this.setupChatDialogListeners();
    this.setupModalListeners();
    this.setupRippleEffects();
    this.setupEventBusSubscriptions();
    this.setupKeyboardListeners();
  }
  
  /**
   * Set up panel-related event listeners
   */
  setupPanelListeners() {
    // Collapse/expand workflow panel
    if (this.elements.workflowPanelHeader) {
      this.elements.workflowPanelHeader.addEventListener('click', () => {
        this.themeManager.toggleWorkflowPanel();
      });
    }
    
    // Collapse/expand conversation panel
    if (this.elements.panelToggle) {
      this.elements.panelToggle.addEventListener('click', () => {
        this.themeManager.toggleConversationPanel();
      });
    }
  }
  
  /**
   * Set up chat dialog event listeners
   */
  setupChatDialogListeners() {
    // Close node chat dialog
    if (this.elements.closeChatBtn) {
      this.elements.closeChatBtn.addEventListener('click', () => {
        this.themeManager.hideNodeChatDialog();
      });
    }
    
    // Node chat send button
    if (this.elements.nodeChatSend) {
      this.elements.nodeChatSend.addEventListener('click', () => {
        this.themeManager.sendNodeChatMessage();
      });
    }
    
    // Node chat input enter key
    if (this.elements.nodeChatInput) {
      this.elements.nodeChatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.themeManager.sendNodeChatMessage();
        }
      });
    }
  }
  
  /**
   * Set up modal event listeners
   */
  setupModalListeners() {
    // Close result modal
    if (this.elements.closeResultModal) {
      this.elements.closeResultModal.addEventListener('click', () => {
        this.themeManager.hideResultModal();
      });
    }
  }
  
  /**
   * Set up ripple effect event listeners
   */
  setupRippleEffects() {
    // Add ripple effect to buttons
    if (this.elements.rippleButtons) {
      this.elements.rippleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const timeout = EventUtils.createRippleEffect(e);
          this.themeManager.rippleTimeouts.push(timeout);
        });
      });
    }
  }
  
  /**
   * Set up event bus subscriptions
   */
  setupEventBusSubscriptions() {
    // Subscribe to node events
    this.eventBus.subscribe('node:selected', this.themeManager.handleNodeSelected.bind(this.themeManager));
    this.eventBus.subscribe('node:deselected', this.themeManager.handleNodeDeselected.bind(this.themeManager));
    this.eventBus.subscribe('node:executing', this.themeManager.handleNodeExecuting.bind(this.themeManager));
    this.eventBus.subscribe('node:completed', this.themeManager.handleNodeCompleted.bind(this.themeManager));
    this.eventBus.subscribe('node:error', this.themeManager.handleNodeError.bind(this.themeManager));
    
    // Subscribe to workflow events
    this.eventBus.subscribe('workflow:executing', this.themeManager.handleWorkflowExecuting.bind(this.themeManager));
    this.eventBus.subscribe('workflow:completed', this.themeManager.handleWorkflowCompleted.bind(this.themeManager));
    this.eventBus.subscribe('workflow:failed', this.themeManager.handleWorkflowFailed.bind(this.themeManager));
  }
  
  /**
   * Set up keyboard event listeners
   */
  setupKeyboardListeners() {
    // Escape key handling for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close any open modals or dialogs
        if (this.themeManager.state.chatDialogOpen) {
          this.themeManager.hideNodeChatDialog();
        }
        if (this.elements.resultModal && this.elements.resultModal.style.display === 'block') {
          this.themeManager.hideResultModal();
        }
      }
    });
  }
}