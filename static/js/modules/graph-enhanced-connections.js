// graph-enhanced-connections.js
// Fully corrected and functional version

window.GraphEnhancedConnections = class GraphEnhancedConnections {
    constructor(graphInteraction) {
        this.graphInteraction = graphInteraction;
        this.graphCore = graphInteraction.graphCore;
        this.cy = graphInteraction.cy;

        this.connectionTypes = [
            { id: 'provides_context', name: 'Provides Context', description: 'Source node provides context information to target node', lineStyle: 'solid', lineWidth: 2, color: '#3498db', icon: '📄' },
            { id: 'controls_flow', name: 'Controls Flow', description: 'Source node controls execution flow to target node', lineStyle: 'dashed', lineWidth: 2, color: '#e74c3c', icon: '🔄' },
            { id: 'data_transfer', name: 'Data Transfer', description: 'Source node transfers structured data to target node', lineStyle: 'solid', lineWidth: 3, color: '#27ae60', icon: '📊' },
            { id: 'conditional', name: 'Conditional', description: 'Conditional connection based on source node output', lineStyle: 'dotted', lineWidth: 2, color: '#f39c12', icon: '❓' },
            { id: 'feedback_loop', name: 'Feedback Loop', description: 'Target node provides feedback to source node', lineStyle: 'dashed', lineWidth: 2, color: '#9b59b6', icon: '🔁' },
            { id: 'reference', name: 'Reference', description: 'Target node references source node without direct data flow', lineStyle: 'dotted', lineWidth: 1, color: '#95a5a6', icon: '🔗' }
        ];
    }

    init() {
        this.registerConnectionEvents();
        this.createEnhancedConnectionLegend();
        this.applyEnhancedConnectionStyles();
        this.updateEnhancedConnectionBadges();
    }

    registerConnectionEvents() {
        this.cy.on('add remove', 'edge', () => {
            this.applyEnhancedConnectionStyles();
            this.updateEnhancedConnectionBadges();
        });

        this.cy.on('layoutstop pan zoom', () => {
            this.updateEnhancedConnectionBadges();
        });

        window.addEventListener('resize', () => {
            this.updateEnhancedConnectionBadges();
        });
    }

    applyEnhancedConnectionStyles() {
        this.cy.edges().forEach(edge => {
            const edgeType = edge.data('edge_type') || 'provides_context';
            edge.removeClass('edge-provides-context edge-controls-flow edge-data-transfer edge-conditional edge-feedback-loop edge-reference');
            edge.addClass(`edge-${edgeType.replace('_', '-')}`);

            const connectionType = this.connectionTypes.find(type => type.id === edgeType);
            if (connectionType) {
                edge.style({
                    'line-color': connectionType.color,
                    'target-arrow-color': connectionType.color,
                    'width': connectionType.lineWidth,
                    'line-style': connectionType.lineStyle
                });
            }
        });
    }

    updateEnhancedConnectionBadges() {
        document.querySelectorAll('.connection-badge').forEach(badge => badge.remove());

        const cyContainer = this.cy.container().parentNode;

        this.cy.edges().forEach(edge => {
            const edgeType = edge.data('edge_type') || 'provides_context';
            const midpoint = edge.renderedMidpoint();

            if (!midpoint || typeof midpoint.x !== 'number' || typeof midpoint.y !== 'number') {
                return;
            }

            const connectionType = this.connectionTypes.find(type => type.id === edgeType);
            if (!connectionType) return;

            const badge = document.createElement('div');
            badge.className = `connection-badge ${edgeType.replace('_', '-')}`;
            badge.style.cssText = `
                position: absolute;
                left: ${midpoint.x}px;
                top: ${midpoint.y}px;
                transform: translate(-50%, -50%);
                background-color: ${connectionType.color};
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 12px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 10;
                cursor: pointer;
            `;

            badge.textContent = connectionType.icon || connectionType.name.charAt(0);
            badge.title = `${connectionType.name}: ${connectionType.description}`;

            const cyContainer = this.cy.container().parentNode;
            cyContainer.appendChild(badge);
        });
    }

    createEnhancedConnectionLegend() {
        const legend = document.createElement('div');
        legend.className = 'connection-legend';
        legend.style = 'position:absolute; bottom:20px; left:20px; background:white; padding:12px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);z-index:10;max-width:300px;';

        const title = document.createElement('div');
        title.textContent = 'Connection Types';
        title.style = 'font-weight:bold;margin-bottom:10px;font-size:14px;';
        legend.appendChild(title);

        this.connectionTypes.forEach(type => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.marginBottom = '8px';

            const icon = document.createElement('span');
            icon.textContent = type.icon;
            icon.style.marginRight = '8px';

            const desc = document.createElement('span');
            desc.textContent = `${type.name} - ${type.description}`;
            desc.style.fontSize = '12px';

            item.appendChild(icon);
            item.appendChild(desc);
            legend.appendChild(item);
        });

        const container = this.cy.container().parentNode;
        container.appendChild(legend);
    }
};

window.GraphEnhancedConnections = GraphEnhancedConnections;
