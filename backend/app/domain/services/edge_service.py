# app/domain/services/edge_service.py
from typing import Dict, Any, List, Optional
from flask import current_app
from ...core.exceptions import ResourceNotFoundError, ValidationError
from ...infrastructure.database.repositories import EdgeRepository, NodeRepository
from ... import db
from ...models.edge import Edge

class EdgeService:
    """Service for handling edge operations."""
    
    def __init__(self, edge_repo: EdgeRepository = None, node_repo: NodeRepository = None):
        self.edge_repo = edge_repo or EdgeRepository()
        self.node_repo = node_repo or NodeRepository()
    
    def create_edge(self, source_id: str, target_id: str, edge_type: str = 'provides_context') -> Dict[str, Any]:
        """Create a new edge between nodes."""
        try:
            # Validate nodes exist
            source_node = self.node_repo.get_by_id(source_id)
            if not source_node:
                raise ResourceNotFoundError(f"Source node {source_id} not found")
                
            target_node = self.node_repo.get_by_id(target_id)
            if not target_node:
                raise ResourceNotFoundError(f"Target node {target_id} not found")
            
            # Create edge ID using consistent format
            edge_id = f"{source_id}-{target_id}"
            
            # Check if edge already exists
            existing_edge = self.edge_repo.get_by_id(edge_id)
            if existing_edge:
                return existing_edge.to_dict()
            
            # Create new edge
            edge_data = {
                'id': edge_id,
                'source_node_id': source_id,
                'target_node_id': target_id,
                'edge_type': edge_type
            }
            
            edge = self.edge_repo.create(edge_data)
            return edge.to_dict()
            
        except ResourceNotFoundError:
            raise
        except Exception as e:
            current_app.logger.error(f"Error creating edge: {str(e)}")
            raise
    
    def delete_edge(self, edge_id: str) -> bool:
        """Delete an edge."""
        try:
            # Check if edge exists first - do NOT raise an exception if not found
            existing_edge = self.edge_repo.get_by_id(edge_id)
            if not existing_edge:
                # Return success even if edge doesn't exist
                current_app.logger.info(f"Edge {edge_id} not found for deletion, ignoring")
                return True
                
            # Delete the edge
            success = self.edge_repo.delete(edge_id)
            return success
            
        except Exception as e:
            current_app.logger.error(f"Error deleting edge {edge_id}: {str(e)}")
            raise
    
    def get_edges_for_graph(self, graph_id: int) -> List[Dict[str, Any]]:
        """Get all edges for a graph."""
        try:
            edges = self.edge_repo.get_edges_for_graph(graph_id)
            return [edge.to_dict() for edge in edges]
        except Exception as e:
            current_app.logger.error(f"Error getting edges for graph {graph_id}: {str(e)}")
            raise
    
    def bulk_create_edges(self, edges_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create multiple edges at once."""
        results = []
        successful_edges = []
        
        for edge_data in edges_data:
            try:
                source_id = edge_data.get('source')
                target_id = edge_data.get('target')
                edge_type = edge_data.get('type', 'provides_context')
                
                edge = self.create_edge(source_id, target_id, edge_type)
                results.append(edge)
                successful_edges.append(edge)
            except Exception as e:
                current_app.logger.error(f"Error creating edge {edge_data}: {str(e)}")
                results.append(None)
        
        return [edge for edge in successful_edges if edge is not None]
    
    def clear_edges_for_graph(self, graph_id: int) -> bool:
        """Delete all edges connected to nodes in a graph at once."""
        try:
            # Get node IDs for the graph
            nodes = self.node_repo.get_by_graph(graph_id)
            node_ids = [node.id for node in nodes]
            
            # If no nodes, nothing to delete
            if not node_ids:
                return True
                
            # Get all related edges
            edges = self.edge_repo.get_edges_for_nodes(node_ids)
            
            # Delete each edge
            for edge in edges:
                db.session.delete(edge)
            
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error clearing edges for graph {graph_id}: {str(e)}")
            raise