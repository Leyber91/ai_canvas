/**
 * workflow/ExecutionEngine.js
 * 
 * Responsible for executing workflows, including handling cycles,
 * communicating with backend, and managing execution state.
 */
export class ExecutionEngine {
  /**
   * @param {WorkflowManager} workflowManager - Parent workflow manager
   */
  constructor(workflowManager) {
    this.workflowManager = workflowManager;
    this.executionTimeout = null;
  }
  
  /**
   * Initialize the execution engine
   */
  initialize() {
    // Nothing to initialize for now
  }
  
  /**
   * Execute a workflow by processing nodes in topological order or handling cycles
   * 
   * @param {string} graphId - ID of the graph to execute
   * @returns {Promise<Object>} Execution results
   */
  async executeWorkflow(graphId) {
    const { apiClient, eventBus, validator, config } = this.workflowManager;
    const executionState = this.workflowManager.executionState;
    
    if (executionState.isExecuting) {
      throw new Error('A workflow is already being executed');
    }
    
    // Reset execution state
    this.workflowManager.resetExecutionState();
    executionState.isExecuting = true;
    executionState.startTime = Date.now();
    
    // Validate workflow before execution
    const validation = validator.validateWorkflow();
    
    // If we're not allowing cycles and they exist, fail execution
    if (!config.allowCycles && validation.hasCycles) {
      // Highlight cycles for visualization
      this.workflowManager.highlightCycles();
      
      // Throw validation errors
      executionState.isExecuting = false;
      throw new Error(validation.errors.join('. '));
    }
    
    // If there are other errors besides cycles, fail execution
    const nonCycleErrors = validation.errors.filter(err => !err.includes('cycles'));
    if (nonCycleErrors.length > 0) {
      executionState.isExecuting = false;
      throw new Error(nonCycleErrors.join('. '));
    }
    
    try {
      // Set a timeout for the overall execution
      this.startExecutionTimeout();
      
      // Publish workflow execution started event
      eventBus.publish('workflow:executing', { graphId });
      
      // Choose execution strategy based on cycle handling mode
      let results;
      
      switch (config.cycleHandlingMode) {
        case 'iterate':
          results = await this.executeWithCycleIteration(graphId);
          break;
        case 'unwrap':
          results = await this.executeWithCycleUnwrapping(graphId);
          break;
        case 'stop':
        default:
          // Default mode - either execute without cycles or fail
          if (validation.hasCycles) {
            throw new Error('Workflow contains cycles and cannot be executed sequentially with current settings');
          }
          results = await this.executeWithoutCycles(graphId);
          break;
      }
      
      // Clear the timeout
      this.clearExecutionTimeout();
      // Add explicit logging for debugging
      console.log("Workflow execution completed with results:", results);
      
      // Ensure results are properly structured 
      if (!results.execution_order && results.data && results.data.execution_order) {
      // Handle API response format
      results = results.data;
      }
      
      // Store results in execution state - ensure proper format
      executionState.executionResults = results.results || {};
      executionState.executionOrder = results.execution_order || [];

      // Log completion for debugging
      console.log("Workflow execution completed:", {
          order: executionState.executionOrder,
          results: executionState.executionResults
      });
      
      // Publish workflow execution completed event
      eventBus.publish('workflow:completed', {
        graphId,
        executionOrder: executionState.executionOrder,
        results: executionState.executionResults,
        nodeIterationCount: executionState.nodeIterationCount,
        cycleIterationCount: executionState.cycleIterationCount,
        executionTime: Date.now() - executionState.startTime
      });
      
      return {
        execution_order: executionState.executionOrder,
        results: executionState.executionResults,
        nodeIterationCount: executionState.nodeIterationCount,
        cycleIterationCount: executionState.cycleIterationCount,
        executionTime: Date.now() - executionState.startTime
      };
    } catch (error) {
      // Clear the timeout
      this.clearExecutionTimeout();
      
      // Store error
      executionState.errors.push(error.message);
      
      // Publish workflow execution failed event
      eventBus.publish('workflow:failed', {
        graphId,
        error: error.message,
        executionState: { ...executionState }
      });
      
      throw error;
    } finally {
      executionState.isExecuting = false;
    }
  }
  
  /**
   * Execute workflow without handling cycles
   * 
   * @param {string} graphId - Graph ID
   * @returns {Promise<Object>} Execution results
   */
  async executeWithoutCycles(graphId) {
      const { apiClient, topologicalSorter, executionState } = this.workflowManager;
      
      // Compute execution order client-side as a backup
      const clientSideOrder = topologicalSorter.computeTopologicalSort();
      
      // Execute the workflow via the API
      try {
        console.log("Executing workflow for graph:", graphId);
        const response = await apiClient.post('/api/execute', {
          graph_id: graphId
        });
        
        console.log("Workflow execution response:", response);
        
        if (response.status !== 'success') {
          throw new Error(response.message || 'Failed to execute workflow');
        }
        
        // Ensure we have valid data structure even if the API response format varies
        const executionOrder = response.data?.execution_order || [];
        const results = response.data?.results || {};
        
        // Update execution state
        executionState.executionOrder = executionOrder;
        executionState.executionResults = results;
        
        // Return properly structured results
        return {
          execution_order: executionOrder,
          results: results
        };
      } catch (error) {
        console.error("Workflow execution error:", error);
        // If server execution fails but we have a valid client-side order, try to execute locally
        if (clientSideOrder) {
          return this.executeWorkflowLocally(graphId, clientSideOrder);
        }
        throw error;
      }
    }
          
  /**
   * Execute workflow with cycle iteration
   * 
   * @param {string} graphId - Graph ID
   * @returns {Promise<Object>} Execution results
   */
  async executeWithCycleIteration(graphId) {
    const { cycleDetector, config, executionState } = this.workflowManager;
    
    // Detect cycles first
    const { cycles, metaCycles } = cycleDetector.detectCycles();
    
    // If no cycles, execute normally
    if (cycles.length === 0) {
      return this.executeWithoutCycles(graphId);
    }
    
    // Initialize execution state
    executionState.cycleIterationCount = {};
    cycles.forEach((cycle, index) => {
      executionState.cycleIterationCount[`cycle-${index}`] = 0;
    });
    
    // Get a modified order that includes cycles
    const executionPlan = this.createCyclicExecutionPlan(graphId, cycles);
    
    // Execute the plan
    return this.executeWorkflowLocally(graphId, executionPlan);
  }
  
  /**
   * Execute workflow with cycle unwrapping (treating cycles as parallel paths)
   * 
   * @param {string} graphId - Graph ID
   * @returns {Promise<Object>} Execution results
   */
  async executeWithCycleUnwrapping(graphId) {
    const { cycleDetector, config } = this.workflowManager;
    
    // Detect cycles first
    const { cycles } = cycleDetector.detectCycles();
    
    // If no cycles, execute normally
    if (cycles.length === 0) {
      return this.executeWithoutCycles(graphId);
    }
    
    // Create an unwrapped execution plan
    const executionPlan = this.createUnwrappedExecutionPlan(graphId, cycles);
    
    // Execute the plan
    return this.executeWorkflowLocally(graphId, executionPlan);
  }
  
  /**
   * Create an execution plan that handles cycles by iteration
   * 
   * @param {string} graphId - Graph ID
   * @param {Array} cycles - Detected cycles
   * @returns {Array} Execution plan with cycle iterations
   */
  createCyclicExecutionPlan(graphId, cycles) {
    const { topologicalSorter, config } = this.workflowManager;
    
    // Create a copy of the graph without the cycle edges
    // This gives us a base execution order
    const baseOrder = this.createAcyclicBasePlan(cycles);
    
    // Now we need to modify this order to include cycle iterations
    const executionPlan = [];
    
    // We'll track visited nodes to ensure we don't revisit them unnecessarily
    const visitedNodes = new Set();
    const cycleEntryPoints = new Map();
    
    // Find entry points for each cycle
    cycles.forEach((cycle, cycleIndex) => {
      // The entry point is the first node in the cycle that appears in the base order
      let entryPointIndex = Infinity;
      let entryPoint = null;
      
      cycle.forEach(nodeId => {
        const index = baseOrder.indexOf(nodeId);
        if (index !== -1 && index < entryPointIndex) {
          entryPointIndex = index;
          entryPoint = nodeId;
        }
      });
      
      if (entryPoint) {
        cycleEntryPoints.set(`cycle-${cycleIndex}`, entryPoint);
      }
    });
    
    // Process base order and inject cycle iterations
    for (let i = 0; i < baseOrder.length; i++) {
      const nodeId = baseOrder[i];
      executionPlan.push(nodeId);
      visitedNodes.add(nodeId);
      
      // Check if this node is an entry point for any cycle
      for (const [cycleId, entryPoint] of cycleEntryPoints.entries()) {
        if (nodeId === entryPoint) {
          // Find the cycle
          const cycleIndex = parseInt(cycleId.split('-')[1]);
          const cycle = cycles[cycleIndex];
          
          // Add cycle iterations
          for (let iteration = 0; iteration < config.maxCycleIterations; iteration++) {
            // Add all nodes in the cycle except the entry point (already added)
            const cycleStartIndex = cycle.indexOf(entryPoint);
            for (let j = 1; j < cycle.length - 1; j++) {
              const cycleNodeIndex = (cycleStartIndex + j) % (cycle.length - 1);
              const cycleNodeId = cycle[cycleNodeIndex];
              
              // Skip if it's the entry point (already added)
              if (cycleNodeId === entryPoint) continue;
              
              executionPlan.push(cycleNodeId);
            }
            
            // Add the entry point again to complete the cycle
            executionPlan.push(entryPoint);
          }
        }
      }
    }
    
    return executionPlan;
  }
  
  /**
   * Create an execution plan that "unwraps" cycles
   * 
   * @param {string} graphId - Graph ID
   * @param {Array} cycles - Detected cycles
   * @returns {Array} Execution plan with unwrapped cycles
   */
  createUnwrappedExecutionPlan(graphId, cycles) {
    const { topologicalSorter, config } = this.workflowManager;
    
    // Create a copy of the graph with the cycle back-edges removed
    // This gives us a base execution order without cycles
    const baseOrder = this.createAcyclicBasePlan(cycles);
    
    // Deep clone the execution order to prevent mutations
    const executionPlan = [...baseOrder];
    
    return executionPlan;
  }
  
  /**
   * Create a base execution plan with cycles removed
   * 
   * @param {Array} cycles - The cycles to remove
   * @returns {Array} A cycle-free execution order
   */
  createAcyclicBasePlan(cycles) {
    const { graphManager, topologicalSorter } = this.workflowManager;
    
    // Make a copy of the current edges
    const originalEdges = [...graphManager.edges];
    
    // Temporarily remove cycle-completing edges
    cycles.forEach(cycle => {
      // Remove the edge that completes the cycle (from last to first node)
      const lastNodeIndex = cycle.length - 2; // Last node before the repeat
      const edgeToRemove = `${cycle[lastNodeIndex]}-${cycle[0]}`;
      
      // Find and temporarily remove this edge
      const edgeIndex = graphManager.edges.findIndex(edge => 
        edge.id === edgeToRemove || (edge.source === cycle[lastNodeIndex] && edge.target === cycle[0])
      );
      
      if (edgeIndex !== -1) {
        graphManager.edges.splice(edgeIndex, 1);
      }
    });
    
    // Compute a topological sort without the cycle edges
    const acyclicOrder = topologicalSorter.computeTopologicalSort();
    
    // Restore original edges
    graphManager.edges.length = 0;
    originalEdges.forEach(edge => graphManager.edges.push(edge));
    
    return acyclicOrder;
  }
  
  /**
   * Execute a workflow locally with the given execution order
   * 
   * @param {string} graphId - ID of the graph to execute
   * @param {Array} executionOrder - Order of node execution
   * @returns {Promise<Object>} Execution results
   */
  async executeWorkflowLocally(graphId, executionOrder) {
    const { graphManager, conversationManager, apiClient, executionState, config } = this.workflowManager;
    
    executionState.executionOrder = [];
    const results = {};
    const nodeIterationCount = {};
    
    // Track iterations of each node (for cycles)
    executionOrder.forEach(nodeId => {
      nodeIterationCount[nodeId] = (nodeIterationCount[nodeId] || 0) + 1;
    });
    
    // Execute nodes in the given order
    for (const nodeId of executionOrder) {
      const iteration = nodeIterationCount[nodeId] > 1 ? 
        nodeIterationCount[nodeId] - 1 : 0;
      
      // Track this execution in the order
      executionState.executionOrder.push({
        nodeId,
        iteration
      });
      
      // Update the current node being processed
      executionState.currentNode = nodeId;
      
      // Update iteration counts in state
      executionState.nodeIterationCount = { ...nodeIterationCount };
      
      // Publish progress event
      this.workflowManager.eventBus.publish('workflow:node-executing', {
        nodeId,
        iteration,
        totalNodes: executionOrder.length,
        progress: executionState.executionOrder.length / executionOrder.length
      });
      
      const node = graphManager.getNodeData(nodeId);
      
      if (!node) {
        results[nodeId] = results[nodeId] || [];
        results[nodeId][iteration] = "Error: Node not found";
        continue;
      }
      
      // Get parent nodes
      const parentNodes = graphManager.getParentNodes(nodeId);
      const parentContexts = parentNodes.map(parent => {
        // Get result from the latest iteration of the parent
        let parentResult;
        
        if (results[parent.id]) {
          if (Array.isArray(results[parent.id])) {
            // Get the latest available result
            parentResult = results[parent.id][results[parent.id].length - 1] || '';
          } else {
            parentResult = results[parent.id] || '';
          }
        } else {
          parentResult = '';
        }
        
        return {
          node_id: parent.id,
          last_response: parentResult
        };
      });
      
      try {
        // Get conversation history
        const conversationHistory = conversationManager.getConversationHistory(nodeId);
        
        // Prepare request
        const requestData = {
          node_id: nodeId,
          backend: node.backend,
          model: node.model,
          system_message: node.systemMessage,
          parent_contexts: parentContexts,
          conversation_history: conversationHistory,
          temperature: node.temperature,
          max_tokens: node.maxTokens,
          stream: false,
          user_input: iteration === 0 ? 
            "Execute workflow step" : 
            `Execute workflow step (iteration ${iteration + 1})`
        };
        
        // Send the request
        const response = await apiClient.post('/api/node/chat', requestData);
        
        // Extract the result
        let result = '';
        if (node.backend === 'ollama') {
          result = response.message?.content || 'No response';
        } else if (node.backend === 'groq') {
          result = response.choices?.[0]?.message?.content || 'No response';
        }
        
        // Store result for this iteration
        if (nodeIterationCount[nodeId] > 1) {
          results[nodeId] = results[nodeId] || [];
          results[nodeId][iteration] = result;
        } else {
          results[nodeId] = result;
        }
        
        // Publish node completed event
        this.workflowManager.eventBus.publish('workflow:node-completed', {
          nodeId,
          iteration,
          result
        });
      } catch (error) {
        const errorMessage = `Error: ${error.message}`;
        
        // Store error for this iteration
        if (nodeIterationCount[nodeId] > 1) {
          results[nodeId] = results[nodeId] || [];
          results[nodeId][iteration] = errorMessage;
        } else {
          results[nodeId] = errorMessage;
        }
        
        // Publish node error event
        this.workflowManager.eventBus.publish('workflow:node-error', {
          nodeId,
          iteration,
          error: error.message
        });
      }
      
      // Check if we should pause between nodes
      await this.nodePause();
    }
    
    // Store execution results
    executionState.nodeIterationCount = nodeIterationCount;
    
    return {
      execution_order: executionOrder,
      results
    };
  }
  
  /**
   * Start a timeout for the overall execution
   */
  startExecutionTimeout() {
    this.clearExecutionTimeout();
    
    const timeoutSeconds = this.workflowManager.config.timeoutSeconds;
    if (timeoutSeconds > 0) {
      this.executionTimeout = setTimeout(() => {
        if (this.workflowManager.executionState.isExecuting) {
          const error = new Error(`Workflow execution timed out after ${timeoutSeconds} seconds`);
          
          // Update execution state
          this.workflowManager.executionState.errors.push(error.message);
          
          // Publish timeout event
          this.workflowManager.eventBus.publish('workflow:timeout', {
            error: error.message,
            timeoutSeconds,
            executionState: { ...this.workflowManager.executionState }
          });
          
          // Force execution to stop
          this.workflowManager.executionState.isExecuting = false;
        }
      }, timeoutSeconds * 1000);
    }
  }
  
  /**
   * Clear the execution timeout
   */
  clearExecutionTimeout() {
    if (this.executionTimeout) {
      clearTimeout(this.executionTimeout);
      this.executionTimeout = null;
    }
  }
  
  /**
   * Pause between nodes to prevent rate limiting
   * 
   * @returns {Promise<void>} Promise that resolves after the pause
   */
  async nodePause() {
    // Default pause is 100ms
    const pauseTime = 100;
    return new Promise(resolve => setTimeout(resolve, pauseTime));
  }
  
  /**
   * Estimate execution time based on graph complexity
   * 
   * @returns {Object} Execution time estimate
   */
  estimateExecutionTime() {
    const { graphManager, cycleDetector, config } = this.workflowManager;
    const nodes = graphManager.nodes;
    
    // Base time per node (in seconds)
    const baseTimePerNode = {
      'ollama': 5,  // Local models are typically faster
      'groq': 3     // Cloud models with API limits
    };
    
    // Get cycles
    const { cycles } = cycleDetector.detectCycles();
    const cycleNodes = new Set();
    
    cycles.forEach(cycle => {
      cycle.forEach(nodeId => cycleNodes.add(nodeId));
    });
    
    // Calculate iterations for each node
    const nodeIterations = {};
    nodes.forEach(node => {
      if (cycleNodes.has(node.id) && config.allowCycles && config.cycleHandlingMode === 'iterate') {
        nodeIterations[node.id] = config.maxCycleIterations;
      } else {
        nodeIterations[node.id] = 1;
      }
    });
    
    // Count nodes by backend
    const nodesByBackend = {};
    nodes.forEach(node => {
      const iterations = nodeIterations[node.id] || 1;
      const backend = node.backend || 'unknown';
      nodesByBackend[backend] = (nodesByBackend[backend] || 0) + iterations;
    });
    
    // Calculate total time
    let totalTimeSeconds = 0;
    Object.keys(nodesByBackend).forEach(backend => {
      totalTimeSeconds += nodesByBackend[backend] * (baseTimePerNode[backend] || 5);
    });
    
    // Add overhead for complexity
    const complexity = Math.min(nodes.length * 0.2, 10);
    totalTimeSeconds *= (1 + complexity / 10);
    
    // Add extra time for cycles
    if (cycles.length > 0) {
      totalTimeSeconds *= 1.2; // 20% extra time for cycles
    }
    
    return {
      estimatedSeconds: Math.round(totalTimeSeconds),
      estimatedText: totalTimeSeconds < 60 
        ? `~${Math.round(totalTimeSeconds)} seconds` 
        : `~${Math.round(totalTimeSeconds / 60)} minutes`,
      nodeIterations
    };
  }
}