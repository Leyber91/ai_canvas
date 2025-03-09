# app/infrastructure/ai_providers/groq_provider.py
import os
import json
import requests
from typing import List, Dict, Any, Optional
from flask import current_app

from .base import AIProvider
from ...core.exceptions import ProviderError
from ...core.config import settings

# List of supported Groq models
GROQ_MODELS = [
    "deepseek-r1-distill-llama-70b",   
    "deepseek-r1-distill-qwen-32b",    
    "gemma2-9b-it",                    
    "llama-3.1-8b-instant",            
    "llama-3.2-11b-vision-preview",    
    "llama-3.2-1b-preview",            
    "llama-3.2-3b-preview",            
    "llama-3.2-90b-vision-preview",    
    "llama-3.3-70b-specdec",           
    "llama-3.3-70b-versatile",         
    "llama-guard-3-8b",                
    "llama3-70b-8192",                 
    "llama3-8b-8192",                  
    "mistral-saba-24b",                
    "mixtral-8x7b-32768",              
    "qwen-2.5-32b",                    
    "qwen-2.5-coder-32b"               
]

class GroqProvider(AIProvider):
    """Provider for Groq API integration."""
    
    def get_available_models(self) -> List[str]:
        """Get available models from Groq."""
        return GROQ_MODELS
    
    def chat(self, model: str, messages: List[Dict[str, str]], 
            temperature: float, max_tokens: int, streaming: bool = False) -> Dict[str, Any]:
        """Send a chat request to Groq."""
        # Get API key from settings
        groq_api_key = settings.GROQ_API_KEY
        if not groq_api_key:
            raise ProviderError(
                "GROQ_API_KEY not found in environment variables",
                code="missing_api_key"
            )
            
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        # Convert max_tokens to max_completion_tokens for Groq
        groq_data = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_completion_tokens": max_tokens
        }
        
        try:
            response = requests.post(groq_url, headers=headers, json=groq_data)
            
            # Log response status for debugging
            current_app.logger.info(f"Groq API response status code: {response.status_code}")
            
            if response.status_code != 200:
                raise ProviderError(
                    f"Groq API returned status code {response.status_code}",
                    code="groq_api_error",
                    details={"status_code": response.status_code, "response": response.text[:200]}
                )
            
            try:
                return response.json()
            except json.JSONDecodeError as e:
                raise ProviderError(
                    f"Invalid JSON response from Groq: {str(e)}",
                    code="groq_parse_error"
                )
                
        except requests.RequestException as e:
            raise ProviderError(f"Groq request error: {str(e)}", code="groq_request_error")
    
    def process_node(self, node_data: Dict[str, Any], parent_contexts: List[Dict[str, str]], 
                    conversation_history: List[Dict[str, str]]) -> str:
        """Process a node in a workflow."""
        # Prepare data for Groq
        context_text = ""
        for ctx in parent_contexts:
            context_text += f"Context from parent node {ctx['node_id']}: {ctx['last_response']}\n\n"
        
        # Create the message list
        messages = [
            {"role": "system", "content": node_data["system_message"] + "\n\n" + context_text},
            *conversation_history
        ]
        
        try:
            # Send request to Groq
            response = self.chat(
                model=node_data["model"],
                messages=messages,
                temperature=node_data["temperature"],
                max_tokens=node_data["max_tokens"]
            )
            
            # Extract the content from the response
            if 'choices' in response and len(response['choices']) > 0 and 'message' in response['choices'][0]:
                content = response['choices'][0]['message'].get('content', '')
                return content
            else:
                return "Error: Invalid response format from Groq"
        except ProviderError as e:
            return f"Error: {e.message}"
        except Exception as e:
            current_app.logger.error(f"Error processing Groq node: {str(e)}")
            return f"Error: {str(e)}"