"""
Routes for handling edge operations.
"""

from flask import request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

from . import api_bp
from ..services import graph_service

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

@api_bp.route('/edges/<edge_id>', methods=['GET'])
def get_edge(edge_id):
    """Get a specific edge."""
    try:
        # Since there's no get_edge function in graph_service, we'll use the Edge model directly
        from ..models import Edge
        
        edge = Edge.query.get(edge_id)
        if not edge:
            return jsonify({
                'status': 'error',
                'message': 'Edge not found'
            }), 404
            
        return jsonify({
            'status': 'success',
            'data': edge.to_dict()
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve edge'
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

@api_bp.route('/graphs/<int:graph_id>/edges', methods=['GET'])
def get_graph_edges(graph_id):
    """Get all edges for a graph."""
    try:
        # Check if graph exists
        graph = graph_service.get_graph(graph_id)
        if not graph:
            return jsonify({
                'status': 'error',
                'message': 'Graph not found'
            }), 404
            
        # Get all edges for the graph
        from ..models import Edge
        
        # Get all node IDs in this graph
        node_ids = [node.id for node in graph.nodes]
        
        # Get all edges where source node is in this graph
        edges = Edge.query.filter(Edge.source_node_id.in_(node_ids)).all()
        
        return jsonify({
            'status': 'success',
            'data': [edge.to_dict() for edge in edges]
        })
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve edges'
        }), 500
