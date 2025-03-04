"""
Edge model for the AI Canvas application.
"""

from . import db

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
