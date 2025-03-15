/**
 * graph/NodeManager.js
 * 
 * Manages nodes in the graph, including creating, updating, 
 * and removing nodes, as well as tracking node selection.
 */
export class NodeManager {
  /**
   * @param {GraphManager} graphManager - The parent graph manager
   */
  constructor(graphManager) {
    this.graphManager = graphManager;
    this.nodes = [];
    this.selectedNodeId = null;
  }
  
  /**
   * Add a node to the graph
   * 
   * @param {Object} nodeData - Node data
   * @returns {string} Node ID
   */
  addNode(nodeData) {
    const { id, name, backend, model, systemMessage, temperature, maxTokens } = nodeData;
    
    // Ensure node is associated with current graph if it exists
    const currentGraphId = this.graphManager.getCurrentGraphId();
    if (currentGraphId && !nodeData.graph_id) {
      nodeData.graph_id = currentGraphId;
    }
    
    // Determine color based on backend
    const color = backend === 'ollama' ? '#3498db' : '#9b59b6';
    const classes = `${backend}-node`;
    
    // Check if node already exists
    const existingNode = this.graphManager.cytoscapeManager.findNode(id);
    if (existingNode.length > 0) {
      console.warn(`Node with ID ${id} already exists. Updating instead.`);
      return this.updateNode(id, nodeData);
    }
    
    // Create cytoscape data object
    const cyNodeData = {
      id,
      name,
      color,
      backend,
      model,
      systemMessage,
      temperature,
      maxTokens,
      graph_id: nodeData.graph_id
    };
    
    // Add node to Cytoscape
    this.graphManager.cytoscapeManager.addNode(id, cyNodeData, classes);
    
    // Add to internal nodes array
    this.nodes.push(nodeData);
    
    // Run layout if this is the first node
    if (this.nodes.length === 1) {
      this.graphManager.layoutManager.runLayout();
    }
    
    // Publish node added event
    this.graphManager.eventBus.publish('node:added', { id, nodeData });
    
    return id;
  }
  
  /**
   * Update an existing node
   * 
   * @param {string} nodeId - ID of the node to update
   * @param {Object} nodeData - New node data
   * @returns {boolean} Success
   */
  updateNode(nodeId, nodeData) {
    const node = this.graphManager.cytoscapeManager.findNode(nodeId);
    
    if (node.length === 0) {
      console.error(`Cannot update node: Node with ID ${nodeId} not found`);
      return false;
    }
    
    // Update node data
    node.data({
      ...nodeData,
      color: nodeData.backend === 'ollama' ? '#3498db' : '#9b59b6'
    });
    
    // Update classes
    node.removeClass('ollama-node groq-node');
    node.addClass(`${nodeData.backend}-node`);
    
    // Update in internal array
    const index = this.nodes.findIndex(n => n.id === nodeId);
    if (index !== -1) {
      this.nodes[index] = nodeData;
    } else {
      this.nodes.push(nodeData);
    }
    
    // Publish node updated event
    this.graphManager.eventBus.publish('node:updated', { id: nodeId, nodeData });
    
    return true;
  }
  
  /**
   * Remove a node from the graph
   * 
   * @param {string} nodeId - ID of the node to remove
   * @returns {boolean} Success
   */
  removeNode(nodeId) {
    // Remove node from Cytoscape
    this.graphManager.cytoscapeManager.removeElement(nodeId);
    
    // Remove from internal nodes array
    this.nodes = this.nodes.filter(node => node.id !== nodeId);
    
    // If the selected node was removed, deselect it
    if (this.selectedNodeId === nodeId) {
      this.deselectNode();
    }
    
    // Publish node removed event
    this.graphManager.eventBus.publish('node:removed', { id: nodeId });
    
    return true;
  }
  
  /**
   * Select a node in the graph
   * 
   * @param {string} nodeId - ID of the node to select
   */
  selectNode(nodeId) {
    // Update Cytoscape selection
    this.graphManager.cytoscapeManager.selectNode(nodeId);
    
    // Update internal selection state
    this.selectedNodeId = nodeId;
    
    // Get node data
    const nodeData = this.getNodeData(nodeId);
    
    // Publish node selected event
    this.graphManager.eventBus.publish('node:selected', nodeData);
  }
  
  /**
   * Deselect the currently selected node
   */
  deselectNode() {
    // Clear Cytoscape selection
    this.graphManager.cytoscapeManager.clearSelection();
    
    // Clear internal selection state
    this.selectedNodeId = null;
    
    // Publish node deselected event
    this.graphManager.eventBus.publish('node:deselected');
  }
  
  /**
   * Get data for a specific node
   * 
   * @param {string} nodeId - ID of the node
   * @returns {Object|null} Node data or null if not found
   */
  getNodeData(nodeId) {
    const node = this.graphManager.cytoscapeManager.findNode(nodeId);
    if (node.length === 0) return null;
    
    return {
      id: nodeId,
      name: node.data('name'),
      backend: node.data('backend'),
      model: node.data('model'),
      systemMessage: node.data('systemMessage'),
      temperature: node.data('temperature'),
      maxTokens: node.data('maxTokens'),
      graph_id: node.data('graph_id')
    };
  }
  
  /**
   * Get parent nodes for a given node
   * 
   * @param {string} nodeId - ID of the node to get parents for
   * @returns {Array} Array of parent node data objects
   */
  getParentNodes(nodeId) {
    if (!nodeId) {
      console.error('getParentNodes called with invalid nodeId:', nodeId);
      return [];
    }
    
    const parentNodes = [];
    
    try {
      // Check if the node exists
      const targetNode = this.graphManager.cytoscapeManager.findNode(nodeId);
      if (targetNode.length === 0) {
        console.error(`Node with id ${nodeId} not found in the graph`);
        return [];
      }
      
      // Find all edges where this node is the target
      const incomingEdges = this.graphManager.cytoscapeManager.findConnectedEdges(nodeId, 'incoming');
      
      incomingEdges.forEach(edge => {
        const sourceId = edge.data('source');
        const sourceNode = this.getNodeData(sourceId);
        
        if (sourceNode) {
          parentNodes.push(sourceNode);
        }
      });
    } catch (error) {
      console.error('Error in getParentNodes:', error);
    }
    
    return parentNodes;
  }
  
  /**
   * Get all nodes
   * 
   * @returns {Array} Array of node data objects
   */
  getAllNodes() {
    return [...this.nodes];
  }
  
  /**
   * Get the selected node ID
   * 
   * @returns {string|null} Selected node ID or null
   */
  getSelectedNodeId() {
    return this.selectedNodeId;
  }
  
  /**
   * Clear all nodes
   */
  clearNodes() {
    this.nodes = [];
    this.selectedNodeId = null;
  }
  
  /**
   * Get count of nodes
   * 
   * @returns {number} Number of nodes
   */
  getNodeCount() {
    return this.nodes.length;
  }
  
  /**
   * Check if a node exists
   * 
   * @param {string} nodeId - Node ID to check
   * @returns {boolean} True if node exists
   */
  nodeExists(nodeId) {
    return this.graphManager.cytoscapeManager.findNode(nodeId).length > 0;
  }
  
  /**
   * Get all child nodes for a given node
   * 
   * @param {string} nodeId - ID of the node
   * @returns {Array} Array of child node data objects
   */
  getChildNodes(nodeId) {
    if (!nodeId) return [];
    
    const childNodes = [];
    
    try {
      // Find all edges where this node is the source
      const outgoingEdges = this.graphManager.cytoscapeManager.findConnectedEdges(nodeId, 'outgoing');
      
      outgoingEdges.forEach(edge => {
        const targetId = edge.data('target');
        const targetNode = this.getNodeData(targetId);
        
        if (targetNode) {
          childNodes.push(targetNode);
        }
      });
    } catch (error) {
      console.error('Error in getChildNodes:', error);
    }
    
    return childNodes;
  }
}