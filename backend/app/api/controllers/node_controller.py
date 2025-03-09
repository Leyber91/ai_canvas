# app/api/controllers/node_controller.py
from flask import Blueprint, jsonify, request
from ...core.exceptions import AppException, ResourceNotFoundError, ValidationError
from ...domain.services.node_service import NodeService

node_bp = Blueprint('node', __name__, url_prefix='/api/nodes')
node_service = NodeService()

@node_bp.route('/<node_id>', methods=['GET'])
def get_node(node_id):
    """Get a node by ID."""
    try:
        node = node_service.get_node(node_id)
        return jsonify({
            'status': 'success',
            'data': node
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve node: {str(e)}'
        }), 500

@node_bp.route('/<node_id>', methods=['PUT'])
def update_node(node_id):
    """Update a node."""
    try:
        data = request.json
        position = data.get('position', {})
        
        node = node_service.update_node(
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
        
        return jsonify({
            'status': 'success',
            'data': node
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to update node: {str(e)}'
        }), 500

@node_bp.route('/<node_id>', methods=['DELETE'])
def delete_node(node_id):
    """Delete a node."""
    try:
        node_service.delete_node(node_id)
        return jsonify({
            'status': 'success',
            'message': 'Node deleted successfully'
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to delete node: {str(e)}'
        }), 500