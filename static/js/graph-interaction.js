/**
 * graph-interaction.js - Node interaction features for Cytoscape.js graph visualization
 * This file imports and coordinates all the modular components
 */

import GraphInteractionBase from './modules/graph-base.js';
import GraphNodeSelection from './modules/graph-node-selection.js';
import GraphNodeDragging from './modules/graph-node-dragging.js';
import GraphEdgeHandling from './modules/graph-edge-handling.js';
import GraphConnectionUI from './modules/graph-connection-ui.js';
import GraphContextMenu from './modules/graph-context-menu.js';
import GraphModal from './modules/graph-modal.js';

class GraphInteraction extends GraphInteractionBase {
    constructor(graphCore) {
        super(graphCore);
        
        // Initialize modules
        this.nodeSelection = new GraphNodeSelection(this);
        this.nodeDragging = new GraphNodeDragging(this);
        this.edgeHandling = new GraphEdgeHandling(this);
        this.connectionUI = new GraphConnectionUI(this);
        this.contextMenu = new GraphContextMenu(this);
        this.modal = new GraphModal(this);
    }

    init() {
        // Setup node selection
        this.nodeSelection.setupNodeSelection();
        
        // Setup node dragging
        this.nodeDragging.setupNodeDragging();
        
        // Setup edge handling
        this.edgeHandling.setupEdgeHandling();
        this.edgeHandling.setupEdgeHover();
        
        // Setup context menu
        this.contextMenu.setupContextMenu();
        
        // Create connection creation panel
        this.connectionUI.createConnectionCreationPanel();
        
        // Apply connection styles to existing edges
        this.connectionUI.applyConnectionStyles();
        
        // Create connection legend
        this.connectionUI.createConnectionLegend();
        
        // Setup event listeners for node editing
        document.addEventListener('editNode', (event) => {
            const nodeData = event.detail;
            this.modal.showNodeEditor(nodeData);
        });
        
        // Setup event listener for showing model info
        document.addEventListener('showModelInfo', (event) => {
            const nodeId = event.detail;
            this.modal.showModelInfo(nodeId);
        });
        
        // Setup event listener for showing API usage
        document.addEventListener('showApiUsage', (event) => {
            const nodeId = event.detail;
            this.modal.showApiUsage(nodeId);
        });
    }

    // Method to start edge drawing from a node
    startEdgeDrawing(nodeId) {
        this.edgeHandling.startEdgeDrawing(nodeId);
    }

    // Method to show model info for a node
    showModelInfo(nodeId) {
        this.modal.showModelInfo(nodeId);
    }

    // Method to show API usage for a node
    showApiUsage(nodeId) {
        this.modal.showApiUsage(nodeId);
    }

    // Method to show node editor
    showNodeEditor(nodeData = null) {
        this.modal.showNodeEditor(nodeData);
    }
}

// Export the GraphInteraction
window.GraphInteraction = GraphInteraction;
