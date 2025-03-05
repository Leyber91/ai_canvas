/**
 * graph-edge-handling.js - Edge creation and management functionality
 * Enhanced version with fixes for connection visualization issues
 */

class GraphEdgeHandling {
    constructor(graphInteraction) {
        this.graphInteraction = graphInteraction;
        this.graphCore = graphInteraction.graphCore;
        this.cy = graphInteraction.cy;
        this.tempEdge = null;
        this.connectionInProgress = false;
        this.edgeDrawingMessageContainer = null;
    }

    setupEdgeHandling() {
        // Edge drawing mode
        this.cy.on('tapstart', 'node', (event) => {
            if (this.graphInteraction.edgeDrawingMode) {
                this.graphInteraction.edgeSource = event.target;
            }
        });
        
        this.cy.on('tapend', 'node', (event) => {
            if (this.graphInteraction.edgeDrawingMode && this.graphInteraction.edgeSource) {
                const target = event.target;
                
                // Don't create self-loops
                if (target.id() !== this.graphInteraction.edgeSource.id()) {
                    // Show connection type selection panel
                    this.showConnectionTypePanel(this.graphInteraction.edgeSource.id(), target.id());
                }
            }
        });

        // Add global event listener for the connectionComplete event
        document.addEventListener('connectionComplete', this.handleConnectionComplete.bind(this));
    }

    // New method to handle connection completion
    handleConnectionComplete(event) {
        console.log('Connection complete event received:', event.detail);
        
        // Apply styles and update badges after a short delay to ensure layout is stable
        setTimeout(() => {
            if (this.graphInteraction.connectionUI) {
                console.log('Applying connection styles after completion');
                this.graphInteraction.connectionUI.applyConnectionStyles();
                
                console.log('Updating connection badges after completion');
                this.graphInteraction.connectionUI.updateConnectionBadges();
            } else {
                console.error('connectionUI not available in graphInteraction');
            }
        }, 150); // Wait 150ms for layout to stabilize
    }

    setupEdgeHover() {
        // Edge hover effects
        this.cy.on('mouseover', 'edge', (event) => {
            const edge = event.target;
            edge.addClass('edge-hover');
            
            // Show connection type tooltip
            this.showConnectionTooltip(edge);
        });
        
        this.cy.on('mouseout', 'edge', (event) => {
            const edge = event.target;
            edge.removeClass('edge-hover');
            
            // Hide tooltip
            this.hideConnectionTooltip();
        });
        
        // Edge selection
        this.cy.on('tap', 'edge', (event) => {
            const edge = event.target;
            
            // Toggle selection
            if (edge.hasClass('edge-selected')) {
                edge.removeClass('edge-selected');
            } else {
                this.cy.$('.edge-selected').removeClass('edge-selected');
                edge.addClass('edge-selected');
            }
        });
    }

    showConnectionTooltip(edge) {
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'connection-tooltip';
        tooltip.className = 'connection-tooltip';
        
        // Get edge data
        const sourceId = edge.data('source');
        const targetId = edge.data('target');
        const edgeType = edge.data('edge_type') || 'provides_context';
        
        // Get node names
        const sourceNode = this.cy.$(`#${sourceId}`);
        const targetNode = this.cy.$(`#${targetId}`);
        const sourceName = sourceNode.data('name');
        const targetName = targetNode.data('name');
        
        // Get connection type name
        const connectionType = this.graphInteraction.connectionTypes.find(type => type.id === edgeType);
        const typeName = connectionType ? connectionType.name : 'Provides Context';
        
        // Set tooltip content
        tooltip.innerHTML = `
            <div class="connection-tooltip-title">${sourceName} → ${targetName}</div>
            <div class="connection-tooltip-type">Type: ${typeName}</div>
        `;
        
        // Position tooltip near the edge midpoint
        const renderedMidpoint = edge.renderedMidpoint();
        tooltip.style.left = `${renderedMidpoint.x}px`;
        tooltip.style.top = `${renderedMidpoint.y - 40}px`;
        
        // Add to document
        document.body.appendChild(tooltip);
    }
    
    hideConnectionTooltip() {
        const tooltip = document.getElementById('connection-tooltip');
        if (tooltip) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }

    startEdgeDrawing(nodeId) {
        // Prevent starting edge drawing if already in progress
        if (this.connectionInProgress) {
            console.log('Connection already in progress, ignoring request');
            return;
        }
        
        console.log(`Starting edge drawing from node: ${nodeId}`);
        this.connectionInProgress = true;
        this.graphInteraction.edgeDrawingMode = true;
        this.graphInteraction.edgeSource = this.cy.$(`#${nodeId}`);
        
        // Visual feedback
        this.cy.elements().addClass('faded');
        this.graphInteraction.edgeSource.removeClass('faded');
        
        // Highlight potential target nodes
        this.cy.nodes().forEach(node => {
            if (node.id() !== nodeId) {
                node.removeClass('faded');
                node.addClass('potential-target');
            }
        });
        
        // Show message to user with cancel button
        this.edgeDrawingMessageContainer = document.createElement('div');
        this.edgeDrawingMessageContainer.className = 'edge-drawing-message-container';
        this.edgeDrawingMessageContainer.style.position = 'fixed';
        this.edgeDrawingMessageContainer.style.top = '10px';
        this.edgeDrawingMessageContainer.style.left = '50%';
        this.edgeDrawingMessageContainer.style.transform = 'translateX(-50%)';
        this.edgeDrawingMessageContainer.style.backgroundColor = '#3498db';
        this.edgeDrawingMessageContainer.style.color = 'white';
        this.edgeDrawingMessageContainer.style.padding = '10px 15px';
        this.edgeDrawingMessageContainer.style.borderRadius = '5px';
        this.edgeDrawingMessageContainer.style.zIndex = '1000';
        this.edgeDrawingMessageContainer.style.display = 'flex';
        this.edgeDrawingMessageContainer.style.alignItems = 'center';
        this.edgeDrawingMessageContainer.style.gap = '10px';
        this.edgeDrawingMessageContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        
        const message = document.createElement('div');
        message.textContent = 'Select target node to create connection';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.backgroundColor = 'white';
        cancelBtn.style.color = '#3498db';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '3px';
        cancelBtn.style.padding = '5px 10px';
        cancelBtn.style.cursor = 'pointer';
        
        cancelBtn.addEventListener('click', () => {
            this.cancelEdgeDrawing();
        });
        
        this.edgeDrawingMessageContainer.appendChild(message);
        this.edgeDrawingMessageContainer.appendChild(cancelBtn);
        document.body.appendChild(this.edgeDrawingMessageContainer);
        
        // Cancel on background click
        const cancelHandler = (e) => {
            if (e.target === this.cy) {
                this.cancelEdgeDrawing();
                this.cy.off('tap', cancelHandler);
            }
        };
        
        this.cy.on('tap', cancelHandler);
        
        // Add hover effect for potential target nodes
        this.cy.on('mouseover', 'node.potential-target', (event) => {
            const node = event.target;
            node.addClass('hover-target');
            
            // Show temporary edge
            this.showTemporaryEdge(this.graphInteraction.edgeSource, node);
        });
        
        this.cy.on('mouseout', 'node.potential-target', (event) => {
            const node = event.target;
            node.removeClass('hover-target');
            
            // Remove temporary edge
            this.removeTemporaryEdge();
        });
    }
    
    cancelEdgeDrawing() {
        console.log('Cancelling edge drawing');
        this.connectionInProgress = false;
        this.graphInteraction.edgeDrawingMode = false;
        this.graphInteraction.edgeSource = null;
        this.cy.elements().removeClass('faded potential-target hover-target');
        
        // Remove the message container if it exists
        if (this.edgeDrawingMessageContainer && this.edgeDrawingMessageContainer.parentNode) {
            this.edgeDrawingMessageContainer.parentNode.removeChild(this.edgeDrawingMessageContainer);
            this.edgeDrawingMessageContainer = null;
        }
        
        // Remove temporary edge if exists
        this.removeTemporaryEdge();
        
        // Remove hover event handlers
        this.cy.off('mouseover', 'node.potential-target');
        this.cy.off('mouseout', 'node.potential-target');
        
        // Dispatch event for connection cancel
        document.dispatchEvent(new CustomEvent('connectionCancelled'));
    }
    
    showTemporaryEdge(sourceNode, targetNode) {
        // Remove any existing temporary edge
        this.removeTemporaryEdge();
        
        // Create a temporary edge
        this.tempEdge = this.cy.add({
            group: 'edges',
            data: {
                id: 'temp-edge',
                source: sourceNode.id(),
                target: targetNode.id()
            },
            classes: 'temp-edge'
        });
        
        // Style the temporary edge
        this.tempEdge.style({
            'line-color': '#3498db',
            'target-arrow-color': '#3498db',
            'width': 2,
            'line-style': 'dashed',
            'opacity': 0.7
        });
    }
    
    removeTemporaryEdge() {
        if (this.tempEdge) {
            this.cy.remove(this.tempEdge);
            this.tempEdge = null;
        }
    }

    showConnectionTypePanel(sourceId, targetId) {
        console.log(`Showing connection type panel for ${sourceId} -> ${targetId}`);
        // Store source and target IDs
        this.graphInteraction.edgeSource = this.cy.$(`#${sourceId}`);
        this.graphInteraction.edgeTarget = this.cy.$(`#${targetId}`);
        
        // Show panel
        const panel = document.getElementById('connection-creation-panel');
        if (panel) {
            panel.style.display = 'block';
        } else {
            console.error('Connection creation panel element not found');
        }
    }
    
    hideConnectionTypePanel() {
        console.log('Hiding connection type panel');
        // Hide panel
        const panel = document.getElementById('connection-creation-panel');
        if (panel) {
            panel.style.display = 'none';
        }
        
        // Reset edge drawing mode
        this.connectionInProgress = false;
        this.graphInteraction.edgeDrawingMode = false;
        this.graphInteraction.edgeSource = null;
        this.graphInteraction.edgeTarget = null;
        
        // Clean up UI elements
        this.cy.elements().removeClass('faded potential-target hover-target');
        
        // Remove temporary edge if exists
        this.removeTemporaryEdge();
        
        // Remove edge drawing message container
        if (this.edgeDrawingMessageContainer && this.edgeDrawingMessageContainer.parentNode) {
            this.edgeDrawingMessageContainer.parentNode.removeChild(this.edgeDrawingMessageContainer);
            this.edgeDrawingMessageContainer = null;
        }
        
        // Remove hover event handlers
        this.cy.off('mouseover', 'node.potential-target');
        this.cy.off('mouseout', 'node.potential-target');
    }
    
    createConnection(edgeType) {
        if (!this.graphInteraction.edgeSource || !this.graphInteraction.edgeTarget) {
            console.error('Source or target node is missing');
            this.hideConnectionTypePanel();
            return;
        }
        
        // Create edge with specified type
        const sourceId = this.graphInteraction.edgeSource.id();
        const targetId = this.graphInteraction.edgeTarget.id();
        
        console.log(`Creating connection: ${sourceId} -> ${targetId} (${edgeType})`);
        
        // Add edge to graph
        const edgeId = this.graphCore.addEdge(sourceId, targetId, edgeType);
        
        if (!edgeId) {
            console.error('Failed to create edge in graph core');
            this.hideConnectionTypePanel();
            return;
        }
        
        // Save edge to backend
        this.saveEdgeToBackend(sourceId, targetId, edgeType);
        
        // Hide panel
        this.hideConnectionTypePanel();
        
        // Reset connection state
        this.connectionInProgress = false;
    }
    
    saveEdgeToBackend(sourceId, targetId, edgeType) {
        // Prepare edge data
        const edgeData = {
            source: sourceId,
            target: targetId,
            type: edgeType
        };
        
        console.log('Saving edge to backend:', edgeData);
        
        // Save to backend - Use a reference to this that won't be lost in callbacks
        const self = this;
        
        fetch('/api/edges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(edgeData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                console.log('Edge saved to backend successfully:', data.data);
                
                // Apply connection styles - using the saved reference to this
                if (self.graphInteraction && self.graphInteraction.connectionUI) {
                    console.log('Applying connection styles after save');
                    self.graphInteraction.connectionUI.applyConnectionStyles();
                } else {
                    console.error('connectionUI not available');
                }
                
                // Dispatch connection complete event with details
                document.dispatchEvent(new CustomEvent('connectionComplete', { 
                    detail: {
                        sourceId: sourceId,
                        targetId: targetId,
                        edgeType: edgeType,
                        edgeId: data.data.id || `${sourceId}-${targetId}`
                    }
                }));
                
                // Add a second trigger for badge updates with a delay
                setTimeout(() => {
                    // Final update of badges after layout has stabilized
                    if (self.graphInteraction && self.graphInteraction.connectionUI) {
                        console.log('Updating badges with delay after save');
                        self.graphInteraction.connectionUI.updateConnectionBadges();
                    }
                }, 300);
            } else {
                console.error('Failed to save edge:', data.message);
                // Show error to user
                self.showConnectionError(data.message || 'Failed to save connection');
            }
        })
        .catch(error => {
            console.error('Error saving edge:', error);
            // Show error to user
            self.showConnectionError(error.message || 'Error creating connection');
        });
    }

    // New method to show connection errors
    showConnectionError(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'connection-error-toast';
        errorToast.style.position = 'fixed';
        errorToast.style.bottom = '20px';
        errorToast.style.right = '20px';
        errorToast.style.backgroundColor = '#e74c3c';
        errorToast.style.color = 'white';
        errorToast.style.padding = '10px 15px';
        errorToast.style.borderRadius = '5px';
        errorToast.style.zIndex = '1000';
        errorToast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        
        errorToast.textContent = `Connection Error: ${message}`;
        
        document.body.appendChild(errorToast);
        
        // Remove the toast after 5 seconds
        setTimeout(() => {
            if (document.body.contains(errorToast)) {
                document.body.removeChild(errorToast);
            }
        }, 5000);
    }

    showConnectionTypeEditor(edge) {
        // Get edge data
        const sourceId = edge.data('source');
        const targetId = edge.data('target');
        const currentType = edge.data('edge_type') || 'provides_context';
        
        // Create modal for editing connection type
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.style.display = 'block';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        const title = document.createElement('h2');
        title.textContent = 'Edit Connection Type';
        
        // Create connection type options
        const typeSelector = document.createElement('div');
        typeSelector.className = 'connection-type-selector';
        
        this.graphInteraction.connectionTypes.forEach(type => {
            const option = document.createElement('div');
            option.className = `connection-type-option ${type.id === currentType ? 'selected' : ''}`;
            option.setAttribute('data-type', type.id);
            
            const colorDiv = document.createElement('div');
            colorDiv.className = `connection-type-color ${type.id.replace('_', '-')}`;
            
            const textDiv = document.createElement('div');
            textDiv.innerHTML = `
                <strong>${type.name}</strong>
                <div>${type.description}</div>
            `;
            
            option.appendChild(colorDiv);
            option.appendChild(textDiv);
            
            option.addEventListener('click', () => {
                // Remove selected class from all options
                typeSelector.querySelectorAll('.connection-type-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                // Add selected class to clicked option
                option.classList.add('selected');
            });
            
            typeSelector.appendChild(option);
        });
        
        // Create action buttons
        const actions = document.createElement('div');
        actions.className = 'form-actions';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        
        // Use a proper reference to this
        const self = this;
        
        saveBtn.addEventListener('click', () => {
            const selectedOption = typeSelector.querySelector('.connection-type-option.selected');
            if (selectedOption) {
                const newType = selectedOption.getAttribute('data-type');
                
                // Update edge type
                edge.data('edge_type', newType);
                
                // Update edge style based on type
                edge.removeClass('edge-provides-context edge-controls-flow edge-data-transfer edge-conditional');
                edge.addClass(`edge-${newType.replace('_', '-')}`);
                
                // Apply connection styles
                if (self.graphInteraction && self.graphInteraction.connectionUI) {
                    self.graphInteraction.connectionUI.applyConnectionStyles();
                    
                    // Update badges with delay
                    setTimeout(() => {
                        self.graphInteraction.connectionUI.updateConnectionBadges();
                    }, 100);
                }
                
                // Dispatch connection updated event
                document.dispatchEvent(new CustomEvent('connectionUpdated', { 
                    detail: {
                        edgeId: edge.id(),
                        sourceId: sourceId,
                        targetId: targetId,
                        edgeType: newType
                    }
                }));
                
                // Close modal
                document.body.removeChild(overlay);
            }
        });
        
        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        
        // Assemble modal
        content.appendChild(closeBtn);
        content.appendChild(title);
        content.appendChild(typeSelector);
        content.appendChild(actions);
        overlay.appendChild(content);
        
        // Add to document
        document.body.appendChild(overlay);
    }

    // New method to validate connections against backend
    validateConnections() {
        // Get all edges in the graph
        const edges = this.cy.edges();
        const edgeData = [];
        
        edges.forEach(edge => {
            edgeData.push({
                id: edge.id(),
                source: edge.data('source'),
                target: edge.data('target')
            });
        });
        
        // Skip if no edges
        if (edgeData.length === 0) {
            console.log('No edges to validate');
            return Promise.resolve([]);
        }
        
        console.log(`Validating ${edgeData.length} connections`);
        
        // Validate with the backend
        return fetch('/api/edges/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ edges: edgeData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const results = data.data;
                const invalidEdges = [];
                
                // Check results
                Object.entries(results).forEach(([edgeId, isValid]) => {
                    if (!isValid) {
                        invalidEdges.push(edgeId);
                    }
                });
                
                if (invalidEdges.length > 0) {
                    console.warn(`Found ${invalidEdges.length} invalid edges:`, invalidEdges);
                } else {
                    console.log('All connections are valid');
                }
                
                return invalidEdges;
            } else {
                console.error('Error validating connections:', data.message);
                return [];
            }
        })
        .catch(error => {
            console.error('Error calling connection validation:', error);
            return [];
        });
    }
}

// Export the GraphEdgeHandling
export default GraphEdgeHandling;