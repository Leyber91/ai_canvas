/**
 * graph-core.js - Core graph functionality for Cytoscape.js graph visualization
 */

class GraphCore {
    constructor() {
        this.cy = null;
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.gridEnabled = true;
        this.gridSize = 20;
        this.pinnedNodes = new Set();
    }

    initCytoscape(container) {
        // Initialize Cytoscape
        this.cy = cytoscape({
            container: document.getElementById(container),
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
                        'width': '140px',
                        'height': '50px',
                        'shape': 'round-rectangle',
                        'border-width': 2,
                        'border-color': '#666',
                        'text-wrap': 'wrap',
                        'text-max-width': '120px',
                        'text-overflow-wrap': 'ellipsis',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-weight': 'bold',
                        'z-index': 'data(zIndex)'
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
                },
                {
                    selector: '.pinned',
                    style: {
                        'border-width': 3,
                        'border-color': '#27ae60',
                        'border-style': 'double'
                    }
                },
                {
                    selector: '.execution-path',
                    style: {
                        'line-color': '#3498db',
                        'target-arrow-color': '#3498db',
                        'width': 4,
                        'transition-property': 'line-color, target-arrow-color, width',
                        'transition-duration': '0.5s'
                    }
                },
                {
                    selector: '.grid-background',
                    style: {
                        'background-image': 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M%200%2C0%20L%200%2C20%20M%200%2C0%20L%2020%2C0%22%20stroke%3D%22%23eee%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E',
                        'background-width': '20px',
                        'background-height': '20px'
                    }
                }
            ],
            layout: {
                name: 'grid',
                rows: 2
            },
            wheelSensitivity: 0.2,
            minZoom: 0.1,
            maxZoom: 3,
            boxSelectionEnabled: true
        });

        return this.cy;
    }

    addNode(nodeData) {
        const { id, name, backend, model, systemMessage, temperature, maxTokens } = nodeData;
        
        // Determine color based on backend
        const color = backend === 'ollama' ? '#3498db' : '#9b59b6';
        
        // Generate a random z-index for proper layering
        const zIndex = Math.floor(Math.random() * 100);
        
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
                maxTokens,
                zIndex
            },
            position: {
                // Spread nodes out more to avoid initial overlapping
                x: Math.random() * 500 + 100,
                y: Math.random() * 500 + 100
            }
        });
        
        // Add to internal nodes array
        this.nodes.push(nodeData);
        
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
        
        // Remove from pinned nodes if it was pinned
        if (this.pinnedNodes.has(nodeId)) {
            this.pinnedNodes.delete(nodeId);
        }
    }

    addEdge(sourceId, targetId, edgeType = 'provides_context') {
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
                target: targetId,
                edge_type: edgeType
            }
        });
        
        // Add to internal edges array
        this.edges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: edgeType
        });
        
        return edgeId;
    }

    removeEdge(edgeId) {
        // Remove edge from Cytoscape
        this.cy.remove(`#${edgeId}`);
        
        // Remove from internal edges array
        this.edges = this.edges.filter(edge => edge.id !== edgeId);
    }

    clearGraph() {
        this.cy.elements().remove();
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.pinnedNodes.clear();
    }
}

// Export the GraphCore
window.GraphCore = GraphCore;
