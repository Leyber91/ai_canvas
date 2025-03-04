"""
Service for interacting with the Groq API.
"""

import os
import json
import requests
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

from ..models import db, Message

# Groq models with their rate limits
GROQ_MODELS = [
    "deepseek-r1-distill-llama-70b",   # 30 req/min, 1,000 req/day, 6,000 tokens/min, No token limit/day
    "deepseek-r1-distill-qwen-32b",    # 30 req/min, 1,000 req/day, 6,000 tokens/min, No token limit/day
    "gemma2-9b-it",                    # 30 req/min, 14,400 req/day, 15,000 tokens/min, 500,000 tokens/day
    "llama-3.1-8b-instant",            # 30 req/min, 14,400 req/day, 6,000 tokens/min, 500,000 tokens/day
    "llama-3.2-11b-vision-preview",    # 30 req/min, 7,000 req/day, 7,000 tokens/min, 500,000 tokens/day
    "llama-3.2-1b-preview",            # 30 req/min, 7,000 req/day, 7,000 tokens/min, 500,000 tokens/day
    "llama-3.2-3b-preview",            # 30 req/min, 7,000 req/day, 7,000 tokens/min, 500,000 tokens/day
    "llama-3.2-90b-vision-preview",    # 15 req/min, 3,500 req/day, 7,000 tokens/min, 250,000 tokens/day
    "llama-3.3-70b-specdec",           # 30 req/min, 1,000 req/day, 6,000 tokens/min, 100,000 tokens/day
    "llama-3.3-70b-versatile",         # 30 req/min, 1,000 req/day, 6,000 tokens/min, 100,000 tokens/day
    "llama-guard-3-8b",                # 30 req/min, 14,400 req/day, 15,000 tokens/min, 500,000 tokens/day
    "llama3-70b-8192",                 # 30 req/min, 14,400 req/day, 6,000 tokens/min, 500,000 tokens/day
    "llama3-8b-8192",                  # 30 req/min, 14,400 req/day, 6,000 tokens/min, 500,000 tokens/day
    "mistral-saba-24b",                # 30 req/min, 1,000 req/day, 6,000 tokens/min, 500,000 tokens/day
    "mixtral-8x7b-32768",              # 30 req/min, 14,400 req/day, 5,000 tokens/min, 500,000 tokens/day
    "qwen-2.5-32b",                    # 30 req/min, 1,000 req/day, 6,000 tokens/min, No token limit/day
    "qwen-2.5-coder-32b"               # 30 req/min, 1,000 req/day, 6,000 tokens/min, No token limit/day
]

# Model rate limits information
GROQ_MODEL_LIMITS = {
    "deepseek-r1-distill-llama-70b": {"req_per_min": 30, "req_per_day": 1000, "tokens_per_min": 6000, "tokens_per_day": "No limit"},
    "deepseek-r1-distill-qwen-32b": {"req_per_min": 30, "req_per_day": 1000, "tokens_per_min": 6000, "tokens_per_day": "No limit"},
    "gemma2-9b-it": {"req_per_min": 30, "req_per_day": 14400, "tokens_per_min": 15000, "tokens_per_day": 500000},
    "llama-3.1-8b-instant": {"req_per_min": 30, "req_per_day": 14400, "tokens_per_min": 6000, "tokens_per_day": 500000},
    "llama-3.2-11b-vision-preview": {"req_per_min": 30, "req_per_day": 7000, "tokens_per_min": 7000, "tokens_per_day": 500000},
    "llama-3.2-1b-preview": {"req_per_min": 30, "req_per_day": 7000, "tokens_per_min": 7000, "tokens_per_day": 500000},
    "llama-3.2-3b-preview": {"req_per_min": 30, "req_per_day": 7000, "tokens_per_min": 7000, "tokens_per_day": 500000},
    "llama-3.2-90b-vision-preview": {"req_per_min": 15, "req_per_day": 3500, "tokens_per_min": 7000, "tokens_per_day": 250000},
    "llama-3.3-70b-specdec": {"req_per_min": 30, "req_per_day": 1000, "tokens_per_min": 6000, "tokens_per_day": 100000},
    "llama-3.3-70b-versatile": {"req_per_min": 30, "req_per_day": 1000, "tokens_per_min": 6000, "tokens_per_day": 100000},
    "llama-guard-3-8b": {"req_per_min": 30, "req_per_day": 14400, "tokens_per_min": 15000, "tokens_per_day": 500000},
    "llama3-70b-8192": {"req_per_min": 30, "req_per_day": 14400, "tokens_per_min": 6000, "tokens_per_day": 500000},
    "llama3-8b-8192": {"req_per_min": 30, "req_per_day": 14400, "tokens_per_min": 6000, "tokens_per_day": 500000},
    "mistral-saba-24b": {"req_per_min": 30, "req_per_day": 1000, "tokens_per_min": 6000, "tokens_per_day": 500000},
    "mixtral-8x7b-32768": {"req_per_min": 30, "req_per_day": 14400, "tokens_per_min": 5000, "tokens_per_day": 500000},
    "qwen-2.5-32b": {"req_per_min": 30, "req_per_day": 1000, "tokens_per_min": 6000, "tokens_per_day": "No limit"},
    "qwen-2.5-coder-32b": {"req_per_min": 30, "req_per_day": 1000, "tokens_per_min": 6000, "tokens_per_day": "No limit"}
}

def get_available_models():
    """Get available models from Groq."""
    return GROQ_MODELS

def chat(data):
    """Direct chat with Groq API."""
    # Get API key from environment variables (now force reloaded in run.py)
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        current_app.logger.error("GROQ_API_KEY not found in environment variables")
        return {"error": "GROQ_API_KEY not found in environment variables"}
        
    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    # Convert max_tokens to max_completion_tokens if present
    if 'max_tokens' in data:
        data['max_completion_tokens'] = data.pop('max_tokens')
    
    try:
        current_app.logger.info("Sending direct chat request to Groq API")
        response = requests.post(groq_url, headers=headers, json=data)
        
        # Log response status for debugging
        current_app.logger.info(f"Groq API direct chat response status: {response.status_code}")
        
        if response.status_code != 200:
            current_app.logger.error(f"Groq API error: Status code {response.status_code}")
            try:
                error_content = response.json()
                current_app.logger.error(f"Error response: {error_content}")
            except:
                current_app.logger.error(f"Raw error response: {response.text[:200]}...")
        
        return response.json()
    except Exception as e:
        current_app.logger.error(f"Error chatting with Groq: {str(e)}")
        return {"error": str(e)}

def handle_chat(model, messages, temperature, max_tokens, node_id, conversation_id):
    """Handle chat with Groq backend."""
    # Prepare data for Groq
    groq_data = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_completion_tokens": max_tokens  # Updated from max_tokens to max_completion_tokens
    }
    
    # Get API key from environment variables (now force reloaded in run.py)
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        error_msg = "GROQ_API_KEY not found in environment variables"
        current_app.logger.error(error_msg)
        return {"error": error_msg}
        
    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        # Debug the request data
        current_app.logger.info("Sending request to Groq API:")
        current_app.logger.info(f"Model: {model}")
        current_app.logger.info(f"Number of messages: {len(messages)}")
        current_app.logger.info(f"Temperature: {temperature}")
        current_app.logger.info(f"Max tokens: {max_tokens}")
        
        # Send the request
        response = requests.post(groq_url, headers=headers, json=groq_data)
        
        # Log the response status code and headers for debugging
        current_app.logger.info(f"Groq API response status code: {response.status_code}")
        current_app.logger.info(f"Groq API response headers: {response.headers}")
        
        # Check if the response is valid JSON
        try:
            result = response.json()
            current_app.logger.info("Groq response received successfully")
            current_app.logger.debug(f"Groq response content: {result}")
            
            # Check for error in the response
            if 'error' in result:
                error_msg = f"Groq API returned an error: {result['error'].get('message', 'Unknown error')}"
                current_app.logger.error(error_msg)
                return {"error": error_msg}
            
            # Extract the content from the response
            if result.get('choices') and len(result['choices']) > 0 and result['choices'][0].get('message'):
                content = result['choices'][0]['message'].get('content', '')
                
                # Store the assistant message in the database
                try:
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
        except json.JSONDecodeError as json_err:
            error_msg = f"Invalid JSON response from Groq: {str(json_err)}"
            current_app.logger.error(error_msg)
            current_app.logger.error(f"Response content preview: {response.text[:200]}...")
            return {"error": error_msg}
            
    except Exception as e:
        error_msg = str(e)
        current_app.logger.error(f"Error with Groq request: {error_msg}")
        return {"error": error_msg}

def process_node(node, parent_contexts, conversation_history, conversation):
    """Process a node with Groq backend."""
    # Prepare data for Groq
    groq_data = {
        "model": node.model,
        "messages": [
            {"role": "system", "content": node.system_message + "\n\n" + "".join([
                f"Context from parent node {ctx['node_id']}: {ctx['last_response']}\n\n"
                for ctx in parent_contexts
            ])},
            *conversation_history
        ],
        "temperature": node.temperature,
        "max_completion_tokens": node.max_tokens  # Updated from max_tokens to max_completion_tokens
    }
    
    # Get API key from environment variables (now force reloaded in run.py)
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        return "Error: GROQ_API_KEY not found in environment variables"
    
    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        # Log the request data for debugging
        current_app.logger.info(f"Sending request to Groq API for node {node.id}")
        current_app.logger.info(f"Model: {node.model}")
        current_app.logger.info(f"Temperature: {node.temperature}")
        current_app.logger.info(f"Max completion tokens: {node.max_tokens}")
        
        response = requests.post(groq_url, headers=headers, json=groq_data)
        
        # Log the response status and headers
        current_app.logger.info(f"Groq API response status code: {response.status_code}")
        current_app.logger.info(f"Groq API response headers: {response.headers}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                current_app.logger.debug(f"Groq response content: {result}")
                
                # Check for error in the response
                if 'error' in result:
                    error_msg = f"Groq API returned an error: {result['error'].get('message', 'Unknown error')}"
                    current_app.logger.error(error_msg)
                    return f"Error: {error_msg}"
                
                if result.get('choices') and len(result['choices']) > 0 and result['choices'][0].get('message'):
                    content = result['choices'][0]['message'].get('content', '')
                    
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
                    error_msg = "Invalid response format from Groq"
                    current_app.logger.error(f"Error: {error_msg}")
                    return f"Error: {error_msg}"
            except json.JSONDecodeError as e:
                error_msg = f"Invalid JSON response from Groq: {str(e)}"
                current_app.logger.error(error_msg)
                current_app.logger.error(f"Response content preview: {response.text[:200]}...")
                return f"Error: {error_msg}"
        else:
            error_msg = f"Groq API returned status code {response.status_code}"
            current_app.logger.error(error_msg)
            try:
                error_content = response.json()
                current_app.logger.error(f"Error response content: {error_content}")
            except:
                current_app.logger.error(f"Error response content (raw): {response.text[:200]}...")
            return f"Error: {error_msg}"
    except Exception as e:
        current_app.logger.error(f"Error processing Groq node: {str(e)}")
        return f"Error: {str(e)}"
