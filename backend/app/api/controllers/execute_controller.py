# app/api/controllers/execute_controller.py
from flask import Blueprint, jsonify, request
from ...core.exceptions import AppException, ResourceNotFoundError, WorkflowError
from ...domain.services.workflow_service import WorkflowService

execute_bp = Blueprint('execute', __name__, url_prefix='/api')
workflow_service = WorkflowService()

@execute_bp.route('/execute', methods=['POST'])
def execute_workflow():
    """Execute a workflow by processing nodes in topological order."""
    try:
        data = request.json
        graph_id = data.get('graph_id')
        
        results, error = workflow_service.execute_workflow(graph_id)
        
        if error:
            return jsonify({
                'status': 'error',
                'message': error
            }), 400
        
        return jsonify({
            'status': 'success',
            'data': results
        })
    except WorkflowError as e:
        return jsonify(e.to_dict()), e.status_code
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error executing workflow: {str(e)}'
        }), 500