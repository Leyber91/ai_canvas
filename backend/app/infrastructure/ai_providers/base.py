# app/infrastructure/ai_providers/base.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class AIProvider(ABC):
    """Base interface for AI providers."""
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """Get available models from the provider."""
        pass
    
    @abstractmethod
    def chat(self, model: str, messages: List[Dict[str, str]], 
             temperature: float, max_tokens: int, streaming: bool = False) -> Dict[str, Any]:
        """Send a chat request to the provider."""
        pass
    
    @abstractmethod
    def process_node(self, node_data: Dict[str, Any], parent_contexts: List[Dict[str, str]], 
                    conversation_history: List[Dict[str, str]]) -> str:
        """Process a node in a workflow."""
        pass

class AIProviderFactory:
    """Factory for creating AI providers."""
    
    @staticmethod
    def get_provider(backend: str) -> AIProvider:
        """Get a provider for the specified backend."""
        from .ollama_provider import OllamaProvider
        from .groq_provider import GroqProvider
        
        if backend == 'ollama':
            return OllamaProvider()
        elif backend == 'groq':
            return GroqProvider()
        else:
            raise ValueError(f"Unsupported backend: {backend}")

# app/infrastructure/ai_providers/ollama_provider.py
import requests
import json
from typing import List, Dict, Any, Optional
from flask import current_app, Response, stream_with_context

from .base import AIProvider
from ...core.exceptions import ProviderError
from ..database.models import Message, db

OLLAMA_API_URL = "http://localhost:11434/api"

class OllamaProvider(AIProvider):
    """Provider for Ollama API integration."""
    
    def get_available_models(self) -> List[str]:
        """Get available models from Ollama."""
        ollama_models = []
        try:
            response = requests.get(f"{OLLAMA_API_URL}/tags")
            if response.status_code == 200:
                ollama_models = [model['name'] for model in response.json().get('models', [])]
            else:
                current_app.logger.warning(f"Failed to get Ollama models, status: {response.status_code}")
        except Exception as e:
            current_app.logger.error(f"Error getting Ollama models: {str(e)}")
        
        return ollama_models
    
    def chat(self, model: str, messages: List[Dict[str, str]], 
             temperature: float, max_tokens: int, streaming: bool = False) -> Any:
        """Send a chat request to Ollama."""
        try:
            ollama_data = {
                "model": model,
                "messages": messages,
                "stream": streaming,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            # If streaming is requested, handle differently
            if streaming:
                response = requests.post(
                    f"{OLLAMA_API_URL}/chat", 
                    json=ollama_data, 
                    stream=True
                )
                
                if response.status_code != 200:
                    raise ProviderError(
                        f"Ollama API returned status code {response.status_code}",
                        code="ollama_api_error"
                    )
                
                # Return streaming response
                return self._create_stream_response(response)
            
            # Handle non-streaming response
            response = requests.post(f"{OLLAMA_API_URL}/chat", json=ollama_data)
            
            if response.status_code != 200:
                raise ProviderError(
                    f"Ollama API returned status code {response.status_code}",
                    code="ollama_api_error"
                )
            
            return self._parse_ollama_response(response)
            
        except requests.RequestException as e:
            raise ProviderError(f"Ollama request error: {str(e)}", code="ollama_request_error")
    
    def process_node(self, node_data: Dict[str, Any], parent_contexts: List[Dict[str, str]], 
                    conversation_history: List[Dict[str, str]]) -> str:
        """Process a node in a workflow."""
        try:
            # Prepare context from parent nodes
            context_text = ""
            for ctx in parent_contexts:
                context_text += f"Context from parent node {ctx['node_id']}: {ctx['last_response']}\n\n"
            
            # Prepare data for Ollama
            ollama_data = {
                "model": node_data["model"],
                "messages": [
                    {"role": "system", "content": node_data["system_message"] + "\n\n" + context_text},
                    *conversation_history
                ],
                "options": {
                    "temperature": node_data["temperature"],
                    "num_predict": node_data["max_tokens"]
                }
            }
            
            # Send request to Ollama
            response = requests.post(f"{OLLAMA_API_URL}/chat", json=ollama_data)
            
            # Parse the response
            result = self._parse_ollama_response(response)
            
            if "error" in result:
                return f"Error: {result['error']}"
            
            return result.get("message", {}).get("content", "No response content")
            
        except Exception as e:
            current_app.logger.error(f"Error processing Ollama node: {str(e)}")
            return f"Error: {str(e)}"
    
    def _create_stream_response(self, response: requests.Response) -> Response:
        """Create a streaming response from Ollama."""
        def generate():
            try:
                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': f'Ollama API returned status code {response.status_code}'})}\n\n"
                    return
                
                # Process each line in the streaming response
                for line in response.iter_lines(decode_unicode=True):
                    if line:
                        try:
                            # Parse the JSON object
                            json_obj = json.loads(line)
                            
                            # Extract the content chunk
                            if json_obj.get('message', {}).get('content'):
                                content_chunk = json_obj['message']['content']
                                yield f"data: {content_chunk}\n\n"
                            
                        except json.JSONDecodeError as e:
                            current_app.logger.error(f"Error parsing JSON from Ollama stream: {str(e)}")
                            continue
            except Exception as e:
                current_app.logger.error(f"Error streaming from Ollama: {str(e)}")
                yield f"data: {json.dumps({'error': f'Error streaming from Ollama: {str(e)}'})}\n\n"
        
        return Response(stream_with_context(generate()), mimetype='text/event-stream')
    
    def _parse_ollama_response(self, response: requests.Response) -> Dict[str, Any]:
        """Parse a non-streaming response from Ollama."""
        try:
            if response.status_code != 200:
                return {
                    "error": f"Ollama API returned status code {response.status_code}"
                }
            
            # Ollama returns a JSON object per line in streaming mode
            # We need to parse each line and extract the last valid message
            lines = response.text.strip().split('\n')
            
            # Get the last complete JSON object
            last_response = None
            full_content = ""
            
            for line in lines:
                try:
                    json_obj = json.loads(line)
                    last_response = json_obj
                    # For compatibility with the frontend, reconstruct a complete response
                    if json_obj.get('message', {}).get('content'):
                        full_content += json_obj['message']['content']
                except json.JSONDecodeError:
                    continue
            
            # If we found valid response data
            if last_response:
                # Construct a final response with the full accumulated content
                return {
                    "model": last_response.get('model', ''),
                    "message": {
                        "role": "assistant",
                        "content": full_content
                    }
                }
            else:
                return {"error": "No valid response data found"}
        except Exception as e:
            return {"error": str(e)}