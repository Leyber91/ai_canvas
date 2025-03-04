# AI Canvas - Dynamic Node Interaction

A web application that allows users to create and interact with AI nodes connected to different backends like Ollama and Groq, with support for sequential execution workflows and database persistence.

## Features

- Create AI nodes with different backends (Ollama, Groq)
- Automatic detection of locally available Ollama models
- Support for specific Groq models (deepseek-r1-distill-llama-70b, deepseek-r1-distill-llama-32b, mixtral-8x7b-32768, qwen-2.5-32b, qwen-2.5-coder-32b)
- Connect nodes to create a graph structure
- Chat with nodes and leverage context from parent nodes
- Save and load graph configurations from database
- Customize node properties (model, system message, temperature, etc.)
- **NEW** Real-time streaming responses for Ollama models
- **NEW** Sequential workflow execution based on graph topology
- **NEW** Database persistence for graphs, nodes, edges, and conversations

## Requirements

- Python 3.8+
- Ollama running locally (for Ollama backend)
- Groq API key (for Groq backend)
- SQLite (for development) or PostgreSQL (for production)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ai-canvas
```

2. Install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Configure environment variables:

Edit the `.env` file in the `backend` directory:

```
# Groq API key
GROQ_API_KEY=your_groq_api_key_here

# Secret key for Flask sessions
SECRET_KEY=your_secret_key_here

# Database URL (SQLite for development)
DATABASE_URL=sqlite:///ai_canvas.sqlite

# For PostgreSQL (production)
# DATABASE_URL=postgresql://username:password@localhost/ai_canvas
```

4. Database setup:

The application will automatically create the SQLite database on first run. For PostgreSQL:

```bash
# Create the database
createdb ai_canvas

# The tables will be created automatically when the app starts
```

## Running the Application

1. Start Ollama locally (if you plan to use Ollama backend):

```bash
ollama serve
```

2. Start the Flask backend:

```bash
cd backend
python run.py
```

On Windows:

```cmd
cd backend
python run.py
```

3. Open your browser and navigate to:

```
http://localhost:5000
```

## Usage

### Creating Nodes

1. Click the "Add Node" button
2. Fill in the node details:
   - Node Name: A descriptive name for the node
   - Backend: Select Ollama or Groq
   - Model: Select from available models (automatically populated based on backend selection)
   - System Message: The role or instructions for the AI (e.g., "You are a helpful assistant")
   - Temperature: Adjust for more deterministic (lower) or creative (higher) responses
   - Max Tokens: Maximum length of the response

### Connecting Nodes

1. Right-click on a node
2. Select "Add Connection"
3. Click on another node to create a connection

### Chatting with Nodes

1. Click on a node to select it
2. Type your message in the chat input
3. Press Enter or click Send

### Saving and Loading

- Click "Save Graph" to save the current configuration to the database
- Click "Load Graph" to load a saved configuration from the database

### Executing Workflows

1. Create multiple nodes and connect them to establish a workflow
2. Ensure that nodes are connected in a directed acyclic graph (no cycles)
3. Click the "Execute Workflow" button at the bottom of the conversation panel
4. The system will:
   - Analyze the graph to determine the execution order
   - Execute nodes in topological order (parents before children)
   - Pass context from parent nodes to their children
   - Display results for all executed nodes

## Architecture

- **Frontend**: 
  - HTML, CSS, JavaScript
  - Cytoscape.js for graph visualization
  - Real-time streaming for Ollama responses
  - Interactive workflow execution UI

- **Backend**: 
  - Python Flask server with Flask-SocketIO for real-time communication
  - SQLAlchemy ORM for database interactions
  - NetworkX for graph analysis and topological sorting
  - Proxy to Ollama and Groq APIs

- **Data Persistence**: 
  - SQLite for development
  - PostgreSQL for production
  - Complete database schema for graphs, nodes, edges, and conversations
  - Fallback to localStorage when database is unavailable

## License

[MIT License](LICENSE)
