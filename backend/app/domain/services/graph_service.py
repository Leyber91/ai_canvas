# app/domain/services/graph_service.py
from typing import Dict, Any, List, Tuple, Optional
from flask import current_app

from ...core.exceptions import ResourceNotFoundError, ValidationError
from ...infrastructure.database.repositories import GraphRepository, NodeRepository, EdgeRepository

class GraphService:
    """Service for handling graph operations."""
    
    def __init__(self, graph_repo: GraphRepository = None, node_repo: NodeRepository = None,
                edge_repo: EdgeRepository = None):
        self.graph_repo = graph_repo or GraphRepository()
        self.node_repo = node_repo or NodeRepository() 
        self.edge_repo = edge_repo or EdgeRepository()
    
    def get_all_graphs(self) -> List[Dict[str, Any]]:
        """Get all graphs."""
        try:
            graphs = self.graph_repo.get_all()
            return [graph.to_dict() for graph in graphs]
        except Exception as e:
            current_app.logger.error(f"Error getting all graphs: {str(e)}")
            raise
    
    def get_graph(self, graph_id: int) -> Dict[str, Any]:
        """Get a graph by ID with all nodes and edges."""
        try:
            graph_data = self.graph_repo.get_full_graph(graph_id)
            if not graph_data:
                raise ResourceNotFoundError(f"Graph with ID {graph_id} not found")
            return graph_data
        except ResourceNotFoundError:
            raise
        except Exception as e:
            current_app.logger.error(f"Error getting graph {graph_id}: {str(e)}")
            raise
    
    def create_graph(self, name: str, description: str = None, layout_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a new graph."""
        try:
            # Validate graph data
            if not name:
                raise ValidationError("Graph name is required")
                
            # Create the graph
            graph_data = {
                'name': name,
                'description': description,
                'layout_data': layout_data
            }
            
            graph = self.graph_repo.create(graph_data)
            return graph.to_dict()
        except ValidationError:
            raise
        except Exception as e:
            current_app.logger.error(f"Error creating graph: {str(e)}")
            raise
    
    def update_graph(self, graph_id: int, name: Optional[str] = None, 
                    description: Optional[str] = None, 
                    layout_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Update a graph."""
        try:
            update_data = {}
            if name is not None:
                update_data['name'] = name
            if description is not None:
                update_data['description'] = description
            if layout_data is not None:
                update_data['layout_data'] = layout_data
                
            graph = self.graph_repo.update(graph_id, update_data)
            if not graph:
                raise ResourceNotFoundError(f"Graph with ID {graph_id} not found")
                
            return graph.to_dict()
        except ResourceNotFoundError:
            raise
        except Exception as e:
            current_app.logger.error(f"Error updating graph {graph_id}: {str(e)}")
            raise
    
    def delete_graph(self, graph_id: int) -> bool:
        """Delete a graph."""
        try:
            success = self.graph_repo.delete(graph_id)
            if not success:
                raise ResourceNotFoundError(f"Graph with ID {graph_id} not found")
                
            return True
        except ResourceNotFoundError:
            raise
        except Exception as e:
            current_app.logger.error(f"Error deleting graph {graph_id}: {str(e)}")
            raise