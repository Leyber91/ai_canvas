# app/domain/services/workflow_service.py
from typing import List, Dict, Any, Optional, Tuple
from flask import current_app
import networkx as nx

from ...core.exceptions import ResourceNotFoundError, WorkflowError
from ...infrastructure.database.repositories import (
    GraphRepository, NodeRepository, EdgeRepository, 
    ConversationRepository
)
from ...infrastructure.ai_providers.base import AIProviderFactory
from .topology_service import TopologyService

class WorkflowService:
    """Service for executing workflows."""
    
    def __init__(self, graph_repo: GraphRepository = None, 
                 node_repo: NodeRepository = None,
                 edge_repo: EdgeRepository = None,
                 conversation_repo: ConversationRepository = None,
                 topology_service: TopologyService = None):
        self.graph_repo = graph_repo or GraphRepository()
        self.node_repo = node_repo or NodeRepository()
        self.edge_repo = edge_repo or EdgeRepository()
        self.conversation_repo = conversation_repo or ConversationRepository()
        self.topology_service = topology_service or TopologyService()
        self.ai_factory = AIProviderFactory()
    
    def execute_workflow(self, graph_id: int) -> Tuple[Dict[str, Any], Optional[str]]:
        """Execute a workflow by processing nodes in topological order."""
        try:
            # Get the graph
            graph = self.graph_repo.get_by_id(graph_id)
            if not graph:
                raise ResourceNotFoundError(f"Graph with ID {graph_id} not found")
            
            # Check for cycles
            cycles = self.topology_service.detect_cycles(graph_id)
            if cycles["has_cycle"]:
                raise WorkflowError(
                    "Graph contains cycles and cannot be executed sequentially",
                    details={"cycles": cycles["cycles"]}
                )
            
            # Get topological sort
            execution_order = self.topology_service.compute_topological_sort(graph_id)
            if not execution_order:
                raise WorkflowError("Failed to determine execution order")
            
            # Execute nodes in order
            results = {}
            
            for node_id in execution_order:
                # Get the node
                node = self.node_repo.get_by_id(node_id)
                if not node:
                    results[node_id] = "Error: Node not found"
                    continue
                
                # Get parent nodes
                parent_nodes = self.node_repo.get_parent_nodes(node_id)
                
                # Get parent contexts
                parent_contexts = []
                for parent in parent_nodes:
                    # Get the conversation for the parent node
                    parent_conversations = self.conversation_repo.get_by_node(parent.id)
                    last_response = ""
                    
                    if parent_conversations:
                        # Use the most recent conversation
                        conversation = parent_conversations[0]
                        
                        # Find the last assistant message
                        assistant_messages = [
                            msg for msg in conversation.messages 
                            if msg.role == "assistant"
                        ]
                        
                        if assistant_messages:
                            last_response = assistant_messages[-1].content
                    
                    parent_contexts.append({
                        'node_id': parent.id,
                        'last_response': last_response
                    })
                
                # Get or create conversation for this node
                node_conversations = self.conversation_repo.get_by_node(node_id)
                if node_conversations:
                    conversation = node_conversations[0]
                else:
                    conversation = self.conversation_repo.create(node_id)
                
                # Get conversation history
                conversation_history = []
                for message in conversation.messages:
                    conversation_history.append({
                        'role': message.role,
                        'content': message.content
                    })
                
                # If there's no user input in the conversation, use a default prompt
                if not any(msg['role'] == 'user' for msg in conversation_history):
                    # Add a default user message
                    default_message = "Process the context from parent nodes and provide insights."
                    conversation_history.append({'role': 'user', 'content': default_message})
                    
                    # Store the default message
                    self.conversation_repo.add_message(
                        conversation.id,
                        "user",
                        default_message
                    )
                
                # Get the appropriate AI provider
                provider = self.ai_factory.get_provider(node.backend)
                
                # Process the node
                try:
                    node_data = {
                        "id": node.id,
                        "model": node.model,
                        "system_message": node.system_message or "",
                        "temperature": node.temperature,
                        "max_tokens": node.max_tokens
                    }
                    
                    result = provider.process_node(
                        node_data, 
                        parent_contexts, 
                        conversation_history
                    )
                    
                    # Add assistant message to conversation
                    self.conversation_repo.add_message(
                        conversation.id,
                        "assistant",
                        result
                    )
                    
                    results[node_id] = result
                except Exception as e:
                    current_app.logger.error(f"Error processing node {node_id}: {str(e)}")
                    results[node_id] = f"Error: {str(e)}"
            
            # Return the results
            return {
                'execution_order': execution_order,
                'results': results
            }, None
        
        except (ResourceNotFoundError, WorkflowError) as e:
            return None, str(e)
        except Exception as e:
            current_app.logger.error(f"Error executing workflow: {str(e)}")
            return None, f"Error executing workflow: {str(e)}"