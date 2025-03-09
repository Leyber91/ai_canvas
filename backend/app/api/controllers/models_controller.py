# app/api/controllers/models_controller.py
from flask import Blueprint, jsonify
from ...domain.services.model_service import ModelService

models_bp = Blueprint('models', __name__, url_prefix='/api')
model_service = ModelService()

@models_bp.route('/models', methods=['GET'])
def get_models():
    """Get available models from Ollama and Groq."""
    try:
        models = model_service.get_available_models()
        return jsonify(models)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to get models: {str(e)}'
        }), 500

@models_bp.route('/groq/model-limits', methods=['GET'])
def get_groq_model_limits():
    """Get rate limits for Groq models."""
    try:
        limits = model_service.get_groq_model_limits()
        return jsonify(limits)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to get Groq model limits: {str(e)}'
        }), 500