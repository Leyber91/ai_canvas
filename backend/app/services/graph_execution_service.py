"""
Service for executing graph workflows.
"""

from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

from ..models import db, Graph, Node, Conversation, Message
from . import ollama_service, groq_service
from .graph_analysis_service import get_topological_sort, get_parent_nodes

def execute_workflow(graph_id):
    """
    Execute a workflow by processing nodes in topological order.
    
    Args:
        graph_id: ID of the graph to execute
        
    Returns:
        tuple: (execution results dict, error message or None)
    """
    try:
        # Get the graph
        graph = Graph.query.get(graph_id)
        if not graph:
            return None, "Graph not found"
        
        # Get execution order using topological sort
        execution_order, error = get_topological_sort(graph_id)
        if error:
            return None, error
        
        # Execute nodes in order
        results = {}
        
        for node_id in execution_order:
            result = execute_node(node_id)
            results[node_id] = result
        
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

def execute_node(node_id):
    """
    Execute a single node, considering parent contexts.
    
    Args:
        node_id: ID of the node to execute
        
    Returns:
        str: Execution result or error message
    """
    try:
        # Get the node
        node = Node.query.get(node_id)
        if not node:
            return "Node not found"
        
        # Get parent nodes
        parent_nodes = get_parent_nodes(node_id)
        
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
            return ollama_service.process_node(node, parent_contexts, conversation_history, conversation)
        elif node.backend == "groq":
            return groq_service.process_node(node, parent_contexts, conversation_history, conversation)
        else:
            return f"Error: Unsupported backend: {node.backend}"
            
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error executing node: {str(e)}")
        return f"Database error: {str(e)}"
    except Exception as e:
        current_app.logger.error(f"Error executing node: {str(e)}")
        return f"Error: {str(e)}"

def get_node_execution_context(node_id):
    """
    Get the execution context for a node (parent contexts + conversation history).
    
    Args:
        node_id: ID of the node
        
    Returns:
        dict: Execution context with parent_contexts and conversation_history
    """
    try:
        # Get the node
        node = Node.query.get(node_id)
        if not node:
            return {"error": "Node not found"}
        
        # Get parent nodes
        parent_nodes = get_parent_nodes(node_id)
        
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
                'node_name': parent.name,
                'last_response': last_response
            })
        
        # Get the conversation history for this node
        conversation = Conversation.query.filter_by(node_id=node.id).first()
        conversation_history = []
        
        if conversation:
            messages = Message.query.filter_by(conversation_id=conversation.id).order_by(Message.timestamp).all()
            conversation_history = [{'role': msg.role, 'content': msg.content} for msg in messages]
        
        return {
            'parent_contexts': parent_contexts,
            'conversation_history': conversation_history
        }
            
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error getting execution context: {str(e)}")
        return {"error": f"Database error: {str(e)}"}
    except Exception as e:
        current_app.logger.error(f"Error getting execution context: {str(e)}")
        return {"error": f"Error: {str(e)}"}
