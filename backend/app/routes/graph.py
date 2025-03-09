
"""
Routes for handling graph operations.
"""

from flask import request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

from . import api_bp
from ..models import db, Conversation, Message, Node, Graph, Edge
from ..services import graph_service


@api_bp.route('/graphs', methods=['GET'])
def get_graphs():
    """Get all graphs."""
    try:
        graphs = graph_service.get_all_graphs()
        return jsonify({
            'status': 'success',
            'data': [graph.to_dict() for graph in graphs]
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve graphs'
        }), 500

@api_bp.route('/graphs', methods=['POST'])
def create_graph():
    """Create a new graph."""
    data = request.json
    
    try:
        graph = graph_service.create_graph(
            name=data.get('name', 'Untitled Graph'),
            description=data.get('description', ''),
            layout_data=data.get('layout_data')
        )
        
        return jsonify({
            'status': 'success',
            'data': graph.to_dict()
        }), 201
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create graph'
        }), 500

@api_bp.route('/graphs/<int:graph_id>', methods=['GET'])
def get_graph(graph_id):
    """Get a specific graph."""
    try:
        graph = graph_service.get_graph(graph_id)
        if not graph:
            return jsonify({
                'status': 'error',
                'message': 'Graph not found'
            }), 404
            
        return jsonify({
            'status': 'success',
            'data': graph.to_dict()
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve graph'
        }), 500

@api_bp.route('/graphs/<int:graph_id>', methods=['PUT'])
def update_graph(graph_id):
    """Update a graph."""
    data = request.json
    
    try:
        graph = graph_service.update_graph(
            graph_id=graph_id,
            name=data.get('name'),
            description=data.get('description'),
            layout_data=data.get('layout_data')
        )
        
        if not graph:
            return jsonify({
                'status': 'error',
                'message': 'Graph not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': graph.to_dict()
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update graph'
        }), 500

@api_bp.route('/graphs/<int:graph_id>', methods=['DELETE'])
def delete_graph(graph_id):
    """Delete a graph."""
    try:
        success = graph_service.delete_graph(graph_id)
        if not success:
            return jsonify({
                'status': 'error',
                'message': 'Graph not found'
            }), 404
            
        return jsonify({
            'status': 'success',
            'message': 'Graph deleted successfully'
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete graph'
        }), 500

@api_bp.route('/graphs/<int:graph_id>/nodes', methods=['POST'])
def create_node(graph_id):
    """Create a new node in a graph."""
    data = request.json
    
    try:
        # Check if graph exists
        graph = graph_service.get_graph(graph_id)
        if not graph:
            return jsonify({
                'status': 'error',
                'message': 'Graph not found'
            }), 404
            
        # Safely handle position data which might be None
        position = data.get('position') or {}
        position_x = position.get('x') if isinstance(position, dict) else None
        position_y = position.get('y') if isinstance(position, dict) else None
            
        node = graph_service.create_node(
            graph_id=graph_id,
            node_id=data.get('id'),
            name=data.get('name'),
            backend=data.get('backend'),
            model=data.get('model'),
            system_message=data.get('systemMessage'),
            temperature=data.get('temperature', 0.7),
            max_tokens=data.get('maxTokens', 1024),
            position_x=position_x,
            position_y=position_y
        )
        
        return jsonify({
            'status': 'success',
            'data': node.to_dict()
        }), 201
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Failed to create node'
        }), 500


@api_bp.route('/nodes/<node_id>', methods=['PUT'])
def update_node(node_id):
    """Update a node."""
    data = request.json
    
    try:
        position = data.get('position', {})
        
        node = graph_service.update_node(
            node_id=node_id,
            name=data.get('name'),
            backend=data.get('backend'),
            model=data.get('model'),
            system_message=data.get('systemMessage'),
            temperature=data.get('temperature'),
            max_tokens=data.get('maxTokens'),
            position_x=position.get('x') if position else None,
            position_y=position.get('y') if position else None
        )
        
        if not node:
            return jsonify({
                'status': 'error',
                'message': 'Node not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': node.to_dict()
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update node'
        }), 500

@api_bp.route('/nodes/<node_id>', methods=['DELETE'])
def delete_node(node_id):
    """Delete a node."""
    try:
        success = graph_service.delete_node(node_id)
        if not success:
            return jsonify({
                'status': 'error',
                'message': 'Node not found'
            }), 404
            
        return jsonify({
            'status': 'success',
            'message': 'Node deleted successfully'
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete node'
        }), 500

@api_bp.route('/edges', methods=['POST'])
def create_edge():
    """Create a new edge between nodes."""
    data = request.json
    
    try:
        source_id = data.get('source')
        target_id = data.get('target')
        
        edge = graph_service.create_edge(
            source_id=source_id,
            target_id=target_id,
            edge_type=data.get('type', 'provides_context')
        )
        
        if not edge:
            return jsonify({
                'status': 'error',
                'message': 'Source or target node not found'
            }), 404
            
        return jsonify({
            'status': 'success',
            'data': edge.to_dict()
        }), 201
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create edge'
        }), 500

@api_bp.route('/edges/<edge_id>', methods=['DELETE'])
def delete_edge(edge_id):
    """Delete an edge."""
    try:
        success = graph_service.delete_edge(edge_id)
        if not success:
            return jsonify({
                'status': 'error',
                'message': 'Edge not found'
            }), 404
            
        return jsonify({
            'status': 'success',
            'message': 'Edge deleted successfully'
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete edge'
        }), 500

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


@api_bp.route('/reset-database', methods=['POST'])
def reset_database():
    """Reset the database by deleting all graphs and related data."""
    try:
        # Use a transaction to ensure atomicity
        with db.session.begin():
            # Delete all messages first (due to foreign key constraints)
            Message.query.delete()
            
            # Delete all conversations
            Conversation.query.delete()
            
            # Delete all edges
            Edge.query.delete()
            
            # Delete all nodes
            Node.query.delete()
            
            # Delete all graphs
            Graph.query.delete()
        
        return jsonify({
            'status': 'success',
            'message': 'Database has been reset successfully'
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error during reset: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to reset database: {str(e)}'
        }), 500
