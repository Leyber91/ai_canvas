"""
Database models for the AI Canvas application.
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Text

db = SQLAlchemy()

class Graph(db.Model):
    """Graph model representing a collection of nodes and edges."""
    __tablename__ = 'graphs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    creation_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_modified = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    layout_data = db.Column(db.JSON, nullable=True)
    
    # Relationships
    nodes = db.relationship('Node', backref='graph', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert graph to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'creation_date': self.creation_date.isoformat() if self.creation_date else None,
            'last_modified': self.last_modified.isoformat() if self.last_modified else None,
            'layout_data': self.layout_data,
            'nodes': [node.to_dict() for node in self.nodes],
            'edges': [edge.to_dict() for edge in Edge.query.filter(
                Edge.source_node_id.in_([node.id for node in self.nodes])
            ).all()]
        }


class Node(db.Model):
    """Node model representing an AI node in the graph."""
    __tablename__ = 'nodes'
    
    id = db.Column(db.String(50), primary_key=True)
    graph_id = db.Column(db.Integer, db.ForeignKey('graphs.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    backend = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    system_message = db.Column(db.Text, nullable=True)
    temperature = db.Column(db.Float, default=0.7)
    max_tokens = db.Column(db.Integer, default=1024)
    position_x = db.Column(db.Float, nullable=True)
    position_y = db.Column(db.Float, nullable=True)
    
    # Relationships
    conversations = db.relationship('Conversation', backref='node', cascade='all, delete-orphan')
    outgoing_edges = db.relationship('Edge', 
                                    foreign_keys='Edge.source_node_id',
                                    backref='source_node', 
                                    cascade='all, delete-orphan')
    incoming_edges = db.relationship('Edge', 
                                    foreign_keys='Edge.target_node_id',
                                    backref='target_node', 
                                    cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert node to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'backend': self.backend,
            'model': self.model,
            'systemMessage': self.system_message,
            'temperature': self.temperature,
            'maxTokens': self.max_tokens,
            'position': {
                'x': self.position_x,
                'y': self.position_y
            } if self.position_x is not None and self.position_y is not None else None
        }


class Edge(db.Model):
    """Edge model representing a connection between nodes."""
    __tablename__ = 'edges'
    
    id = db.Column(db.String(100), primary_key=True)
    source_node_id = db.Column(db.String(50), db.ForeignKey('nodes.id'), nullable=False)
    target_node_id = db.Column(db.String(50), db.ForeignKey('nodes.id'), nullable=False)
    edge_type = db.Column(db.String(50), default='provides_context')
    
    def to_dict(self):
        """Convert edge to dictionary."""
        return {
            'id': self.id,
            'source': self.source_node_id,
            'target': self.target_node_id,
            'type': self.edge_type
        }


class Conversation(db.Model):
    """Conversation model representing a chat session with a node."""
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    node_id = db.Column(db.String(50), db.ForeignKey('nodes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='conversation', cascade='all, delete-orphan', order_by='Message.timestamp')
    
    def to_dict(self):
        """Convert conversation to dictionary."""
        return {
            'id': self.id,
            'node_id': self.node_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'messages': [message.to_dict() for message in self.messages]
        }


class Message(db.Model):
    """Message model representing a single message in a conversation."""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert message to dictionary."""
        return {
            'id': self.id,
            'role': self.role,
            'content': self.content,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
