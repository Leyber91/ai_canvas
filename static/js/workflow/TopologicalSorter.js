/**
 * workflow/TopologicalSorter.js
 * 
 * Responsible for computing the topological sort of a directed graph.
 * Provides methods for determining execution order in acyclic graphs.
 */
export class TopologicalSorter {
    /**
     * @param {WorkflowManager} workflowManager - Parent workflow manager
     */
    constructor(workflowManager) {
      this.workflowManager = workflowManager;
    }
    
    /**
     * Initialize the topological sorter
     */
    initialize() {
      // Nothing specific to initialize
    }
    
    /**
     * Compute a topological sort of the graph
     * 
     * @returns {Array|null} Ordered array of node IDs, or null if graph has cycles
     */
    computeTopologicalSort() {
      const { graphManager, cycleDetector } = this.workflowManager;
      
      // Check for cycles first
      if (cycleDetector.hasCycles()) {
        return null;
      }
      
      const nodes = graphManager.nodes;
      const edges = graphManager.edges;
      
      // Build adjacency list
      const adjacencyList = {};
      nodes.forEach(node => {
        adjacencyList[node.id] = [];
      });
      
      edges.forEach(edge => {
        if (adjacencyList[edge.source]) {
          adjacencyList[edge.source].push(edge.target);
        }
      });
      
      // Track visited nodes
      const visited = {};
      
      // Result stack
      const result = [];
      
      // Recursive DFS function
      const dfs = (nodeId) => {
        // Mark as visited
        visited[nodeId] = true;
        
        // Visit all neighbors
        for (const adjacentId of adjacencyList[nodeId] || []) {
          if (!visited[adjacentId]) {
            dfs(adjacentId);
          }
        }
        
        // Add to result stack after all neighbors are visited
        result.unshift(nodeId);
      };
      
      // Run DFS for all nodes
      for (const node of nodes) {
        if (!visited[node.id]) {
          dfs(node.id);
        }
      }
      
      return result;
    }
    
    /**
     * Sort nodes by their in-degree (number of incoming edges)
     * Useful for level-based visualization and understanding dependencies
     * 
     * @returns {Object} Object mapping levels to node IDs
     */
    computeLevelOrder() {
      const { graphManager } = this.workflowManager;
      const nodes = graphManager.nodes;
      const edges = graphManager.edges;
      
      // Calculate in-degree for each node
      const inDegree = {};
      nodes.forEach(node => {
        inDegree[node.id] = 0;
      });
      
      edges.forEach(edge => {
        if (edge.target in inDegree) {
          inDegree[edge.target]++;
        }
      });
      
      // Group nodes by level
      const levels = {};
      let currentLevel = 0;
      let queue = nodes.filter(node => inDegree[node.id] === 0).map(node => node.id);
      
      // While there are nodes without all dependencies processed
      while (queue.length > 0) {
        levels[currentLevel] = queue;
        
        // Process this level and build the next level
        const nextQueue = [];
        
        for (const nodeId of queue) {
          // Find all outgoing edges
          const outgoingEdges = edges.filter(edge => edge.source === nodeId);
          
          // Decrease in-degree of target nodes
          for (const edge of outgoingEdges) {
            inDegree[edge.target]--;
            
            // If all dependencies are processed, add to next level
            if (inDegree[edge.target] === 0) {
              nextQueue.push(edge.target);
            }
          }
        }
        
        queue = nextQueue;
        currentLevel++;
      }
      
      // Check if all nodes are included
      const assignedNodes = Object.values(levels).flat();
      const missingNodes = nodes.filter(node => !assignedNodes.includes(node.id)).map(node => node.id);
      
      // If there are missing nodes, they must be in cycles
      if (missingNodes.length > 0) {
        levels['cycles'] = missingNodes;
      }
      
      return levels;
    }
    
    /**
     * Identify critical paths in the graph (longest paths from roots to leaves)
     * 
     * @returns {Array<Array<string>>} Array of critical paths
     */
    findCriticalPaths() {
      const { graphManager } = this.workflowManager;
      const nodes = graphManager.nodes;
      const edges = graphManager.edges;
      
      // Build adjacency list
      const adjacencyList = {};
      nodes.forEach(node => {
        adjacencyList[node.id] = [];
      });
      
      edges.forEach(edge => {
        if (adjacencyList[edge.source]) {
          adjacencyList[edge.source].push(edge.target);
        }
      });
      
      // Find root nodes (no incoming edges)
      const rootNodes = nodes.filter(node => 
        !edges.some(edge => edge.target === node.id)
      ).map(node => node.id);
      
      // Find leaf nodes (no outgoing edges)
      const leafNodes = nodes.filter(node => 
        !edges.some(edge => edge.source === node.id)
      ).map(node => node.id);
      
      // For each node, calculate longest path from roots
      const longestPath = {};
      rootNodes.forEach(root => {
        longestPath[root] = 1; // Path length to self is 1
      });
      
      // Get a topological ordering
      const topo = this.computeTopologicalSort();
      
      // If cycles exist, we can't compute longest paths accurately
      if (!topo) return [];
      
      // Process nodes in topological order
      topo.forEach(nodeId => {
        // If we haven't processed this node as a root, initialize it
        if (!longestPath[nodeId]) {
          longestPath[nodeId] = 1;
        }
        
        // Update all neighbors
        for (const targetId of adjacencyList[nodeId] || []) {
          longestPath[targetId] = Math.max(
            longestPath[targetId] || 0,
            longestPath[nodeId] + 1
          );
        }
      });
      
      // Build critical paths from roots to leaves
      const criticalPaths = [];
      
      // Helper function to build paths
      const buildPaths = (currentNode, currentPath) => {
        currentPath.push(currentNode);
        
        // If this is a leaf node, we have a complete path
        if (leafNodes.includes(currentNode)) {
          criticalPaths.push([...currentPath]);
        } else {
          // Find the neighbors that are on the critical path
          const neighbors = adjacencyList[currentNode] || [];
          
          // Sort neighbors by their longest path value (descending)
          const sortedNeighbors = [...neighbors].sort((a, b) => 
            (longestPath[b] || 0) - (longestPath[a] || 0)
          );
          
          // Consider only the neighbors on the longest path
          const maxPathLength = sortedNeighbors.length > 0 ? 
            longestPath[sortedNeighbors[0]] : 0;
          
          const criticalNeighbors = sortedNeighbors.filter(neighbor => 
            (longestPath[neighbor] || 0) === maxPathLength
          );
          
          // Recursively build paths from critical neighbors
          for (const neighbor of criticalNeighbors) {
            buildPaths(neighbor, [...currentPath]);
          }
        }
      };
      
      // Start from each root node
      rootNodes.forEach(root => {
        buildPaths(root, []);
      });
      
      return criticalPaths;
    }
    
    /**
     * Identify parallel execution groups (nodes that can be executed in parallel)
     * 
     * @returns {Array<Array<string>>} Array of parallel execution groups
     */
    identifyParallelGroups() {
      const levels = this.computeLevelOrder();
      
      // Return all levels except the cycles
      return Object.keys(levels)
        .filter(level => level !== 'cycles')
        .map(level => levels[level]);
    }
    
    /**
     * Create a weighted topological sort
     * (prioritize certain nodes based on weights)
     * 
     * @param {Object} nodeWeights - Map of node IDs to weights
     * @returns {Array} Weighted topological sort
     */
    computeWeightedTopologicalSort(nodeWeights = {}) {
      const baseOrder = this.computeTopologicalSort();
      if (!baseOrder) return null;
      
      // Create a copy to avoid mutating the original
      const weightedOrder = [...baseOrder];
      
      // Sort by weights (higher weights first)
      weightedOrder.sort((a, b) => {
        const weightA = nodeWeights[a] || 0;
        const weightB = nodeWeights[b] || 0;
        
        if (weightA !== weightB) {
          return weightB - weightA; // Higher weights first
        }
        
        // If weights are equal, maintain topological order
        return baseOrder.indexOf(a) - baseOrder.indexOf(b);
      });
      
      // Validate the weighted order is still a valid topological sort
      if (!this.isValidTopologicalOrder(weightedOrder)) {
        // If not valid, fall back to the original topological sort
        return baseOrder;
      }
      
      return weightedOrder;
    }
    
    /**
     * Check if an order is a valid topological sort
     * 
     * @param {Array} order - The order to check
     * @returns {boolean} True if valid
     */
    isValidTopologicalOrder(order) {
      const { graphManager } = this.workflowManager;
      const edges = graphManager.edges;
      
      // For each edge, the source must come before the target
      for (const edge of edges) {
        const sourceIndex = order.indexOf(edge.source);
        const targetIndex = order.indexOf(edge.target);
        
        // If either node is missing, that's a problem
        if (sourceIndex === -1 || targetIndex === -1) {
          return false;
        }
        
        // The source should come before the target in a topological sort
        if (sourceIndex > targetIndex) {
          return false;
        }
      }
      
      return true;
    }
    
    /**
     * Compute the longest path through the graph
     * 
     * @param {Object} nodeWeights - Optional weights for nodes
     * @returns {Array} The longest path (array of node IDs)
     */
    computeLongestPath(nodeWeights = {}) {
      const { graphManager } = this.workflowManager;
      const nodes = graphManager.nodes;
      const edges = graphManager.edges;
      
      // Get a topological ordering
      const topo = this.computeTopologicalSort();
      if (!topo) return []; // Graph has cycles
      
      // Build adjacency list
      const adjacencyList = {};
      nodes.forEach(node => {
        adjacencyList[node.id] = [];
      });
      
      edges.forEach(edge => {
        if (adjacencyList[edge.source]) {
          adjacencyList[edge.source].push(edge.target);
        }
      });
      
      // Distance and predecessor maps
      const dist = {};
      const pred = {};
      
      // Initialize distances
      nodes.forEach(node => {
        dist[node.id] = 0;
        pred[node.id] = null;
      });
      
      // Process nodes in topological order
      for (const nodeId of topo) {
        const weight = nodeWeights[nodeId] || 1; // Default weight is 1
        
        // Update all neighbors
        for (const targetId of adjacencyList[nodeId] || []) {
          const targetWeight = nodeWeights[targetId] || 1;
          const newDist = dist[nodeId] + weight;
          
          // If we've found a longer path, update
          if (newDist > dist[targetId]) {
            dist[targetId] = newDist;
            pred[targetId] = nodeId;
          }
        }
      }
      
      // Find the node with the maximum distance
      let maxDist = 0;
      let maxNode = null;
      
      for (const node of nodes) {
        if (dist[node.id] > maxDist) {
          maxDist = dist[node.id];
          maxNode = node.id;
        }
      }
      
      // If no path found
      if (!maxNode) return [];
      
      // Reconstruct the path
      const path = [];
      let current = maxNode;
      
      while (current !== null) {
        path.unshift(current);
        current = pred[current];
      }
      
      return path;
    }
    
    /**
     * Generate a recommended execution order based on various factors
     * 
     * @returns {Array} Recommended execution order
     */
    generateRecommendedOrder() {
      const { graphManager, cycleDetector } = this.workflowManager;
      
      // First check if we have cycles
      if (cycleDetector.hasCycles()) {
        // For graphs with cycles, we need a different approach
        return this.generateOrderWithCycles();
      }
      
      // For acyclic graphs, use a modified topological sort
      const baseOrder = this.computeTopologicalSort();
      
      // Compute node weights based on complexity
      const nodeWeights = {};
      
      graphManager.nodes.forEach(node => {
        // Factors that influence weight:
        // 1. Number of incoming edges (more = higher weight)
        // 2. Number of outgoing edges (more = higher weight)
        // 3. Node type/complexity (e.g., model size)
        
        const inEdges = graphManager.edges.filter(e => e.target === node.id).length;
        const outEdges = graphManager.edges.filter(e => e.source === node.id).length;
        
        // Base weight from edge count
        let weight = (inEdges * 2) + outEdges;
        
        // Adjust weight based on model complexity if available
        if (node.model && node.model.includes('70b')) {
          weight += 5; // Large models get priority
        } else if (node.model && (node.model.includes('32b') || node.model.includes('7b'))) {
          weight += 3; // Medium models
        }
        
        nodeWeights[node.id] = weight;
      });
      
      // Use weighted topological sort
      return this.computeWeightedTopologicalSort(nodeWeights);
    }
    
    /**
     * Generate an execution order for graphs with cycles
     * 
     * @returns {Array} Execution order that handles cycles
     */
    generateOrderWithCycles() {
      const { graphManager, cycleDetector } = this.workflowManager;
      
      // Get cycle information
      const { cycles } = cycleDetector.detectCycles();
      
      // Create a temporary copy of the graph with cycle edges removed
      const tempEdges = [...graphManager.edges];
      const cyclicEdges = [];
      
      // Identify cycle-completing edges
      cycles.forEach(cycle => {
        // The edge from the last node to the first node in the cycle
        const lastNodeIndex = cycle.length - 2;
        const cycleEdge = tempEdges.findIndex(e => 
          e.source === cycle[lastNodeIndex] && e.target === cycle[0]
        );
        
        if (cycleEdge !== -1) {
          cyclicEdges.push(tempEdges[cycleEdge]);
          tempEdges.splice(cycleEdge, 1);
        }
      });
      
      // Temporarily replace edges
      const originalEdges = graphManager.edges;
      graphManager.edges = tempEdges;
      
      // Get topological sort of the acyclic version
      const baseOrder = this.computeTopologicalSort();
      
      // Restore original edges
      graphManager.edges = originalEdges;
      
      // If we couldn't get a valid base order, return all nodes
      if (!baseOrder) {
        return graphManager.nodes.map(n => n.id);
      }
      
      // Reinsert cycle nodes at appropriate points
      const enhancedOrder = [...baseOrder];
      
      // For each cycle, ensure all cycle nodes are present
      cycles.forEach(cycle => {
        // Find positions of cycle nodes in the base order
        const positions = cycle.map(nodeId => enhancedOrder.indexOf(nodeId))
          .filter(pos => pos !== -1);
        
        // If some cycle nodes aren't in the base order, add them
        if (positions.length !== cycle.length - 1) { // -1 because last node is duplicate
          const cycleWithoutDuplicates = cycle.slice(0, -1);
          
          // Find the first cycle node in the base order
          const firstPos = Math.min(...positions);
          
          // Insert missing nodes after the first one
          cycleWithoutDuplicates.forEach(nodeId => {
            if (!enhancedOrder.includes(nodeId)) {
              enhancedOrder.splice(firstPos + 1, 0, nodeId);
            }
          });
        }
      });
      
      return enhancedOrder;
    }
  }