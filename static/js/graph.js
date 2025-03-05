/**
 * Improved GraphManager class
 * Integrates the enhanced connection and workflow fixes
 */

class GraphManager {
    constructor() {
        this.core = new GraphCore();
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.init();
    }

    init() {
        // Initialize Cytoscape core
        this.core.initCytoscape('cy');
        this.cy = this.core.cy;
        
        // Initialize modules
        this.interaction = new GraphInteraction(this.core);
        this.navigation = new GraphNavigation(this.core);
        this.layout = new GraphLayout(this.core);
        
        // Initialize each module
        this.interaction.init();
        this.navigation.init();
        this.layout.init();
        
        // Initialize enhanced modules
        this.enhancedConnections = new GraphEnhancedConnections(this.interaction);
        this.enhancedWorkflow = new GraphEnhancedWorkflow(this.core);
        
        // Initialize enhanced modules
        this.enhancedConnections.init();
        this.enhancedWorkflow.init();
        
        // Add CSS for new UI elements
        this.addCustomStyles();
        
        // Add event listeners for graph changes
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for graph changes
        this.cy.on('add remove', 'node edge', () => {
            // Update node and edge arrays
            this.nodes = this.core.nodes;
            this.edges = this.core.edges;
        });
        
        // Listen for layout completion
        this.cy.on('layoutstop', () => {
            // Update connection badges
            if (this.enhancedConnections) {
                this.enhancedConnections.updateEnhancedConnectionBadges();
            }
        });
        
        // Listen for pan and zoom
        this.cy.on('pan zoom', _.debounce(() => {
            // Update connection badges
            if (this.enhancedConnections) {
                this.enhancedConnections.updateEnhancedConnectionBadges();
            }
        }, 50));
        
        // Listen for position changes (node dragging)
        this.cy.on('position', 'node', _.debounce(() => {
            if (this.enhancedConnections) {
                this.enhancedConnections.updateEnhancedConnectionBadges();
            }
        }, 50));
        
        // Listen for window resize
        window.addEventListener('resize', _.debounce(() => {
            // Update connection badges
            if (this.enhancedConnections) {
                this.enhancedConnections.updateEnhancedConnectionBadges();
            }
        }, 100));
        
        // Create custom events for graph operations
        this.setupCustomEvents();
    }

    setupCustomEvents() {
        // Create custom event for graph loaded
        this.graphLoadedEvent = new CustomEvent('graphLoaded');
        
        // Create custom event for graph imported
        this.graphImportedEvent = new CustomEvent('graphImported');
        
        // Create custom event for graph saved
        this.graphSavedEvent = new CustomEvent('graphSaved');
        
        // Create custom event for node data changed
        this.nodeDataChangedEvent = new CustomEvent('nodeDataChanged');
    }

    addCustomStyles() {
        // Add CSS for graph controls
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced connection badges */
            .connection-badge {
                font-size: 12px !important;
                width: 24px !important;
                height: 24px !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                border-radius: 50% !important;
                background-color: white !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
                z-index: 10 !important;
                cursor: pointer !important;
                user-select: none !important;
                pointer-events: all !important;
            }
            
            /* Execution order badges */
            .execution-order-badge {
                position: absolute;
                font-size: 10px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: #2c3e50;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 20;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                pointer-events: none;
            }
            
            /* Enhanced execution path styling */
            .execution-path {
                line-color: #3498db !important;
                target-arrow-color: #3498db !important;
                width: 4px !important;
                z-index: 999 !important;
            }
            
            .active-execution-path {
                line-color: #e74c3c !important;
                target-arrow-color: #e74c3c !important;
                width: 5px !important;
                z-index: 1000 !important;
                animation: pulse-edge 1.5s infinite !important;
            }
            
            @keyframes pulse-edge {
                0%, 100% {
                    opacity: 0.8;
                    width: 4px !important;
                }
                50% {
                    opacity: 1;
                    width: 6px !important;
                }
            }
            
            .execution-active {
                background-color: #e74c3c !important;
                border-width: 3px !important;
                border-color: #c0392b !important;
                z-index: 999 !important;
                animation: pulse-node 1.5s infinite !important;
            }
            
            @keyframes pulse-node {
                0%, 100% {
                    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4) !important;
                }
                50% {
                    box-shadow: 0 0 0 10px rgba(231, 76, 60, 0) !important;
                }
            }
            
            .execution-completed {
                background-color: #27ae60 !important;
                border-width: 2px !important;
                border-color: #219955 !important;
            }
            
            .ollama-execution-node {
                border-color: #3498db !important;
                border-width: 2px !important;
            }
            
            .groq-execution-node {
                border-color: #9b59b6 !important;
                border-width: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Proxy methods to the appropriate modules
    
    addNode(nodeData) {
        const nodeId = this.core.addNode(nodeData);
        return nodeId;
    }

    removeNode(nodeId) {
        this.core.removeNode(nodeId);
    }

    addEdge(sourceId, targetId, edgeType) {
        const edgeId = this.core.addEdge(sourceId, targetId, edgeType);
        
        // Update connection styles and badges
        if (this.enhancedConnections) {
            this.enhancedConnections.applyEnhancedConnectionStyles();
            this.enhancedConnections.updateEnhancedConnectionBadges();
        }
        
        return edgeId;
    }

    removeEdge(edgeId) {
        this.core.removeEdge(edgeId);
        
        // Update connection badges
        if (this.enhancedConnections) {
            this.enhancedConnections.updateEnhancedConnectionBadges();
        }
    }

    selectNode(nodeId) {
        this.interaction.selectNode(nodeId);
    }

    deselectNode() {
        this.interaction.deselectNode();
    }

    getNodeData(nodeId) {
        // Use the enhanced workflow's getNodeData method to ensure consistency
        if (this.enhancedWorkflow) {
            return this.enhancedWorkflow.getNodeData(nodeId);
        }
        return this.interaction.getNodeData(nodeId);
    }

    getParentNodes(nodeId) {
        return this.interaction.getParentNodes(nodeId);
    }

    runLayout() {
        const result = this.layout.runLayout();
        
        // Update connection badges after layout
        if (this.enhancedConnections) {
            setTimeout(() => {
                this.enhancedConnections.updateEnhancedConnectionBadges();
            }, 200);
        }
        
        return result;
    }

    exportGraph() {
        const graphData = {
            nodes: this.core.nodes,
            edges: this.core.edges
        };
        
        // Add enhanced connection data if available
        if (this.enhancedConnections) {
            graphData.connectionData = this.enhancedConnections.prepareForExport();
        }
        
        // Add workflow data if available
        if (this.enhancedWorkflow) {
            graphData.workflowData = this.enhancedWorkflow.prepareForExport();
        }
        
        return graphData;
    }

    importGraph(graphData) {
        // Clear existing graph
        this.clearGraph();
        
        // Add nodes
        if (graphData.nodes && Array.isArray(graphData.nodes)) {
            graphData.nodes.forEach(nodeData => {
                this.addNode(nodeData);
            });
        }
        
        // Add edges
        if (graphData.edges && Array.isArray(graphData.edges)) {
            graphData.edges.forEach(edgeData => {
                this.addEdge(
                    edgeData.source, 
                    edgeData.target, 
                    edgeData.type || edgeData.edge_type || 'provides_context'
                );
            });
        }
        
        // Apply enhanced connection styles
        if (this.enhancedConnections) {
            this.enhancedConnections.applyEnhancedConnectionStyles();
            
            // Restore connection data if available
            if (graphData.connectionData) {
                this.enhancedConnections.restoreFromImport(graphData.connectionData);
            }
            
            // Update badges after a short delay to ensure the graph is rendered
            setTimeout(() => {
                this.enhancedConnections.updateEnhancedConnectionBadges();
            }, 200);
        }
        
        // Restore workflow data if available
        if (this.enhancedWorkflow && graphData.workflowData) {
            this.enhancedWorkflow.restoreFromImport(graphData.workflowData);
        }
        
        // Run layout
        this.runLayout();
        
        // Dispatch graph imported event
        document.dispatchEvent(this.graphImportedEvent);
    }
    
    clearGraph() {
        this.core.clearGraph();
        
        // Reset workflow state
        if (this.enhancedWorkflow) {
            this.enhancedWorkflow.resetExecutionState();
        }
    }
    
    getNodePositions() {
        return this.layout.saveNodePositions();
    }
    
    applyNodePositions(positions) {
        this.layout.applyNodePositions(positions);
        
        // Update connection badges after applying positions
        if (this.enhancedConnections) {
            setTimeout(() => {
                this.enhancedConnections.updateEnhancedConnectionBadges();
            }, 200);
        }
    }
    
    // Enhanced workflow methods
    
    executeWorkflow() {
        if (this.enhancedWorkflow) {
            this.enhancedWorkflow.executeWorkflow();
        }
    }
    
    executeSelectedNode() {
        if (this.enhancedWorkflow) {
            this.enhancedWorkflow.executeSelectedNode();
        }
    }
    
    validateWorkflow() {
        if (this.enhancedWorkflow) {
            this.enhancedWorkflow.validateWorkflow();
        }
    }
    
    // New methods for improved integration
    
    updateNode(nodeData) {
        // Get existing node from graph
        const node = this.cy.$id(nodeData.id);
        
        // Update node data
        if (node.length > 0) {
            node.data(nodeData);
            
            // Update internal node array
            const index = this.nodes.findIndex(n => n.id === nodeData.id);
            if (index !== -1) {
                this.nodes[index] = { ...this.nodes[index], ...nodeData };
            }
            
            // Trigger node data changed event
            document.dispatchEvent(this.nodeDataChangedEvent);
            
            return true;
        }
        
        return false;
    }
    
    saveGraph(name, description) {
        // Get graph data
        const graphData = this.exportGraph();
        
        // Prepare layout data
        const layoutData = {
            positions: this.getNodePositions()
        };
        
        // Store the graph data with layout information
        const saveData = {
            name: name || 'Unnamed Graph',
            description: description || '',
            timestamp: new Date().toISOString(),
            graphData: graphData,
            layoutData: layoutData
        };
        
        // Store in localStorage as backup
        localStorage.setItem('aiCanvas_graph', JSON.stringify(saveData));
        
        // Dispatch graph saved event
        document.dispatchEvent(this.graphSavedEvent);
        
        return saveData;
    }
    
    loadGraph(graphId) {
        // Try to load from backend with the ID
        if (graphId) {
            fetch(`/api/graphs/${graphId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success' && data.data) {
                        // Import the graph data
                        this.importGraph(data.data);
                        
                        // Apply layout if available
                        if (data.data.layout_data && data.data.layout_data.positions) {
                            this.applyNodePositions(data.data.layout_data.positions);
                        }
                        
                        // Store the current graph ID
                        localStorage.setItem('aiCanvas_lastGraphId', graphId);
                        
                        // Dispatch graph loaded event
                        document.dispatchEvent(this.graphLoadedEvent);
                        
                        // Return success
                        return true;
                    }
                    return false;
                })
                .catch(error => {
                    console.error('Error loading graph:', error);
                    return false;
                });
        }
        
        // Try to load from localStorage as fallback
        const savedGraph = localStorage.getItem('aiCanvas_graph');
        if (savedGraph) {
            try {
                const saveData = JSON.parse(savedGraph);
                
                // Import the graph data
                this.importGraph(saveData.graphData);
                
                // Apply layout if available
                if (saveData.layoutData && saveData.layoutData.positions) {
                    this.applyNodePositions(saveData.layoutData.positions);
                }
                
                // Dispatch graph loaded event
                document.dispatchEvent(this.graphLoadedEvent);
                
                return true;
            } catch (error) {
                console.error('Error parsing saved graph:', error);
                return false;
            }
        }
        
        return false;
    }
}

// Export the GraphManager
window.GraphManager = GraphManager;