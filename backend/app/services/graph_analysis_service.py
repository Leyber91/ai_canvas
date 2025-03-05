"""
Service for analyzing graph structures and determining execution order.
"""

import networkx as nx
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

from ..models import Graph, Node, Edge

def build_networkx_graph(graph_id):
    """
    Build a NetworkX graph from the database graph for analysis.
    
    Args:
        graph_id: ID of the graph to analyze
        
    Returns:
        tuple: (NetworkX graph, error message or None)
    """
    try:
        # Get the graph
        graph = Graph.query.get(graph_id)
        if not graph:
            return None, "Graph not found"
        
        # Build a NetworkX graph
        G = nx.DiGraph()
        
        # Add nodes
        for node in graph.nodes:
            G.add_node(node.id)
        
        # Add edges
        edges = Edge.query.filter(
            Edge.source_node_id.in_([node.id for node in graph.nodes])
        ).all()
        
        for edge in edges:
            G.add_edge(edge.source_node_id, edge.target_node_id)
            
        return G, None
        
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error building graph: {str(e)}")
        return None, f"Database error: {str(e)}"
    except Exception as e:
        current_app.logger.error(f"Error building graph: {str(e)}")
        return None, f"Error building graph: {str(e)}"

def get_topological_sort(graph_id):
    """
    Get nodes in topological sort order (execution order).
    
    Args:
        graph_id: ID of the graph to analyze
        
    Returns:
        tuple: (list of node IDs in execution order, error message or None)
    """
    G, error = build_networkx_graph(graph_id)
    
    if error:
        return None, error
        
    # Check for cycles
    if not nx.is_directed_acyclic_graph(G):
        return None, "Graph contains cycles and cannot be executed sequentially"
    
    # Get topological sort
    try:
        execution_order = list(nx.topological_sort(G))
        return execution_order, None
    except nx.NetworkXUnfeasible:
        return None, "Graph is not a directed acyclic graph"
    except Exception as e:
        current_app.logger.error(f"Error computing topological sort: {str(e)}")
        return None, f"Error computing execution order: {str(e)}"

def get_parent_nodes(node_id):
    """
    Get all parent nodes of a given node.
    
    Args:
        node_id: ID of the node
        
    Returns:
        list: List of parent Node objects
    """
    try:
        # Get the node
        node = Node.query.get(node_id)
        if not node:
            return []
            
        # Get parent nodes
        parent_nodes = []
        for edge in node.incoming_edges:
            parent_node = Node.query.get(edge.source_node_id)
            if parent_node:
                parent_nodes.append(parent_node)
                
        return parent_nodes
        
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error getting parent nodes: {str(e)}")
        return []

def get_child_nodes(node_id):
    """
    Get all child nodes of a given node.
    
    Args:
        node_id: ID of the node
        
    Returns:
        list: List of child Node objects
    """
    try:
        # Get the node
        node = Node.query.get(node_id)
        if not node:
            return []
            
        # Get child nodes
        child_nodes = []
        for edge in node.outgoing_edges:
            child_node = Node.query.get(edge.target_node_id)
            if child_node:
                child_nodes.append(child_node)
                
        return child_nodes
        
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error getting child nodes: {str(e)}")
        return []

def get_node_depth(node_id):
    """
    Get the depth of a node in its graph (longest path from any root).
    
    Args:
        node_id: ID of the node
        
    Returns:
        int: Depth of the node, or -1 if error
    """
    try:
        # Get the node
        node = Node.query.get(node_id)
        if not node:
            return -1
            
        # Get the graph
        graph = Graph.query.get(node.graph_id)
        if not graph:
            return -1
            
        # Build NetworkX graph
        G, error = build_networkx_graph(graph.id)
        if error:
            return -1
            
        # Find all paths to this node
        max_depth = 0
        
        # Find nodes with no incoming edges (roots)
        roots = [n for n in G.nodes() if G.in_degree(n) == 0]
        
        for root in roots:
            if nx.has_path(G, root, node_id):
                path_length = len(nx.shortest_path(G, root, node_id)) - 1
                max_depth = max(max_depth, path_length)
                
        return max_depth
        
    except Exception as e:
        current_app.logger.error(f"Error calculating node depth: {str(e)}")
        return -1
