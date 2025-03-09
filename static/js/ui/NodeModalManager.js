/**
 * ui/NodeModalManager.js
 * 
 * Manages the node creation/editing modal and form handling.
 */
export class NodeModalManager {
    /**
     * @param {UIManager} uiManager - The parent UI manager
     */
    constructor(uiManager) {
      this.uiManager = uiManager;
      this.needsModelUpdate = false;
      this.modelUpdateObserver = null;
    }
    
    /**
     * Initialize the node modal manager
     */
    initialize() {
      // Set up modal-specific event listeners
      this.setupEventListeners();
      
      // Add a hidden field for graph ID if it doesn't exist already
      this.addGraphIdField();
      
      // Set up delayed model update observer for dynamic loading
      this.setupDelayedModelUpdate();
    }
    
    /**
     * Set up event listeners for the modal
     */
    setupEventListeners() {
      const { elements } = this.uiManager;
      
      // Modal controls
      if (elements.closeModalBtn) {
        elements.closeModalBtn.addEventListener('click', () => this.hideNodeModal());
      }
      
      if (elements.cancelBtn) {
        elements.cancelBtn.addEventListener('click', () => this.hideNodeModal());
      }
      
      // Form submission
      if (elements.nodeForm) {
        elements.nodeForm.addEventListener('submit', (event) => this.handleNodeFormSubmit(event));
      }
      
      // Backend selection change
      if (elements.backendSelect) {
        elements.backendSelect.addEventListener('change', () => this.updateModelOptions());
      }
      
      // Temperature slider
      if (elements.temperatureInput && elements.temperatureValue) {
        elements.temperatureInput.addEventListener('input', () => {
          elements.temperatureValue.textContent = elements.temperatureInput.value;
        });
      }
    }
    
    /**
     * Add a hidden field for graph ID to the node form
     */
    addGraphIdField() {
      const { elements } = this.uiManager;
      
      // Only proceed if we have the node form
      if (!elements.nodeForm) return;
      
      // Check if field already exists
      if (!document.getElementById('graph-id-field')) {
        const graphIdField = document.createElement('input');
        graphIdField.type = 'hidden';
        graphIdField.id = 'graph-id-field';
        graphIdField.name = 'graph_id';
        elements.nodeForm.appendChild(graphIdField);
      }
    }
    
    /**
     * Set up delayed model update for dynamic loading
     */
    setupDelayedModelUpdate() {
      // If DOM elements are ready now, run an initial update
      const { elements } = this.uiManager;
      
      if (elements.backendSelect && elements.modelSelect) {
        // Elements are ready, update models when they're loaded
        this.needsModelUpdate = true;
      } else {
        // Elements aren't ready, set up a MutationObserver to wait for them
        console.log('Setting up observer for model selector');
        
        // Disconnect existing observer if there is one
        if (this.modelUpdateObserver) {
          this.modelUpdateObserver.disconnect();
        }
        
        // Create new observer
        this.modelUpdateObserver = new MutationObserver((mutations) => {
          // Check if our elements are now available
          if (document.getElementById('backend-select') && document.getElementById('model-select')) {
            // Re-find DOM elements 
            this.uiManager.findDOMElements();
            
            if (this.uiManager.elements.backendSelect && this.uiManager.elements.modelSelect) {
              console.log('DOM elements now available, updating models');
              // Set flag for model registry updates
              this.needsModelUpdate = true;
              // Stop observing
              this.modelUpdateObserver.disconnect();
              this.modelUpdateObserver = null;
            }
          }
        });
        
        // Start observing the document
        this.modelUpdateObserver.observe(document, { childList: true, subtree: true });
        
        // Safety fallback - try again after a short delay
        setTimeout(() => {
          if (this.needsModelUpdate === false) {
            console.log('Delayed model update');
            this.uiManager.findDOMElements();
            if (this.uiManager.elements.backendSelect && this.uiManager.elements.modelSelect) {
              this.needsModelUpdate = true;
              
              // If we have a model registry, update it
              if (this.uiManager.modelRegistry) {
                this.uiManager.modelRegistry.refreshModels();
              }
            }
          }
        }, 500);
      }
    }
    
    /**
     * Show the node creation modal
     */
    showNodeModal() {
      const { elements, graphManager } = this.uiManager;
      
      // Check if we have the modal element
      if (!elements.nodeModal) {
        console.error('Node modal element not found');
        return;
      }
      
      // Get the current graph ID for new nodes
      const currentGraphId = graphManager.getCurrentGraphId();
      
      if (!currentGraphId) {
        // If no graph is loaded, ask user to save first
        if (!confirm('No graph is currently loaded. Would you like to create and save a new graph first?')) {
          return;
        }
        
        // Show save dialog and return
        this.uiManager.graphControlsManager.saveGraph(true);
        return;
      }
      
      // Set the graph ID field if it exists
      const graphIdField = document.getElementById('graph-id-field');
      if (graphIdField) {
        graphIdField.value = currentGraphId;
      }
      
      // Show the modal
      elements.nodeModal.style.display = 'block';
      
      // Focus the name field if it exists
      const nameField = document.getElementById('node-name');
      if (nameField) {
        nameField.focus();
      }
      
      // Update model options
      this.updateModelOptions();
    }
    
    /**
     * Hide the node creation modal
     */
    hideNodeModal() {
      const { elements } = this.uiManager;
      
      // Check if we have the modal and form elements
      if (!elements.nodeModal || !elements.nodeForm) {
        console.error('Node modal or form elements not found');
        return;
      }
      
      // Hide the modal
      elements.nodeModal.style.display = 'none';
      
      // Reset the form
      elements.nodeForm.reset();
    }
    
    /**
     * Update the model options based on selected backend
     */
    updateModelOptions() {
      const { elements, modelRegistry } = this.uiManager;
      
      // Check if DOM elements exist before trying to use them
      if (!elements.backendSelect || !elements.modelSelect) {
        console.log('DOM elements not ready yet, will update models later');
        // Save the fact that we need to update models once elements are ready
        this.needsModelUpdate = true;
        return;
      }
    
      const backend = elements.backendSelect.value;
      console.log(`Updating model options for backend: ${backend}`);
      const models = modelRegistry.getModelsForBackend(backend);
      console.log(`Models available: ${models.length}`);
      
      // Clear existing options
      elements.modelSelect.innerHTML = '';
      
      if (models.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No models available';
        elements.modelSelect.appendChild(option);
      } else {
        // Add models as options
        models.forEach(model => {
          const option = document.createElement('option');
          option.value = model;
          
          // Add limits info for Groq models
          if (backend === 'groq') {
            const limits = modelRegistry.getModelLimits(model);
            if (limits) {
              const reqPerDay = limits.req_per_day;
              const tokensPerMin = limits.tokens_per_min;
              option.textContent = `${model} (${reqPerDay}/day, ${tokensPerMin}/min)`;
              option.title = `Requests: ${limits.req_per_min}/min, ${reqPerDay}/day\nTokens: ${tokensPerMin}/min, ${limits.tokens_per_day === "No limit" ? "No limit/day" : limits.tokens_per_day + "/day"}`;
            } else {
              option.textContent = model;
            }
          } else {
            option.textContent = model;
          }
          
          elements.modelSelect.appendChild(option);
        });
      }
      
      // If this was the first update, trigger the optimal settings
      if (elements.modelSelect.value) {
        const settings = modelRegistry.getOptimalSettings(
          backend, 
          elements.modelSelect.value
        );
        
        // Update temperature input if it exists
        if (elements.temperatureInput && elements.temperatureValue) {
          elements.temperatureInput.value = settings.temperature;
          elements.temperatureValue.textContent = settings.temperature;
        }
        
        // Update max tokens input if it exists
        const maxTokensElement = document.getElementById('max-tokens');
        if (maxTokensElement) {
          maxTokensElement.value = settings.maxTokens;
        }
      }
    }
    
    /**
     * Handle node form submission
     * 
     * @param {Event} event - Form submission event
     */
    handleNodeFormSubmit(event) {
      event.preventDefault();
      
      const { elements, eventBus, graphManager } = this.uiManager;
      
      // Get form values
      const nameField = document.getElementById('node-name');
      if (!nameField) {
        console.error('Node name field not found');
        return;
      }
      
      const name = nameField.value;
      const backend = elements.backendSelect?.value || 'ollama';
      const model = elements.modelSelect?.value || 'llama3';
      
      const systemMessageField = document.getElementById('system-message');
      const systemMessage = systemMessageField?.value || 'You are a helpful assistant';
      
      const temperature = parseFloat(elements.temperatureInput?.value || 0.7);
      
      const maxTokensField = document.getElementById('max-tokens');
      const maxTokens = parseInt(maxTokensField?.value || 1024);
      
      // Get the graph ID field or use current graph ID
      const graphIdField = document.getElementById('graph-id-field');
      const graphId = graphIdField?.value || graphManager.getCurrentGraphId();
      
      // Create node data
      const nodeData = {
        id: 'node-' + Date.now(),
        name,
        backend,
        model,
        systemMessage,
        temperature,
        maxTokens,
        graph_id: graphId // Ensure the node is associated with current graph
      };
      
      // Add node to graph
      eventBus.publish('node:add', nodeData);
      
      // Hide modal
      this.hideNodeModal();
      
      // Show success notification
      this.uiManager.showNotification(`Node "${name}" created successfully`);
    }
}