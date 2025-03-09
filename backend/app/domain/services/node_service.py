# app/domain/services/node_service.py
from typing import Dict, Any, List, Optional
from flask import current_app

from ...core.exceptions import ResourceNotFoundError, ValidationError
from ...infrastructure.database.repositories import NodeRepository, GraphRepository

class NodeService:
    """Service for handling node operations."""
    
    def __init__(self, node_repo: NodeRepository = None, graph_repo: GraphRepository = None):
        self.node_repo = node_repo or NodeRepository()
        self.graph_repo = graph_repo or GraphRepository()
    
    def create_node(self, graph_id: int, node_id: str, name: str, backend: str, 
                   model: str, system_message: Optional[str] = None,
                   temperature: float = 0.7, max_tokens: int = 1024,
                   position_x: Optional[float] = None, 
                   position_y: Optional[float] = None) -> Dict[str, Any]:
        """Create a new node in a graph."""
        try:
            # Validate graph exists
            graph = self.graph_repo.get_by_id(graph_id)
            if not graph:
                raise ResourceNotFoundError(f"Graph with ID {graph_id} not found")
            
            # Validate node data
            if not node_id:
                raise ValidationError("Node ID is required")
            if not name:
                raise ValidationError("Node name is required")
            if not backend:
                raise ValidationError("Node backend is required")
            if not model:
                raise ValidationError("Node model is required")
            
            # Create node
            node_data = {
                'id': node_id,
                'graph_id': graph_id,
                'name': name,
                'backend': backend,
                'model': model,
                'system_message': system_message,
                'temperature': temperature,
                'max_tokens': max_tokens,
                'position_x': position_x,
                'position_y': position_y
            }
            
            node = self.node_repo.create(node_data)
            return node.to_dict()
        except (ResourceNotFoundError, ValidationError):
            raise
        except Exception as e:
            current_app.logger.error(f"Error creating node: {str(e)}")
            raise
    
    def update_node(self, node_id: str, name: Optional[str] = None,
                   backend: Optional[str] = None, model: Optional[str] = None,
                   system_message: Optional[str] = None, 
                   temperature: Optional[float] = None,
                   max_tokens: Optional[int] = None,
                   position_x: Optional[float] = None,
                   position_y: Optional[float] = None) -> Dict[str, Any]:
        """Update a node."""
        try:
            # Prepare update data
            update_data = {}
            if name is not None:
                update_data['name'] = name
            if backend is not None:
                update_data['backend'] = backend
            if model is not None:
                update_data['model'] = model
            if system_message is not None:
                update_data['system_message'] = system_message
            if temperature is not None:
                update_data['temperature'] = temperature
            if max_tokens is not None:
                update_data['max_tokens'] = max_tokens
            if position_x is not None:
                update_data['position_x'] = position_x
            if position_y is not None:
                update_data['position_y'] = position_y
            
            # Update the node
            node = self.node_repo.update(node_id, update_data)
            if not node:
                raise ResourceNotFoundError(f"Node with ID {node_id} not found")
                
            return node.to_dict()
        except ResourceNotFoundError:
            raise
        except Exception as e:
            current_app.logger.error(f"Error updating node {node_id}: {str(e)}")
            raise
    
    def delete_node(self, node_id: str) -> bool:
        """Delete a node."""
        try:
            success = self.node_repo.delete(node_id)
            if not success:
                raise ResourceNotFoundError(f"Node with ID {node_id} not found")
                
            return True
        except ResourceNotFoundError:
            raise
        except Exception as e:
            current_app.logger.error(f"Error deleting node {node_id}: {str(e)}")
            raise
    
    def get_node(self, node_id: str) -> Dict[str, Any]:
        """Get a node by ID."""
        try:
            node = self.node_repo.get_by_id(node_id)
            if not node:
                raise ResourceNotFoundError(f"Node with ID {node_id} not found")
                
            return node.to_dict()
        except ResourceNotFoundError:
            raise
        except Exception as e:
            current_app.logger.error(f"Error getting node {node_id}: {str(e)}")
            raise
    
    def get_parent_nodes(self, node_id: str) -> List[Dict[str, Any]]:
        """Get parent nodes for a node."""
        try:
            parents = self.node_repo.get_parent_nodes(node_id)
            return [parent.to_dict() for parent in parents]
        except Exception as e:
            current_app.logger.error(f"Error getting parent nodes for {node_id}: {str(e)}")
            raise