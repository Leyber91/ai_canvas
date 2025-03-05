/**
 * graph-base.js - Base class and initialization for graph interaction
 */

class GraphInteractionBase {
    constructor(graphCore) {
        this.graphCore = graphCore;
        this.cy = graphCore.cy;
        this.dragEnabled = true;
        this.contextMenuEnabled = true;
        this.edgeDrawingMode = false;
        this.edgeSource = null;
        this.connectionTypes = [
            { id: 'provides_context', name: 'Provides Context', description: 'Source node provides context to target node' },
            { id: 'controls_flow', name: 'Controls Flow', description: 'Source node controls execution flow to target node' },
            { id: 'data_transfer', name: 'Data Transfer', description: 'Source node transfers data to target node' },
            { id: 'conditional', name: 'Conditional', description: 'Conditional connection between nodes' }
        ];
        this.defaultConnectionType = 'provides_context';
    }

    init() {
        this.setupNodeSelection();
        this.setupNodeDragging();
        this.setupEdgeHandling();
        this.setupContextMenu();
        this.setupEdgeHover();
        this.createConnectionCreationPanel();
    }

    // Utility methods
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
                    
                    // Add edge type to the parent node data
                    sourceNode.edgeType = edge.data('edge_type') || 'provides_context';
                    
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
}

// Export the GraphInteractionBase
export default GraphInteractionBase;
