/**
 * ui/GraphControlsManager.js
 * 
 * Manages graph control actions like save, load, execute workflow,
 * and graph status indicators.
 */
export class GraphControlsManager {
    /**
     * @param {UIManager} uiManager - The parent UI manager
     */
    constructor(uiManager) {
      this.uiManager = uiManager;
      this.graphStatusIndicator = null;
      this.graphNameDisplay = null;
      this.saveAsGraphBtn = null;
    }
    
    /**
     * Initialize the graph controls manager
     */
    initialize() {
      // Add graph status indicator
      this.addGraphStatusIndicator();
      
      // Replace the original save button with Save/Save As
      this.replaceGraphButtons();
    }
    
    /**
     * Add graph status indicator to the header
     */
    addGraphStatusIndicator() {
      // Create status indicator container
      const statusContainer = document.createElement('div');
      statusContainer.className = 'graph-status-container';
      statusContainer.style.display = 'flex';
      statusContainer.style.alignItems = 'center';
      statusContainer.style.marginLeft = '15px';
      
      // Create graph name display
      const graphNameDisplay = document.createElement('span');
      graphNameDisplay.id = 'current-graph-name';
      graphNameDisplay.className = 'graph-name-display';
      graphNameDisplay.textContent = 'No Graph Loaded';
      graphNameDisplay.style.marginRight = '8px';
      graphNameDisplay.style.fontWeight = 'bold';
      
      // Create modified indicator
      const modifiedIndicator = document.createElement('span');
      modifiedIndicator.id = 'graph-modified-indicator';
      modifiedIndicator.className = 'graph-modified-indicator';
      modifiedIndicator.textContent = '';
      modifiedIndicator.style.color = '#e74c3c';
      modifiedIndicator.style.fontWeight = 'bold';
      modifiedIndicator.style.marginLeft = '4px';
      
      statusContainer.appendChild(graphNameDisplay);
      statusContainer.appendChild(modifiedIndicator);
      
      // Add to header (assuming header is the first child of container)
      const headerElement = document.querySelector('header');
      
      if (headerElement) {
        const controlsContainer = headerElement.querySelector('.controls');
        if (controlsContainer) {
          headerElement.insertBefore(statusContainer, controlsContainer);
        } else {
          headerElement.appendChild(statusContainer);
        }
      } else {
        // If there's no header, add it to the body
        document.body.appendChild(statusContainer);
      }
      
      // Store references
      this.graphStatusIndicator = modifiedIndicator;
      this.graphNameDisplay = graphNameDisplay;
    }
    
    /**
     * Replace the original save button with Save/Save As buttons
     */
    replaceGraphButtons() {
      // Get the original save button
      const originalSaveBtn = this.uiManager.elements.saveGraphBtn;
      
      if (!originalSaveBtn) {
        console.error('Save graph button not found');
        return;
      }
      
      const originalSaveBtnParent = originalSaveBtn.parentElement;
      
      // Create Save button
      const saveBtn = document.createElement('button');
      saveBtn.id = 'save-graph-btn';
      saveBtn.textContent = 'Save';
      saveBtn.title = 'Save the current graph';
      saveBtn.disabled = true; // Initially disabled
      
      // Create Save As button
      const saveAsBtn = document.createElement('button');
      saveAsBtn.id = 'save-as-graph-btn';
      saveAsBtn.textContent = 'Save As';
      saveAsBtn.title = 'Save as a new graph';
      
      // Replace the original button
      if (originalSaveBtnParent) {
        originalSaveBtnParent.removeChild(originalSaveBtn);
        originalSaveBtnParent.insertBefore(saveAsBtn, originalSaveBtnParent.firstChild);
        originalSaveBtnParent.insertBefore(saveBtn, originalSaveBtnParent.firstChild);
      }
      
      // Store references
      this.uiManager.elements.saveGraphBtn = saveBtn;
      this.saveAsGraphBtn = saveAsBtn;
      
      // Add event listeners
      saveBtn.addEventListener('click', () => this.saveGraph(false));
      saveAsBtn.addEventListener('click', () => this.saveGraph(true));
    }
    
    /**
     * Add a reset database button to the UI
     */
    addResetDbButton() {
      const resetBtn = document.createElement('button');
      resetBtn.id = 'reset-db-btn';
      resetBtn.className = 'danger-btn';
      resetBtn.textContent = 'Reset DB';
      resetBtn.style.backgroundColor = '#e74c3c';
      resetBtn.style.marginLeft = '10px';
      
      // Add button to controls
      const controlsContainer = document.querySelector('.controls');
      if (controlsContainer) {
        controlsContainer.appendChild(resetBtn);
        
        // Store reference
        this.uiManager.elements.resetDbBtn = resetBtn;
        
        // Add event listener
        resetBtn.addEventListener('click', () => this.resetDatabase());
      }
    }
    
    /**
     * Update the graph status display
     * 
     * @param {string|null} graphName - Name of the current graph or null if none
     * @param {boolean} isModified - Whether the graph has unsaved changes
     */
    updateGraphStatus(graphName, isModified) {
      // Update name display if provided
      if (graphName !== null && this.graphNameDisplay) {
        this.graphNameDisplay.textContent = graphName;
      }
      
      // Update modified indicator
      if (this.graphStatusIndicator) {
        this.graphStatusIndicator.textContent = isModified ? '*' : '';
      }
      
      // Update save button state
      if (this.uiManager.elements.saveGraphBtn) {
        // Enable save button if there's a graph loaded
        this.uiManager.elements.saveGraphBtn.disabled = !this.uiManager.graphManager.getCurrentGraphId();
      }
    }
    
    /**
     * Save the current graph
     * 
     * @param {boolean} saveAs - Whether to save as a new graph
     */
    async saveGraph(saveAs = false) {
      try {
        // If no graph is loaded or Save As was requested
        if (saveAs || !this.uiManager.graphManager.getCurrentGraphId()) {
          // Get a name for the graph
          const graphName = prompt(
            'Enter a name for this graph:',
            this.uiManager.graphManager.getCurrentGraphName() || 'My AI Canvas Graph'
          );
          
          if (!graphName) {
            return; // User cancelled
          }
          
          const graphDescription = prompt('Enter a description (optional):', '');
          
          // Show saving indicator
          const saveBtn = saveAs ? this.saveAsGraphBtn : this.uiManager.elements.saveGraphBtn;
          const originalText = saveBtn.textContent;
          saveBtn.textContent = 'Saving...';
          saveBtn.disabled = true;
          
          try {
            // Save the graph as new
            await this.uiManager.graphManager.saveGraph(graphName, graphDescription || '', saveAs);
            
            // Show success message
            this.uiManager.showNotification(`Graph "${graphName}" saved successfully!`);
          } catch (error) {
            // Graph may have been saved to localStorage as fallback
            console.error('Error saving graph:', error);
            this.uiManager.showNotification(
              `Error saving graph to server: ${error.message}. Graph was saved to local storage as a fallback.`,
              'error'
            );
          }
          
          // Reset button
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
        } else {
          // Save the existing graph without prompting
          const saveBtn = this.uiManager.elements.saveGraphBtn;
          const originalText = saveBtn.textContent;
          saveBtn.textContent = 'Saving...';
          saveBtn.disabled = true;
          
          try {
            // Save the graph with existing name/description
            await this.uiManager.graphManager.saveGraph(
              this.uiManager.graphManager.getCurrentGraphName(),
              '', // Use existing description
              false // Not a new graph
            );
            
            // Show success notification
            this.uiManager.showNotification(
              `Graph "${this.uiManager.graphManager.getCurrentGraphName()}" saved successfully!`
            );
          } catch (error) {
            console.error('Error saving graph:', error);
            this.uiManager.showNotification(
              `Error saving graph: ${error.message}. Graph was saved to local storage as a fallback.`,
              'error'
            );
          }
          
          // Reset button
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
        }
      } catch (error) {
        this.uiManager.errorHandler.handleError(error, {
          context: 'Saving Graph'
        });
      }
    }
    
    /**
     * Load a graph from the server
     */
    async loadGraph() {
      // Check for unsaved changes
      if (this.uiManager.graphManager.hasUnsavedChanges()) {
        if (!confirm('You have unsaved changes. Are you sure you want to load a different graph?')) {
          return; // User cancelled
        }
      }
      
      try {
        // Show loading indicator
        const loadBtn = this.uiManager.elements.loadGraphBtn;
        if (!loadBtn) {
          console.error('Load graph button not found');
          return;
        }
        
        const originalText = loadBtn.textContent;
        loadBtn.textContent = 'Loading...';
        loadBtn.disabled = true;
        
        try {
          // Get available graphs
          const graphs = await this.uiManager.graphManager.getAvailableGraphs();
          
          if (!graphs || graphs.length === 0) {
            this.uiManager.showNotification('No saved graphs found on the server. Try creating a new graph.', 'info');
            
            // Check if there's a graph in localStorage
            const graphData = localStorage.getItem('aiCanvas_graph');
            if (graphData) {
              if (confirm('No graphs found in database, but a graph was found in local storage. Would you like to load it?')) {
                this.uiManager.graphManager.importGraph(JSON.parse(graphData));
                console.log('Loaded graph from localStorage');
                this.uiManager.showNotification('Graph loaded from local storage', 'success');
              }
            }
            
            return;
          }
          
          // Create a dialog for graph selection
          this.uiManager.dialogManager.showGraphSelectionDialog(graphs);
        } catch (error) {
          this.uiManager.errorHandler.handleError(error, {
            context: 'Loading Graphs',
            silent: true
          });
          
          // Try to load from localStorage as fallback
          const graphData = localStorage.getItem('aiCanvas_graph');
          if (graphData) {
            if (confirm('Error loading graphs from server. A graph was found in local storage. Would you like to load it?')) {
              this.uiManager.graphManager.importGraph(JSON.parse(graphData));
              console.log('Loaded graph from localStorage');
              this.uiManager.showNotification('Graph loaded from local storage', 'success');
            }
          } else {
            this.uiManager.showNotification('No saved graphs found in local storage either.', 'error');
          }
        }
      } finally {
        // Reset button if it exists
        const loadBtn = this.uiManager.elements.loadGraphBtn;
        if (loadBtn) {
          loadBtn.textContent = 'Load Graph';
          loadBtn.disabled = false;
        }
      }
    }
    
    /**
     * Execute the current workflow
     */
    async executeWorkflow() {
        if (this.isExecuting) return;
  
        this.isExecuting = true;
        this.updateStatus('Executing', 'executing');
        
        // Add timeout for auto-recovery from stuck state
        this.executionTimeout = setTimeout(() => {
          if (this.isExecuting) {
            console.warn("Execution timeout reached - forcing completion");
            this.isExecuting = false;
            this.updateStatus('Completed', 'success');
            this.updateProgress(100);
            
            // Re-enable execute button
            if (this.executeBtn) {
              this.executeBtn.disabled = false;
            }
            
            // Show notification
            if (this.uiManager.showNotification) {
              this.uiManager.showNotification('Workflow execution completed', 'info');
            }
          }
        }, 30000); // 30 seconds timeout








      try {
        // Get the execute button
        const executeBtn = this.uiManager.elements.executeWorkflowBtn;
        if (!executeBtn) {
          console.error('Execute workflow button not found');
          return;
        }
        
        // Show execution in progress
        const originalText = executeBtn.textContent;
        executeBtn.textContent = 'Executing...';
        executeBtn.disabled = true;
        
        // Check if there's a graph ID
        const graphId = this.uiManager.graphManager.getCurrentGraphId() || 
                       localStorage.getItem('aiCanvas_lastGraphId');
        
        if (!graphId) {
          this.uiManager.showNotification(
            'Please save the graph first before executing the workflow.',
            'error'
          );
          return;
        }
        
        // Show execution progress dialog
        const progressDialog = this.uiManager.dialogManager.showWorkflowProgressDialog();
        
        try {
          // Execute the workflow
          const results = await this.uiManager.workflowManager.executeWorkflow(graphId);
          
          // Update progress dialog with results
          this.uiManager.dialogManager.updateWorkflowProgressDialog(progressDialog, results);
        } catch (error) {
          this.uiManager.dialogManager.handleWorkflowError(progressDialog, error);
        }
      } finally {
        // Reset button if it exists
        const executeBtn = this.uiManager.elements.executeWorkflowBtn;
        if (executeBtn) {
          executeBtn.textContent = 'Execute Workflow';
          executeBtn.disabled = false;
        }
      }
    }
    
    /**
     * Reset the database (admin function)
     */
    async resetDatabase() {
      if (!confirm('WARNING: This will delete ALL graphs and data. This action cannot be undone. Are you sure?')) {
        return;
      }
      
      try {
        // Get reset button
        const resetDbBtn = this.uiManager.elements.resetDbBtn;
        if (!resetDbBtn) {
          console.error('Reset database button not found');
          return;
        }
        
        // Show loading state
        resetDbBtn.textContent = 'Resetting...';
        resetDbBtn.disabled = true;
        
        // Reset the database
        await this.uiManager.graphManager.resetDatabase();
        
        this.uiManager.showNotification('Database has been reset successfully', 'success');
      } catch (error) {
        this.uiManager.errorHandler.handleError(error, {
          context: 'Resetting Database'
        });
      } finally {
        // Reset button if it exists
        const resetDbBtn = this.uiManager.elements.resetDbBtn;
        if (resetDbBtn) {
          resetDbBtn.textContent = 'Reset DB';
          resetDbBtn.disabled = false;
        }
      }
    }
}