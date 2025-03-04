"""
Service for handling graph operations.
"""

import networkx as nx
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

from ..models import db, Graph, Node, Edge, Conversation, Message
from . import ollama_service, groq_service

def create_graph(name, description=None, layout_data=None):
    """Create a new graph."""
    try:
        graph = Graph(
            name=name,
            description=description,
            layout_data=layout_data
        )
        db.session.add(graph)
        db.session.commit()
        return graph
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error creating graph: {str(e)}")
        raise

def get_graph(graph_id):
    """Get a graph by ID."""
    return Graph.query.get(graph_id)

def get_all_graphs():
    """Get all graphs."""
    return Graph.query.all()

def update_graph(graph_id, name=None, description=None, layout_data=None):
    """Update a graph."""
    try:
        graph = Graph.query.get(graph_id)
        if not graph:
            return None
            
        if name is not None:
            graph.name = name
        if description is not None:
            graph.description = description
        if layout_data is not None:
            graph.layout_data = layout_data
            
        db.session.commit()
        return graph
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error updating graph: {str(e)}")
        raise

def delete_graph(graph_id):
    """Delete a graph."""
    try:
        graph = Graph.query.get(graph_id)
        if not graph:
            return False
            
        db.session.delete(graph)
        db.session.commit()
        return True
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error deleting graph: {str(e)}")
        raise

def create_node(graph_id, node_id, name, backend, model, system_message=None, 
                temperature=0.7, max_tokens=1024, position_x=None, position_y=None):
    """Create a new node in a graph."""
    try:
        node = Node(
            id=node_id,
            graph_id=graph_id,
            name=name,
            backend=backend,
            model=model,
            system_message=system_message,
            temperature=temperature,
            max_tokens=max_tokens,
            position_x=position_x,
            position_y=position_y
        )
        
        db.session.add(node)
        db.session.commit()
        return node
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error creating node: {str(e)}")
        raise

def get_node(node_id):
    """Get a node by ID."""
    return Node.query.get(node_id)

def update_node(node_id, name=None, backend=None, model=None, system_message=None,
                temperature=None, max_tokens=None, position_x=None, position_y=None):
    """Update a node."""
    try:
        node = Node.query.get(node_id)
        if not node:
            return None
            
        if name is not None:
            node.name = name
        if backend is not None:
            node.backend = backend
        if model is not None:
            node.model = model
        if system_message is not None:
            node.system_message = system_message
        if temperature is not None:
            node.temperature = temperature
        if max_tokens is not None:
            node.max_tokens = max_tokens
        if position_x is not None:
            node.position_x = position_x
        if position_y is not None:
            node.position_y = position_y
            
        db.session.commit()
        return node
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error updating node: {str(e)}")
        raise

def delete_node(node_id):
    """Delete a node."""
    try:
        node = Node.query.get(node_id)
        if not node:
            return False
            
        db.session.delete(node)
        db.session.commit()
        return True
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error deleting node: {str(e)}")
        raise

def create_edge(source_id, target_id, edge_type='provides_context'):
    """Create a new edge between nodes."""
    try:
        # Check if nodes exist
        source_node = Node.query.get(source_id)
        target_node = Node.query.get(target_id)
        
        if not source_node or not target_node:
            return None
            
        # Check if edge already exists
        edge_id = f"{source_id}-{target_id}"
        existing_edge = Edge.query.get(edge_id)
        
        if existing_edge:
            return existing_edge
            
        edge = Edge(
            id=edge_id,
            source_node_id=source_id,
            target_node_id=target_id,
            edge_type=edge_type
        )
        
        db.session.add(edge)
        db.session.commit()
        return edge
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error creating edge: {str(e)}")
        raise

def delete_edge(edge_id):
    """Delete an edge."""
    try:
        edge = Edge.query.get(edge_id)
        if not edge:
            return False
            
        db.session.delete(edge)
        db.session.commit()
        return True
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error deleting edge: {str(e)}")
        raise

def execute_workflow(graph_id):
    """Execute a workflow by processing nodes in topological order."""
    try:
        # Get the graph
        graph = Graph.query.get(graph_id)
        if not graph:
            return None, "Graph not found"
        
        # Build a NetworkX graph for topological sorting
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
        
        # Check for cycles
        if not nx.is_directed_acyclic_graph(G):
            return None, "Graph contains cycles and cannot be executed sequentially"
        
        # Get topological sort
        try:
            execution_order = list(nx.topological_sort(G))
        except nx.NetworkXUnfeasible:
            return None, "Graph is not a directed acyclic graph"
        
        # Execute nodes in order
        results = {}
        
        for node_id in execution_order:
            # Get the node
            node = Node.query.get(node_id)
            
            # Get parent nodes
            parent_nodes = []
            for edge in node.incoming_edges:
                parent_node = Node.query.get(edge.source_node_id)
                parent_nodes.append(parent_node)
            
            # Get parent contexts
            parent_contexts = []
            for parent in parent_nodes:
                # Get the last message from the parent's conversation
                conversation = Conversation.query.filter_by(node_id=parent.id).first()
                last_response = ""
                
                if conversation:
                    last_message = Message.query.filter_by(
                        conversation_id=conversation.id,
                        role="assistant"
                    ).order_by(Message.timestamp.desc()).first()
                    
                    if last_message:
                        last_response = last_message.content
                
                parent_contexts.append({
                    'node_id': parent.id,
                    'last_response': last_response
                })
            
            # Get the conversation history for this node
            conversation = Conversation.query.filter_by(node_id=node.id).first()
            conversation_history = []
            
            if conversation:
                messages = Message.query.filter_by(conversation_id=conversation.id).order_by(Message.timestamp).all()
                conversation_history = [{'role': msg.role, 'content': msg.content} for msg in messages]
            
            # If there's no user input in the conversation, use a default prompt
            if not any(msg['role'] == 'user' for msg in conversation_history):
                # Add a default user message
                default_message = "Process the context from parent nodes and provide insights."
                conversation_history.append({'role': 'user', 'content': default_message})
                
                # Store the default message
                if conversation:
                    message = Message(
                        conversation_id=conversation.id,
                        role="user",
                        content=default_message
                    )
                    db.session.add(message)
                    db.session.commit()
            
            # Process the node based on its backend
            if node.backend == "ollama":
                results[node_id] = ollama_service.process_node(node, parent_contexts, conversation_history, conversation)
            elif node.backend == "groq":
                results[node_id] = groq_service.process_node(node, parent_contexts, conversation_history, conversation)
            else:
                results[node_id] = f"Error: Unsupported backend: {node.backend}"
        
        # Return the results
        return {
            'execution_order': execution_order,
            'results': results
        }, None
    
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return None, f"Database error during execution: {str(e)}"
    except Exception as e:
        current_app.logger.error(f"Error executing workflow: {str(e)}")
        return None, f"Error executing workflow: {str(e)}"
