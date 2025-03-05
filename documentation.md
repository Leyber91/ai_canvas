# AI Canvas - Client Documentation

## Project Overview

AI Canvas is a powerful web application that enables you to create, connect, and interact with AI nodes powered by different language model backends. The platform allows you to build visual workflows where AI nodes can communicate with each other, passing context between them to solve complex problems through sequential execution.

This innovative tool combines the power of multiple AI models (via Ollama and Groq backends) with an intuitive graph-based interface, allowing you to create sophisticated AI workflows without writing code. Whether you're prototyping AI solutions, building complex reasoning chains, or creating specialized AI assistants, AI Canvas provides the framework to bring your ideas to life.

## System Architecture

AI Canvas employs a modern, modular architecture designed for flexibility and extensibility:

### Frontend
- **User Interface**: A clean, intuitive web interface built with HTML, CSS, and JavaScript
- **Graph Visualization**: Interactive node-based interface using Cytoscape.js for creating and managing AI workflows
- **Real-time Communication**: Seamless updates and streaming responses for immediate feedback

### Backend
- **Application Server**: Python Flask server that handles all requests and manages the application logic
- **AI Integration**: Proxy services that connect to Ollama (local) and Groq (cloud) AI backends
- **Graph Analysis**: Tools for analyzing graph structures and determining execution order for workflows

### Data Storage
- **Database**: SQLite for development (with PostgreSQL support for production environments)
- **Model**: Structured data storage for graphs, nodes, edges, conversations, and messages
- **Persistence**: Complete saving and loading capabilities with fallback to local storage when needed

### Communication Flow
The system follows a clear communication pattern:
1. User interactions in the browser are captured by the frontend
2. Requests are sent to the Flask backend via HTTP/WebSocket
3. Backend processes requests, interacts with AI services, and manages data
4. Results are returned to the frontend for display to the user

## Key Functionality

### AI Node Creation and Management
- **Multiple AI Backends**: Create nodes powered by either Ollama (local) or Groq (cloud) language models
- **Model Selection**: Choose from automatically detected Ollama models or supported Groq models
- **Node Configuration**: Customize each node with specific parameters:
  - System message (instructions for the AI)
  - Temperature (creativity vs. determinism)
  - Maximum token output
  - Position in the workflow

### Graph-Based Workflow Design
- **Visual Node Connection**: Create directed connections between nodes to establish information flow
- **Context Passing**: Automatically pass relevant context from parent nodes to child nodes
- **Workflow Validation**: Automatic cycle detection to ensure valid execution paths

### Interactive Conversations
- **Chat Interface**: Engage in conversations with individual AI nodes
- **Context-Aware Responses**: Nodes consider both direct input and context from connected parent nodes
- **Real-time Streaming**: See responses as they're generated (for Ollama models)
- **Conversation History**: Maintain and review conversation history for each node

### Workflow Execution
- **Sequential Processing**: Execute entire workflows in the correct order (topological sort)
- **Automatic Context Propagation**: Pass information through the graph during execution
- **Execution Reporting**: View detailed results from each node in the workflow

### Data Persistence
- **Save/Load Functionality**: Store and retrieve your graph configurations
- **Database Storage**: Reliable persistence of all graph elements and conversations
- **Local Storage Fallback**: Automatic fallback to browser storage when database is unavailable

## User Guide

### Getting Started

1. **Accessing the Application**
   - Open your web browser and navigate to the application URL
   - The main interface will display with an empty canvas on the left and a conversation panel on the right

2. **Creating Your First Node**
   - Click the "Add Node" button in the top header
   - Fill in the node configuration form:
     - **Node Name**: Give your node a descriptive name
     - **Backend**: Select either Ollama (local) or Groq (cloud)
     - **Model**: Choose from available models for the selected backend
     - **System Message**: Provide instructions for the AI (e.g., "You are a helpful assistant")
     - **Temperature**: Adjust for more deterministic (lower) or creative (higher) responses
     - **Max Tokens**: Set the maximum length of responses
   - Click "Save Node" to create the node

3. **Connecting Nodes**
   - Click on a node to select it
   - Click the "Add Connection" button in the node operations panel
   - Click on another node to create a connection
   - The arrow will show the direction of information flow

4. **Chatting with a Node**
   - Click on a node to select it
   - Type your message in the chat input at the bottom of the conversation panel
   - Press Enter or click Send
   - The AI will respond, considering both your input and any context from parent nodes

5. **Saving Your Work**
   - Click the "Save Graph" button in the top header
   - Enter a name and optional description for your graph
   - The system will save your entire configuration to the database

6. **Loading a Saved Graph**
   - Click the "Load Graph" button in the top header
   - Select from the list of saved graphs
   - Your graph will be restored with all nodes, connections, and conversation history

### Executing Workflows

1. **Setting Up a Workflow**
   - Create multiple nodes representing different steps in your process
   - Connect the nodes in the desired execution order (parent → child)
   - Ensure there are no cycles in your graph (no circular references)

2. **Running the Workflow**
   - Save your graph if you haven't already
   - Click the "Execute Workflow" button at the bottom of the conversation panel
   - The system will:
     - Analyze the graph to determine the execution order
     - Process each node in the correct sequence
     - Pass context from parent nodes to their children
     - Display results for all executed nodes

3. **Reviewing Results**
   - A results dialog will show the execution order and output from each node
   - You can review the conversation history of any node to see the details

## Technical Requirements

### Client Requirements
- **Web Browser**: Modern web browser with JavaScript enabled
  - Chrome 80+
  - Firefox 75+
  - Safari 13+
  - Edge 80+
- **Internet Connection**: Required for accessing the application and Groq API

### Server Requirements
- **Python**: Version 3.8 or higher
- **Ollama**: Running locally for Ollama backend support
- **Groq API Key**: Required for Groq backend support
- **Database**: SQLite (development) or PostgreSQL (production)
- **Operating System**: Cross-platform (Windows, macOS, Linux)

### Hardware Recommendations
- **For Ollama Backend**: 
  - 16GB+ RAM recommended for running larger models
  - GPU acceleration recommended for optimal performance
- **For Groq Backend**:
  - Standard hardware sufficient (processing occurs in the cloud)

## FAQ

### General Questions

**Q: Can I use AI Canvas without an internet connection?**  
A: Partially. You can use the Ollama backend offline if you have Ollama running locally with downloaded models. However, the Groq backend requires an internet connection, and some features like saving to the database may be limited offline.

**Q: Is there a limit to how many nodes I can create?**  
A: There is no hard limit on the number of nodes you can create. However, very large graphs may impact performance, especially during workflow execution. We recommend keeping workflows focused and modular for the best experience.

**Q: What happens if the system crashes during a workflow execution?**  
A: The system saves conversation history incrementally, so most data should be preserved. You can reload your graph and try again. For critical workflows, we recommend saving your graph before execution.

### Technical Questions

**Q: What's the difference between Ollama and Groq backends?**  
A: Ollama runs locally on your machine, providing privacy and no usage limits, but requires local resources. Groq is a cloud service that offers powerful models without local hardware requirements but has API usage limits and requires an internet connection.

**Q: How do I add more models to the available options?**  
A: For Ollama, you can add models using the Ollama CLI (`ollama pull [model-name]`). The application will automatically detect newly added models. For Groq, the available models are determined by the Groq API and will be updated automatically as new models become available.

## Support Information

For assistance with AI Canvas, please contact our support team:

**Email**: [support@aicanvas.example.com](mailto:support@aicanvas.example.com)

**Documentation**: [https://docs.aicanvas.example.com](https://docs.aicanvas.example.com)

**Hours of Operation**: Monday-Friday, 9:00 AM - 5:00 PM (UTC)

When reporting issues, please include:
- A detailed description of the problem
- Steps to reproduce the issue
- Browser and operating system information
- Screenshots if applicable

---

© 2025 AI Canvas. All rights reserved.
