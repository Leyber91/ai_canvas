# app/domain/services/model_service.py
from typing import Dict, Any, List
from flask import current_app
import os

from ...infrastructure.ai_providers.base import AIProviderFactory

# Groq models with their rate limits
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

class ModelService:
    """Service for managing AI models."""
    
    def __init__(self):
        self.ai_factory = AIProviderFactory()
        
    def get_available_models(self) -> Dict[str, List[str]]:
        """Get available models from all providers."""
        try:
            # Get Ollama models
            ollama_provider = self.ai_factory.get_provider('ollama')
            ollama_models = ollama_provider.get_available_models()
            
            # Get Groq models
            groq_models = list(GROQ_MODEL_LIMITS.keys())
            
            return {
                "ollama": ollama_models,
                "groq": groq_models
            }
        except Exception as e:
            current_app.logger.error(f"Error getting available models: {str(e)}")
            # Fallback to known models if providers fail
            return {
                "ollama": ["llama3", "llama2", "mistral"],
                "groq": list(GROQ_MODEL_LIMITS.keys())
            }
    
    def get_groq_model_limits(self) -> Dict[str, Dict[str, Any]]:
        """Get rate limits for Groq models."""
        return GROQ_MODEL_LIMITS
    
    def get_recommended_models(self, use_case: str) -> Dict[str, List[str]]:
        """Get recommended models for a specific use case."""
        all_models = self.get_available_models()
        
        if use_case == 'code':
            return {
                'ollama': [m for m in all_models['ollama'] if 'code' in m or 'coder' in m],
                'groq': ['qwen-2.5-coder-32b']
            }
        elif use_case == 'summarization':
            return {
                'ollama': [m for m in all_models['ollama'] if 'llama3' in m],
                'groq': ['deepseek-r1-distill-llama-70b']
            }
        else:  # Default to chat
            return {
                'ollama': [m for m in all_models['ollama'] if 'llama3' in m],
                'groq': ['mixtral-8x7b-32768']
            }