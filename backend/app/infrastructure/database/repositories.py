# app/infrastructure/database/repositories.py
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.exc import SQLAlchemyError
from flask import current_app

from .models import db, Graph, Node, Edge, Conversation, Message

class BaseRepository:
    """Base repository with common operations."""
    
    def __init__(self):
        self.db = db
    
    def commit(self) -> bool:
        """Commit current transaction."""
        try:
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error: {str(e)}")
            db.session.rollback()
            raise

class GraphRepository(BaseRepository):
    """Repository for Graph operations."""
    
    def get_all(self) -> List[Graph]:
        """Get all graphs."""
        return Graph.query.all()
    
    def get_by_id(self, graph_id: int) -> Optional[Graph]:
        """Get a graph by ID."""
        return Graph.query.get(graph_id)
    
    def create(self, data: Dict[str, Any]) -> Graph:
        """Create a new graph."""
        try:
            graph = Graph(
                name=data.get('name', 'Untitled Graph'),
                description=data.get('description', ''),
                layout_data=data.get('layout_data')
            )
            db.session.add(graph)
            self.commit()
            return graph
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error creating graph: {str(e)}")
            raise
    
    def update(self, graph_id: int, data: Dict[str, Any]) -> Optional[Graph]:
        """Update a graph."""
        try:
            graph = self.get_by_id(graph_id)
            if not graph:
                return None
                
            if 'name' in data:
                graph.name = data['name']
            if 'description' in data:
                graph.description = data['description']
            if 'layout_data' in data:
                graph.layout_data = data['layout_data']
                
            self.commit()
            return graph
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error updating graph: {str(e)}")
            raise
    
    def delete(self, graph_id: int) -> bool:
        """Delete a graph."""
        try:
            graph = self.get_by_id(graph_id)
            if not graph:
                return False
                
            db.session.delete(graph)
            self.commit()
            return True
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error deleting graph: {str(e)}")
            raise
    
    def get_full_graph(self, graph_id: int) -> Optional[Dict[str, Any]]:
        """Get a graph with all its nodes and edges."""
        graph = self.get_by_id(graph_id)
        if not graph:
            return None
            
        # Get all edges related to the graph's nodes
        node_ids = [node.id for node in graph.nodes]
        edges = Edge.query.filter(Edge.source_node_id.in_(node_ids)).all()
        
        return {
            **graph.to_dict(),
            'nodes': [node.to_dict() for node in graph.nodes],
            'edges': [edge.to_dict() for edge in edges]
        }

class NodeRepository(BaseRepository):
    """Repository for Node operations."""
    
    def get_by_id(self, node_id: str) -> Optional[Node]:
        """Get a node by ID."""
        return Node.query.get(node_id)
    
    def get_by_graph(self, graph_id: int) -> List[Node]:
        """Get all nodes for a graph."""
        return Node.query.filter_by(graph_id=graph_id).all()
    
    def create(self, data: Dict[str, Any]) -> Node:
        """Create a new node."""
        try:
            node = Node(
                id=data['id'],
                graph_id=data['graph_id'],
                name=data['name'],
                backend=data['backend'],
                model=data['model'],
                system_message=data.get('system_message'),
                temperature=data.get('temperature', 0.7),
                max_tokens=data.get('max_tokens', 1024),
                position_x=data.get('position_x'),
                position_y=data.get('position_y')
            )
            db.session.add(node)
            self.commit()
            return node
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error creating node: {str(e)}")
            raise
    
    def update(self, node_id: str, data: Dict[str, Any]) -> Optional[Node]:
        """Update a node."""
        try:
            node = self.get_by_id(node_id)
            if not node:
                return None
                
            update_fields = [
                'name', 'backend', 'model', 'system_message',
                'temperature', 'max_tokens', 'position_x', 'position_y'
            ]
            
            for field in update_fields:
                if field in data:
                    setattr(node, field, data[field])
                    
            self.commit()
            return node
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error updating node: {str(e)}")
            raise
    
    def delete(self, node_id: str) -> bool:
        """Delete a node."""
        try:
            node = self.get_by_id(node_id)
            if not node:
                return False
                
            db.session.delete(node)
            self.commit()
            return True
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error deleting node: {str(e)}")
            raise
    
    def get_parent_nodes(self, node_id: str) -> List[Node]:
        """Get parent nodes for a node."""
        edges = Edge.query.filter_by(target_node_id=node_id).all()
        parent_ids = [edge.source_node_id for edge in edges]
        return Node.query.filter(Node.id.in_(parent_ids)).all()

class EdgeRepository(BaseRepository):
    """Repository for Edge operations."""
    
    def get_by_id(self, edge_id: str) -> Optional[Edge]:
        """Get an edge by ID."""
        return Edge.query.get(edge_id)
    
    def create(self, source_id: str, target_id: str, edge_type: str = 'provides_context') -> Optional[Edge]:
        """Create a new edge between nodes."""
        try:
            # Check if nodes exist
            source_node = Node.query.get(source_id)
            target_node = Node.query.get(target_id)
            
            if not source_node or not target_node:
                return None
                
            # Check if edge already exists
            edge_id = f"{source_id}-{target_id}"
            existing_edge = self.get_by_id(edge_id)
            
            if existing_edge:
                return existing_edge
                
            edge = Edge(
                id=edge_id,
                source_node_id=source_id,
                target_node_id=target_id,
                edge_type=edge_type
            )
            
            db.session.add(edge)
            self.commit()
            return edge
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error creating edge: {str(e)}")
            raise
    
    def delete(self, edge_id: str) -> bool:
        """Delete an edge."""
        try:
            edge = self.get_by_id(edge_id)
            if not edge:
                return False
                
            db.session.delete(edge)
            self.commit()
            return True
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error deleting edge: {str(e)}")
            raise
    
    def get_edges_for_graph(self, graph_id: int) -> List[Edge]:
        """Get all edges for a graph."""
        # Get all node IDs for the graph
        nodes = Node.query.filter_by(graph_id=graph_id).all()
        node_ids = [node.id for node in nodes]
        
        # Get all edges where the source is in these nodes
        return Edge.query.filter(Edge.source_node_id.in_(node_ids)).all()

    def get_edges_for_nodes(self, node_ids: List[str]) -> List[Edge]:
        """Get all edges where source or target is in the given node IDs."""
        return Edge.query.filter(
            (Edge.source_node_id.in_(node_ids)) | (Edge.target_node_id.in_(node_ids))
        ).all()

class ConversationRepository(BaseRepository):
    """Repository for Conversation operations."""
    
    def get_by_id(self, conversation_id: int) -> Optional[Conversation]:
        """Get a conversation by ID."""
        return Conversation.query.get(conversation_id)
    
    def get_by_node(self, node_id: str) -> List[Conversation]:
        """Get all conversations for a node."""
        return Conversation.query.filter_by(node_id=node_id).all()
    
    def create(self, node_id: str) -> Conversation:
        """Create a new conversation for a node."""
        try:
            conversation = Conversation(node_id=node_id)
            db.session.add(conversation)
            self.commit()
            return conversation
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error creating conversation: {str(e)}")
            raise
    
    def delete(self, conversation_id: int) -> bool:
        """Delete a conversation."""
        try:
            conversation = self.get_by_id(conversation_id)
            if not conversation:
                return False
                
            db.session.delete(conversation)
            self.commit()
            return True
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error deleting conversation: {str(e)}")
            raise
    
    def add_message(self, conversation_id: int, role: str, content: str) -> Message:
        """Add a message to a conversation."""
        try:
            message = Message(
                conversation_id=conversation_id,
                role=role,
                content=content
            )
            
            db.session.add(message)
            self.commit()
            return message
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error adding message: {str(e)}")
            raise
