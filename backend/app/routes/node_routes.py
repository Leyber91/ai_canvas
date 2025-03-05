"""
Routes for handling node operations.
"""

from flask import request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

from . import api_bp
from ..models import db, Node
from ..services import graph_service

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
            
        node = graph_service.create_node(
            graph_id=graph_id,
            node_id=data.get('id'),
            name=data.get('name'),
            backend=data.get('backend'),
            model=data.get('model'),
            system_message=data.get('systemMessage'),
            temperature=data.get('temperature', 0.7),
            max_tokens=data.get('maxTokens', 1024),
            position_x=data.get('position', {}).get('x'),
            position_y=data.get('position', {}).get('y')
        )
        
        return jsonify({
            'status': 'success',
            'data': node.to_dict()
        }), 201
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to create node'
        }), 500

@api_bp.route('/nodes/<node_id>', methods=['GET'])
def get_node(node_id):
    """Get a specific node."""
    try:
        node = graph_service.get_node(node_id)
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
            'message': 'Failed to retrieve node'
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

@api_bp.route('/nodes/<node_id>/parent-nodes', methods=['GET'])
def get_parent_nodes(node_id):
    """Get all parent nodes of a node."""
    try:
        node = Node.query.get(node_id)
        if not node:
            return jsonify({
                'status': 'error',
                'message': 'Node not found'
            }), 404
            
        parent_nodes = graph_service.get_parent_nodes(node_id)
        
        return jsonify({
            'status': 'success',
            'data': [parent.to_dict() for parent in parent_nodes]
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve parent nodes'
        }), 500

@api_bp.route('/nodes/<node_id>/child-nodes', methods=['GET'])
def get_child_nodes(node_id):
    """Get all child nodes of a node."""
    try:
        node = Node.query.get(node_id)
        if not node:
            return jsonify({
                'status': 'error',
                'message': 'Node not found'
            }), 404
            
        child_nodes = graph_service.get_child_nodes(node_id)
        
        return jsonify({
            'status': 'success',
            'data': [child.to_dict() for child in child_nodes]
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve child nodes'
        }), 500

@api_bp.route('/nodes/<node_id>/execution-context', methods=['GET'])
def get_node_execution_context(node_id):
    """Get the execution context for a node."""
    try:
        node = Node.query.get(node_id)
        if not node:
            return jsonify({
                'status': 'error',
                'message': 'Node not found'
            }), 404
            
        context = graph_service.get_node_execution_context(node_id)
        
        if 'error' in context:
            return jsonify({
                'status': 'error',
                'message': context['error']
            }), 500
            
        return jsonify({
            'status': 'success',
            'data': context
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve execution context'
        }), 500
