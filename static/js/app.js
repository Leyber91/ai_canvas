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
    
    // Update temperature value display
    temperatureInput.addEventListener('input', () => {
        temperatureValue.textContent = temperatureInput.value;
    });
    
    // Context menu for node/edge operations
    setupContextMenu();
    
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
            // Get graph data
            const graphData = window.graphManager.exportGraph();
            const conversationsData = window.conversationManager.exportConversations();
            
            // Save to backend
            fetch('/api/graph', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    graph: graphData,
                    conversations: conversationsData
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('Graph saved successfully!');
                    
                    // Also save to localStorage as backup
                    localStorage.setItem('aiCanvas_graph', JSON.stringify(graphData));
                    localStorage.setItem('aiCanvas_conversations', JSON.stringify(conversationsData));
                } else {
                    throw new Error('Failed to save graph');
                }
            })
            .catch(error => {
                console.error('Error saving graph:', error);
                alert('Error saving graph: ' + error.message);
                
                // Save to localStorage as fallback
                localStorage.setItem('aiCanvas_graph', JSON.stringify(graphData));
                localStorage.setItem('aiCanvas_conversations', JSON.stringify(conversationsData));
                alert('Graph saved to local storage as fallback.');
            });
        } catch (error) {
            console.error('Error preparing graph data:', error);
            alert('Error preparing graph data: ' + error.message);
        }
    }
    
    function loadGraph() {
        // First try to load from backend
        fetch('/api/graph')
            .then(response => response.json())
            .then(data => {
                if (data.nodes && data.edges) {
                    // Load graph data
                    window.graphManager.importGraph(data);
                    
                    // Try to load conversations
                    fetch('/api/conversations')
                        .then(response => response.json())
                        .then(conversationsData => {
                            window.conversationManager.importConversations(conversationsData);
                        })
                        .catch(error => {
                            console.error('Error loading conversations:', error);
                            // Try to load from localStorage as fallback
                            loadConversationsFromLocalStorage();
                        });
                } else {
                    // If backend doesn't have data, try localStorage
                    loadSavedGraph();
                }
            })
            .catch(error => {
                console.error('Error loading graph from backend:', error);
                // Try to load from localStorage as fallback
                loadSavedGraph();
            });
    }
    
    function loadSavedGraph() {
        try {
            // Load graph from localStorage
            const savedGraph = localStorage.getItem('aiCanvas_graph');
            if (savedGraph) {
                const graphData = JSON.parse(savedGraph);
                window.graphManager.importGraph(graphData);
                
                // Load conversations
                loadConversationsFromLocalStorage();
                
                console.log('Loaded graph from localStorage');
            }
        } catch (error) {
            console.error('Error loading saved graph:', error);
        }
    }
    
    function loadConversationsFromLocalStorage() {
        try {
            const savedConversations = localStorage.getItem('aiCanvas_conversations');
            if (savedConversations) {
                const conversationsData = JSON.parse(savedConversations);
                window.conversationManager.importConversations(conversationsData);
                console.log('Loaded conversations from localStorage');
            }
        } catch (error) {
            console.error('Error loading saved conversations:', error);
        }
    }
    
    function setupContextMenu() {
        // Create context menu element
        const contextMenu = document.createElement('div');
        contextMenu.id = 'context-menu';
        contextMenu.style.position = 'absolute';
        contextMenu.style.display = 'none';
        contextMenu.style.zIndex = '1000';
        contextMenu.style.backgroundColor = 'white';
        contextMenu.style.border = '1px solid #ccc';
        contextMenu.style.borderRadius = '4px';
        contextMenu.style.padding = '5px 0';
        contextMenu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        document.body.appendChild(contextMenu);
        
        // Context menu for nodes
        window.graphManager.cy.on('cxttap', 'node', function(event) {
            const node = event.target;
            const nodeId = node.id();
            
            // Position menu
            const position = event.renderedPosition;
            contextMenu.style.left = position.x + 'px';
            contextMenu.style.top = position.y + 'px';
            
            // Clear previous menu items
            contextMenu.innerHTML = '';
            
            // Add menu items
            addMenuItem(contextMenu, 'Remove Node', () => {
                window.graphManager.removeNode(nodeId);
                hideContextMenu();
            });
            
            addMenuItem(contextMenu, 'Clear Conversation', () => {
                window.conversationManager.clearConversation(nodeId);
                hideContextMenu();
            });
            
            addMenuItem(contextMenu, 'Add Connection', () => {
                // Start edge drawing mode
                window.graphManager.cy.edges().unselectify();
                window.graphManager.cy.nodes().selectify();
                
                const sourceNode = node;
                
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
                    }
                };
                
                window.graphManager.cy.on('tap', selectTargetHandler);
                
                hideContextMenu();
            });
            
            // Show menu
            contextMenu.style.display = 'block';
            
            // Prevent default context menu
            event.preventDefault();
        });
        
        // Context menu for edges
        window.graphManager.cy.on('cxttap', 'edge', function(event) {
            const edge = event.target;
            const edgeId = edge.id();
            
            // Position menu
            const position = event.renderedPosition;
            contextMenu.style.left = position.x + 'px';
            contextMenu.style.top = position.y + 'px';
            
            // Clear previous menu items
            contextMenu.innerHTML = '';
            
            // Add menu items
            addMenuItem(contextMenu, 'Remove Connection', () => {
                window.graphManager.removeEdge(edgeId);
                hideContextMenu();
            });
            
            // Show menu
            contextMenu.style.display = 'block';
            
            // Prevent default context menu
            event.preventDefault();
        });
        
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', hideContextMenu);
        window.graphManager.cy.on('tap', function(event) {
            if (event.target === window.graphManager.cy) {
                hideContextMenu();
            }
        });
        
        function addMenuItem(menu, text, callback) {
            const item = document.createElement('div');
            item.textContent = text;
            item.style.padding = '8px 12px';
            item.style.cursor = 'pointer';
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f0f0f0';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
            });
            
            item.addEventListener('click', callback);
            
            menu.appendChild(item);
        }
        
        function hideContextMenu() {
            contextMenu.style.display = 'none';
        }
    }
});
