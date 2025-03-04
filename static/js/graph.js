/**
 * Graph.js - Handles the Cytoscape.js graph visualization
 */

class GraphManager {
    constructor() {
        this.cy = null;
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.init();
    }

    init() {
        // Initialize Cytoscape
        this.cy = cytoscape({
            container: document.getElementById('cy'),
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': 'data(color)',
                        'label': 'data(name)',
                        'color': '#fff',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '12px',
                        'width': '120px',
                        'height': '40px',
                        'shape': 'round-rectangle'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                    }
                },
                {
                    selector: '.selected',
                    style: {
                        'border-width': 3,
                        'border-color': '#e74c3c'
                    }
                }
            ],
            layout: {
                name: 'grid',
                rows: 2
            },
            wheelSensitivity: 0.2
        });

        // Add event listeners
        this.cy.on('tap', 'node', (event) => {
            const node = event.target;
            this.selectNode(node.id());
        });

        this.cy.on('tap', (event) => {
            if (event.target === this.cy) {
                // Clicked on background
                this.deselectNode();
            }
        });
    }

    addNode(nodeData) {
        const { id, name, backend, model, systemMessage, temperature, maxTokens } = nodeData;
        
        // Determine color based on backend
        const color = backend === 'ollama' ? '#3498db' : '#9b59b6';
        
        // Add node to Cytoscape
        this.cy.add({
            group: 'nodes',
            data: {
                id,
                name,
                color,
                backend,
                model,
                systemMessage,
                temperature,
                maxTokens
            },
            position: {
                x: Math.random() * 300,
                y: Math.random() * 300
            }
        });
        
        // Add to internal nodes array
        this.nodes.push(nodeData);
        
        // Run layout
        this.runLayout();
        
        return id;
    }

    removeNode(nodeId) {
        // Remove node from Cytoscape
        this.cy.remove(`#${nodeId}`);
        
        // Remove from internal nodes array
        this.nodes = this.nodes.filter(node => node.id !== nodeId);
        
        // Remove any edges connected to this node
        this.edges = this.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
        
        // If the selected node was removed, deselect it
        if (this.selectedNode === nodeId) {
            this.deselectNode();
        }
    }

    addEdge(sourceId, targetId) {
        // Check if nodes exist
        if (!this.cy.getElementById(sourceId).length || !this.cy.getElementById(targetId).length) {
            console.error('Cannot add edge: one or both nodes do not exist');
            return null;
        }
        
        // Check if edge already exists
        const edgeId = `${sourceId}-${targetId}`;
        if (this.cy.getElementById(edgeId).length) {
            console.error('Edge already exists');
            return null;
        }
        
        // Add edge to Cytoscape
        this.cy.add({
            group: 'edges',
            data: {
                id: edgeId,
                source: sourceId,
                target: targetId
            }
        });
        
        // Add to internal edges array
        this.edges.push({
            id: edgeId,
            source: sourceId,
            target: targetId
        });
        
        return edgeId;
    }

    removeEdge(edgeId) {
        // Remove edge from Cytoscape
        this.cy.remove(`#${edgeId}`);
        
        // Remove from internal edges array
        this.edges = this.edges.filter(edge => edge.id !== edgeId);
    }

    selectNode(nodeId) {
        // Deselect previously selected node
        this.cy.$('.selected').removeClass('selected');
        
        // Select new node
        this.cy.$(`#${nodeId}`).addClass('selected');
        this.selectedNode = nodeId;
        
        // Get node data
        const nodeData = this.getNodeData(nodeId);
        
        // Trigger custom event
        const event = new CustomEvent('nodeSelected', { detail: nodeData });
        document.dispatchEvent(event);
    }

    deselectNode() {
        this.cy.$('.selected').removeClass('selected');
        this.selectedNode = null;
        
        // Trigger custom event
        const event = new CustomEvent('nodeDeselected');
        document.dispatchEvent(event);
    }

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

    getParentNodes(nodeId) {
        if (!nodeId) {
            console.error('getParentNodes called with invalid nodeId:', nodeId);
            return [];
        }
        
        console.log(`Getting parent nodes for node: ${nodeId}`);
        const parentNodes = [];
        
        try {
            // Check if the node exists
            const targetNode = this.cy.$(`#${nodeId}`);
            if (targetNode.length === 0) {
                console.error(`Node with id ${nodeId} not found in the graph`);
                return [];
            }
            
            // Find all edges where this node is the target
            const incomingEdges = this.cy.edges(`[target = "${nodeId}"]`);
            console.log(`Found ${incomingEdges.length} incoming edges for node ${nodeId}`);
            
            incomingEdges.forEach(edge => {
                const sourceId = edge.data('source');
                console.log(`Processing edge from ${sourceId} to ${nodeId}`);
                
                const sourceNode = this.getNodeData(sourceId);
                if (sourceNode) {
                    console.log(`Adding parent node: ${sourceId}`, sourceNode);
                    parentNodes.push(sourceNode);
                } else {
                    console.error(`Failed to get data for parent node: ${sourceId}`);
                }
            });
        } catch (error) {
            console.error('Error in getParentNodes:', error);
        }
        
        return parentNodes;
    }

    runLayout() {
        const layout = this.cy.layout({
            name: 'cose',
            animate: true,
            animationDuration: 500,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: false,
            componentSpacing: 100,
            nodeRepulsion: 400000,
            nodeOverlap: 10,
            idealEdgeLength: 100,
            edgeElasticity: 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
        });
        
        layout.run();
    }

    exportGraph() {
        return {
            nodes: this.nodes,
            edges: this.edges
        };
    }

    importGraph(graphData) {
        // Clear existing graph
        this.cy.elements().remove();
        this.nodes = [];
        this.edges = [];
        
        // Add nodes
        graphData.nodes.forEach(nodeData => {
            this.addNode(nodeData);
        });
        
        // Add edges
        graphData.edges.forEach(edgeData => {
            this.addEdge(edgeData.source, edgeData.target);
        });
        
        // Run layout
        this.runLayout();
    }
}

// Export the GraphManager
window.GraphManager = GraphManager;
