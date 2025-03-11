/**
 * app.js
 * 
 * Main entry point for the AI Canvas application.
 * Bootstraps and coordinates all modules.
 */

// Import core modules
import { EventBus } from './core/EventBus.js';
import { ErrorHandler } from './core/ErrorHandler.js';
import { APIClient } from './api/APIClient.js';
import { StorageManager } from './storage/StorageManager.js';
import { GraphManager } from './graph/GraphManager.js';
import { ConversationManager } from './conversation/ConversationManager.js';
import { ModelRegistry } from './models/ModelRegistry.js';
import { WorkflowManager } from './workflow/WorkflowManager.js';
import { UIManager } from './ui/UIManager.js';
import { workflowPanelRegistry } from './ui/registry/WorkflowPanelRegistry.js';
import { config } from './config.js';

/**
 * Main application class that orchestrates all modules
 */
class AICanvas {
  constructor() {
    console.log('Initializing AI Canvas application...');
    
    // Create core services
    this.eventBus = new EventBus();
    this.errorHandler = new ErrorHandler(this.eventBus);
    this.apiClient = new APIClient(config.apiBaseUrl, this.eventBus, this.errorHandler);
    this.storageManager = new StorageManager(this.eventBus);
    
    // Create domain-specific modules
    this.modelRegistry = new ModelRegistry(this.apiClient, this.eventBus);
    this.graphManager = new GraphManager(this.apiClient, this.eventBus, this.storageManager);
    this.conversationManager = new ConversationManager(
      this.apiClient, 
      this.eventBus, 
      this.graphManager
    );
    
    // Create workflow manager with all required dependencies
    this.workflowManager = new WorkflowManager(
      this.apiClient, 
      this.eventBus, 
      this.graphManager, 
      this.conversationManager
    );
    
    // Create UI manager last since it depends on all other modules
    this.uiManager = new UIManager(
      this.eventBus,
      this.graphManager,
      this.conversationManager,
      this.modelRegistry,
      this.workflowManager,
      this.errorHandler
    );
    
    // Initialize error handling
    this.setupErrorHandling();
    
    // Configure event monitoring
    this.setupEventMonitoring();
    
    // Make modules available globally for debugging and console access
    this.exposeGlobals();
  }
  
  /**
   * Set up event monitoring for critical events
   */
  setupEventMonitoring() {
    if (config.debug) {
      // Monitor graph loading events
      this.eventBus.subscribe('graph:loaded', (graphData) => {
        console.log('DEBUG: Graph loaded event received:', graphData?.id || 'No ID');
        console.log('Current graph IDs:');
        console.log('- GraphManager:', this.graphManager.getCurrentGraphId());
        console.log('- WorkflowManager:', this.workflowManager.currentGraphId);
      });
      
      // Monitor graph importing events
      this.eventBus.subscribe('graph:imported', (graphData) => {
        console.log('DEBUG: Graph imported event received:', graphData?.id || 'No ID');
        this.syncGraphIds();
      });
      
      // Monitor workflow execution
      this.eventBus.subscribe('workflow:executing', (data) => {
        console.log('DEBUG: Workflow executing with graph ID:', data.graphId);
      });
    }
  }
  
  /**
   * Synchronize graph IDs between GraphManager and WorkflowManager
   */
  syncGraphIds() {
    const graphManagerId = this.graphManager.getCurrentGraphId();
    
    if (graphManagerId) {
      // Ensure the WorkflowManager has the same graph ID
      this.workflowManager.currentGraphId = graphManagerId;
      
      if (config.debug) {
        console.log(`DEBUG: Synchronized graph IDs to: ${graphManagerId}`);
      }
    } else if (this.workflowManager.currentGraphId) {
      if (config.debug) {
        console.warn('DEBUG: GraphManager has no current graph ID, but WorkflowManager does:', 
          this.workflowManager.currentGraphId);
      }
    }
  }
  
  /**
   * Set up global error handling
   */
  setupErrorHandling() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.errorHandler.handleError(error || new Error(message), {
        source,
        lineno,
        colno,
        context: 'Global error handler'
      });
      return true; // Prevent default error handling
    };
    
    window.addEventListener('unhandledrejection', (event) => {
      this.errorHandler.handleError(event.reason, {
        context: 'Unhandled Promise rejection'
      });
      event.preventDefault();
    });
  }
  
  /**
   * Expose key objects to the global scope for debugging and legacy compatibility
   */
  exposeGlobals() {
    // Make key managers available globally
    window.graphManager = this.graphManager;
    window.conversationManager = this.conversationManager;
    window.errorHandler = this.errorHandler;
    window.eventBus = this.eventBus;
    window.workflowManager = this.workflowManager;
    window.workflowPanelRegistry = workflowPanelRegistry;
    
    // Add helper methods for debugging
    window.debugGraphState = () => {
      console.log('Current graph state:');
      console.log('- GraphManager ID:', this.graphManager.getCurrentGraphId());
      console.log('- GraphManager name:', this.graphManager.getCurrentGraphName());
      console.log('- WorkflowManager ID:', this.workflowManager.currentGraphId);
      console.log('- Nodes count:', this.graphManager.nodes.length);
      console.log('- Edges count:', this.graphManager.edges.length);
      return {
        graphManagerId: this.graphManager.getCurrentGraphId(),
        graphName: this.graphManager.getCurrentGraphName(),
        workflowManagerId: this.workflowManager.currentGraphId,
        nodesCount: this.graphManager.nodes.length,
        edgesCount: this.graphManager.edges.length
      };
    };
    
    // Add sync method for debugging
    window.syncGraphIds = () => this.syncGraphIds();
    
    // Add helper method to clean up duplicate workflow panels
    window.cleanupWorkflowPanels = () => {
      const removedCount = workflowPanelRegistry.cleanupDuplicates();
      console.log(`Manually cleaned up ${removedCount} duplicate workflow panels`);
      return removedCount;
    };
    
    // Add resetLocalGraphData to global scope for backward compatibility
    window.resetLocalGraphData = () => {
      this.storageManager.removeItem('aiCanvas_lastGraphId');
      this.storageManager.removeItem('aiCanvas_graph');
      console.log('Local graph data has been reset');
      alert('Local graph data has been reset. Please try creating a new graph.');
    };
    
    // Add resetDatabase to global scope for backward compatibility
    window.resetDatabase = async () => {
      if (!confirm('WARNING: This will delete ALL graphs and data. This action cannot be undone. Are you sure?')) {
        return;
      }
  
      const resetDbBtn = document.getElementById('reset-db-btn');
      if (resetDbBtn) {
        resetDbBtn.textContent = 'Resetting...';
        resetDbBtn.disabled = true;
      }
      
      try {
        await this.graphManager.resetDatabase();
        
        alert('Database has been reset successfully');
        
        // Also clear local storage
        window.resetLocalGraphData();
        
        // Clear the current graph
        this.graphManager.clearGraph();
      } catch (error) {
        console.error('Error resetting database:', error);
        alert(`Error resetting database: ${error.message}`);
      } finally {
        if (resetDbBtn) {
          resetDbBtn.textContent = 'Reset DB';
          resetDbBtn.disabled = false;
        }
      }
    };
  }
  
  /**
   * Clean up any duplicate workflow panels from previous sessions
   */
  cleanupDuplicatePanels() {
    // Use the registry to clean up duplicates
    const removedCount = workflowPanelRegistry.cleanupDuplicates();
    
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} duplicate workflow panels during application initialization`);
    }
  }
  
  /**
   * Initialize the application and all modules
   */
  async initialize() {
    try {
      // Enable debug mode in development
      if (config.debug) {
        this.eventBus.setDebugMode(true);
        console.log('Debug mode enabled');
      }
      
      // Clean up any duplicate workflow panels from previous sessions
      this.cleanupDuplicatePanels();
      
      // Initialize modules in the correct order
      await this.modelRegistry.initialize();
      await this.graphManager.initialize();
      await this.conversationManager.initialize();
      await this.workflowManager.initialize();
      
      // Initialize UI last
      await this.uiManager.initialize();
      
      console.log('AI Canvas application initialized successfully');
      
      // Try to load saved graph
      await this.loadInitialGraph();
      
      // Ensure graph IDs are synchronized
      this.syncGraphIds();
      
      if (config.debug) {
        console.log('Initialization complete. Current graph state:');
        window.debugGraphState();
      }
    } catch (error) {
      this.errorHandler.handleError(error, {
        context: 'Application initialization'
      });
    }
  }
  
  /**
   * Load the initial graph from last session or create a new one
   */
  async loadInitialGraph() {
    try {
      const lastGraphId = this.storageManager.getItem('aiCanvas_lastGraphId');
      
      if (lastGraphId) {
        console.log(`Attempting to load last used graph: ${lastGraphId}`);
        try {
          const loadedGraph = await this.graphManager.loadGraphById(lastGraphId);
          
          // Explicitly update the workflow manager with the loaded graph ID
          if (loadedGraph && loadedGraph.id) {
            this.workflowManager.currentGraphId = loadedGraph.id;
            
            if (config.debug) {
              console.log(`Set WorkflowManager.currentGraphId to ${loadedGraph.id}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to load graph ${lastGraphId}:`, error);
          
          // If we got a 404, the graph doesn't exist anymore
          if (error.status === 404) {
            this.storageManager.removeItem('aiCanvas_lastGraphId');
            this.storageManager.removeItem('aiCanvas_graph');
            console.log('Removed invalid graph reference from local storage');
          }
          
          // Try to load from local storage as fallback
          this.loadGraphFromLocalStorage();
        }
      } else {
        this.loadGraphFromLocalStorage();
      }
    } catch (error) {
      this.errorHandler.handleError(error, {
        context: 'Loading initial graph'
      });
    }
  }
  
  /**
   * Attempt to load a graph from local storage
   */
  loadGraphFromLocalStorage() {
    try {
      const savedGraph = this.storageManager.getItem('aiCanvas_graph');
      if (savedGraph) {
        const graphData = typeof savedGraph === 'string' ? JSON.parse(savedGraph) : savedGraph;
        this.graphManager.importGraph(graphData);
        
        // Explicitly update the workflow manager with the graph ID
        if (graphData && graphData.id) {
          this.workflowManager.currentGraphId = graphData.id;
          
          if (config.debug) {
            console.log(`Set WorkflowManager.currentGraphId to ${graphData.id} from localStorage`);
          }
        } else {
          // If the graph data doesn't have an ID, sync with whatever the GraphManager has
          setTimeout(() => this.syncGraphIds(), 100);
        }
        
        console.log('Loaded graph from local storage');
      } else {
        console.log('No saved graph found. Starting with an empty canvas.');
      }
    } catch (error) {
      this.errorHandler.handleError(error, {
        context: 'Loading graph from local storage'
      });
      console.log('Failed to load graph from local storage. Starting with an empty canvas.');
    }
  }
}

// Bootstrap the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new AICanvas();
  app.initialize();
});
