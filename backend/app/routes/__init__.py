"""
Routes for the AI Canvas application.
"""

from flask import Blueprint

# Create blueprints
main_bp = Blueprint('main', __name__)
api_bp = Blueprint('api', __name__)

# Import routes to register them with the blueprints
from .main import *
from .models import *
from .chat import *
from .graph import *
from .execute import *

# Export blueprints
__all__ = ['main_bp', 'api_bp']
