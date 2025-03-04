# AI Canvas - Dynamic Node Interaction

A web application that allows users to create and interact with AI nodes connected to different backends like Ollama and Groq.

## Features

- Create AI nodes with different backends (Ollama, Groq)
- Automatic detection of locally available Ollama models
- Support for specific Groq models (deepseek-r1-distill-llama-70b, deepseek-r1-distill-llama-32b, mixtral-8x7b-32768, qwen-2.5-32b, qwen-2.5-coder-32b)
- Connect nodes to create a graph structure
- Chat with nodes and leverage context from parent nodes
- Save and load graph configurations
- Customize node properties (model, system message, temperature, etc.)

## Requirements

- Python 3.8+
- Ollama running locally (for Ollama backend)
- Groq API key (for Groq backend)

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

Edit the `.env` file in the `backend` directory and add your Groq API key:

```
GROQ_API_KEY=your_groq_api_key_here
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

- Click "Save Graph" to save the current configuration
- Click "Load Graph" to load a saved configuration

## Architecture

- Frontend: HTML, CSS, JavaScript with Cytoscape.js for graph visualization
- Backend: Python Flask server that proxies requests to Ollama and Groq
- Data Persistence: Currently uses localStorage, with backend API endpoints for future database integration

## License

[MIT License](LICENSE)
