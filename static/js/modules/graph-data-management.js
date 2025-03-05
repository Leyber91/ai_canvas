/**
 * graph-data-management.js - Handles graph data import/export and persistence
 */

class GraphDataManagement {
    constructor(graphCore) {
        this.graphCore = graphCore;
        this.cy = graphCore.cy;
    }

    /**
     * Export the current graph to a data object
     * @returns {Object} Graph data object with nodes and edges
     */
    exportGraph() {
        return {
            nodes: this.graphCore.nodes,
            edges: this.graphCore.edges
        };
    }

    /**
     * Import graph data and render it
     * @param {Object} graphData - Graph data object with nodes and edges
     */
    importGraph(graphData) {
        // Clear existing graph
        this.clearGraph();
        
        // Add nodes
        graphData.nodes.forEach(nodeData => {
            this.graphCore.addNode(nodeData);
        });
        
        // Add edges
        graphData.edges.forEach(edgeData => {
            this.graphCore.addEdge(
                edgeData.source, 
                edgeData.target, 
                edgeData.type || edgeData.edge_type
            );
        });
    }
    
    /**
     * Clear the current graph
     */
    clearGraph() {
        this.graphCore.clearGraph();
    }
    
    /**
     * Get the current positions of all nodes
     * @returns {Object} Object mapping node IDs to position objects
     */
    getNodePositions() {
        const positions = {};
        this.cy.nodes().forEach(node => {
            const position = node.position();
            positions[node.id()] = {
                x: position.x,
                y: position.y
            };
        });
        return positions;
    }
    
    /**
     * Apply saved positions to nodes
     * @param {Object} positions - Object mapping node IDs to position objects
     */
    applyNodePositions(positions) {
        if (!positions) return;
        
        Object.entries(positions).forEach(([nodeId, position]) => {
            const node = this.cy.$(`#${nodeId}`);
            if (node.length > 0) {
                node.position(position);
            }
        });
        
        // Fit the graph to view if no positions were applied
        if (Object.keys(positions).length === 0) {
            this.cy.fit();
        }
    }
    
    /**
     * Save the current graph to local storage
     * @param {string} name - Name to identify the saved graph
     */
    saveToLocalStorage(name) {
        const graphData = this.exportGraph();
        const positions = this.getNodePositions();
        
        const saveData = {
            name,
            timestamp: new Date().toISOString(),
            graphData,
            positions
        };
        
        // Get existing saved graphs
        const savedGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '[]');
        
        // Check if a graph with this name already exists
        const existingIndex = savedGraphs.findIndex(g => g.name === name);
        if (existingIndex >= 0) {
            savedGraphs[existingIndex] = saveData;
        } else {
            savedGraphs.push(saveData);
        }
        
        localStorage.setItem('savedGraphs', JSON.stringify(savedGraphs));
        return saveData;
    }
    
    /**
     * Load a graph from local storage
     * @param {string} name - Name of the saved graph to load
     * @returns {boolean} Success status
     */
    loadFromLocalStorage(name) {
        const savedGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '[]');
        const savedGraph = savedGraphs.find(g => g.name === name);
        
        if (!savedGraph) return false;
        
        this.importGraph(savedGraph.graphData);
        this.applyNodePositions(savedGraph.positions);
        return true;
    }
    
    /**
     * Get a list of all saved graphs in local storage
     * @returns {Array} Array of saved graph metadata
     */
    getSavedGraphsList() {
        const savedGraphs = JSON.parse(localStorage.getItem('savedGraphs') || '[]');
        return savedGraphs.map(g => ({
            name: g.name,
            timestamp: g.timestamp,
            nodeCount: g.graphData.nodes.length,
            edgeCount: g.graphData.edges.length
        }));
    }
}

