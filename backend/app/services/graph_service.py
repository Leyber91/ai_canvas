"""
Service for handling graph operations.
This is a facade that coordinates the specialized graph services.
"""

# Import specialized services
from .graph_crud_service import (
    create_graph, get_graph, get_all_graphs, update_graph, delete_graph,
    create_node, get_node, update_node, delete_node,
    create_edge, delete_edge
)

from .graph_analysis_service import (
    build_networkx_graph, get_topological_sort,
    get_parent_nodes, get_child_nodes, get_node_depth
)

from .graph_execution_service import (
    execute_workflow, execute_node, get_node_execution_context
)

# Re-export all functions to maintain backward compatibility
__all__ = [
    # CRUD operations
    'create_graph', 'get_graph', 'get_all_graphs', 'update_graph', 'delete_graph',
    'create_node', 'get_node', 'update_node', 'delete_node',
    'create_edge', 'delete_edge',
    
    # Analysis operations
    'build_networkx_graph', 'get_topological_sort',
    'get_parent_nodes', 'get_child_nodes', 'get_node_depth',
    
    # Execution operations
    'execute_workflow', 'execute_node', 'get_node_execution_context'
]
