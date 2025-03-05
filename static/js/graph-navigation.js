/**
 * graph-navigation.js - Navigation controls for Cytoscape.js graph visualization
 */

class GraphNavigation {
    constructor(graphCore) {
        this.graphCore = graphCore;
        this.cy = graphCore.cy;
        this.zoomFactor = 1.2; // Zoom factor for zoom in/out
        this.panDistance = 100; // Pan distance in pixels
        this.controlsContainer = null;
        this.minimap = null;
        this.searchTimeout = null;
    }

    init() {
        this.setupKeyboardControls();
        this.createNavigationControls();
        this.createMinimap();
        this.createSearchControls();
        this.createTimelineControls();
    }

    setupKeyboardControls() {
        // Keyboard shortcuts for navigation
        document.addEventListener('keydown', (event) => {
            // Only handle keyboard events when the graph is in focus
            const graphContainer = document.getElementById('cy');
            if (!graphContainer.contains(document.activeElement) && 
                document.activeElement !== document.body) {
                return;
            }
            
            switch (event.key) {
                case '+':
                case '=':
                    this.zoomIn();
                    event.preventDefault();
                    break;
                case '-':
                case '_':
                    this.zoomOut();
                    event.preventDefault();
                    break;
                case '0':
                    this.resetZoom();
                    event.preventDefault();
                    break;
                case 'ArrowUp':
                    this.panUp();
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                    this.panDown();
                    event.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.panLeft();
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    this.panRight();
                    event.preventDefault();
                    break;
                case 'f':
                    this.fitGraph();
                    event.preventDefault();
                    break;
                case 'g':
                    this.toggleGrid();
                    event.preventDefault();
                    break;
            }
        });
    }

    createNavigationControls() {
        // Create navigation controls container
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.className = 'graph-controls';
        
        // Add zoom controls
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        
        const zoomInBtn = this.createControlButton('+', 'Zoom In', () => this.zoomIn());
        const zoomOutBtn = this.createControlButton('-', 'Zoom Out', () => this.zoomOut());
        const resetZoomBtn = this.createControlButton('1:1', 'Reset Zoom', () => this.resetZoom());
        const fitBtn = this.createControlButton('Fit', 'Fit to View', () => this.fitGraph());
        
        zoomControls.appendChild(zoomInBtn);
        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(resetZoomBtn);
        zoomControls.appendChild(fitBtn);
        
        // Add pan controls
        const panControls = document.createElement('div');
        panControls.className = 'pan-controls';
        
        const panUpBtn = this.createControlButton('↑', 'Pan Up', () => this.panUp());
        const panDownBtn = this.createControlButton('↓', 'Pan Down', () => this.panDown());
        const panLeftBtn = this.createControlButton('←', 'Pan Left', () => this.panLeft());
        const panRightBtn = this.createControlButton('→', 'Pan Right', () => this.panRight());
        
        const panButtonsTop = document.createElement('div');
        panButtonsTop.className = 'pan-buttons-row';
        panButtonsTop.appendChild(panUpBtn);
        
        const panButtonsMiddle = document.createElement('div');
        panButtonsMiddle.className = 'pan-buttons-row';
        panButtonsMiddle.appendChild(panLeftBtn);
        panButtonsMiddle.appendChild(panRightBtn);
        
        const panButtonsBottom = document.createElement('div');
        panButtonsBottom.className = 'pan-buttons-row';
        panButtonsBottom.appendChild(panDownBtn);
        
        panControls.appendChild(panButtonsTop);
        panControls.appendChild(panButtonsMiddle);
        panControls.appendChild(panButtonsBottom);
        
        // Add grid controls
        const gridControls = document.createElement('div');
        gridControls.className = 'grid-controls';
        
        const toggleGridBtn = this.createControlButton('Grid', 'Toggle Grid', () => this.toggleGrid());
        gridControls.appendChild(toggleGridBtn);
        
        // Add all controls to container
        this.controlsContainer.appendChild(zoomControls);
        this.controlsContainer.appendChild(panControls);
        this.controlsContainer.appendChild(gridControls);
        
        // Add to document
        const graphContainer = document.getElementById('cy');
        graphContainer.parentNode.appendChild(this.controlsContainer);
    }

    createControlButton(text, title, onClick) {
        const button = document.createElement('button');
        button.className = 'graph-control-btn';
        button.textContent = text;
        button.title = title;
        button.addEventListener('click', onClick);
        return button;
    }

    zoomIn() {
        this.cy.zoom({
            level: this.cy.zoom() * this.zoomFactor,
            renderedPosition: {
                x: this.cy.width() / 2,
                y: this.cy.height() / 2
            }
        });
    }

    zoomOut() {
        this.cy.zoom({
            level: this.cy.zoom() / this.zoomFactor,
            renderedPosition: {
                x: this.cy.width() / 2,
                y: this.cy.height() / 2
            }
        });
    }

    resetZoom() {
        this.cy.zoom(1);
        this.cy.center();
    }

    fitGraph() {
        this.cy.fit();
    }

    panUp() {
        this.cy.panBy({ x: 0, y: this.panDistance });
    }

    panDown() {
        this.cy.panBy({ x: 0, y: -this.panDistance });
    }

    panLeft() {
        this.cy.panBy({ x: this.panDistance, y: 0 });
    }

    panRight() {
        this.cy.panBy({ x: -this.panDistance, y: 0 });
    }

    toggleGrid() {
        this.graphCore.gridEnabled = !this.graphCore.gridEnabled;
        
        if (this.graphCore.gridEnabled) {
            this.cy.container().classList.add('grid-background');
        } else {
            this.cy.container().classList.remove('grid-background');
        }
        
        // Update grid button appearance
        const gridButton = this.controlsContainer.querySelector('.grid-controls button');
        if (gridButton) {
            if (this.graphCore.gridEnabled) {
                gridButton.classList.add('active');
            } else {
                gridButton.classList.remove('active');
            }
        }
    }

    setGridSize(size) {
        this.graphCore.gridSize = size;
        
        // Update grid size in CSS
        const gridSize = `${size}px`;
        document.documentElement.style.setProperty('--grid-size', gridSize);
    }

    createMinimap() {
        // Create minimap container
        const minimapContainer = document.createElement('div');
        minimapContainer.id = 'graph-minimap';
        minimapContainer.className = 'graph-minimap';
        
        // Add to document
        const graphContainer = document.getElementById('cy');
        graphContainer.parentNode.appendChild(minimapContainer);
        
        // Check if cytoscape-minimap extension is available
        if (typeof this.cy.minimap === 'function') {
            // Initialize minimap
            this.minimap = this.cy.minimap({
                container: minimapContainer,
                width: 150,
                height: 100,
                fillColor: '#f5f5f5',
                strokeColor: '#ccc',
                nodeColor: '#3498db',
                nodeStrokeColor: '#2980b9',
                edgeColor: '#ccc'
            });
        } else {
            // Fallback if extension is not available
            console.warn('Cytoscape minimap extension not available. Loading it dynamically...');
            
            // Create a simple minimap representation
            minimapContainer.style.position = 'absolute';
            minimapContainer.style.bottom = '20px';
            minimapContainer.style.right = '20px';
            minimapContainer.style.width = '150px';
            minimapContainer.style.height = '100px';
            minimapContainer.style.backgroundColor = '#f5f5f5';
            minimapContainer.style.border = '1px solid #ccc';
            minimapContainer.style.borderRadius = '3px';
            minimapContainer.style.overflow = 'hidden';
            minimapContainer.style.zIndex = '10';
            
            // Add a message
            minimapContainer.innerHTML = '<div style="padding: 5px; font-size: 10px; text-align: center;">Minimap View</div>';
            
            // Try to load the extension dynamically
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/cytoscape-minimap@1.0.1/cytoscape-minimap.js';
            script.onload = () => {
                // Initialize minimap after loading
                this.minimap = this.cy.minimap({
                    container: minimapContainer,
                    width: 150,
                    height: 100,
                    fillColor: '#f5f5f5',
                    strokeColor: '#ccc',
                    nodeColor: '#3498db',
                    nodeStrokeColor: '#2980b9',
                    edgeColor: '#ccc'
                });
            };
            document.head.appendChild(script);
        }
    }
    
    createSearchControls() {
        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-controls';
        
        // Create search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search nodes...';
        searchInput.className = 'search-input';
        
        // Create search results container
        const searchResults = document.createElement('div');
        searchResults.className = 'search-results';
        searchResults.style.display = 'none';
        
        // Add event listeners
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            
            // Clear previous timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            // Set a timeout to avoid searching on every keystroke
            this.searchTimeout = setTimeout(() => {
                if (query.length < 2) {
                    searchResults.style.display = 'none';
                    return;
                }
                
                // Search for nodes
                const matchingNodes = this.cy.nodes().filter(node => {
                    const name = node.data('name') || '';
                    return name.toLowerCase().includes(query);
                });
                
                // Display results
                if (matchingNodes.length > 0) {
                    searchResults.innerHTML = '';
                    searchResults.style.display = 'block';
                    
                    matchingNodes.forEach(node => {
                        const resultItem = document.createElement('div');
                        resultItem.className = 'search-result-item';
                        resultItem.textContent = node.data('name');
                        
                        resultItem.addEventListener('click', () => {
                            // Center on the node
                            this.cy.center(node);
                            // Zoom in slightly
                            this.cy.zoom(1.5);
                            // Select the node
                            this.graphCore.selectedNode = node.id();
                            this.cy.$('.selected').removeClass('selected');
                            node.addClass('selected');
                            
                            // Trigger node selection event
                            const nodeData = {
                                id: node.id(),
                                name: node.data('name'),
                                backend: node.data('backend'),
                                model: node.data('model'),
                                systemMessage: node.data('systemMessage'),
                                temperature: node.data('temperature'),
                                maxTokens: node.data('maxTokens')
                            };
                            
                            const event = new CustomEvent('nodeSelected', { detail: nodeData });
                            document.dispatchEvent(event);
                            
                            // Clear search
                            searchInput.value = '';
                            searchResults.style.display = 'none';
                        });
                        
                        searchResults.appendChild(resultItem);
                    });
                } else {
                    searchResults.innerHTML = '<div class="search-no-results">No nodes found</div>';
                    searchResults.style.display = 'block';
                }
            }, 300);
        });
        
        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
        
        // Add to container
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchResults);
        
        // Add to controls
        this.controlsContainer.appendChild(searchContainer);
    }
    
    createTimelineControls() {
        // Create timeline container
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';
        
        // Create timeline progress bar
        const timelineProgress = document.createElement('div');
        timelineProgress.className = 'timeline-progress';
        
        // Create timeline steps container
        const timelineSteps = document.createElement('div');
        timelineSteps.className = 'timeline-steps';
        
        // Add to container
        timelineContainer.appendChild(timelineProgress);
        timelineContainer.appendChild(timelineSteps);
        
        // Add to document
        const graphContainer = document.getElementById('cy');
        graphContainer.parentNode.appendChild(timelineContainer);
        
        // Store reference
        this.timelineContainer = timelineContainer;
        this.timelineProgress = timelineProgress;
        this.timelineSteps = timelineSteps;
    }
    
    updateTimeline(executionOrder, currentStep) {
        if (!executionOrder || executionOrder.length === 0) {
            this.timelineContainer.style.display = 'none';
            return;
        }
        
        // Show timeline
        this.timelineContainer.style.display = 'block';
        
        // Clear previous steps
        this.timelineSteps.innerHTML = '';
        
        // Calculate progress percentage
        const progressPercent = currentStep > 0 ? (currentStep / (executionOrder.length - 1)) * 100 : 0;
        this.timelineProgress.style.width = `${progressPercent}%`;
        
        // Add steps
        executionOrder.forEach((nodeId, index) => {
            const step = document.createElement('div');
            step.className = 'timeline-step';
            
            // Add status class
            if (index < currentStep) {
                step.classList.add('completed');
            } else if (index === currentStep) {
                step.classList.add('active');
            }
            
            // Get node data
            const node = this.cy.$(`#${nodeId}`);
            if (node.length > 0) {
                step.title = node.data('name');
            }
            
            // Add click handler
            step.addEventListener('click', () => {
                // Trigger step change event
                const event = new CustomEvent('timelineStepSelected', { 
                    detail: { step: index, nodeId: nodeId } 
                });
                document.dispatchEvent(event);
            });
            
            this.timelineSteps.appendChild(step);
        });
    }
}

// Export the GraphNavigation
window.GraphNavigation = GraphNavigation;
