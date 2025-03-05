"""
Main routes for the AI Canvas application.
"""

from flask import Blueprint
from . import socketio

# Create main blueprint
main_bp = Blueprint('main', __name__)

# Import routes to register them with the blueprint
from .routes.main import *

# Import API blueprint
from .api import api_bp

# Import API routes
from .routes.graph import *
from .routes.execute import *
from .routes.models import *
from .routes.chat import *
