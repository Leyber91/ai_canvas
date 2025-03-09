# app/api/controllers/edge_controller.py
from flask import Blueprint, jsonify, request, current_app
from ...core.exceptions import AppException, ResourceNotFoundError, ValidationError
from ...domain.services.edge_service import EdgeService

edge_bp = Blueprint('edge', __name__, url_prefix='/api/edges')
edge_service = EdgeService()

@edge_bp.route('', methods=['POST'])
def create_edge():
    """Create a new edge between nodes."""
    try:
        data = request.json
        source_id = data.get('source')
        target_id = data.get('target')
        edge_type = data.get('type', 'provides_context')
        
        edge = edge_service.create_edge(
            source_id=source_id,
            target_id=target_id,
            edge_type=edge_type
        )
        
        return jsonify({
            'status': 'success',
            'data': edge
        }), 201
    except (ResourceNotFoundError, ValidationError) as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        current_app.logger.error(f"Unexpected error creating edge: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to create edge: {str(e)}'
        }), 500

@edge_bp.route('/<edge_id>', methods=['DELETE'])
def delete_edge(edge_id):
    """Delete an edge."""
    try:
        # Modified to always return success, even if edge doesn't exist
        edge_service.delete_edge(edge_id)
        return jsonify({
            'status': 'success',
            'message': 'Edge deleted successfully'
        })
    except Exception as e:
        # Log error but don't expose to client
        current_app.logger.error(f"Unexpected error deleting edge: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error processing edge deletion'
        }), 500

@edge_bp.route('/batch', methods=['POST'])
def batch_edge_operations():
    """Handle batch edge operations."""
    try:
        data = request.json
        operation = data.get('operation')
        
        if operation == 'create':
            edges_data = data.get('edges', [])
            results = edge_service.bulk_create_edges(edges_data)
            
            return jsonify({
                'status': 'success',
                'data': results
            }), 201
        else:
            return jsonify({
                'status': 'error',
                'message': f'Unknown operation: {operation}'
            }), 400
            
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to process batch operation: {str(e)}'
        }), 500