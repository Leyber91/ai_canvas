/**
 * App.js - Main application file
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    window.graphManager = new GraphManager();
    window.conversationManager = new ConversationManager();
    
    // Available models
    let availableModels = {
        ollama: [],
        groq: []
    };
    
    // DOM elements
    const addNodeBtn = document.getElementById('add-node-btn');
    const saveGraphBtn = document.getElementById('save-graph-btn');
    const loadGraphBtn = document.getElementById('load-graph-btn');
    const nodeModal = document.getElementById('node-modal');
    const nodeForm = document.getElementById('node-form');
    const closeModalBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-btn');
    const temperatureInput = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperature-value');
    const backendSelect = document.getElementById('backend-select');
    const modelSelect = document.getElementById('model-select');
    
    // Fetch available models
    fetchAvailableModels();
    
    // Event listeners
    addNodeBtn.addEventListener('click', showNodeModal);
    saveGraphBtn.addEventListener('click', saveGraph);
    loadGraphBtn.addEventListener('click', loadGraph);
    closeModalBtn.addEventListener('click', hideNodeModal);
    cancelBtn.addEventListener('click', hideNodeModal);
    nodeForm.addEventListener('submit', handleNodeFormSubmit);
    backendSelect.addEventListener('change', updateModelOptions);
    
    // Execute workflow button
    const executeWorkflowBtn = document.getElementById('execute-workflow-btn');
    executeWorkflowBtn.addEventListener('click', executeWorkflow);
    
    // Update temperature value display
    temperatureInput.addEventListener('input', () => {
        temperatureValue.textContent = temperatureInput.value;
    });
    
    // Node operations buttons instead of context menu
    setupNodeOperations();
    
    // Fetch Groq model limits
    fetchGroqModelLimits();
    
    // Load graph from localStorage if available
    loadSavedGraph();
    
    // Functions
    function showNodeModal() {
        nodeModal.style.display = 'block';
        document.getElementById('node-name').focus();
    }
    
    function hideNodeModal() {
        nodeModal.style.display = 'none';
        nodeForm.reset();
    }
    
    // Functions to fetch and update models
    async function fetchAvailableModels() {
        try {
            console.log('Fetching available models...');
            const response = await fetch('/api/models');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received models from server:', data);
            
            availableModels.ollama = data.ollama || [];
            availableModels.groq = data.groq || [];
            
            // Update model options based on current backend selection
            updateModelOptions();
            
            console.log('Available models loaded:', availableModels);
        } catch (error) {
            console.error('Error fetching models:', error);
            // Set some default models in case of error
            availableModels.ollama = ['llama3', 'llama2', 'mistral'];
            availableModels.groq = [
                'deepseek-r1-distill-llama-70b',
                'deepseek-r1-distill-llama-32b',
                'mixtral-8x7b-32768',
                'qwen-2.5-32b',
                'qwen-2.5-coder-32b'
            ];
            console.log('Using default models:', availableModels);
            updateModelOptions();
        }
    }
    
    function updateModelOptions() {
        const backend = backendSelect.value;
        console.log(`Updating model options for backend: ${backend}`);
        
        const models = availableModels[backend] || [];
        console.log(`Available models for ${backend}:`, models);
        
        // Clear existing options
        modelSelect.innerHTML = '';
        
        if (models.length === 0) {
            console.warn(`No models available for ${backend}`);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models available';
            modelSelect.appendChild(option);
        } else {
            // Add models as options
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
            console.log(`Added ${models.length} models to dropdown`);
        }
    }

    function handleNodeFormSubmit(event) {
        event.preventDefault();
        
        // Get form values
        const name = document.getElementById('node-name').value;
        const backend = document.getElementById('backend-select').value;
        const model = document.getElementById('model-select').value;
        const systemMessage = document.getElementById('system-message').value;
        const temperature = parseFloat(document.getElementById('temperature').value);
        const maxTokens = parseInt(document.getElementById('max-tokens').value);
        
        // Create node data
        const nodeData = {
            id: 'node-' + Date.now(),
            name,
            backend,
            model,
            systemMessage,
            temperature,
            maxTokens
        };
        
        // Add node to graph
        window.graphManager.addNode(nodeData);
        
        // Hide modal
        hideNodeModal();
    }
    
    function saveGraph() {
        try {
            // Show saving indicator
            const saveBtn = document.getElementById('save-graph-btn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
            
            // Get graph data
            const graphData = window.graphManager.exportGraph();
            
            // Create a new graph or update existing one
            const graphName = prompt('Enter a name for this graph:', 'My AI Canvas Graph');
            if (!graphName) {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
                return; // User cancelled
            }
            
            const graphDescription = prompt('Enter a description (optional):', '');
            
            // Prepare the data
            const graphPayload = {
                name: graphName,
                description: graphDescription || '',
                layout_data: {
                    positions: window.graphManager.getNodePositions()
                }
            };
            
            // Save to backend
            fetch('/api/graphs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(graphPayload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const graphId = data.data.id;
                    
                    // Now save all nodes
                    const saveNodePromises = graphData.nodes.map(node => {
                        return fetch(`/api/graphs/${graphId}/nodes`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(node)
                        });
                    });
                    
                    return Promise.all(saveNodePromises)
                        .then(() => {
                            // Now save all edges
                            const saveEdgePromises = graphData.edges.map(edge => {
                                return fetch('/api/edges', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(edge)
                                });
                            });
                            
                            return Promise.all(saveEdgePromises);
                        })
                        .then(() => {
                            alert(`Graph "${graphName}" saved successfully with ID: ${graphId}`);
                            
                            // Also save to localStorage as backup
                            localStorage.setItem('aiCanvas_lastGraphId', graphId);
                            localStorage.setItem('aiCanvas_graph', JSON.stringify(graphData));
                        });
                } else {
                    throw new Error(data.message || 'Failed to save graph');
                }
            })
            .catch(error => {
                console.error('Error saving graph:', error);
                alert('Error saving graph: ' + error.message);
                
                // Save to localStorage as fallback
                localStorage.setItem('aiCanvas_graph', JSON.stringify(graphData));
                alert('Graph saved to local storage as fallback.');
            })
            .finally(() => {
                // Reset button
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            });
        } catch (error) {
            console.error('Error preparing graph data:', error);
            alert('Error preparing graph data: ' + error.message);
        }
    }
    
    function loadGraph() {
        // Show loading indicator
        const loadBtn = document.getElementById('load-graph-btn');
        const originalText = loadBtn.textContent;
        loadBtn.textContent = 'Loading...';
        loadBtn.disabled = true;
        
        // First try to load from backend
        fetch('/api/graphs')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.data && data.data.length > 0) {
                    // Show graph selection dialog
                    const graphs = data.data;
                    
                    // Create a simple dialog for graph selection
                    const dialogOverlay = document.createElement('div');
                    dialogOverlay.style.position = 'fixed';
                    dialogOverlay.style.top = '0';
                    dialogOverlay.style.left = '0';
                    dialogOverlay.style.width = '100%';
                    dialogOverlay.style.height = '100%';
                    dialogOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    dialogOverlay.style.zIndex = '1000';
                    dialogOverlay.style.display = 'flex';
                    dialogOverlay.style.justifyContent = 'center';
                    dialogOverlay.style.alignItems = 'center';
                    
                    const dialog = document.createElement('div');
                    dialog.style.backgroundColor = 'white';
                    dialog.style.padding = '20px';
                    dialog.style.borderRadius = '5px';
                    dialog.style.maxWidth = '500px';
                    dialog.style.width = '90%';
                    
                    const title = document.createElement('h2');
                    title.textContent = 'Select a Graph to Load';
                    dialog.appendChild(title);
                    
                    const graphList = document.createElement('div');
                    graphList.style.maxHeight = '300px';
                    graphList.style.overflowY = 'auto';
                    graphList.style.margin = '10px 0';
                    
                    graphs.forEach(graph => {
                        const graphItem = document.createElement('div');
                        graphItem.style.padding = '10px';
                        graphItem.style.margin = '5px 0';
                        graphItem.style.border = '1px solid #ddd';
                        graphItem.style.borderRadius = '3px';
                        graphItem.style.cursor = 'pointer';
                        
                        graphItem.innerHTML = `
                            <strong>${graph.name}</strong>
                            <div>${graph.description || 'No description'}</div>
                            <div style="font-size: 0.8em; color: #666;">
                                Created: ${new Date(graph.creation_date).toLocaleString()}
                            </div>
                        `;
                        
                        graphItem.addEventListener('click', () => {
                            // Load the selected graph
                            loadGraphById(graph.id);
                            document.body.removeChild(dialogOverlay);
                        });
                        
                        graphList.appendChild(graphItem);
                    });
                    
                    dialog.appendChild(graphList);
                    
                    const cancelButton = document.createElement('button');
                    cancelButton.textContent = 'Cancel';
                    cancelButton.style.padding = '8px 16px';
                    cancelButton.style.marginTop = '10px';
                    cancelButton.addEventListener('click', () => {
                        document.body.removeChild(dialogOverlay);
                        loadBtn.textContent = originalText;
                        loadBtn.disabled = false;
                    });
                    
                    dialog.appendChild(cancelButton);
                    dialogOverlay.appendChild(dialog);
                    document.body.appendChild(dialogOverlay);
                } else {
                    // If no graphs in backend, try localStorage
                    loadSavedGraph();
                    loadBtn.textContent = originalText;
                    loadBtn.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error loading graphs from backend:', error);
                // Try to load from localStorage as fallback
                loadSavedGraph();
                loadBtn.textContent = originalText;
                loadBtn.disabled = false;
            });
    }
    
    function loadGraphById(graphId) {
        // Show loading indicator
        const loadBtn = document.getElementById('load-graph-btn');
        const originalText = loadBtn.textContent;
        loadBtn.textContent = 'Loading...';
        loadBtn.disabled = true;
        
        fetch(`/api/graphs/${graphId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.data) {
                    const graphData = data.data;
                    
                    // Clear existing graph
                    window.graphManager.clearGraph();
                    
                    // Import nodes and edges
                    window.graphManager.importGraph({
                        nodes: graphData.nodes,
                        edges: graphData.edges
                    });
                    
                    // Apply layout if available
                    if (graphData.layout_data && graphData.layout_data.positions) {
                        window.graphManager.applyNodePositions(graphData.layout_data.positions);
                    }
                    
                    // Store the current graph ID
                    localStorage.setItem('aiCanvas_lastGraphId', graphId);
                    
                    alert(`Graph "${graphData.name}" loaded successfully!`);
                } else {
                    throw new Error(data.message || 'Failed to load graph');
                }
            })
            .catch(error => {
                console.error('Error loading graph:', error);
                alert('Error loading graph: ' + error.message);
                
                // Try to load from localStorage as fallback
                loadSavedGraph();
            })
            .finally(() => {
                // Reset button
                loadBtn.textContent = originalText;
                loadBtn.disabled = false;
            });
    }
    
    function loadSavedGraph() {
        try {
            // Try to load the last used graph ID
            const lastGraphId = localStorage.getItem('aiCanvas_lastGraphId');
            if (lastGraphId) {
                // Try to load from backend first
                loadGraphById(lastGraphId);
                return;
            }
            
            // If no last graph ID, try localStorage
            const savedGraph = localStorage.getItem('aiCanvas_graph');
            if (savedGraph) {
                const graphData = JSON.parse(savedGraph);
                window.graphManager.importGraph(graphData);
                console.log('Loaded graph from localStorage');
                alert('Loaded graph from local storage (no database connection)');
            } else {
                alert('No saved graphs found.');
            }
        } catch (error) {
            console.error('Error loading saved graph:', error);
            alert('Error loading saved graph: ' + error.message);
        }
    }
    
    function executeWorkflow() {
        // Get the current graph ID from localStorage
        const graphId = localStorage.getItem('aiCanvas_lastGraphId');
        
        if (!graphId) {
            alert('Please save the graph first before executing the workflow.');
            return;
        }
        
        // Show execution in progress
        const executeBtn = document.getElementById('execute-workflow-btn');
        const originalText = executeBtn.textContent;
        executeBtn.textContent = 'Executing...';
        executeBtn.disabled = true;
        
        // Create a modal to show execution progress
        const progressOverlay = document.createElement('div');
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
        progressContent.style.margin = '15px 0';
        progressContent.innerHTML = '<p>Analyzing graph and determining execution order...</p>';
        progressDialog.appendChild(progressContent);
        
        progressOverlay.appendChild(progressDialog);
        document.body.appendChild(progressOverlay);
        
        // Execute the workflow
        fetch(`/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ graph_id: graphId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const executionOrder = data.data.execution_order;
                const results = data.data.results;
                
                // Update progress dialog with execution results
                let resultHtml = '<h3>Execution Order:</h3>';
                resultHtml += '<ol>';
                
                executionOrder.forEach(nodeId => {
                    const node = window.graphManager.getNodeData(nodeId);
                    resultHtml += `<li><strong>${node ? node.name : nodeId}</strong></li>`;
                });
                
                resultHtml += '</ol>';
                
                resultHtml += '<h3>Results:</h3>';
                resultHtml += '<div style="margin-top: 10px;">';
                
                Object.keys(results).forEach(nodeId => {
                    const node = window.graphManager.getNodeData(nodeId);
                    const result = results[nodeId];
                    
                    resultHtml += `
                        <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <h4>${node ? node.name : nodeId}</h4>
                            <div style="white-space: pre-wrap; font-family: monospace; margin-top: 5px; padding: 8px; background-color: #f5f5f5; border-radius: 3px; max-height: 200px; overflow-y: auto;">
                                ${result.startsWith('Error:') ? 
                                    `<span style="color: red;">${result}</span>` : 
                                    result}
                            </div>
                        </div>
                    `;
                });
                
                resultHtml += '</div>';
                
                // Add a close button
                resultHtml += `
                    <div style="margin-top: 20px; text-align: right;">
                        <button id="close-progress-btn" style="padding: 8px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Close
                        </button>
                    </div>
                `;
                
                progressContent.innerHTML = resultHtml;
                
                // Add event listener to close button
                document.getElementById('close-progress-btn').addEventListener('click', () => {
                    document.body.removeChild(progressOverlay);
                });
                
                // Refresh conversations after execution
                Object.keys(results).forEach(nodeId => {
                    // If this node is currently active, refresh its conversation display
                    if (window.conversationManager.activeNodeId === nodeId) {
                        window.conversationManager.displayConversation(nodeId);
                    }
                });
                
            } else {
                progressContent.innerHTML = `
                    <div style="color: red; margin: 15px 0;">
                        <p>Error executing workflow: ${data.message}</p>
                    </div>
                    <div style="margin-top: 20px; text-align: right;">
                        <button id="close-progress-btn" style="padding: 8px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Close
                        </button>
                    </div>
                `;
                
                document.getElementById('close-progress-btn').addEventListener('click', () => {
                    document.body.removeChild(progressOverlay);
                });
            }
        })
        .catch(error => {
            console.error('Error executing workflow:', error);
            
            progressContent.innerHTML = `
                <div style="color: red; margin: 15px 0;">
                    <p>Error executing workflow: ${error.message}</p>
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button id="close-progress-btn" style="padding: 8px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Close
                    </button>
                </div>
            `;
            
            document.getElementById('close-progress-btn').addEventListener('click', () => {
                document.body.removeChild(progressOverlay);
            });
        })
        .finally(() => {
            // Reset button
            executeBtn.textContent = originalText;
            executeBtn.disabled = false;
        });
    }
    
    // Fetch Groq model limits from the backend
    async function fetchGroqModelLimits() {
        try {
            const response = await fetch('/api/groq/model-limits');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const modelLimits = await response.json();
            console.log('Groq model limits:', modelLimits);
            
            // Store the limits for later use
            window.groqModelLimits = modelLimits;
            
            // Update the model select dropdown to show limits
            updateModelOptionsWithLimits();
        } catch (error) {
            console.error('Error fetching Groq model limits:', error);
        }
    }
    
    // Update model options with limits information
    function updateModelOptionsWithLimits() {
        if (backendSelect.value === 'groq' && window.groqModelLimits) {
            const models = availableModels.groq || [];
            
            // Clear existing options
            modelSelect.innerHTML = '';
            
            if (models.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No models available';
                modelSelect.appendChild(option);
            } else {
                // Add models as options with limits info
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    
                    // Add limits info if available
                    const limits = window.groqModelLimits[model];
                    if (limits) {
                        option.textContent = `${model} (${limits.req_per_day}/day, ${limits.tokens_per_min}/min)`;
                        option.title = `Requests: ${limits.req_per_min}/min, ${limits.req_per_day}/day\nTokens: ${limits.tokens_per_min}/min, ${limits.tokens_per_day}/day`;
                    } else {
                        option.textContent = model;
                    }
                    
                    modelSelect.appendChild(option);
                });
            }
        } else {
            // Fall back to regular update for non-Groq backends
            updateModelOptions();
        }
    }
    
    // Override the original updateModelOptions function
    const originalUpdateModelOptions = updateModelOptions;
    updateModelOptions = function() {
        if (backendSelect.value === 'groq' && window.groqModelLimits) {
            updateModelOptionsWithLimits();
        } else {
            originalUpdateModelOptions();
        }
    };
    
    // Setup node operations buttons instead of context menu
    function setupNodeOperations() {
        // Create node operations container
        const nodeOpsContainer = document.createElement('div');
        nodeOpsContainer.id = 'node-operations';
        nodeOpsContainer.className = 'node-operations';
        document.querySelector('.node-info').appendChild(nodeOpsContainer);
        
        // Update node operations when a node is selected
        document.addEventListener('nodeSelected', (event) => {
            const nodeData = event.detail;
            updateNodeOperations(nodeData.id);
        });
        
        document.addEventListener('nodeDeselected', () => {
            nodeOpsContainer.innerHTML = '';
        });
        
        function updateNodeOperations(nodeId) {
            nodeOpsContainer.innerHTML = '';
            
            // Add operation buttons
            addOperationButton('Remove Node', () => {
                window.graphManager.removeNode(nodeId);
            });
            
            addOperationButton('Clear Conversation', () => {
                window.conversationManager.clearConversation(nodeId);
            });
            
            addOperationButton('Add Connection', () => {
                // Start edge drawing mode
                window.graphManager.cy.edges().unselectify();
                window.graphManager.cy.nodes().selectify();
                
                const sourceNode = window.graphManager.cy.$(`#${nodeId}`);
                
                // Change button text to indicate mode
                const button = nodeOpsContainer.querySelector('button:last-child');
                button.textContent = 'Select Target Node...';
                button.classList.add('active-operation');
                
                // One-time event for selecting target node
                const selectTargetHandler = function(event) {
                    if (event.target !== window.graphManager.cy && event.target.isNode()) {
                        const targetNode = event.target;
                        
                        // Don't allow self-connections
                        if (targetNode.id() !== sourceNode.id()) {
                            window.graphManager.addEdge(sourceNode.id(), targetNode.id());
                        }
                        
                        // Clean up
                        window.graphManager.cy.off('tap', selectTargetHandler);
                        window.graphManager.cy.nodes().unselectify();
                        window.graphManager.cy.edges().selectify();
                        
                        // Reset button
                        button.textContent = 'Add Connection';
                        button.classList.remove('active-operation');
                    }
                };
                
                window.graphManager.cy.on('tap', selectTargetHandler);
            });
            
            // If this is a Groq node, add model limits info
            const nodeData = window.graphManager.getNodeData(nodeId);
            if (nodeData && nodeData.backend === 'groq' && window.groqModelLimits) {
                const limits = window.groqModelLimits[nodeData.model];
                if (limits) {
                    const limitsInfo = document.createElement('div');
                    limitsInfo.className = 'model-limits-info';
                    limitsInfo.innerHTML = `
                        <h4>Model Limits</h4>
                        <div class="limits-grid">
                            <div>Requests:</div>
                            <div>${limits.req_per_min}/min, ${limits.req_per_day}/day</div>
                            <div>Tokens:</div>
                            <div>${limits.tokens_per_min}/min, ${limits.tokens_per_day === "No limit" ? "No limit/day" : limits.tokens_per_day + "/day"}</div>
                        </div>
                    `;
                    nodeOpsContainer.appendChild(limitsInfo);
                }
            }
        }
        
        function addOperationButton(text, callback) {
            const button = document.createElement('button');
            button.textContent = text;
            button.className = 'node-op-btn';
            button.addEventListener('click', callback);
            nodeOpsContainer.appendChild(button);
            return button;
        }
    }
    
    // Add event listener for edge operations
    window.graphManager.cy.on('tap', 'edge', function(event) {
        const edge = event.target;
        const edgeId = edge.id();
        
        // Create a temporary floating button to remove the edge
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove Connection';
        removeBtn.className = 'floating-edge-btn';
        
        // Position near the edge
        const position = event.renderedPosition;
        removeBtn.style.position = 'absolute';
        removeBtn.style.left = position.x + 'px';
        removeBtn.style.top = position.y + 'px';
        removeBtn.style.zIndex = '1000';
        
        // Add click handler
        removeBtn.addEventListener('click', () => {
            window.graphManager.removeEdge(edgeId);
            document.body.removeChild(removeBtn);
        });
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(removeBtn)) {
                document.body.removeChild(removeBtn);
            }
        }, 3000);
        
        // Add to document
        document.body.appendChild(removeBtn);
    });
});
