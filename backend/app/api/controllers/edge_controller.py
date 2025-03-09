# app/api/controllers/edge_controller.py
from flask import Blueprint, jsonify, request
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
        return jsonify({
            'status': 'error',
            'message': f'Failed to create edge: {str(e)}'
        }), 500

@edge_bp.route('/<edge_id>', methods=['DELETE'])
def delete_edge(edge_id):
    """Delete an edge."""
    try:
        edge_service.delete_edge(edge_id)
        return jsonify({
            'status': 'success',
            'message': 'Edge deleted successfully'
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to delete edge: {str(e)}'
        }), 500