/**
 * workflow/WorkflowManager.js
 * 
 * Main coordinator for workflow management in AI Canvas.
 * Integrates specialized sub-modules for different workflow responsibilities.
 */
import { CycleDetector } from './CycleDetector.js';
import { TopologicalSorter } from './TopologicalSorter.js';
import { ExecutionEngine } from './ExecutionEngine.js';
import { WorkflowValidator } from './WorkflowValidator.js';
import { WorkflowVisualizer } from './WorkflowVisualizer.js';
import { config } from '../config.js';

export class WorkflowManager {
  constructor(apiClient, eventBus, graphManager, conversationManager) {
    this.apiClient = apiClient;
    this.eventBus = eventBus;
    this.graphManager = graphManager;
    this.conversationManager = conversationManager;
    
    // Configuration
    this.config = {
      allowCycles: config.workflow?.allowCycles || false,
      cycleHandlingMode: config.workflow?.cycleHandlingMode || 'stop',
      maxCycleIterations: config.workflow?.maxCycleIterations || 3,
      maxTotalIterations: config.workflow?.maxTotalIterations || 50,
      timeoutSeconds: config.workflow?.timeoutSeconds || 60
    };
    
    // Initialize execution state
    this.executionState = this.resetExecutionState();
    
    // Initialize sub-modules
    this.cycleDetector = new CycleDetector(this);
    this.topologicalSorter = new TopologicalSorter(this);
    this.executionEngine = new ExecutionEngine(this);
    this.validator = new WorkflowValidator(this);
    this.visualizer = new WorkflowVisualizer(this);
    
    // Current graph ID
    this.currentGraphId = null;
    
    // Debug mode for additional logging
    this.debug = config.debug || false;
  }
  
  /**
   * Initialize the workflow manager and all sub-modules
   */
  async initialize() {
    if (this.debug) console.log('Workflow Manager initializing...');
    
    // Initialize sub-modules
    this.cycleDetector.initialize();
    this.topologicalSorter.initialize();
    this.executionEngine.initialize();
    this.validator.initialize();
    this.visualizer.initialize(this.graphManager, this.eventBus);
    
    // Subscribe to events
    this.subscribeToEvents();
    
    if (this.debug) console.log('Workflow Manager initialized successfully');
    
    // Publish workflow initialized event
    this.eventBus.publish('workflow:initialized', { 
      config: { ...this.config }
    });
  }
  
  /**
   * Subscribe to events
   */
  subscribeToEvents() {
    this.eventBus.subscribe('graph:loaded', this.handleGraphLoaded, this);
    this.eventBus.subscribe('graph:cleared', this.handleGraphCleared, this);
    
    // Monitor graph changes to validate workflow
    this.eventBus.subscribe('edge:added', () => this.validator.validateWorkflowSilent());
    this.eventBus.subscribe('edge:removed', () => this.validator.validateWorkflowSilent());
    this.eventBus.subscribe('node:added', () => this.validator.validateWorkflowSilent());
    this.eventBus.subscribe('node:removed', () => this.validator.validateWorkflowSilent());
  }
  
  /**
   * Handle graph loaded event
   * 
   * @param {Object} graphData - Loaded graph data
   */
  handleGraphLoaded(graphData) {
    if (graphData && graphData.id) {
      this.currentGraphId = graphData.id;
      
      // Validate the loaded graph silently
      this.validator.validateWorkflowSilent();
    }
  }
  
  /**
   * Handle graph cleared event
   */
  handleGraphCleared() {
    this.currentGraphId = null;
    this.executionState = this.resetExecutionState();
    
    // Reset visualizer
    this.visualizer.resetVisualization();
  }
  
  /**
   * Reset execution state to initial values
   */
  resetExecutionState() {
    return {
      isExecuting: false,
      startTime: null,
      currentNode: null,
      executionOrder: [],
      executionResults: {},
      nodeIterationCount: {},
      cycleIterationCount: {},
      errors: []
    };
  }
  
  /**
   * Execute a workflow by processing nodes in topological order
   * 
   * @param {string} graphId - ID of the graph to execute
   * @returns {Promise<Object>} Execution results
   */
  async executeWorkflow(graphId) {
    try {
      // Ensure graph ID is valid
      const useGraphId = graphId || this.currentGraphId || localStorage.getItem('aiCanvas_lastGraphId');
      if (!useGraphId) {
        throw new Error('No graph ID provided and no current graph loaded');
      }
      
      // Log for debugging
      console.log("Executing workflow with graph ID:", useGraphId);
      
      // Execute workflow using execution engine
      const result = await this.executionEngine.executeWorkflow(useGraphId);
      
      // Log successful completion
      console.log("Workflow execution completed:", result);
      
      return result;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      
      // Ensure the error is a proper Error object with a message
      const errorMessage = error.message || 'Unknown error during workflow execution';
      
      // Publish workflow execution failed event
      this.eventBus.publish('workflow:failed', {
        graphId: graphId || this.currentGraphId,
        error: errorMessage
      });
      
      throw error;
    }
  }
  
  /**
   * Highlight cycles in the graph
   */
  highlightCycles() {
    const { cycles } = this.cycleDetector.detectCycles();
    this.visualizer.visualizeCycles(cycles);
    return cycles;
  }
  
  /**
   * Break cycles in the graph by removing edges
   * 
   * @returns {Array} Array of removed edge IDs
   */
  breakCycles() {
    return this.cycleDetector.breakCycles();
  }
  
  /**
   * Get suggestions for fixing workflow issues
   * 
   * @returns {Array} Array of suggestion objects
   */
  getWorkflowSuggestions() {
    return this.validator.getWorkflowSuggestions();
  }
  
  /**
   * Validate a workflow before execution
   * 
   * @returns {Object} Validation result with success flag and any errors
   */
  validateWorkflow() {
    return this.validator.validateWorkflow();
  }
  
  /**
   * Estimate execution time based on graph complexity
   * 
   * @returns {Object} Execution time estimate
   */
  estimateExecutionTime() {
    return this.executionEngine.estimateExecutionTime();
  }
  
  /**
   * Update workflow configuration
   * 
   * @param {Object} newConfig - New configuration values
   * @returns {Object} Updated configuration
   */
  updateConfig(newConfig) {
    // Validate new configuration
    const validation = this.validator.validateConfig(newConfig);
    
    if (!validation.success) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    // Apply valid changes
    Object.keys(newConfig).forEach(key => {
      if (this.config.hasOwnProperty(key)) {
        this.config[key] = newConfig[key];
      }
    });
    
    // Publish config updated event
    this.eventBus.publish('workflow:config-updated', { 
      config: { ...this.config } 
    });
    
    return { ...this.config };
  }
  
  /**
   * Get the current workflow configuration
   * 
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Get the current graph ID
   * 
   * @returns {string|null} Current graph ID or null if no graph is loaded
   */
  getCurrentGraphId() {
    return this.currentGraphId;
  }
  
  /**
   * Check if a graph has cycles
   * 
   * @returns {boolean} True if the graph has cycles
   */
  checkForCycles() {
    return this.cycleDetector.hasCycles();
  }
  
  /**
   * Compute a topological sort of the graph
   * 
   * @returns {Array|null} Ordered array of node IDs, or null if graph has cycles
   */
  computeTopologicalSort() {
    return this.topologicalSorter.computeTopologicalSort();
  }
  
  /**
   * Get detailed information about detected cycles
   * 
   * @returns {Object} Cycle information with node names
   */
  getCycleInfo() {
    return this.cycleDetector.getCycleDetails();
  }
  
  /**
   * Get execution order for the current graph
   * 
   * @returns {Array} Array of node IDs in execution order
   */
  getExecutionOrder() {
    return this.topologicalSorter.computeTopologicalSort() || [];
  }
  
  /**
   * Stop current workflow execution
   */
  stopExecution() {
    if (this.executionState.isExecuting) {
      this.executionState.isExecuting = false;
      this.eventBus.publish('workflow:stopped', {
        graphId: this.currentGraphId,
        message: 'Workflow execution stopped by user'
      });
    }
  }
}