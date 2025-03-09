# app/api/controllers/graph_controller.py
from typing import Dict, Any, List
from flask import jsonify, request, Blueprint
from werkzeug.exceptions import HTTPException

from ...core.exceptions import AppException, ResourceNotFoundError, ValidationError
from ...domain.services.graph_service import GraphService

graph_bp = Blueprint('graph', __name__, url_prefix='/api/graphs')
graph_service = GraphService()

@graph_bp.route('', methods=['GET'])
def get_graphs():
    """Get all graphs."""
    try:
        graphs = graph_service.get_all_graphs()
        return jsonify({
            'status': 'success',
            'data': graphs
        })
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@graph_bp.route('', methods=['POST'])
def create_graph():
    """Create a new graph."""
    try:
        data = request.json
        
        graph = graph_service.create_graph(
            name=data.get('name', 'Untitled Graph'),
            description=data.get('description', ''),
            layout_data=data.get('layout_data')
        )
        
        return jsonify({
            'status': 'success',
            'data': graph
        }), 201
    except ValidationError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to create graph: ' + str(e)
        }), 500

@graph_bp.route('/<int:graph_id>', methods=['GET'])
def get_graph(graph_id):
    """Get a specific graph."""
    try:
        graph = graph_service.get_graph(graph_id)
        return jsonify({
            'status': 'success',
            'data': graph
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to retrieve graph: ' + str(e)
        }), 500

@graph_bp.route('/<int:graph_id>', methods=['PUT'])
def update_graph(graph_id):
    """Update a graph."""
    try:
        data = request.json
        
        graph = graph_service.update_graph(
            graph_id=graph_id,
            name=data.get('name'),
            description=data.get('description'),
            layout_data=data.get('layout_data')
        )
        
        return jsonify({
            'status': 'success',
            'data': graph
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to update graph: ' + str(e)
        }), 500

@graph_bp.route('/<int:graph_id>', methods=['DELETE'])
def delete_graph(graph_id):
    """Delete a graph."""
    try:
        graph_service.delete_graph(graph_id)
        return jsonify({
            'status': 'success',
            'message': 'Graph deleted successfully'
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete graph: ' + str(e)
        }), 500


@graph_bp.route('/<int:graph_id>/batch', methods=['POST'])
def update_graph_batch(graph_id):
    """Update a graph with a batch of operations."""
    try:
        operations = request.json
        result = graph_service.update_graph_batch(graph_id, operations)
        return jsonify({
            'status': 'success',
            'data': result
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except ValidationError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to perform batch update: ' + str(e)
        }), 500