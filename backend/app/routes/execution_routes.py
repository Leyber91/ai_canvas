"""
Routes for handling workflow execution operations.
"""

from flask import request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

from . import api_bp
from ..services import graph_service

@api_bp.route('/graphs/<int:graph_id>/execute', methods=['POST'])
def execute_workflow(graph_id):
    """Execute a workflow by processing nodes in topological order."""
    try:
        # Check if graph exists
        graph = graph_service.get_graph(graph_id)
        if not graph:
            return jsonify({
                'status': 'error',
                'message': 'Graph not found'
            }), 404
            
        # Execute the workflow
        results, error = graph_service.execute_workflow(graph_id)
        
        if error:
            return jsonify({
                'status': 'error',
                'message': error
            }), 500
            
        return jsonify({
            'status': 'success',
            'data': results
        })
    except Exception as e:
        current_app.logger.error(f"Error executing workflow: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to execute workflow: {str(e)}'
        }), 500

@api_bp.route('/nodes/<node_id>/execute', methods=['POST'])
def execute_node(node_id):
    """Execute a single node, considering parent contexts."""
    try:
        # Check if node exists
        node = graph_service.get_node(node_id)
        if not node:
            return jsonify({
                'status': 'error',
                'message': 'Node not found'
            }), 404
            
        # Execute the node
        result = graph_service.execute_node(node_id)
        
        return jsonify({
            'status': 'success',
            'data': {
                'node_id': node_id,
                'result': result
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error executing node: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to execute node: {str(e)}'
        }), 500

@api_bp.route('/graphs/<int:graph_id>/execution-order', methods=['GET'])
def get_execution_order(graph_id):
    """Get the execution order for a graph without executing it."""
    try:
        # Check if graph exists
        graph = graph_service.get_graph(graph_id)
        if not graph:
            return jsonify({
                'status': 'error',
                'message': 'Graph not found'
            }), 404
            
        # Get the execution order
        execution_order, error = graph_service.get_topological_sort(graph_id)
        
        if error:
            return jsonify({
                'status': 'error',
                'message': error
            }), 500
            
        # Get node details for each node in the execution order
        nodes = []
        for node_id in execution_order:
            node = graph_service.get_node(node_id)
            if node:
                nodes.append({
                    'id': node.id,
                    'name': node.name,
                    'backend': node.backend,
                    'model': node.model
                })
        
        return jsonify({
            'status': 'success',
            'data': {
                'execution_order': execution_order,
                'nodes': nodes
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error getting execution order: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to get execution order: {str(e)}'
        }), 500

@api_bp.route('/graphs/<int:graph_id>/validate', methods=['GET'])
def validate_graph(graph_id):
    """Validate a graph for execution (check for cycles)."""
    try:
        # Check if graph exists
        graph = graph_service.get_graph(graph_id)
        if not graph:
            return jsonify({
                'status': 'error',
                'message': 'Graph not found'
            }), 404
            
        # Build the NetworkX graph
        G, error = graph_service.build_networkx_graph(graph_id)
        
        if error:
            return jsonify({
                'status': 'error',
                'message': error
            }), 500
            
        # Import NetworkX
        import networkx as nx
        
        # Check for cycles
        is_dag = nx.is_directed_acyclic_graph(G)
        
        if not is_dag:
            # Find cycles
            cycles = list(nx.simple_cycles(G))
            cycle_nodes = []
            
            for cycle in cycles:
                cycle_node_details = []
                for node_id in cycle:
                    node = graph_service.get_node(node_id)
                    if node:
                        cycle_node_details.append({
                            'id': node.id,
                            'name': node.name
                        })
                cycle_nodes.append(cycle_node_details)
            
            return jsonify({
                'status': 'error',
                'message': 'Graph contains cycles and cannot be executed sequentially',
                'data': {
                    'is_valid': False,
                    'cycles': cycle_nodes
                }
            }), 400
        
        return jsonify({
            'status': 'success',
            'data': {
                'is_valid': True,
                'message': 'Graph is valid for execution'
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error validating graph: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to validate graph: {str(e)}'
        }), 500
