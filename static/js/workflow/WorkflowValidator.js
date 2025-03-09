/**
 * workflow/WorkflowValidator.js
 * 
 * Responsible for validating workflows before execution,
 * providing error messages, and generating suggestions for improvements.
 */
export class WorkflowValidator {
    /**
     * @param {WorkflowManager} workflowManager - Parent workflow manager
     */
    constructor(workflowManager) {
      this.workflowManager = workflowManager;
    }
    
    /**
     * Initialize the workflow validator
     */
    initialize() {
      // Nothing specific to initialize
    }
    
    /**
     * Validate workflow without raising alerts
     * 
     * @returns {Object} Validation result
     */
    validateWorkflowSilent() {
      const result = this.validateWorkflow();
      
      // If there are cycles, store them but don't highlight
      if (result.hasCycles) {
        this.workflowManager.eventBus.publish('workflow:invalid', { 
          errors: result.errors,
          silent: true
        });
      }
      
      return result;
    }
    
    /**
     * Validate a workflow before execution
     * 
     * @returns {Object} Validation result with success flag and any errors
     */
    validateWorkflow() {
      const { graphManager, cycleDetector, config } = this.workflowManager;
      const errors = [];
      
      // Check if there are any nodes
      if (graphManager.nodes.length === 0) {
        errors.push('Workflow contains no nodes');
      }
      
      // Check for cycles
      const { hasCycle, cycles } = cycleDetector.detectCycles();
      if (hasCycle && !config.allowCycles) {
        errors.push('Workflow contains cycles and cannot be executed sequentially');
      }
      
      // Check for nodes with multiple backends
      const uniqueBackends = new Set(graphManager.nodes.map(node => node.backend).filter(Boolean));
      if (uniqueBackends.size > 1) {
        errors.push('Warning: Workflow contains nodes with different backends, which may affect performance');
      }
      
      // Check if each node has a valid backend and model
      for (const node of graphManager.nodes) {
        if (!node.backend) {
          errors.push(`Node '${node.name}' has no backend specified`);
        }
        
        if (!node.model) {
          errors.push(`Node '${node.name}' has no model specified`);
        }
      }
      
      // Check for isolated nodes (no connections)
      const connectedNodes = new Set();
      graphManager.edges.forEach(edge => {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
      });
      
      const isolatedNodes = graphManager.nodes
        .filter(node => !connectedNodes.has(node.id))
        .map(node => node.name);
      
      if (isolatedNodes.length > 0) {
        errors.push(`Warning: Isolated nodes found: ${isolatedNodes.join(', ')}`);
      }
      
      // Check for execution complexity (too many iterations)
      if (hasCycle && config.allowCycles && config.cycleHandlingMode === 'iterate') {
        // Count number of nodes in cycles
        const cycleNodes = new Set();
        cycles.forEach(cycle => cycle.forEach(nodeId => cycleNodes.add(nodeId)));
        
        const totalNodeExecutions = graphManager.nodes.length + 
          (cycleNodes.size * (config.maxCycleIterations - 1));
        
        if (totalNodeExecutions > 50) {
          errors.push(`Warning: Workflow may execute up to ${totalNodeExecutions} node operations due to cycles`);
        }
      }
      
      return {
        success: errors.filter(e => !e.startsWith('Warning:')).length === 0,
        errors,
        hasCycles: hasCycle,
        cycles
      };
    }
    
    /**
     * Get suggestions for fixing workflow issues
     * 
     * @returns {Array} Array of suggestion objects
     */
    getWorkflowSuggestions() {
      const { cycleDetector, config } = this.workflowManager;
      const validation = this.validateWorkflow();
      const suggestions = [];
      
      if (validation.errors.filter(e => !e.startsWith('Warning:')).length === 0) {
        suggestions.push({
          type: 'success',
          message: 'Workflow is valid and ready to execute'
        });
      }
      
      // If cycles are found and not allowed, provide suggestions
      if (validation.hasCycles) {
        const cycleInfo = cycleDetector.getCycleDetails();
        
        if (!config.allowCycles) {
          suggestions.push({
            type: 'error',
            message: 'Workflow contains cycles',
            details: 'Sequential execution requires a directed acyclic graph',
            action: {
              type: 'highlight-cycles',
              label: 'Highlight Cycles'
            }
          });
          
          suggestions.push({
            type: 'suggestion',
            message: 'Enable cycle iteration',
            details: 'Allow controlled iteration of cycles (may increase execution time)',
            action: {
              type: 'enable-cycles',
              label: 'Allow Cycles'
            }
          });
          
          suggestions.push({
            type: 'suggestion',
            message: 'Break cycles automatically',
            details: 'Remove the minimum number of connections to make execution possible',
            action: {
              type: 'break-cycles',
              label: 'Break Cycles'
            }
          });
        } else {
          suggestions.push({
            type: 'info',
            message: 'Cycles will be handled using mode: ' + config.cycleHandlingMode,
            details: `Maximum iterations per cycle: ${config.maxCycleIterations}`
          });
        }
        
        // Add specific information about each cycle
        cycleInfo.forEach((cycle, index) => {
          const nodeNames = cycle.nodes.map(node => node.name).join(' → ');
          suggestions.push({
            type: 'info',
            message: `Cycle ${index + 1}: ${nodeNames}`
          });
        });
      }
      
      // Add suggestions for isolated nodes
      const isolatedNodeError = validation.errors.find(e => e.startsWith('Warning: Isolated nodes'));
      if (isolatedNodeError) {
        suggestions.push({
          type: 'warning',
          message: 'Isolated nodes detected',
          details: 'These nodes have no connections and will not receive context from other nodes',
          action: {
            type: 'highlight-isolated',
            label: 'Highlight Isolated Nodes'
          }
        });
      }
      
      // Add suggestion for execution complexity
      const complexityError = validation.errors.find(e => e.startsWith('Warning: Workflow may execute'));
      if (complexityError) {
        suggestions.push({
          type: 'warning',
          message: 'Complex execution detected',
          details: complexityError.replace('Warning: ', ''),
          action: {
            type: 'reduce-iterations',
            label: 'Reduce Max Iterations'
          }
        });
      }
      
      return suggestions;
    }
    
    /**
     * Check if a node is valid
     * 
     * @param {Object} nodeData - Node data to validate
     * @returns {Object} Validation result with success flag and any errors
     */
    validateNode(nodeData) {
      const errors = [];
      
      // Check required fields
      if (!nodeData.name || nodeData.name.trim() === '') {
        errors.push('Node name is required');
      }
      
      if (!nodeData.backend) {
        errors.push('Backend is required');
      }
      
      if (!nodeData.model) {
        errors.push('Model is required');
      }
      
      // Check for name uniqueness
      const existingNode = this.workflowManager.graphManager.nodes.find(
        node => node.name === nodeData.name && node.id !== nodeData.id
      );
      
      if (existingNode) {
        errors.push(`Node name "${nodeData.name}" is already in use`);
      }
      
      // Check temperature is within range
      if (typeof nodeData.temperature !== 'undefined') {
        const temp = parseFloat(nodeData.temperature);
        if (isNaN(temp) || temp < 0 || temp > 1) {
          errors.push('Temperature must be between 0 and 1');
        }
      }
      
      // Check max tokens is a positive number
      if (typeof nodeData.maxTokens !== 'undefined') {
        const tokens = parseInt(nodeData.maxTokens);
        if (isNaN(tokens) || tokens <= 0) {
          errors.push('Max tokens must be a positive number');
        }
      }
      
      return {
        success: errors.length === 0,
        errors
      };
    }
    
    /**
     * Check if an edge is valid
     * 
     * @param {string} sourceId - Source node ID
     * @param {string} targetId - Target node ID
     * @returns {Object} Validation result with success flag and any errors
     */
    validateEdge(sourceId, targetId) {
      const { graphManager, cycleDetector, config } = this.workflowManager;
      const errors = [];
      
      // Check if nodes exist
      const sourceNode = graphManager.getNodeData(sourceId);
      const targetNode = graphManager.getNodeData(targetId);
      
      if (!sourceNode) {
        errors.push('Source node does not exist');
      }
      
      if (!targetNode) {
        errors.push('Target node does not exist');
      }
      
      // Check if edge already exists
      const edgeExists = graphManager.edges.some(
        edge => edge.source === sourceId && edge.target === targetId
      );
      
      if (edgeExists) {
        errors.push('Connection already exists');
      }
      
      // Check if adding this edge would create a cycle
      if (!config.allowCycles && cycleDetector.wouldCreateCycle(sourceId, targetId)) {
        errors.push('Connection would create a cycle');
      }
      
      return {
        success: errors.length === 0,
        errors
      };
    }
    
    /**
     * Check if workflow configuration is valid
     * 
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result with success flag and any errors
     */
    validateConfig(config) {
      const errors = [];
      
      // Check maxCycleIterations
      if (typeof config.maxCycleIterations !== 'undefined') {
        const iterations = parseInt(config.maxCycleIterations);
        if (isNaN(iterations) || iterations < 1) {
          errors.push('Maximum cycle iterations must be at least 1');
        } else if (iterations > 10) {
          errors.push('Warning: High iteration count may cause long execution times');
        }
      }
      
      // Check maxTotalIterations
      if (typeof config.maxTotalIterations !== 'undefined') {
        const iterations = parseInt(config.maxTotalIterations);
        if (isNaN(iterations) || iterations < 1) {
          errors.push('Maximum total iterations must be at least 1');
        } else if (iterations > 100) {
          errors.push('Warning: Very high total iteration count may cause execution timeouts');
        }
      }
      
      // Check timeoutSeconds
      if (typeof config.timeoutSeconds !== 'undefined') {
        const timeout = parseInt(config.timeoutSeconds);
        if (isNaN(timeout) || timeout < 0) {
          errors.push('Timeout must be a non-negative number');
        } else if (timeout > 600) {
          errors.push('Warning: Timeout longer than 10 minutes may be excessive');
        }
      }
      
      // Check cycleHandlingMode
      if (typeof config.cycleHandlingMode !== 'undefined') {
        const validModes = ['stop', 'iterate', 'unwrap'];
        if (!validModes.includes(config.cycleHandlingMode)) {
          errors.push(`Invalid cycle handling mode: ${config.cycleHandlingMode}. Must be one of: ${validModes.join(', ')}`);
        }
      }
      
      return {
        success: errors.filter(e => !e.startsWith('Warning:')).length === 0,
        errors
      };
    }
  }