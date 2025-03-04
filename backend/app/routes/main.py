"""
Main routes for the AI Canvas application.
"""

from flask import render_template
from . import main_bp

@main_bp.route('/')
def index():
    """Render the main index page."""
    return render_template('index.html')
