I'll create an expanded version of the `file_analysis.md` file that includes all the components we can see in the provided code snippets. This will provide a more comprehensive overview of the AI Canvas project structure.

```md:ai_canvas/file_analysis.md
# AI Canvas Project - Comprehensive File Structure and Class Analysis

## Complete File Tree Structure

```
ai_canvas/
│
├── static/
│   ├── js/
│   │   ├── config.js                     # Configuration settings for the application
│   │   │
│   │   ├── core/                         # Core functionality
│   │   │   └── ErrorHandler.js           # Centralized error handling and reporting
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
│   │   │
│   │   ├── api/                          # API layer
│   │   │   ├── __init__.py               # API initialization
│   │   │   └── controllers/              # API controllers
│   │   │       ├── __init__.py           # Controllers initialization
│   │   │       ├── chat_controller.py    # Chat endpoint handlers
│   │   │       ├── edge_controller.py    # Edge endpoint handlers
│   │   │       ├── execute_controller.py # Workflow execution endpoints
│   │   │       ├── graph_controller.py   # Graph endpoint handlers
│   │   │       ├── main_controller.py    # Main application endpoints
│   │   │       ├── models_controller.py  # Model listing endpoints
│   │   │       └── node_controller.py    # Node endpoint handlers
│   │   │
│   │   ├── core/                         # Core functionality
│   │   │   ├── __init__.py               # Core initialization
│   │   │   ├── config.py                 # Application configuration
│   │   │   └── exceptions.py             # Custom exception classes
│   │   │
│   │   ├── domain/                       # Business domain
│   │   │   ├── __init__.py               # Domain initialization
│   │   │   └── services/                 # Domain services
│   │   │       ├── __init__.py           # Services initialization
│   │   │       ├── chat_service.py       # Chat and conversation management
│   │   │       ├── edge_service.py       # Edge operations
│   │   │       ├── graph_service.py      # Graph CRUD operations
│   │   │       ├── model_service.py      # AI model management
│   │   │       ├── node_service.py       # Node operations
│   │   │       └── workflow_service.py   # Workflow execution
│   │   │
│   │   ├── infrastructure/               # Infrastructure layer
│   │   │   ├── __init__.py               # Infrastructure initialization
│   │   │   ├── ai_providers/             # AI provider integrations
│   │   │   │   ├── __init__.py           # AI providers initialization
│   │   │   │   ├── base.py               # Base AI provider class
│   │   │   │   ├── groq_provider.py      # Groq API integration
│   │   │   │   └── ollama_provider.py    # Ollama API integration
│   │   │   │
│   │   │   └── database/                 # Database layer
│   │   │       ├── __init__.py           # Database initialization
│   │   │       └── repositories/         # Data repositories
│   │   │           ├── __init__.py       # Repositories initialization
│   │   │           ├── conversation_repository.py # Conversation data access
│   │   │           ├── edge_repository.py # Edge data access
│   │   │           ├── graph_repository.py # Graph data access
│   │   │           ├── message_repository.py # Message data access
│   │   │           └── node_repository.py # Node data access
│   │   │
│   │   ├── models/                       # Data models
│   │   │   ├── __init__.py               # Models initialization
│   │   │   ├── conversation.py           # Conversation model
│   │   │   ├── edge.py                   # Edge model
│   │   │   ├── graph.py                  # Graph model
│   │   │   ├── message.py                # Message model
│   │   │   └── node.py                   # Node model
│   │   │
│   │   └── utils/                        # Utility functions
│   │       ├── __init__.py               # Utils initialization
│   │       └── streaming.py              # Response streaming utilities
│   │
│   ├── tests/                            # Test suite
│   │   ├── __init__.py                   # Tests initialization
│   │   ├── test_graph.py                 # Graph functionality tests
│   │   └── test_workflow.py              # Workflow functionality tests
│   │
│   ├── run.py                            # Application entry point
│   ├── requirements.txt                  # Python dependencies
│   ├── test_groq_curl.sh                 # Groq API test script (curl)
│   └── test_groq_powershell.ps1          # Groq API test script (PowerShell)
│
└── README.md                             # Project overview and documentation
```

## Detailed Frontend Component Analysis

### ErrorHandler Class (core/ErrorHandler.js)

Centralized error handling and reporting.

**Properties:**
- `eventBus` - Event bus for publish/subscribe
- `errorLog` - Array of recent errors
- `maxLogSize` - Maximum number of errors to keep in log

**Methods:**
- `handleError(error, options)` - Handle and process an error
- `enhanceErrorInfo(errorRecord)` - Enhance error with additional context
- `categorizeError(errorRecord)` - Categorize error by type
- `showErrorNotification(errorRecord)` - Show user-friendly error notification
- `getRecentErrors()` - Get recent errors for debugging
- `clearErrors()` - Clear error log
- `suggestRecovery(errorRecord)` - Suggest recovery actions for errors

### GraphManager Class (graph/GraphManager.js)

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

### CytoscapeManager Class (graph/CytoscapeManager.js)

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

### NodeManager Class (graph/NodeManager.js)

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

### EdgeManager Class (graph/EdgeManager.js)

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

### GraphLayoutManager Class (graph/GraphLayoutManager.js)

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

### GraphStorage Class (graph/GraphStorage.js)

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

### NodeOperationsManager Class (ui/NodeOperationsManager.js)

Handles node operations UI and interaction.

**Properties:**
- `uiManager` - Parent UI manager instance
- `container` - DOM container for node operations

**Methods:**
- `initialize()` - Initialize the node operations manager
- `setupNodeOperations()` - Set up node operations container
- `updateNodeOperations(nodeId)` - Update operations panel for selected node
- `clearNodeOperations()` - Clear node operations panel
- `addOperationButton(text, callback)` - Add an operation button to the panel
- `addModelLimitsInfo(model)` - Add model limits info for Groq models
- `startEdgeDrawingMode(sourceNodeId)` - Start edge drawing mode
- `showEdgeRemoveButton(data)` - Show temporary button to remove an edge
- `highlightExecutionPath(nodeIds)` - Highlight nodes in execution path

### WorkflowManager Class (workflow/WorkflowManager.js)

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

### CycleDetector Class (workflow/CycleDetector.js)

Detects and provides ways to handle cycles in the workflow graph.

**Properties:**
- `workflowManager` - Parent WorkflowManager instance
- `graphManager` - GraphManager instance reference

**Methods:**
- `initialize()` - Initialize the cycle detector
- `detectCycles()` - Detect cycles in the graph
- `detectMetaCycles(cycles)` - Detect groups of connected cycles
- `wouldCreateCycle(sourceId, targetId)` - Check if adding edge would create cycle
- `hasCycles()` - Check if the graph has any cycles
- `breakCycles()` - Break cycles by removing edges
- `findCyclesContainingNode(nodeId)` - Find cycles containing a specific node
- `findNodesInvolvedInCycles()` - Find all nodes involved in cycles
- `getEdgeWeights()` - Get edge weights based on cycle membership
- `getCycleDetails()` - Get detailed information about cycles

### TopologicalSorter Class (workflow/TopologicalSorter.js)

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

### ExecutionEngine Class (workflow/ExecutionEngine.js)

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

### WorkflowValidator Class (workflow/WorkflowValidator.js)

Validates workflow configuration and structure.

**Properties:**
- `workflowManager` - Parent WorkflowManager instance
- `graphManager` - GraphManager instance reference
- `validationResults` - Last validation results

**Methods:**
- `initialize()` - Initialize the validator
- `validateWorkflowSilent()` - Validate workflow without raising alerts
- `validateWorkflow()` - Validate workflow for execution
- `getWorkflowSuggestions()` - Get suggestions for fixing workflow issues
- `validateNode(nodeData)` - Check if a node is valid
- `validateEdge(sourceId, targetId)` - Check if an edge is valid
- `validateConfig(config)` - Validate workflow configuration
- `checkForIsolatedNodes()` - Check for nodes not connected to any other nodes
- `checkForMissingNodeTypes()` - Check for nodes with undefined types
- `checkForEmptyGraph()` - Check if graph is empty

### StorageManager Class (storage/StorageManager.js)

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

### ModelRegistry Class (models/ModelRegistry.js)

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

### UIManager Class (ui/UIManager.js)

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

## Backend Component Analysis

### ModelService (domain/services/model_service.py)

Service for managing AI models.

**Properties:**
- `ai_factory` - AIProviderFactory instance for creating AI provider instances

**Methods:**
- `get_available_models()` - Get available models from all providers
- `get_groq_model_limits()` - Get rate limits for Groq models
- `get_recommended_models(use_case)` - Get recommended models for a specific use case

### GraphService (domain/services/graph_service.py)

Service for handling graph operations.

**Properties:**
- `graph_repo` - GraphRepository instance
- `node_repo` - NodeRepository instance
- `edge_repo` - EdgeRepository instance

**Methods:**
- `get_all_graphs()` - Get all graphs
- `get_graph(graph_id)` - Get a graph by ID with all nodes and edges
- `create_graph(name, description, layout_data)` - Create a new graph
- `update_graph(graph_id, name, description, layout_data)` - Update a graph
- `delete_graph(graph_id)` - Delete a graph
- `update_graph_batch(graph_id, operations)` - Apply a batch of operations to a graph

### EdgeService (domain/services/edge_service.py)

Service for handling edge operations.

**Properties:**
- `edge_repo` - EdgeRepository instance
- `node_repo` - NodeRepository instance

**Methods:**
- `create_edge(source_id, target_id, edge_type)` - Create a new edge between nodes
- `delete_edge(edge_id)` - Delete an edge
- `get_edges_for_graph(graph_id)` - Get all edges for a graph
- `bulk_create_edges(edges_data)` - Create multiple edges at once
- `clear_edges_for_graph(graph_id)` - Delete all edges connected to nodes in a graph

### ChatService (domain/services/chat_service.py)

Service for handling chat with AI nodes.

**Properties:**
- `node_repo` - NodeRepository instance
- `conversation_repo` - ConversationRepository instance
- `ai_factory` - AIProviderFactory instance

**Methods:**
- `chat_with_node(node_id, messages, parent_contexts, user_input, stream)` - Send a message to a node and get a response
- `get_conversation_history(node_id)` - Get conversation history for a node
- `clear_conversation(node_id)` - Clear conversation for a node

### NodeController (api/controllers/node_controller.py)

API controller for node operations.

**Routes:**
- `GET /api/nodes/<node_id>` - Get a node by ID
- `PUT /api/nodes/<node_id>` - Update a node
- `DELETE /api/nodes/<node_id>` - Delete a node

### ModelsController (api/controllers/models_controller.py)

API controller for model operations.

**Routes:**
- `GET /api/models` - Get available models from Ollama and Groq
- `GET /api/groq/model-limits` - Get rate limits for Groq models

### MainController (api/controllers/main_controller.py)

API controller for main application routes.

**Routes:**
- `GET /` - Render the main index page

### GraphController (api/controllers/graph_controller.py)

API controller for graph operations.

**Routes:**
- `GET /api/graphs` - Get all graphs
- `POST /api/graphs` - Create a new graph
- `GET /api/graphs/<int:graph_id>` - Get a specific graph
- `PUT /api/graphs/<int:graph_id>` - Update a graph
- `DELETE /api/graphs/<int:graph_id>` - Delete a graph
- `POST /api/graphs/<int:graph_id>/batch` - Update a graph with a batch of operations

### ExecuteController (api/controllers/execute_controller.py)

API controller for workflow execution.

**Routes:**
- `POST /api/execute` - Execute a workflow by processing nodes in topological order

### EdgeController (api/controllers/edge_controller.py)

API controller for edge operations.

**Routes:**
- `POST /api/edges` - Create a new edge between nodes
- `DELETE /api/edges/<edge_id>` - Delete an edge
- `POST /api/edges/batch` - Handle batch edge operations

### ChatController (api/controllers/chat_controller.py)

API controller for chat operations.

**Routes:**
- `POST /api/node/chat` - Chat with a specific node, with context from parent nodes
- `GET /api/nodes/<node_id>/conversations` - Get all conversations for a node
- `DELETE /api/nodes/<node_id>/conversations` - Clear all conversations for a node

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
│ - NodeOperationsMan. │        │        │  Backend Controllers │
│ - ConversationPanel  │        │        │                      │
└──────────────────────┘        │        │ - GraphController    │
                                │        │ - NodeController     │
┌──────────────────────┐        │        │ - EdgeController     │
│   GraphManager       │◄───────┘        │ - ChatController     │
└──────┬───────────────┘                 │ - ModelsController   │
       │                                 │ - ExecuteController  │
       ▼                                 └──────────┬───────────┘
┌──────────────────────┐                           │
│  Graph Sub-Managers  │                           │
│                      │                           ▼
│ - CytoscapeManager   │                 ┌──────────────────────┐
│ - NodeManager        │                 │  Domain Services     │
│ - EdgeManager        │                 │                      │
│ - GraphLayoutManager │                 │ - GraphService       │
│ - GraphStorage       │◄────────────────┤ - NodeService        │
└──────┬───────────────┘                 │ - EdgeService        │
       │                                 │ - ChatService        │
       │                                 │ - ModelService       │
       ▼                                 │ - WorkflowService    │
┌──────────────────────┐                 └──────────┬───────────┘
│   WorkflowManager    │                           │
└──────┬───────────────┘                           │
       │                                           ▼
       ▼                                 ┌──────────────────────┐
┌──────────────────────┐                 │ Infrastructure Layer │
│Workflow Sub-Managers │                 │                      │
│                      │                 │ - AI Providers       │
│ - CycleDetector      │                 │   - Ollama Provider  │
│ - TopologicalSorter  │                 │   - Groq Provider    │
│ - ExecutionEngine    │                 │                      │
│ - WorkflowValidator  │                 │ - Database           │
│ - WorkflowVisualizer │                 │   - Repositories     │
└──────────────────────┘                 └──────────────────────┘
```

## Data Flow Patterns

### Graph Export/Import Data Flow

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

### Workflow Execution Flow

1. **Workflow validation:**
   - `WorkflowValidator.validateWorkflow()` checks for issues
   - Validates node configurations
   - Checks for cycles using `CycleDetector`
   - Returns validation result with success flag and any errors

2. **Execution order determination:**
   - `TopologicalSorter.computeTopologicalSort()` creates execution order
   - Respects node dependencies (edges)
   - Ensures parent nodes execute before their children

3. **Node execution:**
   - `ExecutionEngine.executeWorkflow()` processes nodes in order
   - For each node:
     - `collectNodeInputs()` gathers outputs from parent nodes
     - `executeNode()` sends request to API
     - `handleNodeResult()` processes and stores result
   - Updates execution visualization as nodes complete

4. **Error handling:**
   - `handleExecutionError()` manages node execution failures
   - Attempts recovery strategies where possible
   - Provides meaningful error messages
   - Records errors in execution results

This comprehensive architecture ensures proper data flow and execution of AI node workflows while maintaining persistence, validation, and visualization.
```

This expanded version includes a more comprehensive analysis of both frontend and backend components, with detailed information about their properties, methods, and interactions. I've also included a more detailed file structure that reflects the backend organization we can see in the code snippets (domain services, API controllers, etc.), and expanded the relationship diagram and data flow patterns sections. This provides a more in-depth look at the system architecture and how the different components interact to achieve the desired functionality.