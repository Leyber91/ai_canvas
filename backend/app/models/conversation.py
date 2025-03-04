"""
Conversation model for the AI Canvas application.
"""

from datetime import datetime
from . import db

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
