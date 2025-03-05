/**
 * graph-enhanced-workflow.js - Enhanced workflow execution and visualization
 */

// Define the GraphEnhancedWorkflow class
window.GraphEnhancedWorkflow = class GraphEnhancedWorkflow {
    constructor(graphCore) {
        this.graphCore = graphCore;
        this.cy = graphCore.cy;
        this.executionOrder = [];
        this.executionResults = {};
        this.isExecuting = false;
        this.executionStep = 0;
        this.executionHistory = [];
    }

    init() {
        this.createEnhancedWorkflowControls();
        this.registerWorkflowEvents();
    }

    registerWorkflowEvents() {
        // Listen for graph changes that affect workflow
        this.cy.on('add remove', 'node edge', () => {
            // Reset execution state when graph changes
            this.resetExecutionState();
        });
        
        // Listen for node data changes
        document.addEventListener('nodeDataChanged', () => {
            this.resetExecutionState();
        });
    }

    createEnhancedWorkflowControls() {
        // Create workflow controls container
        const workflowControls = document.createElement('div');
        workflowControls.className = 'workflow-controls';
        workflowControls.style.display = 'flex';
        workflowControls.style.flexDirection = 'column';
        workflowControls.style.gap = '10px';
        
        // Create execute button with dropdown
        const executeContainer = document.createElement('div');
        executeContainer.className = 'execute-container';
        executeContainer.style.position = 'relative';
        
        const executeBtn = document.createElement('button');
        executeBtn.className = 'execute-workflow-btn';
        executeBtn.textContent = 'Execute Workflow';
        executeBtn.style.width = '100%';
        executeBtn.style.padding = '8px 12px';
        executeBtn.style.backgroundColor = '#3498db';
        executeBtn.style.color = 'white';
        executeBtn.style.border = 'none';
        executeBtn.style.borderRadius = '4px';
        executeBtn.style.cursor = 'pointer';
        executeBtn.style.display = 'flex';
        executeBtn.style.alignItems = 'center';
        executeBtn.style.justifyContent = 'center';
        executeBtn.style.gap = '5px';
        
        // Add dropdown icon
        const dropdownIcon = document.createElement('span');
        dropdownIcon.innerHTML = '▼';
        dropdownIcon.style.fontSize = '10px';
        dropdownIcon.style.marginLeft = '5px';
        executeBtn.appendChild(dropdownIcon);
        
        // Create dropdown menu
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'execute-dropdown-menu';
        dropdownMenu.style.position = 'absolute';
        dropdownMenu.style.top = '100%';
        dropdownMenu.style.left = '0';
        dropdownMenu.style.right = '0';
        dropdownMenu.style.backgroundColor = 'white';
        dropdownMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        dropdownMenu.style.borderRadius = '4px';
        dropdownMenu.style.marginTop = '5px';
        dropdownMenu.style.zIndex = '100';
        dropdownMenu.style.display = 'none';
        
        // Add dropdown options
        const executeOptions = [
            { id: 'execute-all', label: 'Execute All Nodes', icon: '▶️' },
            { id: 'execute-selected', label: 'Execute Selected Node', icon: '🎯' },
            { id: 'execute-path', label: 'Execute Path to Selected', icon: '🛤️' },
            { id: 'validate-workflow', label: 'Validate Workflow', icon: '✓' }
        ];
        
        executeOptions.forEach(option => {
            const optionItem = document.createElement('div');
            optionItem.className = 'execute-option';
            optionItem.setAttribute('data-option', option.id);
            optionItem.style.padding = '8px 12px';
            optionItem.style.cursor = 'pointer';
            optionItem.style.display = 'flex';
            optionItem.style.alignItems = 'center';
            optionItem.style.gap = '8px';
            
            optionItem.innerHTML = `
                <span>${option.icon}</span>
                <span>${option.label}</span>
            `;
            
            optionItem.addEventListener('mouseover', () => {
                optionItem.style.backgroundColor = '#f5f5f5';
            });
            
            optionItem.addEventListener('mouseout', () => {
                optionItem.style.backgroundColor = 'transparent';
            });
            
            optionItem.addEventListener('click', () => {
                dropdownMenu.style.display = 'none';
                this.handleExecuteOption(option.id);
            });
            
            dropdownMenu.appendChild(optionItem);
        });
        
        // Toggle dropdown on button click
        executeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdownMenu.style.display === 'block';
            dropdownMenu.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdownMenu.style.display = 'none';
        });
        
        executeContainer.appendChild(executeBtn);
        executeContainer.appendChild(dropdownMenu);
        
        // Create step execution controls
        const stepControls = document.createElement('div');
        stepControls.className = 'step-controls';
        stepControls.style.display = 'none'; // Initially hidden
        stepControls.style.flexDirection = 'row';
        stepControls.style.gap = '5px';
        stepControls.style.alignItems = 'center';
        
        const prevStepBtn = document.createElement('button');
        prevStepBtn.className = 'step-btn';
        prevStepBtn.innerHTML = '◀';
        prevStepBtn.title = 'Previous Step';
        prevStepBtn.style.padding = '5px 10px';
        prevStepBtn.style.backgroundColor = '#3498db';
        prevStepBtn.style.color = 'white';
        prevStepBtn.style.border = 'none';
        prevStepBtn.style.borderRadius = '4px';
        prevStepBtn.style.cursor = 'pointer';
        prevStepBtn.addEventListener('click', () => this.previousExecutionStep());
        
        const stepIndicator = document.createElement('div');
        stepIndicator.className = 'step-indicator';
        stepIndicator.style.flex = '1';
        stepIndicator.style.textAlign = 'center';
        stepIndicator.style.fontSize = '12px';
        stepIndicator.textContent = 'Step 0/0';
        
        const nextStepBtn = document.createElement('button');
        nextStepBtn.className = 'step-btn';
        nextStepBtn.innerHTML = '▶';
        nextStepBtn.title = 'Next Step';
        nextStepBtn.style.padding = '5px 10px';
        nextStepBtn.style.backgroundColor = '#3498db';
        nextStepBtn.style.color = 'white';
        nextStepBtn.style.border = 'none';
        nextStepBtn.style.borderRadius = '4px';
        nextStepBtn.style.cursor = 'pointer';
        nextStepBtn.addEventListener('click', () => this.nextExecutionStep());
        
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-btn';
        resetBtn.innerHTML = '↺';
        resetBtn.title = 'Reset Execution';
        resetBtn.style.padding = '5px 10px';
        resetBtn.style.backgroundColor = '#e74c3c';
        resetBtn.style.color = 'white';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '4px';
        resetBtn.style.cursor = 'pointer';
        resetBtn.addEventListener('click', () => this.resetExecution());
        
        // Add controls to container
        stepControls.appendChild(prevStepBtn);
        stepControls.appendChild(stepIndicator);
        stepControls.appendChild(nextStepBtn);
        stepControls.appendChild(resetBtn);
        
        // Create execution history panel
        const historyPanel = document.createElement('div');
        historyPanel.className = 'execution-history-panel';
        historyPanel.style.display = 'none'; // Initially hidden
        historyPanel.style.backgroundColor = 'white';
        historyPanel.style.border = '1px solid #ddd';
        historyPanel.style.borderRadius = '4px';
        historyPanel.style.padding = '10px';
        historyPanel.style.maxHeight = '200px';
        historyPanel.style.overflowY = 'auto';
        
        // Add controls to workflow container
        workflowControls.appendChild(executeContainer);
        workflowControls.appendChild(stepControls);
        workflowControls.appendChild(historyPanel);
        
        // Add to document
        const graphContainer = document.getElementById('cy');
        const controlsContainer = document.querySelector('.graph-controls');
        
        if (controlsContainer) {
            controlsContainer.appendChild(workflowControls);
        } else {
            const newControlsContainer = document.createElement('div');
            newControlsContainer.className = 'graph-controls';
            newControlsContainer.appendChild(workflowControls);
            graphContainer.parentNode.appendChild(newControlsContainer);
        }
        
        // Store references to controls
        this.executeBtn = executeBtn;
        this.stepControls = stepControls;
        this.stepIndicator = stepIndicator;
        this.prevStepBtn = prevStepBtn;
        this.nextStepBtn = nextStepBtn;
        this.historyPanel = historyPanel;
    }

    handleExecuteOption(optionId) {
        switch (optionId) {
            case 'execute-all':
                this.executeWorkflow();
                break;
            case 'execute-selected':
                this.executeSelectedNode();
                break;
            case 'execute-path':
                this.executePathToSelected();
                break;
            case 'validate-workflow':
                this.validateWorkflow();
                break;
        }
    }

    async executeWorkflow() {
        if (this.isExecuting) return;
        
        // Get the current graph ID from localStorage
        const graphId = localStorage.getItem('aiCanvas_lastGraphId');
        
        if (!graphId) {
            this.showNotification('Please save the graph first before executing the workflow.', 'warning');
            return;
        }
        
        // Show execution in progress
        this.isExecuting = true;
        this.executeBtn.textContent = 'Executing...';
        this.executeBtn.disabled = true;
        
        // Reset previous execution state
        this.resetExecutionState();
        
        // Create a modal to show execution progress
        this.showExecutionProgressModal('Analyzing graph and determining execution order...');
        
        try {
            // Execute the workflow
            const response = await fetch(`/api/graphs/${graphId}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.executionOrder = data.data.execution_order;
                this.executionResults = data.data.results;
                
                // Update progress dialog with execution results
                this.updateExecutionProgressModal(data.data);
                
                // Visualize the execution path
                this.visualizeExecutionPath();
                
                // Add to execution history
                this.addExecutionToHistory({
                    timestamp: new Date().toISOString(),
                    type: 'full',
                    status: 'success',
                    order: this.executionOrder,
                    results: this.executionResults
                });
                
            } else {
                this.updateExecutionProgressModal(null, data.message);
                
                // Add to execution history
                this.addExecutionToHistory({
                    timestamp: new Date().toISOString(),
                    type: 'full',
                    status: 'error',
                    error: data.message
                });
            }
        } catch (error) {
            console.error('Error executing workflow:', error);
            
            this.updateExecutionProgressModal(null, error.message);
            
            // Add to execution history
            this.addExecutionToHistory({
                timestamp: new Date().toISOString(),
                type: 'full',
                status: 'error',
                error: error.message
            });
        } finally {
            // Reset button
            this.executeBtn.textContent = 'Execute Workflow';
            this.executeBtn.disabled = false;
            this.isExecuting = false;
        }
    }

    async executeSelectedNode() {
        const selectedNodes = this.cy.$('node.selected');
        if (selectedNodes.length === 0) {
            this.showNotification('Please select a node to execute.', 'warning');
            return;
        }
        
        const nodeId = selectedNodes[0].id();
        
        // Show execution in progress
        this.isExecuting = true;
        this.executeBtn.textContent = 'Executing...';
        this.executeBtn.disabled = true;
        
        // Create a modal to show execution progress
        this.showExecutionProgressModal(`Executing node: ${selectedNodes[0].data('name')}...`);
        
        try {
            // Execute the node
            const response = await fetch(`/api/nodes/${nodeId}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Update progress dialog with execution results
                const result = {
                    execution_order: [nodeId],
                    results: { [nodeId]: data.data.result }
                };
                
                this.executionOrder = [nodeId];
                this.executionResults = { [nodeId]: data.data.result };
                
                this.updateExecutionProgressModal(result);
                
                // Highlight the executed node
                this.cy.elements().removeClass('execution-active execution-completed');
                selectedNodes[0].addClass('execution-completed');
                
                // Add to execution history
                this.addExecutionToHistory({
                    timestamp: new Date().toISOString(),
                    type: 'single',
                    nodeId: nodeId,
                    nodeName: selectedNodes[0].data('name'),
                    status: 'success',
                    result: data.data.result
                });
                
            } else {
                this.updateExecutionProgressModal(null, data.message);
                
                // Add to execution history
                this.addExecutionToHistory({
                    timestamp: new Date().toISOString(),
                    type: 'single',
                    nodeId: nodeId,
                    nodeName: selectedNodes[0].data('name'),
                    status: 'error',
                    error: data.message
                });
            }
        } catch (error) {
            console.error('Error executing node:', error);
            
            this.updateExecutionProgressModal(null, error.message);
            
            // Add to execution history
            this.addExecutionToHistory({
                timestamp: new Date().toISOString(),
                type: 'single',
                nodeId: nodeId,
                nodeName: selectedNodes[0].data('name'),
                status: 'error',
                error: error.message
            });
        } finally {
            // Reset button
            this.executeBtn.textContent = 'Execute Workflow';
            this.executeBtn.disabled = false;
            this.isExecuting = false;
        }
    }

    async executePathToSelected() {
        const selectedNodes = this.cy.$('node.selected');
        if (selectedNodes.length === 0) {
            this.showNotification('Please select a target node.', 'warning');
            return;
        }
        
        const targetNodeId = selectedNodes[0].id();
        const graphId = localStorage.getItem('aiCanvas_lastGraphId');
        
        if (!graphId) {
            this.showNotification('Please save the graph first.', 'warning');
            return;
        }
        
        // Show execution in progress
        this.isExecuting = true;
        this.executeBtn.textContent = 'Executing...';
        this.executeBtn.disabled = true;
        
        // Create a modal to show execution progress
        this.showExecutionProgressModal(`Determining path to node: ${selectedNodes[0].data('name')}...`);
        
        try {
            // Get execution order first
            const orderResponse = await fetch(`/api/graphs/${graphId}/execution-order`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const orderData = await orderResponse.json();
            
            if (orderData.status !== 'success') {
                throw new Error(orderData.message || 'Failed to determine execution order');
            }
            
            // Filter execution order to include only nodes up to the target
            const fullOrder = orderData.data.execution_order;
            const targetIndex = fullOrder.indexOf(targetNodeId);
            
            if (targetIndex === -1) {
                throw new Error('Selected node is not in the execution path');
            }
            
            const pathOrder = fullOrder.slice(0, targetIndex + 1);
            
            // Execute each node in the path
            const results = {};
            
            for (const nodeId of pathOrder) {
                const nodeName = this.cy.$(`#${nodeId}`).data('name');
                this.updateExecutionProgressModal(null, null, `Executing node: ${nodeName}...`);
                
                const response = await fetch(`/api/nodes/${nodeId}/execute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    results[nodeId] = data.data.result;
                } else {
                    results[nodeId] = `Error: ${data.message}`;
                }
            }
            
            // Update execution state
            this.executionOrder = pathOrder;
            this.executionResults = results;
            
            // Update progress dialog with execution results
            this.updateExecutionProgressModal({
                execution_order: pathOrder,
                results: results
            });
            
            // Visualize the execution path
            this.visualizeExecutionPath();
            
            // Add to execution history
            this.addExecutionToHistory({
                timestamp: new Date().toISOString(),
                type: 'path',
                targetNodeId: targetNodeId,
                targetNodeName: selectedNodes[0].data('name'),
                status: 'success',
                order: pathOrder,
                results: results
            });
            
        } catch (error) {
            console.error('Error executing path:', error);
            
            this.updateExecutionProgressModal(null, error.message);
            
            // Add to execution history
            this.addExecutionToHistory({
                timestamp: new Date().toISOString(),
                type: 'path',
                targetNodeId: targetNodeId,
                targetNodeName: selectedNodes[0].data('name'),
                status: 'error',
                error: error.message
            });
        } finally {
            // Reset button
            this.executeBtn.textContent = 'Execute Workflow';
            this.executeBtn.disabled = false;
            this.isExecuting = false;
        }
    }

    async validateWorkflow() {
        const graphId = localStorage.getItem('aiCanvas_lastGraphId');
        
        if (!graphId) {
            this.showNotification('Please save the graph first.', 'warning');
            return;
        }
        
        // Show validation in progress
        this.executeBtn.textContent = 'Validating...';
        this.executeBtn.disabled = true;
        
        try {
            // Validate the workflow
            const response = await fetch(`/api/graphs/${graphId}/validate`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.showNotification('Workflow is valid and can be executed.', 'success');
                
                // Add to execution history
                this.addExecutionToHistory({
                    timestamp: new Date().toISOString(),
                    type: 'validation',
                    status: 'success',
                    message: 'Workflow is valid'
                });
            } else {
                // Show validation errors
                this.showValidationErrorsModal(data);
                
                // Add to execution history
                this.addExecutionToHistory({
                    timestamp: new Date().toISOString(),
                    type: 'validation',
                    status: 'error',
                    error: data.message,
                    details: data.data
                });
            }
        } catch (error) {
            console.error('Error validating workflow:', error);
            this.showNotification(`Validation error: ${error.message}`, 'error');
            
            // Add to execution history
            this.addExecutionToHistory({
                timestamp: new Date().toISOString(),
                type: 'validation',
                status: 'error',
                error: error.message
            });
        } finally {
            // Reset button
            this.executeBtn.textContent = 'Execute Workflow';
            this.executeBtn.disabled = false;
        }
    }

    showExecutionProgressModal(initialMessage) {
        // Create or get existing modal
        let progressOverlay = document.querySelector('.execution-overlay');
        
        if (!progressOverlay) {
            progressOverlay = document.createElement('div');
            progressOverlay.className = 'execution-overlay';
            progressOverlay.style.position = 'fixed';
            progressOverlay.style.top = '0';
            progressOverlay.style.left = '0';
            progressOverlay.style.width = '100%';
            progressOverlay.style.height = '100%';
            progressOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            progressOverlay.style.zIndex = '1000';
            progressOverlay.style.display = 'flex';
            progressOverlay.style.justifyContent = 'center';
            progressOverlay.style.alignItems = 'center';
            
            const progressDialog = document.createElement('div');
            progressDialog.className = 'execution-dialog';
            progressDialog.style.backgroundColor = 'white';
            progressDialog.style.padding = '20px';
            progressDialog.style.borderRadius = '8px';
            progressDialog.style.maxWidth = '700px';
            progressDialog.style.width = '90%';
            progressDialog.style.maxHeight = '80vh';
            progressDialog.style.overflowY = 'auto';
            progressDialog.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
            
            const progressTitle = document.createElement('h2');
            progressTitle.textContent = 'Workflow Execution Progress';
            progressTitle.style.margin = '0 0 15px 0';
            progressTitle.style.fontSize = '18px';
            progressTitle.style.borderBottom = '1px solid #eee';
            progressTitle.style.paddingBottom = '10px';
            progressDialog.appendChild(progressTitle);
            
            const progressContent = document.createElement('div');
            progressContent.className = 'execution-content';
            progressContent.style.margin = '15px 0';
            progressContent.innerHTML = `<p>${initialMessage}</p>`;
            progressDialog.appendChild(progressContent);
            
            progressOverlay.appendChild(progressDialog);
            document.body.appendChild(progressOverlay);
        } else {
            const progressContent = progressOverlay.querySelector('.execution-content');
            progressContent.innerHTML = `<p>${initialMessage}</p>`;
            progressOverlay.style.display = 'flex';
        }
    }

    updateExecutionProgressModal(executionData, errorMessage = null, statusMessage = null) {
        const progressOverlay = document.querySelector('.execution-overlay');
        if (!progressOverlay) return;
        
        const progressContent = progressOverlay.querySelector('.execution-content');
        
        if (statusMessage) {
            progressContent.innerHTML = `<p>${statusMessage}</p>`;
            return;
        }
        
        if (errorMessage) {
            progressContent.innerHTML = `
                <div class="error" style="color: #e74c3c; padding: 10px; background-color: #fdf3f2; border-radius: 4px; margin-bottom: 15px;">
                    <p style="margin: 0;"><strong>Error:</strong> ${errorMessage}</p>
                </div>
                <div class="dialog-actions" style="display: flex; justify-content: flex-end; margin-top: 20px;">
                    <button id="close-progress-btn" style="padding: 8px 15px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
            `;
            
            // Add event listener to close button
            setTimeout(() => {
                document.getElementById('close-progress-btn').addEventListener('click', () => {
                    progressOverlay.style.display = 'none';
                });
            }, 0);
            
            return;
        }
        
        if (!executionData) return;
        
        // Update progress dialog with execution results
        let resultHtml = '<h3 style="margin: 15px 0 10px 0; font-size: 16px;">Execution Order:</h3>';
        resultHtml += '<ol style="margin: 0 0 20px 0; padding-left: 25px;">';
        
        executionData.execution_order.forEach(nodeId => {
            const node = this.cy.$(`#${nodeId}`);
            const nodeName = node.length > 0 ? node.data('name') : nodeId;
            resultHtml += `<li style="margin-bottom: 5px;"><strong>${nodeName}</strong></li>`;
        });
        
        resultHtml += '</ol>';
        
        resultHtml += '<h3 style="margin: 15px 0 10px 0; font-size: 16px;">Results:</h3>';
        resultHtml += '<div class="execution-results" style="display: flex; flex-direction: column; gap: 15px;">';
        
        Object.keys(executionData.results).forEach(nodeId => {
            const node = this.cy.$(`#${nodeId}`);
            const nodeName = node.length > 0 ? node.data('name') : nodeId;
            const result = executionData.results[nodeId];
            const isError = typeof result === 'string' && result.startsWith('Error:');
            
            resultHtml += `
                <div class="execution-result" style="border: 1px solid ${isError ? '#f5d0d0' : '#ddd'}; border-radius: 6px; overflow: hidden;">
                    <div style="padding: 10px 15px; background-color: ${isError ? '#fdf3f2' : '#f8f9fa'}; border-bottom: 1px solid ${isError ? '#f5d0d0' : '#eee'};">
                        <h4 style="margin: 0; font-size: 14px; color: ${isError ? '#e74c3c' : '#333'};">${nodeName}</h4>
                    </div>
                    <div class="result-content" style="padding: 12px 15px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap; background-color: ${isError ? '#fff9f9' : 'white'};">
                        ${isError ? 
                            `<span style="color: #e74c3c;">${result}</span>` : 
                            result}
                    </div>
                </div>
            `;
        });
        
        resultHtml += '</div>';
        
        // Add step execution controls
        resultHtml += `
            <div class="step-execution-controls" style="display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px;">
                <button id="start-step-execution" style="padding: 8px 15px; background-color: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">Step Through Execution</button>
                <button id="close-progress-btn" style="padding: 8px 15px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
        `;
        
        progressContent.innerHTML = resultHtml;
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('close-progress-btn').addEventListener('click', () => {
                progressOverlay.style.display = 'none';
            });
            
            document.getElementById('start-step-execution').addEventListener('click', () => {
                progressOverlay.style.display = 'none';
                this.startStepExecution();
            });
        }, 0);
    }

    showValidationErrorsModal(validationData) {
        // Create modal
        const overlay = document.createElement('div');
        overlay.className = 'validation-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '1000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        
        const dialog = document.createElement('div');
        dialog.className = 'validation-dialog';
        dialog.style.backgroundColor = 'white';
        dialog.style.padding = '20px';
        dialog.style.borderRadius = '8px';
        dialog.style.maxWidth = '600px';
        dialog.style.width = '90%';
        dialog.style.maxHeight = '80vh';
        dialog.style.overflowY = 'auto';
        dialog.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        
        const title = document.createElement('h2');
        title.textContent = 'Workflow Validation';
        title.style.margin = '0 0 15px 0';
        title.style.fontSize = '18px';
        title.style.borderBottom = '1px solid #eee';
        title.style.paddingBottom = '10px';
        dialog.appendChild(title);
        
        const content = document.createElement('div');
        content.className = 'validation-content';
        
        // Add error message
        const errorBox = document.createElement('div');
        errorBox.style.padding = '10px 15px';
        errorBox.style.backgroundColor = '#fdf3f2';
        errorBox.style.border = '1px solid #f5d0d0';
        errorBox.style.borderRadius = '4px';
        errorBox.style.marginBottom = '15px';
        errorBox.style.color = '#e74c3c';
        
        errorBox.innerHTML = `
            <p style="margin: 0 0 10px 0;"><strong>Error:</strong> ${validationData.message}</p>
        `;
        
        content.appendChild(errorBox);
        
        // Add cycle information if available
        if (validationData.data && validationData.data.cycles) {
            const cyclesInfo = document.createElement('div');
            cyclesInfo.style.marginTop = '15px';
            
            cyclesInfo.innerHTML = `
                <h3 style="margin: 0 0 10px 0; font-size: 16px;">Cycles Detected:</h3>
                <p style="margin: 0 0 10px 0;">The following cycles were found in your workflow:</p>
            `;
            
            const cyclesList = document.createElement('ul');
            cyclesList.style.paddingLeft = '20px';
            cyclesList.style.margin = '0 0 15px 0';
            
            validationData.data.cycles.forEach((cycle, index) => {
                const cycleItem = document.createElement('li');
                cycleItem.style.marginBottom = '10px';
                
                let cycleText = `<strong>Cycle ${index + 1}:</strong> `;
                cycleText += cycle.map(node => node.name).join(' → ');
                cycleText += ` → ${cycle[0].name}`;
                
                cycleItem.innerHTML = cycleText;
                cyclesList.appendChild(cycleItem);
            });
            
            cyclesInfo.appendChild(cyclesList);
            content.appendChild(cyclesInfo);
            
            // Add suggestion
            const suggestion = document.createElement('div');
            suggestion.style.backgroundColor = '#f8f9fa';
            suggestion.style.padding = '10px 15px';
            suggestion.style.borderRadius = '4px';
            suggestion.style.marginTop = '15px';
            
            suggestion.innerHTML = `
                <p style="margin: 0;"><strong>Suggestion:</strong> To fix this issue, you need to break the cycles by removing or redirecting some connections. Workflows must be acyclic (no loops) to be executed sequentially.</p>
            `;
            
            content.appendChild(suggestion);
        }
        
        // Add close button
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';
        actions.style.marginTop = '20px';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.padding = '8px 15px';
        closeBtn.style.backgroundColor = '#3498db';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '4px';
        closeBtn.style.cursor = 'pointer';
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        actions.appendChild(closeBtn);
        
        dialog.appendChild(content);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'workflow-notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '1000';
        notification.style.maxWidth = '300px';
        notification.style.fontWeight = 'bold';
        
        // Set style based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#27ae60';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#e74c3c';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f39c12';
                notification.style.color = 'white';
                break;
            default:
                notification.style.backgroundColor = '#3498db';
                notification.style.color = 'white';
        }
        
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    visualizeExecutionPath() {
        // Reset any previous visualization
        this.cy.elements().removeClass('execution-path execution-active execution-completed');
        
        // Add execution path class to edges in the execution order
        for (let i = 0; i < this.executionOrder.length - 1; i++) {
            const sourceId = this.executionOrder[i];
            const targetId = this.executionOrder[i + 1];
            
            // Find edges between these nodes
            const edges = this.cy.edges(`[source = "${sourceId}"][target = "${targetId}"]`);
            edges.addClass('execution-path');
        }
        
        // Highlight all nodes in the execution path with different colors based on node type
        this.executionOrder.forEach(nodeId => {
            const node = this.cy.$(`#${nodeId}`);
            if (node.length > 0) {
                // Add a class based on the node's backend
                const backend = node.data('backend');
                if (backend === 'ollama') {
                    node.addClass('ollama-execution-node');
                } else if (backend === 'groq') {
                    node.addClass('groq-execution-node');
                }
            }
        });
    }

    startStepExecution() {
        // Show step controls
        this.stepControls.style.display = 'flex';
        
        // Reset execution state
        this.executionStep = 0;
        this.cy.elements().removeClass('execution-active execution-completed');
        
        // Show first step
        this.showExecutionStep(0);
        
        // Update button states
        this.updateStepButtons();
    }

    showExecutionStep(step) {
        if (step < 0 || step >= this.executionOrder.length) return;
        
        // Reset active state
        this.cy.elements().removeClass('execution-active');
        
        // Mark all previous steps as completed
        for (let i = 0; i < step; i++) {
            const nodeId = this.executionOrder[i];
            this.cy.$(`#${nodeId}`).addClass('execution-completed');
        }
        
        // Mark current step as active
        const currentNodeId = this.executionOrder[step];
        this.cy.$(`#${currentNodeId}`).addClass('execution-active');
        
        // Center on the active node
        this.cy.center(this.cy.$(`#${currentNodeId}`));
        
        // Show the result for this node
        this.showNodeResult(currentNodeId);
        
        // Highlight the active execution path
        this.cy.edges().removeClass('active-execution-path');
        if (step > 0) {
            const prevNodeId = this.executionOrder[step - 1];
            const edges = this.cy.edges(`[source = "${prevNodeId}"][target = "${currentNodeId}"]`);
            edges.addClass('active-execution-path');
        }
        
        // Update step indicator
        this.stepIndicator.textContent = `Step ${step + 1}/${this.executionOrder.length}`;
    }

    showNodeResult(nodeId) {
        const result = this.executionResults[nodeId];
        if (!result) return;
        
        // Create or update result tooltip
        let tooltip = document.getElementById('execution-result-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'execution-result-tooltip';
            tooltip.className = 'execution-result-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'white';
            tooltip.style.borderRadius = '4px';
            tooltip.style.padding = '10px';
            tooltip.style.maxWidth = '300px';
            tooltip.style.zIndex = '1000';
            tooltip.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            document.body.appendChild(tooltip);
        }
        
        // Get node position
        const node = this.cy.$(`#${nodeId}`);
        const position = node.renderedPosition();
        
        // Get node name
        const nodeName = node.data('name') || nodeId;
        
        // Set tooltip content and position
        tooltip.innerHTML = `
            <h4 style="margin: 0 0 5px 0; font-size: 14px;">${nodeName}</h4>
            <div class="result-content" style="max-height: 150px; overflow-y: auto; font-size: 12px; white-space: pre-wrap; font-family: monospace;">
                ${result.startsWith('Error:') ? 
                    `<span style="color: #e74c3c;">${result}</span>` : 
                    result}
            </div>
        `;
        
        tooltip.style.left = `${position.x}px`;
        tooltip.style.top = `${position.y - 120}px`;
        tooltip.style.display = 'block';
    }

    nextExecutionStep() {
        if (this.executionStep < this.executionOrder.length - 1) {
            this.executionStep++;
            this.showExecutionStep(this.executionStep);
            this.updateStepButtons();
        }
    }

    previousExecutionStep() {
        if (this.executionStep > 0) {
            this.executionStep--;
            this.showExecutionStep(this.executionStep);
            this.updateStepButtons();
        }
    }

    updateStepButtons() {
        this.prevStepBtn.disabled = this.executionStep === 0;
        this.nextStepBtn.disabled = this.executionStep === this.executionOrder.length - 1;
        
        // Update button styles
        if (this.executionStep === 0) {
            this.prevStepBtn.style.opacity = '0.5';
            this.prevStepBtn.style.cursor = 'not-allowed';
        } else {
            this.prevStepBtn.style.opacity = '1';
            this.prevStepBtn.style.cursor = 'pointer';
        }
        
        if (this.executionStep === this.executionOrder.length - 1) {
            this.nextStepBtn.style.opacity = '0.5';
            this.nextStepBtn.style.cursor = 'not-allowed';
        } else {
            this.nextStepBtn.style.opacity = '1';
            this.nextStepBtn.style.cursor = 'pointer';
        }
    }

    resetExecution() {
        // Hide step controls
        this.stepControls.style.display = 'none';
        
        // Reset visualization
        this.cy.elements().removeClass('execution-path execution-active execution-completed active-execution-path');
        this.cy.elements().removeClass('ollama-execution-node groq-execution-node');
        
        // Hide result tooltip
        const tooltip = document.getElementById('execution-result-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        
        // Reset state
        this.resetExecutionState();
    }

    resetExecutionState() {
        this.executionOrder = [];
        this.executionResults = {};
        this.executionStep = 0;
    }

    addExecutionToHistory(executionData) {
        // Add to history array
        this.executionHistory.unshift(executionData);
        
        // Limit history size
        if (this.executionHistory.length > 10) {
            this.executionHistory.pop();
        }
        
        // Update history panel
        this.updateHistoryPanel();
    }

    updateHistoryPanel() {
        if (!this.historyPanel) return;
        
        // Clear current content
        this.historyPanel.innerHTML = '';
        
        // Add title
        const title = document.createElement('div');
        title.textContent = 'Execution History';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        this.historyPanel.appendChild(title);
        
        // Add history items
        if (this.executionHistory.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.textContent = 'No execution history yet';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.color = '#666';
            this.historyPanel.appendChild(emptyMessage);
            return;
        }
        
        const historyList = document.createElement('div');
        historyList.style.display = 'flex';
        historyList.style.flexDirection = 'column';
        historyList.style.gap = '8px';
        
        this.executionHistory.forEach((execution, index) => {
            const item = document.createElement('div');
            item.style.padding = '8px';
            item.style.borderRadius = '4px';
            item.style.backgroundColor = execution.status === 'success' ? '#f1f9f1' : '#fdf3f2';
            item.style.borderLeft = `3px solid ${execution.status === 'success' ? '#27ae60' : '#e74c3c'}`;
            
            // Format timestamp
            const timestamp = new Date(execution.timestamp);
            const timeString = timestamp.toLocaleTimeString();
            
            // Create content based on execution type
            let content = '';
            
            switch (execution.type) {
                case 'full':
                    content = `<strong>Full Workflow Execution</strong> at ${timeString}`;
                    if (execution.status === 'success') {
                        content += ` (${execution.order.length} nodes)`;
                    } else {
                        content += ` - Error: ${execution.error}`;
                    }
                    break;
                    
                case 'single':
                    content = `<strong>Single Node Execution:</strong> ${execution.nodeName} at ${timeString}`;
                    if (execution.status === 'error') {
                        content += ` - Error: ${execution.error}`;
                    }
                    break;
                    
                case 'path':
                    content = `<strong>Path Execution</strong> to ${execution.targetNodeName} at ${timeString}`;
                    if (execution.status === 'success') {
                        content += ` (${execution.order.length} nodes)`;
                    } else {
                        content += ` - Error: ${execution.error}`;
                    }
                    break;
                    
                case 'validation':
                    content = `<strong>Workflow Validation</strong> at ${timeString}`;
                    if (execution.status === 'success') {
                        content += ` - ${execution.message}`;
                    } else {
                        content += ` - Error: ${execution.error}`;
                    }
                    break;
            }
            
            item.innerHTML = content;
            
            // Add click handler to replay execution
            if (execution.status === 'success' && (execution.type === 'full' || execution.type === 'path')) {
                item.style.cursor = 'pointer';
                
                item.addEventListener('click', () => {
                    this.replayExecution(execution);
                });
                
                // Add hint
                const hint = document.createElement('div');
                hint.textContent = 'Click to replay';
                hint.style.fontSize = '10px';
                hint.style.color = '#666';
                hint.style.marginTop = '3px';
                item.appendChild(hint);
            }
            
            historyList.appendChild(item);
        });
        
        this.historyPanel.appendChild(historyList);
    }

    replayExecution(execution) {
        // Set execution state
        this.executionOrder = execution.order;
        this.executionResults = execution.results;
        
        // Visualize execution path
        this.visualizeExecutionPath();
        
        // Start step execution
        this.startStepExecution();
    }

    // Method to get node data by ID
    getNodeData(nodeId) {
        const node = this.cy.$(`#${nodeId}`);
        if (node.length === 0) return null;
        
        return {
            id: nodeId,
            name: node.data('name'),
            backend: node.data('backend'),
            model: node.data('model'),
            systemMessage: node.data('systemMessage'),
            temperature: node.data('temperature'),
            maxTokens: node.data('maxTokens')
        };
    }
}