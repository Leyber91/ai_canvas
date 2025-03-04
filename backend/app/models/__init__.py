"""
Database models for the AI Canvas application.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models to make them available when importing from models
from .graph import Graph
from .node import Node
from .edge import Edge
from .conversation import Conversation
from .message import Message

__all__ = ['db', 'Graph', 'Node', 'Edge', 'Conversation', 'Message']
