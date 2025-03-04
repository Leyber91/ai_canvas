"""
Graph model for the AI Canvas application.
"""

from datetime import datetime
from . import db

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
        from .edge import Edge
        
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
