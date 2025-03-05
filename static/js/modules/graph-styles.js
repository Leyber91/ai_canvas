/**
 * graph-styles.js - Centralized management of graph styles and CSS
 */

class GraphStyles {
    /**
     * Add custom CSS styles for graph controls and UI elements
     */
    static addCustomStyles() {
        // Add CSS for graph controls
        const style = document.createElement('style');
        style.textContent = `
            .graph-controls {
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 10;
                display: flex;
                flex-direction: column;
                gap: 10px;
                background-color: rgba(255, 255, 255, 0.8);
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }
            
            .zoom-controls, .pan-controls, .grid-controls, .layout-controls, .workflow-controls {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 5px;
            }
            
            .graph-control-btn, .step-btn, .run-layout-btn, .execute-workflow-btn, .reset-btn {
                padding: 5px 10px;
                background-color: #3498db;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .graph-control-btn:hover, .step-btn:hover, .run-layout-btn:hover, .execute-workflow-btn:hover, .reset-btn:hover {
                background-color: #2980b9;
            }
            
            .graph-control-btn:disabled, .step-btn:disabled, .run-layout-btn:disabled, .execute-workflow-btn:disabled, .reset-btn:disabled {
                background-color: #95a5a6;
                cursor: not-allowed;
            }
            
            .graph-control-btn.active {
                background-color: #27ae60;
            }
            
            .pan-buttons-row {
                display: flex;
                justify-content: center;
                gap: 5px;
            }
            
            .layout-selector {
                padding: 5px;
                border-radius: 3px;
                border: 1px solid #ddd;
            }
            
            .step-controls {
                display: flex;
                gap: 5px;
            }
            
            .context-menu {
                background-color: white;
                border-radius: 3px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                overflow: hidden;
            }
            
            .context-menu-item {
                padding: 8px 12px;
                cursor: pointer;
            }
            
            .context-menu-item:hover {
                background-color: #f5f5f5;
            }
            
            .edge-drawing-message {
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #3498db;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                z-index: 1000;
            }
            
            .execution-result-tooltip {
                position: absolute;
                background-color: white;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                padding: 10px;
                max-width: 300px;
                z-index: 1000;
                display: none;
            }
            
            .execution-result-tooltip h4 {
                margin-top: 0;
                margin-bottom: 5px;
            }
            
            .execution-result-tooltip .result-content {
                max-height: 150px;
                overflow-y: auto;
                font-size: 12px;
                white-space: pre-wrap;
            }
            
            .execution-result-tooltip .error {
                color: #e74c3c;
            }
            
            .execution-results {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 10px;
            }
            
            .execution-result {
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 10px;
            }
            
            .execution-result h4 {
                margin-top: 0;
                margin-bottom: 5px;
            }
            
            .execution-result .result-content {
                background-color: #f5f5f5;
                padding: 8px;
                border-radius: 3px;
                max-height: 200px;
                overflow-y: auto;
                font-family: monospace;
                white-space: pre-wrap;
            }
            
            .execution-result .error {
                color: #e74c3c;
            }
            
            .step-execution-controls, .dialog-actions {
                margin-top: 15px;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .faded {
                opacity: 0.3;
            }
            
            .execution-path {
                line-color: #3498db;
                target-arrow-color: #3498db;
                width: 4px;
            }
            
            .execution-active {
                background-color: #e74c3c !important;
            }
            
            .execution-completed {
                background-color: #27ae60 !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Get Cytoscape style definitions
     * @returns {Array} Array of Cytoscape style objects
     */
    static getCytoscapeStyles() {
        return [
            {
                selector: 'node',
                style: {
                    'background-color': 'data(color)',
                    'label': 'data(name)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '12px',
                    'width': '140px',
                    'height': '50px',
                    'shape': 'round-rectangle',
                    'border-width': 2,
                    'border-color': '#666',
                    'text-wrap': 'wrap',
                    'text-max-width': '120px',
                    'text-overflow-wrap': 'ellipsis',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-weight': 'bold',
                    'z-index': 'data(zIndex)'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: '.selected',
                style: {
                    'border-width': 3,
                    'border-color': '#e74c3c'
                }
            },
            {
                selector: '.pinned',
                style: {
                    'border-width': 3,
                    'border-color': '#27ae60',
                    'border-style': 'double'
                }
            },
            {
                selector: '.execution-path',
                style: {
                    'line-color': '#3498db',
                    'target-arrow-color': '#3498db',
                    'width': 4,
                    'transition-property': 'line-color, target-arrow-color, width',
                    'transition-duration': '0.5s'
                }
            },
            {
                selector: '.grid-background',
                style: {
                    'background-image': 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M%200%2C0%20L%200%2C20%20M%200%2C0%20L%2020%2C0%22%20stroke%3D%22%23eee%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E',
                    'background-width': '20px',
                    'background-height': '20px'
                }
            }
        ];
    }
}

