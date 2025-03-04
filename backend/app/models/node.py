"""
Node model for the AI Canvas application.
"""

from . import db

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
