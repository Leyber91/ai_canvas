/**
 * graph-connection-ui.js - Connection UI components and creation panel
 */

class GraphConnectionUI {
    constructor(graphInteraction) {
        this.graphInteraction = graphInteraction;
        this.graphCore = graphInteraction.graphCore;
        this.cy = graphInteraction.cy;
    }

    createConnectionCreationPanel() {
        // Create connection type selection panel
        const panel = document.createElement('div');
        panel.id = 'connection-creation-panel';
        panel.className = 'connection-creation-panel';
        
        panel.innerHTML = `
            <h3>Select Connection Type</h3>
            <div class="connection-type-selector">
                ${this.graphInteraction.connectionTypes.map(type => `
                    <div class="connection-type-option" data-type="${type.id}">
                        <div class="connection-type-color ${type.id.replace('_', '-')}"></div>
                        <div>
                            <strong>${type.name}</strong>
                            <div>${type.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="connection-actions">
                <button id="cancel-connection-btn">Cancel</button>
                <button id="create-connection-btn">Create Connection</button>
            </div>
        `;
        
        // Add to document but keep hidden
        panel.style.display = 'none';
        document.body.appendChild(panel);
        
        // Add event listeners
        const typeOptions = panel.querySelectorAll('.connection-type-option');
        typeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                typeOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                option.classList.add('selected');
            });
        });
        
        // Select default option
        const defaultOption = panel.querySelector(`.connection-type-option[data-type="${this.graphInteraction.defaultConnectionType}"]`);
        if (defaultOption) {
            defaultOption.classList.add('selected');
        }
        
        // Cancel button
        const cancelBtn = panel.querySelector('#cancel-connection-btn');
        cancelBtn.addEventListener('click', () => {
            this.graphInteraction.edgeHandling.hideConnectionTypePanel();
        });
        
        // Create button
        const createBtn = panel.querySelector('#create-connection-btn');
        createBtn.addEventListener('click', () => {
            const selectedOption = panel.querySelector('.connection-type-option.selected');
            if (selectedOption) {
                const edgeType = selectedOption.getAttribute('data-type');
                this.graphInteraction.edgeHandling.createConnection(edgeType);
            } else {
                this.graphInteraction.edgeHandling.createConnection(this.graphInteraction.defaultConnectionType);
            }
        });
    }

    // Method to apply connection styles to edges based on their type
    applyConnectionStyles() {
        // Get all edges
        const edges = this.cy.edges();
        
        // Apply styles based on edge type
        edges.forEach(edge => {
            const edgeType = edge.data('edge_type') || 'provides_context';
            
            // Remove all type classes
            edge.removeClass('edge-provides-context edge-controls-flow edge-data-transfer edge-conditional');
            
            // Add class for current type
            edge.addClass(`edge-${edgeType.replace('_', '-')}`);
        });
    }

    // Method to update connection type badges
    updateConnectionBadges() {
        // Remove existing badges
        document.querySelectorAll('.connection-type-badge').forEach(badge => {
            badge.parentNode.removeChild(badge);
        });
        
        // Get all edges
        const edges = this.cy.edges();
        
        // Create badges for each edge
        edges.forEach(edge => {
            const edgeType = edge.data('edge_type') || 'provides_context';
            const midpoint = edge.renderedMidpoint();
            
            // Create badge
            const badge = document.createElement('div');
            badge.className = `connection-type-badge ${edgeType.replace('_', '-')}`;
            
            // Get connection type name (abbreviated)
            const connectionType = this.graphInteraction.connectionTypes.find(type => type.id === edgeType);
            const typeName = connectionType ? connectionType.name.charAt(0) : 'P';
            
            badge.textContent = typeName;
            
            // Position badge
            badge.style.position = 'absolute';
            badge.style.left = `${midpoint.x}px`;
            badge.style.top = `${midpoint.y}px`;
            badge.style.transform = 'translate(-50%, -50%)';
            
            // Add to document
            const container = this.cy.container();
            container.parentNode.appendChild(badge);
        });
    }

    // Method to create a connection type legend
    createConnectionLegend() {
        // Create legend container
        const legend = document.createElement('div');
        legend.className = 'connection-legend';
        legend.style.position = 'absolute';
        legend.style.bottom = '20px';
        legend.style.left = '20px';
        legend.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        legend.style.padding = '10px';
        legend.style.borderRadius = '5px';
        legend.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        legend.style.zIndex = '10';
        
        // Create legend title
        const title = document.createElement('div');
        title.textContent = 'Connection Types';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '5px';
        legend.appendChild(title);
        
        // Create legend items
        this.graphInteraction.connectionTypes.forEach(type => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.marginBottom = '3px';
            
            const color = document.createElement('div');
            color.className = `connection-type-color ${type.id.replace('_', '-')}`;
            color.style.width = '12px';
            color.style.height = '12px';
            color.style.borderRadius = '50%';
            color.style.marginRight = '5px';
            
            const name = document.createElement('div');
            name.textContent = type.name;
            name.style.fontSize = '12px';
            
            item.appendChild(color);
            item.appendChild(name);
            legend.appendChild(item);
        });
        
        // Add to document
        const container = this.cy.container();
        container.parentNode.appendChild(legend);
        
        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'legend-toggle';
        toggleBtn.textContent = 'Legend';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.bottom = '20px';
        toggleBtn.style.left = '20px';
        toggleBtn.style.zIndex = '11';
        toggleBtn.style.display = 'none';
        
        toggleBtn.addEventListener('click', () => {
            legend.style.display = 'block';
            toggleBtn.style.display = 'none';
        });
        
        // Add close button to legend
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '8px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontWeight = 'bold';
        
        closeBtn.addEventListener('click', () => {
            legend.style.display = 'none';
            toggleBtn.style.display = 'block';
        });
        
        legend.appendChild(closeBtn);
        container.parentNode.appendChild(toggleBtn);
    }
}


export default GraphConnectionUI;

