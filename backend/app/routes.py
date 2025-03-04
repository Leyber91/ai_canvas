from flask import Blueprint, request, jsonify, render_template
import requests
import json
import os
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

main_bp = Blueprint('main', __name__)

# Groq models
GROQ_MODELS = [
    "deepseek-r1-distill-llama-70b",
    "deepseek-r1-distill-llama-32b",
    "mixtral-8x7b-32768",
    "qwen-2.5-32b",
    "qwen-2.5-coder-32b"
]

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/api/models', methods=['GET'])
def get_models():
    # Get Ollama models
    ollama_models = []
    try:
        # Try to get models from Ollama API first
        response = requests.get("http://localhost:11434/api/tags")
        if response.status_code == 200:
            ollama_models = [model['name'] for model in response.json().get('models', [])]
        else:
            # Fallback to CLI if API doesn't work
            result = subprocess.run(['ollama', 'list'], capture_output=True, text=True)
            if result.returncode == 0:
                # Parse the output to extract model names
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:  # Skip header line
                    for line in lines[1:]:
                        parts = line.split()
                        if parts:
                            ollama_models.append(parts[0])
    except Exception as e:
        print(f"Error getting Ollama models: {str(e)}")
    
    return jsonify({
        "ollama": ollama_models,
        "groq": GROQ_MODELS
    })

@main_bp.route('/api/ollama/chat', methods=['POST'])
def ollama_chat():
    data = request.json
    ollama_url = "http://localhost:11434/api/chat"
    
    try:
        response = requests.post(ollama_url, json=data)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main_bp.route('/api/groq/chat', methods=['POST'])
def groq_chat():
    data = request.json
    groq_api_key = os.getenv('GROQ_API_KEY')
    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(groq_url, headers=headers, json=data)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main_bp.route('/api/graph', methods=['GET', 'POST'])
def handle_graph():
    if request.method == 'GET':
        # In a real app, this would fetch from a database
        # For now, return a sample graph structure
        return jsonify({
            "nodes": [],
            "edges": []
        })
    
    elif request.method == 'POST':
        # Save the graph structure
        # In a real app, this would save to a database
        return jsonify({"status": "success"})

@main_bp.route('/api/node/chat', methods=['POST'])
def node_chat():
    data = request.json
    node_id = data.get('node_id')
    backend = data.get('backend')
    model = data.get('model')
    system_message = data.get('system_message', '')
    parent_contexts = data.get('parent_contexts', [])
    conversation_history = data.get('conversation_history', [])
    user_input = data.get('user_input', '')
    temperature = data.get('temperature', 0.7)
    max_tokens = data.get('max_tokens', 1024)
    
    # Construct the prompt with parent contexts
    context_text = ""
    for parent in parent_contexts:
        context_text += f"Context from parent node {parent['node_id']}: {parent['last_response']}\n\n"
    
    # Create the message list
    messages = [{"role": "system", "content": system_message + "\n\n" + context_text}]
    
    # Add conversation history
    messages.extend(conversation_history)
    
    # Add the new user input
    messages.append({"role": "user", "content": user_input})
    
    # Route to the appropriate backend
    if backend == "ollama":
        # Prepare data for Ollama
        ollama_data = {
            "model": model,
            "messages": messages,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        # Send request to Ollama
        ollama_url = "http://localhost:11434/api/chat"
        
        try:
            # Debug the request data
            print("Sending request to Ollama API:")
            print(f"Model: {model}")
            print(f"Number of messages: {len(messages)}")
            print(f"Temperature: {temperature}")
            print(f"Max tokens: {max_tokens}")
            
            # Send the request
            response = requests.post(ollama_url, json=ollama_data, stream=False)
            
            # Ollama returns a streaming response with multiple JSON objects
            # We need to get the last complete JSON object which contains the full response
            response_text = response.text
            print(f"Response status code: {response.status_code}")
            
            # Handle streaming response - get the last complete JSON object
            if response.status_code == 200:
                try:
                    # Split by newlines and parse each line as JSON
                    json_lines = response_text.strip().split('\n')
                    print(f"Found {len(json_lines)} JSON objects in response")
                    
                    # Get the last complete JSON object
                    last_json = json.loads(json_lines[-1])
                    
                    # Check if it has the expected fields
                    if 'message' in last_json and 'content' in last_json['message']:
                        print("Successfully parsed Ollama response")
                        return jsonify(last_json)
                    else:
                        # If the last object doesn't have the message, try to find one that does
                        for line in reversed(json_lines):
                            try:
                                json_obj = json.loads(line)
                                if 'message' in json_obj and 'content' in json_obj['message']:
                                    print("Found message in earlier JSON object")
                                    return jsonify(json_obj)
                            except:
                                continue
                        
                        # If we still don't have a valid response, return an error
                        error_msg = "No valid message found in Ollama response"
                        print(error_msg)
                        return jsonify({"error": error_msg}), 500
                        
                except Exception as parse_err:
                    error_msg = f"Error parsing Ollama response: {str(parse_err)}"
                    print(error_msg)
                    print(f"Response content: {response_text[:200]}...")  # Print first 200 chars
                    return jsonify({"error": error_msg}), 500
            else:
                error_msg = f"Ollama API returned status code {response.status_code}"
                print(error_msg)
                print(f"Response content: {response_text[:200]}...")
                return jsonify({"error": error_msg}), response.status_code
                
        except Exception as e:
            error_msg = str(e)
            print(f"Error with Ollama request: {error_msg}")
            return jsonify({"error": error_msg}), 500
    
    elif backend == "groq":
        # Prepare data for Groq
        groq_data = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        # Send request to Groq
        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
            error_msg = "GROQ_API_KEY not found in environment variables"
            print(error_msg)
            return jsonify({"error": error_msg}), 500
            
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            # Debug the request data
            print("Sending request to Groq API:")
            print(f"Model: {model}")
            print(f"Number of messages: {len(messages)}")
            print(f"Temperature: {temperature}")
            print(f"Max tokens: {max_tokens}")
            
            # Send the request
            response = requests.post(groq_url, headers=headers, json=groq_data)
            
            # Check if the response is valid JSON
            try:
                result = response.json()
                print("Groq response received successfully")
                return jsonify(result)
            except json.JSONDecodeError as json_err:
                error_msg = f"Invalid JSON response from Groq: {str(json_err)}"
                print(error_msg)
                print(f"Response content: {response.text[:200]}...")  # Print first 200 chars
                return jsonify({"error": error_msg}), 500
                
        except Exception as e:
            error_msg = str(e)
            print(f"Error with Groq request: {error_msg}")
            return jsonify({"error": error_msg}), 500
    
    else:
        return jsonify({"error": f"Unsupported backend: {backend}"}), 400
