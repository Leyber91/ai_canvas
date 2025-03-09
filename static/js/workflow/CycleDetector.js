/**
 * workflow/CycleDetector.js
 * 
 * Responsible for detecting and managing cycles in workflow graphs.
 * Provides methods for identifying cycles, determining if adding an edge would create a cycle,
 * and breaking cycles by removing edges.
 */
export class CycleDetector {
    /**
     * @param {WorkflowManager} workflowManager - Parent workflow manager
     */
    constructor(workflowManager) {
      this.workflowManager = workflowManager;
      this.lastDetectedCycles = [];
    }
    
    /**
     * Initialize the cycle detector
     */
    initialize() {
      // Nothing to initialize for now
    }
    
    /**
     * Detect cycles in the workflow graph
     * 
     * @returns {Object} Object with hasCycle flag and detected cycles
     */
    detectCycles() {
      const nodes = this.workflowManager.graphManager.nodes;
      const edges = this.workflowManager.graphManager.edges;
      
      // Store all detected cycles
      const cycles = [];
      
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
      
      // Function to detect cycles using DFS
      const findCycles = (nodeId, visited = new Set(), path = [], pathSet = new Set()) => {
        // Add node to current path
        visited.add(nodeId);
        path.push(nodeId);
        pathSet.add(nodeId);
        
        // Check all neighbors
        for (const neighbor of adjacencyList[nodeId] || []) {
          if (!visited.has(neighbor)) {
            findCycles(neighbor, visited, [...path], new Set(pathSet));
          } else if (pathSet.has(neighbor)) {
            // Found a cycle
            const cycleStart = path.indexOf(neighbor);
            const cycle = path.slice(cycleStart);
            cycle.push(neighbor); // Close the cycle
            
            // Make sure we don't have duplicate cycles
            const cycleKey = [...cycle].sort().join('-');
            if (!cycles.some(c => [...c].sort().join('-') === cycleKey)) {
              cycles.push(cycle);
            }
          }
        }
        
        // Remove from current path
        pathSet.delete(nodeId);
      };
      
      // Run DFS from each node
      const allVisited = new Set();
      for (const node of nodes) {
        if (!allVisited.has(node.id)) {
          findCycles(node.id, allVisited);
        }
      }
      
      // Store detected cycles for future reference
      this.lastDetectedCycles = cycles.map(cycle => [...cycle]); // Deep copy
      
      // Find meta-cycles (cycles that share nodes)
      const metaCycles = this.detectMetaCycles(cycles);
      
      return {
        hasCycle: cycles.length > 0,
        cycles: cycles,
        metaCycles: metaCycles
      };
    }
    
    /**
     * Detect meta-cycles (groups of connected cycles)
     * 
     * @param {Array<Array<string>>} cycles - Individual cycles
     * @returns {Array<Array<Array<string>>>} Groups of connected cycles
     */
    detectMetaCycles(cycles) {
      if (cycles.length <= 1) return []; // No meta-cycles with 0 or 1 cycle
      
      const metaCycles = [];
      const visitedCycles = new Set();
      
      // For each cycle, find all related cycles (cycles that share nodes)
      for (let i = 0; i < cycles.length; i++) {
        if (visitedCycles.has(i)) continue;
        
        const metaCycle = [cycles[i]];
        visitedCycles.add(i);
        
        // Find all related cycles
        let foundNew = true;
        while (foundNew) {
          foundNew = false;
          
          for (let j = 0; j < cycles.length; j++) {
            if (visitedCycles.has(j)) continue;
            
            // Check if this cycle shares any nodes with the current meta-cycle
            const sharesNodes = metaCycle.some(cycle => 
              cycle.some(node => cycles[j].includes(node))
            );
            
            if (sharesNodes) {
              metaCycle.push(cycles[j]);
              visitedCycles.add(j);
              foundNew = true;
            }
          }
        }
        
        if (metaCycle.length > 1) {
          metaCycles.push(metaCycle);
        }
      }
      
      return metaCycles;
    }
    
    /**
     * Check if adding an edge would create a cycle
     * 
     * @param {string} sourceId - Source node ID
     * @param {string} targetId - Target node ID
     * @returns {boolean} True if adding the edge would create a cycle
     */
    wouldCreateCycle(sourceId, targetId) {
      // Direct self-reference is a cycle
      if (sourceId === targetId) {
        return true;
      }
      
      // Check if there's already a path from target to source
      const visited = new Set();
      
      const dfs = (currentId) => {
        if (currentId === sourceId) {
          return true; // Found a path back to source
        }
        
        visited.add(currentId);
        
        // Check all outgoing edges from current node
        for (const edge of this.workflowManager.graphManager.edges) {
          if (edge.source === currentId && !visited.has(edge.target)) {
            if (dfs(edge.target)) {
              return true;
            }
          }
        }
        
        return false;
      };
      
      return dfs(targetId);
    }
    
    /**
     * Check if a graph has cycles (simplified version)
     * 
     * @returns {boolean} True if the graph has cycles
     */
    hasCycles() {
      return this.detectCycles().hasCycle;
    }
    
    /**
     * Break cycles in the graph by removing edges
     * 
     * @returns {Array} Array of removed edge IDs
     */
    breakCycles() {
      const { cycles } = this.detectCycles();
      const removedEdges = [];
      
      if (cycles.length === 0) {
        return removedEdges; // No cycles to break
      }
      
      // Find minimal set of edges to remove
      const edgeFrequency = {};
      
      // Count how many cycles each edge appears in
      cycles.forEach(cycle => {
        for (let i = 0; i < cycle.length - 1; i++) {
          const edge = `${cycle[i]}-${cycle[i+1]}`;
          edgeFrequency[edge] = (edgeFrequency[edge] || 0) + 1;
        }
      });
      
      // Sort edges by frequency (most frequent first)
      const edgesToRemove = Object.keys(edgeFrequency).sort((a, b) => 
        edgeFrequency[b] - edgeFrequency[a]);
      
      // Remove edges until no cycles remain
      for (let i = 0; i < edgesToRemove.length; i++) {
        const edgeId = edgesToRemove[i];
        
        // Get source and target from edge ID (format: "source-target")
        const [source, target] = edgeId.split('-');
        
        // Remove the edge
        this.workflowManager.graphManager.removeEdge(edgeId);
        removedEdges.push(edgeId);
        
        // Check if cycles still exist
        if (!this.hasCycles()) {
          break;
        }
      }
      
      // Publish cycles broken event
      this.workflowManager.eventBus.publish('graph:cycles-broken', {
        removedEdges: removedEdges,
        message: `Removed ${removedEdges.length} connections to break cycles`
      });
      
      return removedEdges;
    }
    
    /**
     * Find all cycles that contain a specific node
     * 
     * @param {string} nodeId - The node ID to find cycles for
     * @returns {Array<Array<string>>} Array of cycles containing the node
     */
    findCyclesContainingNode(nodeId) {
      return this.lastDetectedCycles.filter(cycle => cycle.includes(nodeId));
    }
    
    /**
     * Find all nodes involved in cycles
     * 
     * @returns {Array<string>} Array of node IDs involved in cycles
     */
    getCyclicNodes() {
      const cyclicNodes = new Set();
      
      this.lastDetectedCycles.forEach(cycle => {
        cycle.forEach(nodeId => {
          cyclicNodes.add(nodeId);
        });
      });
      
      return Array.from(cyclicNodes);
    }
    
    /**
     * Get edge weights based on cycle membership
     * (edges in more cycles have higher weights)
     * 
     * @returns {Object} Map of edge IDs to weights
     */
    getEdgeWeights() {
      const edgeWeights = {};
      
      this.lastDetectedCycles.forEach(cycle => {
        for (let i = 0; i < cycle.length - 1; i++) {
          const edgeId = `${cycle[i]}-${cycle[i+1]}`;
          edgeWeights[edgeId] = (edgeWeights[edgeId] || 0) + 1;
        }
      });
      
      return edgeWeights;
    }
    
    /**
     * Get detailed information about detected cycles
     * 
     * @returns {Array} Array of cycle objects with node details
     */
    getCycleDetails() {
      const { cycles } = this.detectCycles();
      
      return cycles.map((cycle, index) => {
        const nodes = cycle.map(nodeId => {
          const nodeData = this.workflowManager.graphManager.getNodeData(nodeId);
          return {
            id: nodeId,
            name: nodeData ? nodeData.name : nodeId
          };
        });
        
        // Calculate cycle length (number of unique nodes)
        const uniqueNodes = new Set(cycle);
        
        return {
          id: `cycle-${index}`,
          nodes: nodes,
          length: uniqueNodes.size,
          path: cycle
        };
      });
    }
  }