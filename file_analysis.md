# AI Canvas Project - Comprehensive File Structure and Class Analysis

## Complete File Tree Structure

```
ai_canvas/
│
├── static/
│   ├── js/
│   │   ├── config.js                     # Configuration settings for the application
│   │   │
│   │   ├── graph/                        # Graph-related functionality
│   │   │   ├── CytoscapeManager.js       # Manages Cytoscape.js integration for graph visualization
│   │   │   ├── EdgeManager.js            # Handles edge operations (creation, deletion, querying)
│   │   │   ├── GraphLayoutManager.js     # Controls graph layouts and node positioning
│   │   │   ├── GraphManager.js           # Core graph management class coordinating all graph operations
│   │   │   ├── GraphStorage.js           # Graph persistence (save, load, import/export)
│   │   │   └── NodeManager.js            # Handles node operations (creation, deletion, selection, data)
│   │   │
│   │   ├── models/
│   │   │   └── ModelRegistry.js          # Manages AI model information and settings
│   │   │
│   │   ├── modules/
│   │   │   ├── ConversationPanel.js      # Handles chat interface and message exchange
│   │   │   └── GraphEditor.js            # Graph editing functionality and UI integration
│   │   │
│   │   ├── storage/
│   │   │   └── StorageManager.js         # Local storage management with prefixed keys
│   │   │
│   │   ├── ui/
│   │   │   ├── ConversationPanelManager.js # Manages conversation UI and chat messaging
│   │   │   ├── DialogManager.js          # Manages dialog boxes for user interactions
│   │   │   ├── GraphControlsManager.js   # Graph control buttons for operations
│   │   │   ├── NodeModalManager.js       # Node creation/editing modal functionality
│   │   │   ├── NodeOperationsManager.js  # Node operations UI and interaction handling
│   │   │   ├── NotificationManager.js    # Notification system for user feedback
│   │   │   ├── UIManager.js              # Main UI coordination and event handling
│   │   │   ├── ui-theme-manager.js       # Theme management (light/dark modes)
│   │   │   ├── WorkflowPanel.js          # Workflow UI panel for execution controls
│   │   │   └── WorkflowPanelManager.js   # Workflow panel management and state handling
│   │   │
│   │   └── workflow/                     # Workflow execution engine
│   │       ├── CycleDetector.js          # Detects and handles cycles in graph
│   │       ├── ExecutionEngine.js        # Executes workflow operations on nodes
│   │       ├── index.js                  # Workflow module entry point and exports
│   │       ├── TopologicalSorter.js      # Sorts nodes in execution order
│   │       ├── WorkflowManager.js        # Main workflow coordinator
│   │       ├── WorkflowValidator.js      # Validates workflows for execution
│   │       └── WorkflowVisualizer.js     # Visualizes workflow execution progress
│   │
│   └── css/                              # Stylesheet files
│       ├── styles.css                    # Main stylesheet
│       └── modules/                      # CSS modules for different components
│           ├── graph.css                 # Graph visualization styles
│           ├── conversation.css          # Conversation panel styles
│           ├── modals.css                # Modal dialog styles
│           ├── buttons.css               # Button styles
│           ├── notifications.css         # Notification styles
│           └── workflow.css              # Workflow visualization styles
│
├── backend/                              # Server-side code
│   ├── app/                              # Backend application
│   │   ├── __init__.py                   # App initialization
│   │   ├── api.py                        # API endpoint definitions
│   │   ├── routes.py                     # URL routing
│   │   │
│   │   ├── models/                       # Data models
│   │   │   ├── __init__.py               # Models initialization
│   │   │   ├── graph.py                  # Graph data model
│   │   │   ├── node.py                   # Node data model
│   │   │   └── user.py                   # User data model
│   │   │
│   │   ├── services/                     # Business logic
│   │   │   ├── __init__.py               # Services initialization
│   │   │   ├── graph_service.py          # Graph CRUD operations
│   │   │   ├── ai_service.py             # AI model integration
│   │   │   └── workflow_service.py       # Workflow execution service
│   │   │
│   │   └── utils/                        # Utility functions
│   │       ├── __init__.py               # Utils initialization
│   │       ├── auth.py                   # Authentication utilities
│   │       └── validators.py             # Input validation
│   │
│   ├── templates/                        # HTML templates
│   │   └── index.html                    # Main application template
│   │
│   └── run.py                            # Application entry point
│
└── tests/                                # Test suite
    ├── __init__.py                       # Tests initialization
    ├── test_graph.py                     # Graph functionality tests
    └── test_workflow.py                  # Workflow functionality tests
```

## Detailed Class and Method Analysis

### GraphManager Class (GraphManager.js)

The central coordinator for all graph operations.

**Properties:**
- `apiClient` - API client for server communication
- `eventBus` - Event bus for publish/subscribe
- `storageManager` - StorageManager instance
- `currentGraphId` - ID of the current graph
- `currentGraphName` - Name of the current graph
- `isModified` - Flag for unsaved changes
- `cytoscapeManager` - CytoscapeManager instance
- `nodeManager` - NodeManager instance
- `edgeManager` - EdgeManager instance
- `graphStorage` - GraphStorage instance
- `layoutManager` - GraphLayoutManager instance

**Methods:**
- `initialize()` - Initialize the graph manager and all sub-managers
- `subscribeToEvents()` - Subscribe to required events
- `markAsModified()` - Mark the current graph as modified
- `clearModifiedFlag()` - Clear the modified flag
- `getCurrentGraphId()` - Get the current graph ID
- `getCurrentGraphName()` - Get the current graph name
- `hasUnsavedChanges()` - Check if current graph has unsaved changes
- `setCurrentGraph(id, name)` - Set the current graph details
- `exportGraph()` - Export the current graph to a data object
- `importGraph(graphData)` - Import a graph from a data object
- `clearGraph()` - Clear the graph
- `saveGraph(name, description, forceNew)` - Save the current graph to the server
- `loadGraphById(graphId)` - Load a graph by ID from the server
- `getAvailableGraphs()` - Get all available graphs from the server
- `deleteGraph(graphId)` - Delete a graph from the server
- `resetDatabase()` - Reset the database (admin function)
- `visualizeWorkflowExecution(executionOrder, results)` - Visualize workflow execution
- `highlightCycles(cycles)` - Highlight cycles in the graph
- `clearWorkflowVisualization()` - Clear workflow visualization styles

### CytoscapeManager Class (CytoscapeManager.js)

Manages the Cytoscape.js graph visualization library.

**Properties:**
- `graphManager` - Parent GraphManager instance
- `cy` - Cytoscape instance
- `cyContainer` - DOM container for Cytoscape
- `styleDefinition` - Graph style definition

**Methods:**
- `initialize()` - Initialize the Cytoscape instance
- `setupEventListeners()` - Set up event listeners for the Cytoscape instance
- `getGraphStyle()` - Get the graph style definition for Cytoscape
- `addNode(id, data, classes, position)` - Add a node to the Cytoscape instance
- `findNode(nodeId)` - Find a node in the Cytoscape instance
- `addEdge(id, sourceId, targetId)` - Add an edge between nodes
- `findEdge(edgeId)` - Find an edge in the Cytoscape instance
- `removeElement(id)` - Remove an element (node or edge) from Cytoscape
- `clearAll()` - Clear all elements from the Cytoscape instance
- `getAllNodeElements()` - Get all current nodes as Cytoscape collection
- `getAllEdgeElements()` - Get all current edges as Cytoscape collection
- `findConnectedEdges(nodeId, direction)` - Find edges connecting to a node
- `selectNode(nodeId)` - Select a node
- `clearSelection()` - Clear selection
- `highlightPath(nodeIds, className)` - Highlight a path in the graph

### NodeManager Class (NodeManager.js)

Handles node operations like creation, deletion, and data management.

**Properties:**
- `graphManager` - Parent GraphManager instance
- `nodes` - Map of node data by ID
- `selectedNodeId` - Currently selected node ID

**Methods:**
- `addNode(nodeData)` - Add a node to the graph
- `updateNode(nodeId, nodeData)` - Update an existing node
- `removeNode(nodeId)` - Remove a node from the graph
- `getNodeData(nodeId)` - Get data for a specific node
- `getAllNodes()` - Get all nodes
- `getNodeCount()` - Get count of nodes
- `nodeExists(nodeId)` - Check if a node exists
- `selectNode(nodeId)` - Select a node in the graph
- `deselectNode()` - Deselect the currently selected node
- `getSelectedNodeId()` - Get the selected node ID
- `clearNodes()` - Clear all nodes
- `getChildNodes(nodeId)` - Get all child nodes for a given node
- `getParentNodes(nodeId)` - Get parent nodes for a given node

### EdgeManager Class (EdgeManager.js)

Manages edges between nodes in the graph.

**Properties:**
- `graphManager` - Parent GraphManager instance
- `edges` - Map of edge data by ID

**Methods:**
- `addEdge(sourceId, targetId)` - Add an edge between two nodes
- `removeEdge(edgeId)` - Remove an edge from the graph
- `getEdgeById(edgeId)` - Get an edge by ID
- `getAllEdges()` - Get all edges
- `getEdgeCount()` - Get count of edges
- `getEdgesForNode(nodeId, direction)` - Get all edges for a node
- `edgeExists(edgeId)` - Check if an edge exists
- `hasEdge(sourceId, targetId)` - Check if an edge exists between two nodes
- `clearEdges()` - Clear all edges
- `wouldCreateCycle(sourceId, targetId)` - Check if adding edge would create cycle

### GraphLayoutManager Class (GraphLayoutManager.js)

Controls the layout algorithms and node positioning in the graph.

**Properties:**
- `graphManager` - Parent GraphManager instance
- `layoutOptions` - Default layout options for each algorithm

**Methods:**
- `runLayout(layoutName, customOptions)` - Run a layout algorithm on the graph
- `getAvailableLayouts()` - Get available layout names
- `arrangeInCircle()` - Arrange nodes in a circle
- `arrangeInGrid(rows, columns)` - Arrange nodes in a grid
- `arrangeHierarchical()` - Arrange nodes in a hierarchical layout
- `getNodePositions()` - Get node positions
- `applyNodePositions(positions)` - Apply node positions
- `fitGraph(padding)` - Fit the graph to the viewport
- `centerGraph()` - Center the graph in the viewport

### GraphStorage Class (GraphStorage.js)

Handles persistent storage of graph data on server and local backup.

**Properties:**
- `graphManager` - Parent GraphManager instance
- `apiClient` - API client for server communication

**Methods:**
- `saveGraph(name, description, forceNew)` - Save graph to server
- `loadGraphById(graphId)` - Load graph by ID from server
- `getAvailableGraphs()` - Get all available graphs from server
- `deleteGraph(graphId)` - Delete graph from server
- `clearGraphData(graphId)` - Clear existing graph data before update
- `resetDatabase()` - Reset the database (admin function)
- `exportToJson()` - Export graph to JSON
- `importFromJson(jsonString)` - Import graph from JSON

### WorkflowManager Class (WorkflowManager.js)

Main coordinator for workflow management and execution.

**Properties:**
- `apiClient` - API client for server communication
- `eventBus` - Event bus for publish/subscribe
- `graphManager` - GraphManager instance
- `conversationManager` - ConversationManager instance
- `config` - Workflow configuration settings
- `executionState` - Current execution state
- `cycleDetector` - CycleDetector instance
- `topologicalSorter` - TopologicalSorter instance
- `executionEngine` - ExecutionEngine instance
- `validator` - WorkflowValidator instance
- `visualizer` - WorkflowVisualizer instance
- `currentGraphId` - Current graph ID

**Methods:**
- `initialize()` - Initialize the workflow manager and sub-modules
- `subscribeToEvents()` - Subscribe to events
- `handleGraphLoaded(graphData)` - Handle graph loaded event
- `handleGraphCleared()` - Handle graph cleared event
- `resetExecutionState()` - Reset execution state to initial values
- `executeWorkflow(graphId)` - Execute a workflow by processing nodes
- `highlightCycles()` - Highlight cycles in the graph
- `breakCycles()` - Break cycles in the graph by removing edges
- `getWorkflowSuggestions()` - Get suggestions for fixing workflow issues
- `validateWorkflow()` - Validate a workflow before execution
- `estimateExecutionTime()` - Estimate execution time based on complexity
- `updateConfig(newConfig)` - Update workflow configuration
- `getConfig()` - Get the current workflow configuration
- `getCurrentGraphId()` - Get the current graph ID
- `checkForCycles()` - Check if a graph has cycles
- `computeTopologicalSort()` - Compute a topological sort of the graph
- `getCycleInfo()` - Get detailed information about detected cycles
- `getExecutionOrder()` - Get execution order for the current graph
- `stopExecution()` - Stop current workflow execution

### CycleDetector Class (CycleDetector.js)

Detects and provides ways to handle cycles in the workflow graph.

**Properties:**
- `workflowManager` - Parent WorkflowManager instance
- `graphManager` - GraphManager instance reference

**Methods:**
- `initialize()` - Initialize the cycle detector
- `detectCycles()` - Detect cycles in the graph
- `hasCycles()` - Check if the graph has any cycles
- `getCycleDetails()` - Get detailed information about cycles
- `breakCycles()` - Break cycles by removing edges
- `findAllCycles()` - Find all cycles in the graph
- `findCyclesFromNode(nodeId, visited, recursionStack, path)` - Find cycles from a specific node

### ExecutionEngine Class (ExecutionEngine.js)

Executes workflow operations on nodes in the correct order.

**Properties:**
- `workflowManager` - Parent WorkflowManager instance
- `apiClient` - API client for server communication
- `eventBus` - Event bus for publish/subscribe
- `graphManager` - GraphManager instance reference

**Methods:**
- `initialize()` - Initialize the execution engine
- `executeWorkflow(graphId)` - Execute a workflow by graph ID
- `executeNode(nodeId, inputs)` - Execute a single node with inputs
- `collectNodeInputs(nodeId)` - Collect inputs for a node from parent nodes
- `estimateExecutionTime()` - Estimate execution time based on graph complexity
- `resetExecutionState()` - Reset execution state
- `handleNodeResult(nodeId, result)` - Process node execution result
- `handleExecutionError(nodeId, error)` - Handle node execution error

### TopologicalSorter Class (TopologicalSorter.js)

Sorts nodes in execution order ensuring dependencies are respected.

**Properties:**
- `workflowManager` - Parent WorkflowManager instance
- `graphManager` - GraphManager instance reference

**Methods:**
- `initialize()` - Initialize the topological sorter
- `computeTopologicalSort()` - Compute a topological sort of the graph
- `topologicalSortUtil(nodeId, visited, stack)` - Utility for topological sort
- `isValidForSort()` - Check if graph is valid for topological sort
- `getSourceNodes()` - Get nodes with no incoming edges
- `getSinkNodes()` - Get nodes with no outgoing edges

### WorkflowValidator Class (WorkflowValidator.js)

Validates workflow configuration and structure.

**Properties:**
- `workflowManager` - Parent WorkflowManager instance
- `graphManager` - GraphManager instance reference
- `validationResults` - Last validation results

**Methods:**
- `initialize()` - Initialize the validator
- `validateWorkflow()` - Validate workflow for execution
- `validateWorkflowSilent()` - Validate workflow without publishing events
- `validateConfig(config)` - Validate workflow configuration
- `checkForIsolatedNodes()` - Check for nodes not connected to any other nodes
- `checkForMissingNodeTypes()` - Check for nodes with undefined types
- `checkForEmptyGraph()` - Check if graph is empty
- `getWorkflowSuggestions()` - Get suggestions for fixing workflow issues

### StorageManager Class (StorageManager.js)

Manages browser localStorage with prefixed keys.

**Properties:**
- `eventBus` - Event bus for publish/subscribe
- `prefix` - Prefix for localStorage keys (default: 'aiCanvas_')
- `isAvailable` - Whether localStorage is available

**Methods:**
- `checkAvailability()` - Check if localStorage is available
- `getKey(key)` - Get a prefixed key
- `getItem(key, defaultValue)` - Get an item from storage
- `setItem(key, value)` - Set an item in storage
- `removeItem(key)` - Remove an item from storage
- `clear()` - Clear all items with this prefix
- `getKeys()` - Get all stored keys with this prefix

### UIManager Class (UIManager.js)

Manages the user interface and coordinates UI components.

**Properties:**
- `eventBus` - Event bus for publish/subscribe
- `graphManager` - GraphManager instance
- `conversationManager` - ConversationManager instance
- `modelRegistry` - ModelRegistry instance
- `workflowManager` - WorkflowManager instance
- `errorHandler` - ErrorHandler instance
- `dialogManager` - DialogManager instance
- `notificationManager` - NotificationManager instance
- `nodeModalManager` - NodeModalManager instance
- `graphControlsManager` - GraphControlsManager instance
- `nodeOperationsManager` - NodeOperationsManager instance
- `conversationPanelManager` - ConversationPanelManager instance

**Methods:**
- `initialize()` - Initialize the UI Manager and sub-managers
- `destroy()` - Clean up resources on destroy
- `findDOMElements()` - Find all required DOM elements
- `setupEventListeners()` - Set up global DOM event listeners
- `subscribeToEvents()` - Subscribe to required events
- `showNotification(message, type, duration)` - Show notification message
- `openNodeChat(nodeId, nodeName)` - Open node chat dialog
- `showResultModal(nodeId, result)` - Show the full result modal
- `initializeSpaceBackground()` - Initialize space background effects
- `showWorkflowSuggestions()` - Get suggestions for fixing workflow issues
- `highlightIsolatedNodes()` - Highlight isolated nodes in the graph
- Multiple event handler methods for various system events

### ModelRegistry Class (ModelRegistry.js)

Manages information about available AI models and their settings.

**Properties:**
- `apiClient` - API client for server communications
- `eventBus` - Event bus for publish/subscribe
- `models` - Available models by backend
- `modelLimits` - Limits and capabilities of models

**Methods:**
- `initialize()` - Initialize the model registry
- `fetchAvailableModels()` - Fetch available models from the API
- `fetchModelLimits()` - Fetch model limits from the API
- `refreshModels()` - Refresh the available models
- `getAllModels()` - Get all available models
- `getModelsForBackend(backend)` - Get models for specific backend
- `getModelLimits(model)` - Get limits for specific model
- `isModelAvailable(backend, model)` - Check if model is available
- `getOptimalSettings(backend, model)` - Get optimal settings for model
- `getRecommendedModels(useCase)` - Get recommended models for use case

## Backend Components

### GraphService (graph_service.py)

Handles graph CRUD operations and persistence on the server.

**Methods:**
- `create_graph(name, description, user_id)` - Create a new graph
- `get_graph_by_id(graph_id)` - Get graph by ID
- `update_graph(graph_id, graph_data)` - Update an existing graph
- `delete_graph(graph_id)` - Delete a graph
- `list_graphs(user_id)` - List all graphs for a user
- `clear_graph_data(graph_id)` - Clear a graph's data

### AIService (ai_service.py)

Handles AI model interactions and processing.

**Methods:**
- `get_available_models()` - Get list of available AI models
- `get_model_limits(model)` - Get token limits for model
- `process_node(node_type, inputs, settings)` - Process a node with AI
- `chat_completion(model, messages, settings)` - Generate chat completion
- `text_completion(model, prompt, settings)` - Generate text completion

### WorkflowService (workflow_service.py)

Handles workflow execution on the server.

**Methods:**
- `execute_workflow(graph_id)` - Execute a complete workflow
- `execute_node(node_id, inputs)` - Execute a single node
- `validate_workflow(graph_id)` - Validate a workflow
- `get_execution_order(graph_id)` - Get node execution order
- `check_for_cycles(graph_id)` - Check if workflow has cycles

## Relationship Diagram (Extended)

```
┌──────────────────────┐                 ┌──────────────────────┐
│      UIManager       │◄────────────────┤  EventBus (Central)  │
└──────┬───────────────┘                 └──────────▲───────────┘
       │                                           │  
       │                                           │  
       ▼                                           │  
┌──────────────────────┐                 ┌──────────────────────┐
│   UI Sub-Managers    │                 │      API Client      │
│                      │                 └──────────┬───────────┘
│ - DialogManager      │                           │  
│ - NotificationManager│                           │  
│ - NodeModalManager   │                           ▼  
│ - GraphControlsMan.  │◄───────┐        ┌──────────────────────┐
│ - NodeOperationsMan. │        │        │  Backend Services    │
│ - ConversationPanel  │        │        │                      │
└──────────────────────┘        │        │ - GraphService       │
                                │        │ - AIService          │
┌──────────────────────┐        │        │ - WorkflowService    │
│   GraphManager       │◄───────┘        └──────────────────────┘
└──────┬───────────────┘                           ▲  
       │                                           │  
       ▼                                           │  
┌──────────────────────┐                           │  
│  Graph Sub-Managers  │                           │  
│                      │                           │  
│ - CytoscapeManager   │                           │  
│ - NodeManager        │◄──────────────────────────┘  
│ - EdgeManager        │        
│ - GraphLayoutManager │        ┌──────────────────────┐
│ - GraphStorage       │◄───────┤   StorageManager    │
└──────┬───────────────┘        └──────────────────────┘
       │                                  ▲  
       │                                  │  
       ▼                                  │  
┌──────────────────────┐                  │  
│   WorkflowManager    │──────────────────┘  
└──────┬───────────────┘        
       │                        
       ▼                        
┌──────────────────────┐        
│Workflow Sub-Managers │        
│                      │        
│ - CycleDetector      │        
│ - TopologicalSorter  │        
│ - ExecutionEngine    │        
│ - WorkflowValidator  │        
│ - WorkflowVisualizer │        
└──────────────────────┘
```

## Graph Export/Import Data Flow

The graph export/import functionality follows these steps:

1. **Export flow:**
   - `GraphManager.exportGraph()` collects current graph state (ID, name, nodes, edges)
   - Returns a clean JavaScript object representing the graph
   - This object can be:
     - Converted to JSON and saved to localStorage via `StorageManager.setItem()`
     - Sent to server via `GraphStorage.saveGraph()`
     - Downloaded as a file by the user

2. **Import flow:**
   - `GraphManager.importGraph(graphData)` takes a graph data object
   - Clears the existing graph using `clearGraph()`
   - Sets current graph info (ID, name) 
   - Adds all nodes and edges from the data
   - Runs layout to position nodes
   - Clears modified flag since graph was just imported
   - Publishes 'graph:imported' event

3. **Server storage flow:**
   - `GraphStorage.saveGraph()` prepares graph data
   - Uses the API client to send data to backend
   - Backend `GraphService.update_graph()` stores in database
   - Returns updated graph data including server-generated ID

4. **Local backup flow:**
   - Automatically saves to localStorage on significant changes
   - `StorageManager.setItem('aiCanvas_graph', JSON.stringify(graphData))`
   - Used for recovery if server loading fails
   - Provides offline capability and backup

This comprehensive architecture ensures graph data is preserved in multiple locations and can be recovered or transferred as needed.