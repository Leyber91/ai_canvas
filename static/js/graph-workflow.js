/**
 * graph-workflow.js - Workflow execution and visualization features for Cytoscape.js graph visualization
 */

class GraphWorkflow {
    constructor(graphCore) {
        this.graphCore = graphCore;
        this.cy = graphCore.cy;
        this.executionOrder = [];
        this.executionResults = {};
        this.isExecuting = false;
        this.executionStep = 0;
    }

    init() {
        this.createWorkflowControls();
    }

    createWorkflowControls() {
        // Create workflow controls container
        const workflowControls = document.createElement('div');
        workflowControls.className = 'workflow-controls';
        
        // Create execute button
        const executeBtn = document.createElement('button');
        executeBtn.className = 'execute-workflow-btn';
        executeBtn.textContent = 'Execute Workflow';
        executeBtn.addEventListener('click', () => this.executeWorkflow());
        
        // Create step execution controls
        const stepControls = document.createElement('div');
        stepControls.className = 'step-controls';
        stepControls.style.display = 'none'; // Initially hidden
        
        const prevStepBtn = document.createElement('button');
        prevStepBtn.className = 'step-btn';
        prevStepBtn.textContent = 'Previous Step';
        prevStepBtn.addEventListener('click', () => this.previousExecutionStep());
        
        const nextStepBtn = document.createElement('button');
        nextStepBtn.className = 'step-btn';
        nextStepBtn.textContent = 'Next Step';
        nextStepBtn.addEventListener('click', () => this.nextExecutionStep());
        
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-btn';
        resetBtn.textContent = 'Reset Execution';
        resetBtn.addEventListener('click', () => this.resetExecution());
        
        // Add controls to container
        stepControls.appendChild(prevStepBtn);
        stepControls.appendChild(nextStepBtn);
        stepControls.appendChild(resetBtn);
        
        workflowControls.appendChild(executeBtn);
        workflowControls.appendChild(stepControls);
        
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
        this.prevStepBtn = prevStepBtn;
        this.nextStepBtn = nextStepBtn;
    }

    async executeWorkflow() {
        if (this.isExecuting) return;
        
        // Get the current graph ID from localStorage
        const graphId = localStorage.getItem('aiCanvas_lastGraphId');
        
        if (!graphId) {
            alert('Please save the graph first before executing the workflow.');
            return;
        }
        
        // Show execution in progress
        this.isExecuting = true;
        this.executeBtn.textContent = 'Executing...';
        this.executeBtn.disabled = true;
        
        // Reset previous execution state
        this.resetExecutionState();
        
        // Create a modal to show execution progress
        const progressOverlay = document.createElement('div');
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
        progressDialog.style.borderRadius = '5px';
        progressDialog.style.maxWidth = '600px';
        progressDialog.style.width = '90%';
        progressDialog.style.maxHeight = '80vh';
        progressDialog.style.overflowY = 'auto';
        
        const progressTitle = document.createElement('h2');
        progressTitle.textContent = 'Workflow Execution Progress';
        progressDialog.appendChild(progressTitle);
        
        const progressContent = document.createElement('div');
        progressContent.className = 'execution-content';
        progressContent.style.margin = '15px 0';
        progressContent.innerHTML = '<p>Analyzing graph and determining execution order...</p>';
        progressDialog.appendChild(progressContent);
        
        progressOverlay.appendChild(progressDialog);
        document.body.appendChild(progressOverlay);
        
        try {
            // Execute the workflow
            const response = await fetch(`/api/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ graph_id: graphId })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.executionOrder = data.data.execution_order;
                this.executionResults = data.data.results;
                
                // Update progress dialog with execution results
                let resultHtml = '<h3>Execution Order:</h3>';
                resultHtml += '<ol>';
                
                this.executionOrder.forEach(nodeId => {
                    const node = this.graphCore.getNodeData(nodeId);
                    resultHtml += `<li><strong>${node ? node.name : nodeId}</strong></li>`;
                });
                
                resultHtml += '</ol>';
                
                resultHtml += '<h3>Results:</h3>';
                resultHtml += '<div class="execution-results">';
                
                Object.keys(this.executionResults).forEach(nodeId => {
                    const node = this.graphCore.getNodeData(nodeId);
                    const result = this.executionResults[nodeId];
                    
                    resultHtml += `
                        <div class="execution-result">
                            <h4>${node ? node.name : nodeId}</h4>
                            <div class="result-content">
                                ${result.startsWith('Error:') ? 
                                    `<span class="error">${result}</span>` : 
                                    result}
                            </div>
                        </div>
                    `;
                });
                
                resultHtml += '</div>';
                
                // Add step execution controls
                resultHtml += `
                    <div class="step-execution-controls">
                        <button id="start-step-execution">Step Through Execution</button>
                    </div>
                `;
                
                // Add a close button
                resultHtml += `
                    <div class="dialog-actions">
                        <button id="close-progress-btn">Close</button>
                    </div>
                `;
                
                progressContent.innerHTML = resultHtml;
                
                // Add event listener to close button
                document.getElementById('close-progress-btn').addEventListener('click', () => {
                    document.body.removeChild(progressOverlay);
                });
                
                // Add event listener to step execution button
                document.getElementById('start-step-execution').addEventListener('click', () => {
                    document.body.removeChild(progressOverlay);
                    this.startStepExecution();
                });
                
                // Visualize the execution path
                this.visualizeExecutionPath();
                
            } else {
                progressContent.innerHTML = `
                    <div class="error">
                        <p>Error executing workflow: ${data.message}</p>
                    </div>
                    <div class="dialog-actions">
                        <button id="close-progress-btn">Close</button>
                    </div>
                `;
                
                document.getElementById('close-progress-btn').addEventListener('click', () => {
                    document.body.removeChild(progressOverlay);
                });
            }
        } catch (error) {
            console.error('Error executing workflow:', error);
            
            progressContent.innerHTML = `
                <div class="error">
                    <p>Error executing workflow: ${error.message}</p>
                </div>
                <div class="dialog-actions">
                    <button id="close-progress-btn">Close</button>
                </div>
            `;
            
            document.getElementById('close-progress-btn').addEventListener('click', () => {
                document.body.removeChild(progressOverlay);
            });
        } finally {
            // Reset button
            this.executeBtn.textContent = 'Execute Workflow';
            this.executeBtn.disabled = false;
            this.isExecuting = false;
        }
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
        
        // Update timeline
        if (this.graphCore.graphManager && this.graphCore.graphManager.navigation) {
            this.graphCore.graphManager.navigation.updateTimeline(this.executionOrder, this.executionStep);
        }
        
        // Add event listener for timeline step selection
        document.addEventListener('timelineStepSelected', this.handleTimelineStepSelection.bind(this));
    }
    
    handleTimelineStepSelection(event) {
        const { step } = event.detail;
        this.executionStep = step;
        this.showExecutionStep(step);
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
            document.body.appendChild(tooltip);
        }
        
        // Get node position
        const node = this.cy.$(`#${nodeId}`);
        const position = node.renderedPosition();
        
        // Set tooltip content and position
        tooltip.innerHTML = `
            <h4>${node.data('name')}</h4>
            <div class="result-content">
                ${result.startsWith('Error:') ? 
                    `<span class="error">${result}</span>` : 
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
            
            // Update timeline
            if (this.graphCore.graphManager && this.graphCore.graphManager.navigation) {
                this.graphCore.graphManager.navigation.updateTimeline(this.executionOrder, this.executionStep);
            }
        }
    }

    previousExecutionStep() {
        if (this.executionStep > 0) {
            this.executionStep--;
            this.showExecutionStep(this.executionStep);
            this.updateStepButtons();
            
            // Update timeline
            if (this.graphCore.graphManager && this.graphCore.graphManager.navigation) {
                this.graphCore.graphManager.navigation.updateTimeline(this.executionOrder, this.executionStep);
            }
        }
    }

    updateStepButtons() {
        this.prevStepBtn.disabled = this.executionStep === 0;
        this.nextStepBtn.disabled = this.executionStep === this.executionOrder.length - 1;
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
        
        // Hide timeline
        if (this.graphCore.graphManager && this.graphCore.graphManager.navigation) {
            const timelineContainer = this.graphCore.graphManager.navigation.timelineContainer;
            if (timelineContainer) {
                timelineContainer.style.display = 'none';
            }
        }
        
        // Remove timeline event listener
        document.removeEventListener('timelineStepSelected', this.handleTimelineStepSelection);
        
        // Reset state
        this.resetExecutionState();
    }

    resetExecutionState() {
        this.executionOrder = [];
        this.executionResults = {};
        this.executionStep = 0;
    }
}

// Export the GraphWorkflow
window.GraphWorkflow = GraphWorkflow;
