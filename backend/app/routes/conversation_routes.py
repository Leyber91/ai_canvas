"""
Routes for handling conversation operations.
"""

from flask import request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

from . import api_bp
from ..models import db, Node, Conversation, Message

@api_bp.route('/nodes/<node_id>/conversations', methods=['GET'])
def get_conversations(node_id):
    """Get all conversations for a node."""
    try:
        node = Node.query.get(node_id)
        if not node:
            return jsonify({
                'status': 'error',
                'message': 'Node not found'
            }), 404
            
        conversations = Conversation.query.filter_by(node_id=node_id).all()
        
        return jsonify({
            'status': 'success',
            'data': [conversation.to_dict() for conversation in conversations]
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve conversations'
        }), 500

@api_bp.route('/nodes/<node_id>/conversations', methods=['POST'])
def create_conversation(node_id):
    """Create a new conversation for a node."""
    try:
        node = Node.query.get(node_id)
        if not node:
            return jsonify({
                'status': 'error',
                'message': 'Node not found'
            }), 404
            
        conversation = Conversation(node_id=node_id)
        db.session.add(conversation)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'data': conversation.to_dict()
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create conversation'
        }), 500

@api_bp.route('/conversations/<int:conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get a specific conversation with its messages."""
    try:
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({
                'status': 'error',
                'message': 'Conversation not found'
            }), 404
            
        # Get messages for this conversation
        messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
        
        # Create response data
        conversation_data = conversation.to_dict()
        conversation_data['messages'] = [message.to_dict() for message in messages]
        
        return jsonify({
            'status': 'success',
            'data': conversation_data
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve conversation'
        }), 500

@api_bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    """Delete a conversation."""
    try:
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({
                'status': 'error',
                'message': 'Conversation not found'
            }), 404
            
        db.session.delete(conversation)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Conversation deleted successfully'
        })
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete conversation'
        }), 500

@api_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
def get_messages(conversation_id):
    """Get all messages for a conversation."""
    try:
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({
                'status': 'error',
                'message': 'Conversation not found'
            }), 404
            
        messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
        
        return jsonify({
            'status': 'success',
            'data': [message.to_dict() for message in messages]
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve messages'
        }), 500

@api_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
def add_message(conversation_id):
    """Add a message to a conversation."""
    data = request.json
    
    try:
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({
                'status': 'error',
                'message': 'Conversation not found'
            }), 404
            
        message = Message(
            conversation_id=conversation_id,
            role=data.get('role'),
            content=data.get('content')
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'data': message.to_dict()
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to add message'
        }), 500

@api_bp.route('/messages/<int:message_id>', methods=['GET'])
def get_message(message_id):
    """Get a specific message."""
    try:
        message = Message.query.get(message_id)
        if not message:
            return jsonify({
                'status': 'error',
                'message': 'Message not found'
            }), 404
            
        return jsonify({
            'status': 'success',
            'data': message.to_dict()
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve message'
        }), 500

@api_bp.route('/messages/<int:message_id>', methods=['DELETE'])
def delete_message(message_id):
    """Delete a message."""
    try:
        message = Message.query.get(message_id)
        if not message:
            return jsonify({
                'status': 'error',
                'message': 'Message not found'
            }), 404
            
        db.session.delete(message)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Message deleted successfully'
        })
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete message'
        }), 500
