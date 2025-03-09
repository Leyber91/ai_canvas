"""
Routes for handling AI models.
"""

from flask import jsonify
from . import api_bp
from ..services import ollama_service, groq_service

@api_bp.route('/models', methods=['GET'])
def get_models():
    """Get available models from Ollama and Groq."""
    # Get models from services
    try:
        print("Fetching Ollama models...")
        ollama_models = ollama_service.get_available_models()
        print(f"Fetched {len(ollama_models)} Ollama models")
        
        print("Fetching Groq models...")
        groq_models = groq_service.get_available_models()
        print(f"Fetched {len(groq_models)} Groq models")
        
        response_data = {
            "ollama": ollama_models,
            "groq": groq_models
        }
        
        print("Returning models:", response_data)
        return jsonify(response_data)
    except Exception as e:
        print(f"Error in get_models endpoint: {str(e)}")
        # Return fallback data
        return jsonify({
            "ollama": ["llama3", "llama2", "mistral"],
            "groq": ["mixtral-8x7b-32768", "llama3-70b-8192"]
        })

@api_bp.route('/groq/model-limits', methods=['GET'])
def get_groq_model_limits():
    """Get rate limits for Groq models."""
    return jsonify(groq_service.GROQ_MODEL_LIMITS)
