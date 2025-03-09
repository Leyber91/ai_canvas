"""
Routes for executing graph workflows.
"""

from flask import request, jsonify, current_app

from . import api_bp
from ..services import graph_service

@api_bp.route('/workflow/execute', methods=['POST'])
def execute_workflow():
    """Execute a workflow by processing nodes in topological order."""
    data = request.json
    graph_id = data.get('graph_id')
    
    # Use the graph service to execute the workflow
    result, error = graph_service.execute_workflow(graph_id)
    
    if error:
        current_app.logger.error(f"Error executing workflow: {error}")
        return jsonify({
            'status': 'error',
            'message': error
        }), 500 if 'Database error' in error else 400
    
    return jsonify({
        'status': 'success',
        'data': result
    })