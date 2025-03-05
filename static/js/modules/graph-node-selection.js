/**
 * graph-node-selection.js - Node selection functionality
 */

class GraphNodeSelection {
    constructor(graphInteraction) {
        this.graphInteraction = graphInteraction;
        this.graphCore = graphInteraction.graphCore;
        this.cy = graphInteraction.cy;
    }

    setupNodeSelection() {
        // Node selection
        this.cy.on('tap', 'node', (event) => {
            const node = event.target;
            this.selectNode(node.id());
        });

        // Background click to deselect
        this.cy.on('tap', (event) => {
            if (event.target === this.cy) {
                this.deselectNode();
            }
        });
    }

    selectNode(nodeId) {
        // Deselect previously selected node
        this.cy.$('.selected').removeClass('selected');
        
        // Select new node
        this.cy.$(`#${nodeId}`).addClass('selected');
        this.graphCore.selectedNode = nodeId;
        
        // Get node data
        const nodeData = this.graphInteraction.getNodeData(nodeId);
        
        // Trigger custom event
        const event = new CustomEvent('nodeSelected', { detail: nodeData });
        document.dispatchEvent(event);
    }

    deselectNode() {
        this.cy.$('.selected').removeClass('selected');
        this.graphCore.selectedNode = null;
        
        // Trigger custom event
        const event = new CustomEvent('nodeDeselected');
        document.dispatchEvent(event);
    }

    togglePinNode(nodeId) {
        const node = this.cy.$(`#${nodeId}`);
        if (node.length === 0) return;
        
        if (this.graphCore.pinnedNodes.has(nodeId)) {
            // Unpin the node
            this.graphCore.pinnedNodes.delete(nodeId);
            node.removeClass('pinned');
            node.unlock();
        } else {
            // Pin the node
            this.graphCore.pinnedNodes.add(nodeId);
            node.addClass('pinned');
            node.lock();
        }
    }

    centerOnNode(nodeId) {
        const node = this.cy.$(`#${nodeId}`);
        if (node.length > 0) {
            this.cy.animate({
                center: {
                    eles: node
                },
                zoom: 1.5,
                duration: 500
            });
        }
    }

    duplicateNode(nodeId) {
        // Get original node data
        const originalData = this.graphInteraction.getNodeData(nodeId);
        if (!originalData) return;
        
        // Create a new ID
        const newId = `node-${Date.now()}`;
        
        // Create new node data with slight position offset
        const originalNode = this.cy.$(`#${nodeId}`);
        const position = originalNode.position();
        
        const newNodeData = {
            id: newId,
            name: `${originalData.name} (Copy)`,
            backend: originalData.backend,
            model: originalData.model,
            systemMessage: originalData.systemMessage,
            temperature: originalData.temperature,
            maxTokens: originalData.maxTokens
        };
        
        // Add the new node
        this.graphCore.addNode(newNodeData);
        
        // Position the new node
        const newNode = this.cy.$(`#${newId}`);
        newNode.position({
            x: position.x + 50,
            y: position.y + 50
        });
        
        // Select the new node
        this.selectNode(newId);
    }
}

export default GraphNodeSelection;