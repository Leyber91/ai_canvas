"""
Routes for handling graph operations.
"""

from flask import request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

from . import api_bp
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
