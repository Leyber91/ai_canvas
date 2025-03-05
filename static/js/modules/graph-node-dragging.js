/**
 * graph-node-dragging.js - Node dragging functionality with grid snapping
 */

class GraphNodeDragging {
    constructor(graphInteraction) {
        this.graphInteraction = graphInteraction;
        this.graphCore = graphInteraction.graphCore;
        this.cy = graphInteraction.cy;
        this.dragEnabled = true;
    }

    setupNodeDragging() {
        // Enable node dragging with grid snapping and visual feedback
        
        // Make sure all nodes are grabbable
        this.cy.nodes().grabify();
        
        // Add a toggle button for drag mode
        this.addDragModeToggle();
        
        // Show grid guidelines during drag
        this.cy.on('dragstart', 'node', (event) => {
            const node = event.target;
            
            // Skip if node is pinned
            if (this.graphCore.pinnedNodes.has(node.id())) {
                return;
            }
            
            // Add dragging class for visual feedback
            node.addClass('dragging');
            
            // Show grid guidelines if grid is enabled
            if (this.graphCore.gridEnabled) {
                this.showGridGuidelines(node);
            }
            
            // Bring the node to front during dragging
            node.style('z-index', 999);
        });
        
        // Update grid guidelines during drag
        this.cy.on('drag', 'node', (event) => {
            const node = event.target;
            
            // Skip if node is pinned
            if (this.graphCore.pinnedNodes.has(node.id())) {
                return;
            }
            
            // Update grid guidelines if grid is enabled
            if (this.graphCore.gridEnabled) {
                this.updateGridGuidelines(node);
            }
        });
        
        // Apply grid snapping when drag ends
        this.cy.on('dragfree', 'node', (event) => {
            const node = event.target;
            
            // Skip if node is pinned
            if (this.graphCore.pinnedNodes.has(node.id())) {
                return;
            }
            
            // Remove dragging class
            node.removeClass('dragging');
            
            // Remove grid guidelines
            this.removeGridGuidelines();
            
            // Apply grid snapping if enabled
            if (this.graphCore.gridEnabled) {
                const position = node.position();
                const gridSize = this.graphCore.gridSize;
                
                // Snap to grid
                const snappedPosition = {
                    x: Math.round(position.x / gridSize) * gridSize,
                    y: Math.round(position.y / gridSize) * gridSize
                };
                
                // Apply the snapped position
                node.position(snappedPosition);
            }
            
            // Save node position to localStorage
            this.saveNodePosition(node);
        });
    }
    
    showGridGuidelines(node) {
        // Remove any existing guidelines
        this.removeGridGuidelines();
        
        // Create horizontal and vertical guidelines
        const position = node.position();
        const gridSize = this.graphCore.gridSize;
        
        // Calculate nearest grid lines
        const nearestX = Math.round(position.x / gridSize) * gridSize;
        const nearestY = Math.round(position.y / gridSize) * gridSize;
        
        // Create horizontal guideline
        const hGuideline = document.createElement('div');
        hGuideline.className = 'grid-guideline horizontal';
        hGuideline.style.position = 'absolute';
        hGuideline.style.height = '1px';
        hGuideline.style.width = '100%';
        hGuideline.style.backgroundColor = '#3498db';
        hGuideline.style.top = `${nearestY}px`;
        hGuideline.style.left = '0';
        hGuideline.style.zIndex = '5';
        hGuideline.style.pointerEvents = 'none';
        
        // Create vertical guideline
        const vGuideline = document.createElement('div');
        vGuideline.className = 'grid-guideline vertical';
        vGuideline.style.position = 'absolute';
        vGuideline.style.width = '1px';
        vGuideline.style.height = '100%';
        vGuideline.style.backgroundColor = '#3498db';
        vGuideline.style.left = `${nearestX}px`;
        vGuideline.style.top = '0';
        vGuideline.style.zIndex = '5';
        vGuideline.style.pointerEvents = 'none';
        
        // Add to document
        const container = this.cy.container();
        container.appendChild(hGuideline);
        container.appendChild(vGuideline);
    }
    
    updateGridGuidelines(node) {
        // Update position of guidelines
        const position = node.position();
        const gridSize = this.graphCore.gridSize;
        
        // Calculate nearest grid lines
        const nearestX = Math.round(position.x / gridSize) * gridSize;
        const nearestY = Math.round(position.y / gridSize) * gridSize;
        
        // Update guidelines
        const hGuideline = document.querySelector('.grid-guideline.horizontal');
        const vGuideline = document.querySelector('.grid-guideline.vertical');
        
        if (hGuideline) {
            hGuideline.style.top = `${nearestY}px`;
        }
        
        if (vGuideline) {
            vGuideline.style.left = `${nearestX}px`;
        }
    }
    
    removeGridGuidelines() {
        // Remove all guidelines
        const guidelines = document.querySelectorAll('.grid-guideline');
        guidelines.forEach(guideline => {
            guideline.parentNode.removeChild(guideline);
        });
    }
    
    addDragModeToggle() {
        // Create a toggle button for drag mode
        const dragModeToggle = document.createElement('button');
        dragModeToggle.className = 'graph-control-button';
        dragModeToggle.title = 'Toggle Drag Mode';
        dragModeToggle.innerHTML = '✥'; // Drag icon
        dragModeToggle.style.backgroundColor = this.dragEnabled ? '#e3f2fd' : 'white';
        
        // Add click handler
        dragModeToggle.addEventListener('click', () => {
            this.dragEnabled = !this.dragEnabled;
            
            if (this.dragEnabled) {
                // Enable dragging
                this.cy.nodes().grabify();
                dragModeToggle.style.backgroundColor = '#e3f2fd';
                dragModeToggle.title = 'Drag Mode: Enabled';
            } else {
                // Disable dragging
                this.cy.nodes().ungrabify();
                dragModeToggle.style.backgroundColor = 'white';
                dragModeToggle.title = 'Drag Mode: Disabled';
            }
        });
        
        // Add to graph controls
        const controlsContainer = document.querySelector('.graph-controls');
        if (controlsContainer) {
            // Create a new control group if it doesn't exist
            let dragControlGroup = controlsContainer.querySelector('.drag-control-group');
            if (!dragControlGroup) {
                dragControlGroup = document.createElement('div');
                dragControlGroup.className = 'graph-control-group drag-control-group';
                controlsContainer.appendChild(dragControlGroup);
            }
            
            dragControlGroup.appendChild(dragModeToggle);
        }
    }
    
    saveNodePosition(node) {
        // Save node position to localStorage
        const graphId = localStorage.getItem('aiCanvas_lastGraphId');
        if (!graphId) return;
        
        // Get existing positions
        const positionsKey = `aiCanvas_nodePositions_${graphId}`;
        let positions = {};
        
        try {
            const savedPositions = localStorage.getItem(positionsKey);
            if (savedPositions) {
                positions = JSON.parse(savedPositions);
            }
        } catch (error) {
            console.error('Error parsing saved positions:', error);
        }
        
        // Update position for this node
        positions[node.id()] = {
            x: node.position('x'),
            y: node.position('y')
        };
        
        // Save back to localStorage
        localStorage.setItem(positionsKey, JSON.stringify(positions));
    }
}

export default GraphNodeDragging;
