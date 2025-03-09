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

    def update_graph_batch(graph_id, operations):
        """
        Apply a batch of operations to a graph.
        
        Args:
            graph_id: ID of the graph to update
            operations: Dictionary containing operations to perform:
                    - nodesToCreate: List of nodes to create
                    - nodesToUpdate: List of nodes to update
                    - nodesToDelete: List of node IDs to delete
                    - edgesToCreate: List of edges to create
                    - edgesToDelete: List of edge IDs to delete
                    
        Returns:
            Dictionary with operation results
        """
        try:
            # Check if graph exists
            graph = get_graph(graph_id)
            if not graph:
                raise ResourceNotFoundError(f"Graph with ID {graph_id} not found")
            
            results = {
                "nodes": {"created": 0, "updated": 0, "deleted": 0, "errors": []},
                "edges": {"created": 0, "deleted": 0, "errors": []}
            }
            
            # Process nodes to delete first to avoid constraint errors
            if "nodesToDelete" in operations and operations["nodesToDelete"]:
                for node_id in operations["nodesToDelete"]:
                    try:
                        success = delete_node(node_id)
                        if success:
                            results["nodes"]["deleted"] += 1
                        else:
                            results["nodes"]["errors"].append({
                                "id": node_id,
                                "operation": "delete",
                                "error": "Node not found"
                            })
                    except Exception as e:
                        results["nodes"]["errors"].append({
                            "id": node_id,
                            "operation": "delete",
                            "error": str(e)
                        })
            
            # Process edges to delete
            if "edgesToDelete" in operations and operations["edgesToDelete"]:
                for edge_id in operations["edgesToDelete"]:
                    try:
                        success = delete_edge(edge_id)
                        if success:
                            results["edges"]["deleted"] += 1
                        else:
                            results["edges"]["errors"].append({
                                "id": edge_id,
                                "operation": "delete",
                                "error": "Edge not found"
                            })
                    except Exception as e:
                        results["edges"]["errors"].append({
                            "id": edge_id,
                            "operation": "delete",
                            "error": str(e)
                        })
            
            # Process nodes to create
            if "nodesToCreate" in operations and operations["nodesToCreate"]:
                for node_data in operations["nodesToCreate"]:
                    try:
                        # Extract required fields
                        node_id = node_data.get('id')
                        name = node_data.get('name', 'Unnamed Node')
                        backend = node_data.get('backend', 'ollama')
                        model = node_data.get('model', 'llama2')
                        
                        # Optional fields
                        system_message = node_data.get('systemMessage')
                        temperature = node_data.get('temperature', 0.7)
                        max_tokens = node_data.get('maxTokens', 1024)
                        
                        # Position data
                        position = node_data.get('position', {})
                        position_x = position.get('x') if isinstance(position, dict) else None
                        position_y = position.get('y') if isinstance(position, dict) else None
                        
                        node = create_node(
                            graph_id=graph_id,
                            node_id=node_id,
                            name=name,
                            backend=backend,
                            model=model,
                            system_message=system_message,
                            temperature=temperature,
                            max_tokens=max_tokens,
                            position_x=position_x,
                            position_y=position_y
                        )
                        if node:
                            results["nodes"]["created"] += 1
                    except Exception as e:
                        results["nodes"]["errors"].append({
                            "data": node_data,
                            "operation": "create",
                            "error": str(e)
                        })
            
            # Process nodes to update
            if "nodesToUpdate" in operations and operations["nodesToUpdate"]:
                for node_data in operations["nodesToUpdate"]:
                    try:
                        node_id = node_data.get('id')
                        if not node_id:
                            raise ValueError("Node ID is required for update")
                        
                        # Optional fields
                        name = node_data.get('name')
                        backend = node_data.get('backend')
                        model = node_data.get('model')
                        system_message = node_data.get('systemMessage')
                        temperature = node_data.get('temperature')
                        max_tokens = node_data.get('maxTokens')
                        
                        # Position data
                        position = node_data.get('position', {})
                        position_x = position.get('x') if isinstance(position, dict) else None
                        position_y = position.get('y') if isinstance(position, dict) else None
                        
                        node = update_node(
                            node_id=node_id,
                            name=name,
                            backend=backend,
                            model=model,
                            system_message=system_message,
                            temperature=temperature,
                            max_tokens=max_tokens,
                            position_x=position_x,
                            position_y=position_y
                        )
                        if node:
                            results["nodes"]["updated"] += 1
                    except Exception as e:
                        results["nodes"]["errors"].append({
                            "id": node_id if 'node_id' in locals() else None,
                            "operation": "update",
                            "error": str(e)
                        })
            
            # Process edges to create
            if "edgesToCreate" in operations and operations["edgesToCreate"]:
                for edge_data in operations["edgesToCreate"]:
                    try:
                        source_id = edge_data.get('source')
                        target_id = edge_data.get('target')
                        edge_type = edge_data.get('type', 'provides_context')
                        
                        edge = create_edge(
                            source_id=source_id,
                            target_id=target_id,
                            edge_type=edge_type
                        )
                        if edge:
                            results["edges"]["created"] += 1
                    except Exception as e:
                        results["edges"]["errors"].append({
                            "data": edge_data,
                            "operation": "create",
                            "error": str(e)
                        })
            
            # Calculate success status
            all_errors = len(results["nodes"]["errors"]) + len(results["edges"]["errors"])
            all_operations = (
                results["nodes"]["created"] + 
                results["nodes"]["updated"] + 
                results["nodes"]["deleted"] + 
                results["edges"]["created"] + 
                results["edges"]["deleted"]
            )
            
            return {
                "success": all_errors == 0 and all_operations > 0,
                "partial_success": all_errors > 0 and all_operations > 0,
                "results": results
            }
        
        except ResourceNotFoundError:
            raise
        except Exception as e:
            current_app.logger.error(f"Error in update_graph_batch: {str(e)}")
            raise