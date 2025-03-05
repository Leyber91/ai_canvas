/**
 * graph-layout.js - Layout and positioning features for Cytoscape.js graph visualization
 */

class GraphLayout {
    constructor(graphCore) {
        this.graphCore = graphCore;
        this.cy = graphCore.cy;
        this.availableLayouts = {
            'grid': {
                name: 'grid',
                fit: true,
                padding: 30,
                avoidOverlap: true,
                rows: undefined
            },
            'circle': {
                name: 'circle',
                fit: true,
                padding: 30,
                avoidOverlap: true
            },
            'concentric': {
                name: 'concentric',
                fit: true,
                padding: 30,
                avoidOverlap: true,
                minNodeSpacing: 50
            },
            'cose': {
                name: 'cose',
                animate: true,
                animationDuration: 500,
                refresh: 20,
                fit: true,
                padding: 50,
                randomize: false,
                componentSpacing: 150,
                nodeRepulsion: 800000,  // Increased to prevent overlapping
                nodeOverlap: 20,        // Increased to prevent overlapping
                idealEdgeLength: 150,   // Increased for more spacing
                edgeElasticity: 100,
                nestingFactor: 5,
                gravity: 80,
                numIter: 1500,          // More iterations for better layout
                initialTemp: 200,
                coolingFactor: 0.95,
                minTemp: 1.0
            },
            'breadthfirst': {
                name: 'breadthfirst',
                fit: true,
                padding: 30,
                directed: true,
                spacingFactor: 1.5
            },
            'dagre': {
                name: 'dagre',
                fit: true,
                padding: 30,
                rankDir: 'TB',
                rankSep: 100,
                nodeSep: 50,
                edgeSep: 10
            }
        };
        this.currentLayout = 'cose';
    }

    init() {
        this.createLayoutControls();
    }

    createLayoutControls() {
        // Find the layout section in the graph controls
        const layoutSection = document.querySelector('.graph-controls .layout-section');
        
        if (!layoutSection) {
            console.error('Layout section not found in graph controls');
            return;
        }
        
        // Create layout selector
        const layoutSelector = document.createElement('select');
        layoutSelector.className = 'layout-selector';
        
        // Add layout options
        Object.keys(this.availableLayouts).forEach(layout => {
            const option = document.createElement('option');
            option.value = layout;
            option.textContent = this.formatLayoutName(layout);
            if (layout === this.currentLayout) {
                option.selected = true;
            }
            layoutSelector.appendChild(option);
        });
        
        // Add change event listener
        layoutSelector.addEventListener('change', () => {
            this.currentLayout = layoutSelector.value;
        });
        
        // Create run layout button
        const runLayoutBtn = document.createElement('button');
        runLayoutBtn.className = 'run-layout-btn';
        runLayoutBtn.textContent = 'Apply Layout';
        runLayoutBtn.addEventListener('click', () => this.runLayout());
        
        // Add controls to layout section
        layoutSection.appendChild(layoutSelector);
        layoutSection.appendChild(runLayoutBtn);
        
        // Add alignment controls
        const alignmentSection = document.createElement('div');
        alignmentSection.className = 'graph-control-section';
        alignmentSection.innerHTML = `
            <h4 class="control-section-title">Alignment</h4>
            <div class="graph-control-group">
                <button class="graph-control-button" title="Align Horizontally" id="align-horizontal">⬌</button>
                <button class="graph-control-button" title="Align Vertically" id="align-vertical">⬍</button>
                <button class="graph-control-button" title="Distribute Horizontally" id="distribute-horizontal">⇹</button>
                <button class="graph-control-button" title="Distribute Vertically" id="distribute-vertical">⥮</button>
            </div>
        `;
        
        // Add alignment section after layout section
        layoutSection.parentNode.insertBefore(alignmentSection, layoutSection.nextSibling);
        
        // Add event listeners for alignment buttons
        document.getElementById('align-horizontal').addEventListener('click', () => this.alignNodes('horizontal'));
        document.getElementById('align-vertical').addEventListener('click', () => this.alignNodes('vertical'));
        document.getElementById('distribute-horizontal').addEventListener('click', () => this.distributeNodes('horizontal'));
        document.getElementById('distribute-vertical').addEventListener('click', () => this.distributeNodes('vertical'));
    }

    formatLayoutName(name) {
        // Convert layout name to title case with spaces
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
    }

    runLayout() {
        // Get layout options
        const layoutOptions = this.availableLayouts[this.currentLayout];
        
        // Skip layout for pinned nodes
        if (this.graphCore.pinnedNodes.size > 0) {
            layoutOptions.eles = this.cy.elements().filter(ele => {
                return !ele.isNode() || !this.graphCore.pinnedNodes.has(ele.id());
            });
        } else {
            layoutOptions.eles = this.cy.elements();
        }
        
        // Run layout
        const layout = this.cy.layout(layoutOptions);
        layout.run();
        
        return layout;
    }

    saveNodePositions() {
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

    applyNodePositions(positions) {
        Object.keys(positions).forEach(nodeId => {
            const node = this.cy.$(`#${nodeId}`);
            if (node.length > 0) {
                node.position(positions[nodeId]);
            }
        });
        
        // Fit the graph to the viewport
        this.cy.fit();
    }

    alignNodes(alignment) {
        // Get selected nodes
        const selectedNodes = this.cy.$('node:selected');
        if (selectedNodes.length < 2) {
            console.warn('Select at least two nodes to align');
            return;
        }
        
        // Calculate positions
        const positions = [];
        selectedNodes.forEach(node => {
            positions.push({
                id: node.id(),
                position: node.position()
            });
        });
        
        // Sort nodes by position
        if (alignment === 'horizontal' || alignment === 'top' || alignment === 'bottom') {
            positions.sort((a, b) => a.position.x - b.position.x);
        } else {
            positions.sort((a, b) => a.position.y - b.position.y);
        }
        
        // Calculate target position
        let targetValue;
        switch (alignment) {
            case 'horizontal':
                // Align to average y
                targetValue = positions.reduce((sum, p) => sum + p.position.y, 0) / positions.length;
                positions.forEach(p => {
                    this.cy.$(`#${p.id}`).position('y', targetValue);
                });
                break;
            case 'vertical':
                // Align to average x
                targetValue = positions.reduce((sum, p) => sum + p.position.x, 0) / positions.length;
                positions.forEach(p => {
                    this.cy.$(`#${p.id}`).position('x', targetValue);
                });
                break;
            case 'left':
                // Align to leftmost x
                targetValue = positions[0].position.x;
                positions.forEach(p => {
                    this.cy.$(`#${p.id}`).position('x', targetValue);
                });
                break;
            case 'right':
                // Align to rightmost x
                targetValue = positions[positions.length - 1].position.x;
                positions.forEach(p => {
                    this.cy.$(`#${p.id}`).position('x', targetValue);
                });
                break;
            case 'top':
                // Align to topmost y
                targetValue = positions[0].position.y;
                positions.forEach(p => {
                    this.cy.$(`#${p.id}`).position('y', targetValue);
                });
                break;
            case 'bottom':
                // Align to bottommost y
                targetValue = positions[positions.length - 1].position.y;
                positions.forEach(p => {
                    this.cy.$(`#${p.id}`).position('y', targetValue);
                });
                break;
        }
    }

    distributeNodes(direction) {
        // Get selected nodes
        const selectedNodes = this.cy.$('node:selected');
        if (selectedNodes.length < 3) {
            console.warn('Select at least three nodes to distribute');
            return;
        }
        
        // Calculate positions
        const positions = [];
        selectedNodes.forEach(node => {
            positions.push({
                id: node.id(),
                position: node.position()
            });
        });
        
        // Sort nodes by position
        if (direction === 'horizontal') {
            positions.sort((a, b) => a.position.x - b.position.x);
            
            // Calculate start and end points
            const startX = positions[0].position.x;
            const endX = positions[positions.length - 1].position.x;
            const totalDistance = endX - startX;
            const step = totalDistance / (positions.length - 1);
            
            // Distribute nodes
            for (let i = 1; i < positions.length - 1; i++) {
                const targetX = startX + (step * i);
                this.cy.$(`#${positions[i].id}`).position('x', targetX);
            }
        } else {
            positions.sort((a, b) => a.position.y - b.position.y);
            
            // Calculate start and end points
            const startY = positions[0].position.y;
            const endY = positions[positions.length - 1].position.y;
            const totalDistance = endY - startY;
            const step = totalDistance / (positions.length - 1);
            
            // Distribute nodes
            for (let i = 1; i < positions.length - 1; i++) {
                const targetY = startY + (step * i);
                this.cy.$(`#${positions[i].id}`).position('y', targetY);
            }
        }
    }
}

// Export the GraphLayout
window.GraphLayout = GraphLayout;
