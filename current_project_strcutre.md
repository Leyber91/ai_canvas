# AI Canvas Project Structure Documentation

Below is a comprehensive file tree showing the structure of the entire AI Canvas project, including both backend and frontend components, along with details about key functions and their inputs/outputs.

## Top-Level Project Structure

```
ai-canvas/
├── backend/
│   ├── app/
│   ├── run.py 
│   └── requirements.txt
├── static/
│   ├── css/
│   └── js/
└── templates/
    └── index.html
```

## Backend Structure

```
backend/
├── app/
│   ├── __init__.py                    # Flask app initialization
│   ├── models.py                      # Database models
│   ├── routes/
│   │   ├── __init__.py                # Blueprint initialization
│   │   ├── main.py                    # Main routes
│   │   ├── chat.py                    # Chat endpoints
│   │   ├── execute.py                 # Workflow execution
│   │   ├── graph.py                   # Graph/Node/Edge operations
│   │   └── models.py                  # Model listing endpoints
│   ├── services/
│   │   ├── __init__.py                # Service initialization
│   │   ├── graph_service.py           # Graph operations
│   │   ├── ollama_service.py          # Ollama API integration
│   │   └── groq_service.py            # Groq API integration
│   └── utils/
│       ├── __init__.py                # Utilities initialization
│       └── streaming.py               # Streaming response utilities
├── run.py                             # Application entry point
└── requirements.txt                   # Python dependencies
```

## Frontend Structure

```
static/js/
├── app.js                             # Main application initialization
├── APIClient.js                       # API communication
├── ConversationManager.js             # Chat management
├── ErrorHandler.js                    # Error handling
├── EventBus.js                        # Event system
├── GraphManager.js                    # Graph visualization
├── ModelRegistry.js                   # AI model management
├── StorageManager.js                  # Persistence
├── UIManager.js                       # UI interactions
└── WorkflowManager.js                 # Workflow execution
```

## Key Functions Documentation

### Backend Functions

#### `app/__init__.py`
- `create_app(test_config=None)` → Flask App
  - Creates and configures Flask application
  - Input: Optional test configuration
  - Output: Configured Flask app

#### `app/services/graph_service.py`
- `create_graph(name, description=None, layout_data=None)` → Graph
  - Creates a new graph in the database
  - Input: name, optional description, optional layout data
  - Output: Graph object

- `get_graph(graph_id)` → Graph
  - Gets a graph by ID
  - Input: graph_id
  - Output: Graph object or None

- `get_all_graphs()` → List[Graph]
  - Gets all graphs
  - Output: List of Graph objects

- `update_graph(graph_id, name=None, description=None, layout_data=None)` → Graph
  - Updates a graph
  - Input: graph_id, optional parameters to update
  - Output: Updated Graph object or None

- `delete_graph(graph_id)` → bool
  - Deletes a graph
  - Input: graph_id
  - Output: Success boolean

- `create_node(graph_id, node_id, name, backend, model, system_message=None, temperature=0.7, max_tokens=1024, position_x=None, position_y=None)` → Node
  - Creates a new node in a graph
  - Input: graph_id, node details
  - Output: Node object

- `execute_workflow(graph_id)` → (dict, str)
  - Executes a workflow by processing nodes in topological order
  - Input: graph_id
  - Output: (results dict, error message or None)

#### `app/services/ollama_service.py`
- `get_available_models()` → List[str]
  - Gets available models from Ollama
  - Output: List of model names

- `chat(data)` → dict
  - Direct chat with Ollama API
  - Input: Request data
  - Output: Response data

- `handle_chat(model, messages, temperature, max_tokens, stream, node_id, conversation_id)` → dict/Response
  - Handle chat with Ollama backend
  - Input: Chat parameters
  - Output: Response data or streaming response

#### `app/services/groq_service.py`
- `get_available_models()` → List[str]
  - Gets available models from Groq
  - Output: List of model names

- `chat(data)` → dict
  - Direct chat with Groq API
  - Input: Request data
  - Output: Response data

- `handle_chat(model, messages, temperature, max_tokens, node_id, conversation_id)` → dict
  - Handle chat with Groq backend
  - Input: Chat parameters
  - Output: Response data

### Frontend Functions

#### `APIClient.js`
- `constructor(baseUrl, eventBus, errorHandler)`
  - Creates API client
  - Input: API base URL, event bus, error handler

- `get(endpoint, options = {})` → Promise<any>
  - Make a GET request
  - Input: API endpoint, options
  - Output: Promise with response data

- `post(endpoint, data, options = {})` → Promise<any>
  - Make a POST request
  - Input: API endpoint, data, options
  - Output: Promise with response data

- `stream(endpoint, data, { onChunk, onComplete, onError, options = {} })` → Promise<void>
  - Handle streaming responses
  - Input: API endpoint, data, callbacks
  - Output: Promise (void)

#### `GraphManager.js`
- `initialize()` → Promise<void>
  - Initialize graph visualization
  - Output: Promise (void)

- `addNode(nodeData)` → string
  - Add a node to the graph
  - Input: Node data
  - Output: Node ID

- `addEdge(sourceId, targetId)` → string|null
  - Add an edge between nodes
  - Input: Source and target node IDs
  - Output: Edge ID or null if failed

- `saveGraph(name, description = '')` → Promise<Object>
  - Save the current graph
  - Input: Graph name, description
  - Output: Promise with saved graph data

- `loadGraphById(graphId)` → Promise<Object>
  - Load a graph by ID
  - Input: Graph ID
  - Output: Promise with loaded graph data

#### `ModelRegistry.js`
- `initialize()` → Promise<void>
  - Initialize the model registry
  - Output: Promise (void)

- `fetchAvailableModels()` → Promise<void>
  - Fetch available AI models
  - Output: Promise (void)

- `getModelsForBackend(backend)` → Array
  - Get models for a specific backend
  - Input: Backend name
  - Output: Array of model names

- `refreshModels()` → Promise<void>
  - Refresh available models
  - Output: Promise (void)

#### `ConversationManager.js`
- `initialize()` → Promise<void>
  - Initialize conversation manager
  - Output: Promise (void)

- `sendMessage(userInput)` → Promise<void>
  - Send a message to active node
  - Input: User message
  - Output: Promise (void)

- `displayConversation(nodeId)` → void
  - Display conversation for a node
  - Input: Node ID

- `clearConversation(nodeId)` → void
  - Clear conversation history
  - Input: Node ID

#### `WorkflowManager.js`
- `initialize()` → Promise<void>
  - Initialize workflow manager
  - Output: Promise (void)

- `executeWorkflow(graphId)` → Promise<Object>
  - Execute a workflow
  - Input: Graph ID
  - Output: Promise with execution results

- `detectCycles()` → Object
  - Detect cycles in graph
  - Output: Object with cycle information

- `computeTopologicalSort()` → Array|null
  - Compute execution order
  - Output: Array of node IDs or null if cycles exist

#### `UIManager.js`
- `initialize()` → Promise<void>
  - Initialize UI manager
  - Output: Promise (void)

- `showNodeModal()` → void
  - Show node creation modal

- `updateModelOptions()` → void
  - Update the model dropdown options

- `saveGraph()` → Promise<void>
  - Handle graph saving
  - Output: Promise (void)

- `executeWorkflow()` → Promise<void>
  - Handle workflow execution
  - Output: Promise (void)

## Database Models

```
models.py
├── Graph
│   ├── id: Integer
│   ├── name: String
│   ├── description: Text
│   ├── creation_date: DateTime
│   ├── last_modified: DateTime
│   └── layout_data: JSON
├── Node
│   ├── id: String
│   ├── graph_id: Integer (FK)
│   ├── name: String
│   ├── backend: String
│   ├── model: String
│   ├── system_message: Text
│   ├── temperature: Float
│   ├── max_tokens: Integer
│   ├── position_x: Float
│   └── position_y: Float
├── Edge
│   ├── id: String
│   ├── source_node_id: String (FK)
│   ├── target_node_id: String (FK)
│   └── edge_type: String
├── Conversation
│   ├── id: Integer
│   ├── node_id: String (FK)
│   ├── created_at: DateTime
│   └── updated_at: DateTime
└── Message
    ├── id: Integer
    ├── conversation_id: Integer (FK)
    ├── role: String
    ├── content: Text
    └── timestamp: DateTime
```

This documentation provides a snapshot of the current project structure and function signatures, which can be used for further development and maintenance.