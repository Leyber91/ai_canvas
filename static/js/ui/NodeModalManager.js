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
    this.editMode = false;  // Flag to track if we're in edit mode
    this.editNodeId = null; // ID of the node being edited
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
    
    // Set modal title for creation mode
    if (elements.modalTitle) {
      elements.modalTitle.textContent = 'Add New Node';
    }
    
    // Focus the name field if it exists
    const nameField = document.getElementById('node-name');
    if (nameField) {
      nameField.focus();
    }
    
    // Update model options
    this.updateModelOptions();
  }
  
  /**
   * Show the node editing modal for a specific node
   * 
   * @param {string} nodeId - ID of the node to edit
   */
  showEditNodeModal(nodeId) {
    const { elements, graphManager } = this.uiManager;
    
    // Get node data from graph manager
    const nodeData = graphManager.getNodeData(nodeId);
    if (!nodeData) {
      console.error(`Cannot edit node: Node with ID ${nodeId} not found`);
      return;
    }
    
    // Store edit mode state
    this.editMode = true;
    this.editNodeId = nodeId;
    
    // Show the modal
    elements.nodeModal.style.display = 'block';
    
    // Set the modal title
    if (elements.modalTitle) {
      elements.modalTitle.textContent = 'Edit Node';
    }
    
    // Fill the form with existing node data
    if (elements.nodeForm) {
      // Set node name
      const nameField = elements.nodeForm.elements['node-name'];
      if (nameField) {
        nameField.value = nodeData.name || '';
      }
      
      // Set backend
      if (elements.backendSelect) {
        elements.backendSelect.value = nodeData.backend || 'ollama';
      }
      
      // Update model options based on selected backend
      this.updateModelOptions();
      
      // Set model selection (setTimeout to ensure options are updated)
      setTimeout(() => {
        if (elements.modelSelect) {
          elements.modelSelect.value = nodeData.model || '';
        }
      }, 100);
      
      // Set system message
      const systemMessageField = elements.nodeForm.elements['system-message'];
      if (systemMessageField) {
        systemMessageField.value = nodeData.systemMessage || '';
      }
      
      // Set temperature
      if (elements.temperatureInput && elements.temperatureValue) {
        elements.temperatureInput.value = nodeData.temperature || 0.7;
        elements.temperatureValue.textContent = nodeData.temperature || 0.7;
      }
      
      // Set max tokens
      const maxTokensField = elements.nodeForm.elements['max-tokens'];
      if (maxTokensField) {
        maxTokensField.value = nodeData.maxTokens || 1024;
      }
      
      // Set the graph ID
      const graphIdField = document.getElementById('graph-id-field');
      if (graphIdField) {
        graphIdField.value = nodeData.graph_id || graphManager.getCurrentGraphId();
      }
    }
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
    
    // Reset form error message if exists
    const formError = document.getElementById('form-error');
    if (formError) {
      formError.style.display = 'none';
      formError.textContent = '';
    }
    
    // Reset modal title
    if (elements.modalTitle) {
      elements.modalTitle.textContent = 'Add New Node';
    }
    
    // Reset edit mode
    this.editMode = false;
    this.editNodeId = null;
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
   * Show form error message
   * 
   * @param {string} message - Error message to display
   */
  showFormError(message) {
    const formError = document.getElementById('form-error');
    if (formError) {
      formError.textContent = message;
      formError.style.display = 'block';
    } else {
      console.error('Form error element not found');
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
    
    const name = nameField.value.trim();
    
    // Validate form
    if (!name) {
      this.showFormError('Name is required');
      return;
    }
    
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
      name,
      backend,
      model,
      systemMessage,
      temperature,
      maxTokens,
      graph_id: graphId // Ensure the node is associated with current graph
    };
    
    // Check if we're in edit mode
    if (this.editMode && this.editNodeId) {
      // Add ID to nodeData
      nodeData.id = this.editNodeId;
      
      // Publish update event
      eventBus.publish('node:update', nodeData);
      
      // Show success notification
      this.uiManager.showNotification(`Node "${name}" updated successfully`);
    } else {
      // Generate new ID for node creation
      nodeData.id = 'node-' + Date.now();
      
      // Publish add event
      eventBus.publish('node:add', nodeData);
      
      // Show success notification
      this.uiManager.showNotification(`Node "${name}" created successfully`);
    }
    
    // Hide the modal
    this.hideNodeModal();
  }
}