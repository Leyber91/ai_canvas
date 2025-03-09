"""
Service for interacting with the Ollama API.
"""

import json
import requests
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

from ..models import db, Message
from ..utils.streaming import create_stream_response, stream_ollama_response, parse_ollama_response

# Ollama API endpoint
OLLAMA_API_URL = "http://localhost:11434/api"

# Check and fix app/services/ollama_service.py

def get_available_models():
    """Get available models from Ollama."""
    ollama_models = []
    try:
        # Try to get models from Ollama API first
        response = requests.get(f"{OLLAMA_API_URL}/tags")
        if response.status_code == 200:
            print("Ollama response received:", response.status_code)
            data = response.json()
            
            # Debug the response structure
            if 'models' in data:
                print(f"Found {len(data['models'])} models in response")
                ollama_models = [model['name'] for model in data.get('models', [])]
                print(f"Extracted model names: {ollama_models}")
            else:
                print("No 'models' key in response:", data.keys())
        else:
            print(f"Ollama API returned status: {response.status_code}")
            # Fallback to CLI
            # ... existing CLI fallback code ...
    except Exception as e:
        print(f"Error getting Ollama models: {str(e)}")
    
    # Always return some models, even if none were found
    if not ollama_models:
        print("No models found, using fallback list")
        ollama_models = ["llama3", "llama2", "mistral", "qwen2.5", "llama3.2"]
    
    return ollama_models

def chat(data):
    """Direct chat with Ollama API."""
    try:
        response = requests.post(f"{OLLAMA_API_URL}/chat", json=data)
        return response.json()
    except Exception as e:
        current_app.logger.error(f"Error chatting with Ollama: {str(e)}")
        return {"error": str(e)}

def handle_chat(model, messages, temperature, max_tokens, stream, node_id, conversation_id):
    """Handle chat with Ollama backend."""
    # Prepare data for Ollama
    ollama_data = {
        "model": model,
        "messages": messages,
        "stream": stream,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens
        }
    }
    
    # Log request details
    current_app.logger.info("Sending request to Ollama API:")
    current_app.logger.info(f"Model: {model}")
    current_app.logger.info(f"Number of messages: {len(messages)}")
    current_app.logger.info(f"Temperature: {temperature}")
    current_app.logger.info(f"Max tokens: {max_tokens}")
    current_app.logger.info(f"Stream: {stream}")
    
    try:
        # If streaming is requested, handle differently
        if stream:
            # Make the request to Ollama with stream=True
            response = requests.post(f"{OLLAMA_API_URL}/chat", json=ollama_data, stream=True)
            # Create a streaming response
            return create_stream_response(stream_ollama_response(response, conversation_id))
        
        # Non-streaming response
        response = requests.post(f"{OLLAMA_API_URL}/chat", json=ollama_data)
        
        # Parse the response
        result = parse_ollama_response(response)
        
        # Store the assistant message in the database if successful
        if not result.get('error') and conversation_id:
            try:
                content = result.get('message', {}).get('content', '')
                assistant_message = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=content
                )
                db.session.add(assistant_message)
                db.session.commit()
            except SQLAlchemyError as e:
                current_app.logger.error(f"Database error storing assistant message: {str(e)}")
        
        return result
    except Exception as e:
        error_msg = str(e)
        current_app.logger.error(f"Error with Ollama request: {error_msg}")
        return {"error": error_msg}

def process_node(node, parent_contexts, conversation_history, conversation):
    """Process a node with Ollama backend."""
    # Prepare data for Ollama
    ollama_data = {
        "model": node.model,
        "messages": [
            {"role": "system", "content": node.system_message + "\n\n" + "".join([
                f"Context from parent node {ctx['node_id']}: {ctx['last_response']}\n\n"
                for ctx in parent_contexts
            ])},
            *conversation_history
        ],
        "options": {
            "temperature": node.temperature,
            "num_predict": node.max_tokens
        }
    }
    
    try:
        # Send request to Ollama
        response = requests.post(f"{OLLAMA_API_URL}/chat", json=ollama_data)
        
        # Parse the response
        result = parse_ollama_response(response)
        
        if not result.get('error'):
            content = result.get('message', {}).get('content', '')
            
            # Store the assistant message
            if conversation:
                message = Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=content
                )
                db.session.add(message)
                db.session.commit()
            
            return content
        else:
            return f"Error: {result.get('error')}"
    except Exception as e:
        current_app.logger.error(f"Error processing Ollama node: {str(e)}")
        return f"Error: {str(e)}"
