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
    ollama_models = ollama_service.get_available_models()
    groq_models = groq_service.get_available_models()
    
    return jsonify({
        "ollama": ollama_models,
        "groq": groq_models
    })

@api_bp.route('/groq/model-limits', methods=['GET'])
def get_groq_model_limits():
    """Get rate limits for Groq models."""
    return jsonify(groq_service.GROQ_MODEL_LIMITS)
