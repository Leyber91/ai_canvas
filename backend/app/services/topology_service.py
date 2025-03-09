# app/domain/services/topology_service.py
from typing import List, Dict, Any, Optional, Set, Tuple
from ...core.exceptions import WorkflowError
from ...infrastructure.database.repositories import GraphRepository, NodeRepository, EdgeRepository

class TopologyService:
    """Service for graph topology operations."""
    
    def __init__(self, graph_repo: GraphRepository = None, 
                 node_repo: NodeRepository = None,
                 edge_repo: EdgeRepository = None):
        self.graph_repo = graph_repo or GraphRepository()
        self.node_repo = node_repo or NodeRepository()
        self.edge_repo = edge_repo or EdgeRepository()
    
    def detect_cycles(self, graph_id: int) -> Dict[str, Any]:
        """Detect cycles in a graph."""
        # Get all nodes and edges for the graph
        nodes = self.node_repo.get_by_graph(graph_id)
        node_ids = [node.id for node in nodes]
        edges = self.edge_repo.get_edges_for_graph(graph_id)
        
        # Store all detected cycles
        cycles = []
        
        # Build adjacency list
        adjacency_list = {}
        for node in nodes:
            adjacency_list[node.id] = []
        
        for edge in edges:
            if edge.source_node_id in adjacency_list:
                adjacency_list[edge.source_node_id].append(edge.target_node_id)
        
        # Function to detect cycles using DFS
        def find_cycles(node_id, visited=None, path=None, path_set=None):
            if visited is None:
                visited = set()
            if path is None:
                path = []
            if path_set is None:
                path_set = set()
                
            # Add node to current path
            visited.add(node_id)
            path.append(node_id)
            path_set.add(node_id)
            
            # Check all neighbors
            for neighbor in adjacency_list.get(node_id, []):
                if neighbor not in visited:
                    find_cycles(neighbor, visited, path[:], set(path_set))
                elif neighbor in path_set:
                    # Found a cycle
                    cycle_start = path.index(neighbor)
                    cycle = path[cycle_start:]
                    cycle.append(neighbor)  # Close the cycle
                    cycles.append(cycle)
            
            # Remove from current path
            path_set.remove(node_id)
        
        # Run DFS from each node
        all_visited = set()
        for node in nodes:
            if node.id not in all_visited:
                find_cycles(node.id, all_visited)
        
        return {
            "has_cycle": len(cycles) > 0,
            "cycles": cycles
        }
    
    def compute_topological_sort(self, graph_id: int) -> Optional[List[str]]:
        """Compute a topological sort of the graph."""
        # Check for cycles first
        cycle_detection = self.detect_cycles(graph_id)
        if cycle_detection["has_cycle"]:
            return None
        
        # Get all nodes and edges for the graph
        nodes = self.node_repo.get_by_graph(graph_id)
        edges = self.edge_repo.get_edges_for_graph(graph_id)
        
        # Build adjacency list
        adjacency_list = {}
        for node in nodes:
            adjacency_list[node.id] = []
        
        for edge in edges:
            if edge.source_node_id in adjacency_list:
                adjacency_list[edge.source_node_id].append(edge.target_node_id)
        
        # Track visited nodes
        visited = {}
        
        # Result stack
        result = []
        
        # Recursive DFS function
        def dfs(node_id):
            # Mark as visited
            visited[node_id] = True
            
            # Visit all neighbors
            for adjacent_id in adjacency_list.get(node_id, []):
                if not visited.get(adjacent_id, False):
                    dfs(adjacent_id)
            
            # Add to result stack after all neighbors are visited
            result.insert(0, node_id)
        
        # Run DFS for all nodes
        for node in nodes:
            if not visited.get(node.id, False):
                dfs(node.id)
        
        return result