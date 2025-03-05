/**
 * graph-context-menu.js - Context menu functionality for nodes and edges
 */

class GraphContextMenu {
    constructor(graphInteraction) {
        this.graphInteraction = graphInteraction;
        this.graphCore = graphInteraction.graphCore;
        this.cy = graphInteraction.cy;
    }

    setupContextMenu() {
        // Custom context menu for nodes
        this.cy.on('cxttap', 'node', (event) => {
            if (!this.graphInteraction.contextMenuEnabled) return;
            
            const node = event.target;
            const position = event.renderedPosition;
            
            this.showNodeContextMenu(node, position);
        });
        
        // Custom context menu for edges
        this.cy.on('cxttap', 'edge', (event) => {
            if (!this.graphInteraction.contextMenuEnabled) return;
            
            const edge = event.target;
            const position = event.renderedPosition;
            
            this.showEdgeContextMenu(edge, position);
        });
    }

    showNodeContextMenu(node, position) {
        // Create a context menu element
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${position.x}px`;
        menu.style.top = `${position.y}px`;
        menu.style.zIndex = 1000;
        
        // Get node data
        const nodeData = this.graphInteraction.getNodeData(node.id());
        const backend = nodeData ? nodeData.backend : '';
        
        // Add menu items
        const menuItems = [
            { 
                label: 'Edit Node', 
                icon: '✏️', 
                action: () => this.editNode(node.id()) 
            },
            { 
                label: 'Remove Node', 
                icon: '🗑️', 
                action: () => this.graphCore.removeNode(node.id()) 
            },
            { 
                label: this.graphCore.pinnedNodes.has(node.id()) ? 'Unpin Node' : 'Pin Node', 
                icon: this.graphCore.pinnedNodes.has(node.id()) ? '📌' : '📍',
                action: () => this.graphInteraction.nodeSelection.togglePinNode(node.id()) 
            },
            { 
                label: 'Add Connection', 
                icon: '🔗', 
                action: () => this.graphInteraction.edgeHandling.startEdgeDrawing(node.id()) 
            },
            { 
                label: 'Center on Node', 
                icon: '🔍', 
                action: () => this.graphInteraction.nodeSelection.centerOnNode(node.id()) 
            },
            { 
                label: 'Duplicate Node', 
                icon: '📋', 
                action: () => this.graphInteraction.nodeSelection.duplicateNode(node.id()) 
            }
        ];
        
        // Add backend-specific menu items
        if (backend === 'ollama') {
            menuItems.push({
                label: 'View Model Info',
                icon: 'ℹ️',
                action: () => this.showModelInfo(node.id())
            });
        } else if (backend === 'groq') {
            menuItems.push({
                label: 'View API Usage',
                icon: '📊',
                action: () => this.showApiUsage(node.id())
            });
        }
        
        // Create menu sections
        const createSection = (items) => {
            const section = document.createElement('div');
            section.className = 'context-menu-section';
            
            items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                
                // Add icon if provided
                if (item.icon) {
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'context-menu-icon';
                    iconSpan.textContent = item.icon;
                    menuItem.appendChild(iconSpan);
                }
                
                // Add label
                const labelSpan = document.createElement('span');
                labelSpan.textContent = item.label;
                menuItem.appendChild(labelSpan);
                
                // Add click handler
                menuItem.addEventListener('click', () => {
                    item.action();
                    document.body.removeChild(menu);
                });
                
                section.appendChild(menuItem);
            });
            
            return section;
        };
        
        // Split menu items into sections
        const mainActions = menuItems.slice(0, 4);
        const secondaryActions = menuItems.slice(4);
        
        // Add sections to menu
        menu.appendChild(createSection(mainActions));
        
        if (secondaryActions.length > 0) {
            // Add separator
            const separator = document.createElement('div');
            separator.className = 'context-menu-separator';
            menu.appendChild(separator);
            
            // Add secondary actions
            menu.appendChild(createSection(secondaryActions));
        }
        
        // Add to document
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Delay adding the event listener to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    showEdgeContextMenu(edge, position) {
        // Create a context menu element
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${position.x}px`;
        menu.style.top = `${position.y}px`;
        menu.style.zIndex = 1000;
        
        // Get edge data
        const edgeType = edge.data('edge_type') || 'provides_context';
        
        // Add menu items
        const menuItems = [
            { 
                label: 'Change Connection Type', 
                icon: '🔄', 
                action: () => this.graphInteraction.edgeHandling.showConnectionTypeEditor(edge) 
            },
            { 
                label: 'Remove Connection', 
                icon: '🗑️', 
                action: () => this.graphCore.removeEdge(edge.id()) 
            }
        ];
        
        // Create menu items
        const createSection = (items) => {
            const section = document.createElement('div');
            section.className = 'context-menu-section';
            
            items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                
                // Add icon if provided
                if (item.icon) {
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'context-menu-icon';
                    iconSpan.textContent = item.icon;
                    menuItem.appendChild(iconSpan);
                }
                
                // Add label
                const labelSpan = document.createElement('span');
                labelSpan.textContent = item.label;
                menuItem.appendChild(labelSpan);
                
                // Add click handler
                menuItem.addEventListener('click', () => {
                    item.action();
                    document.body.removeChild(menu);
                });
                
                section.appendChild(menuItem);
            });
            
            return section;
        };
        
        // Add sections to menu
        menu.appendChild(createSection(menuItems));
        
        // Add to document
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Delay adding the event listener to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    editNode(nodeId) {
        // Trigger a custom event for node editing
        const nodeData = this.graphInteraction.getNodeData(nodeId);
        const event = new CustomEvent('editNode', { detail: nodeData });
        document.dispatchEvent(event);
    }
}

export default GraphContextMenu;