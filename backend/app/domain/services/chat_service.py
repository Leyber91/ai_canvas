# app/domain/services/chat_service.py
from typing import Dict, Any, List, Optional
from flask import current_app, Response

from ...core.exceptions import ResourceNotFoundError, ValidationError
from ...infrastructure.database.repositories import NodeRepository, ConversationRepository
from ...infrastructure.ai_providers.base import AIProviderFactory

class ChatService:
    """Service for handling chat with AI nodes."""
    
    def __init__(self, node_repo: NodeRepository = None, 
                 conversation_repo: ConversationRepository = None):
        self.node_repo = node_repo or NodeRepository()
        self.conversation_repo = conversation_repo or ConversationRepository()
        self.ai_factory = AIProviderFactory()
    
    def chat_with_node(self, node_id: str, messages: List[Dict[str, str]], 
                       parent_contexts: List[Dict[str, str]], user_input: str,
                       stream: bool = False) -> Any:
        """Send a message to a node and get a response."""
        # Get the node
        node = self.node_repo.get_by_id(node_id)
        if not node:
            raise ResourceNotFoundError(f"Node with ID {node_id} not found")
        
        # Get or create a conversation
        conversations = self.conversation_repo.get_by_node(node_id)
        if conversations:
            conversation = conversations[0]
        else:
            conversation = self.conversation_repo.create(node_id)
        
        # Add the user message to the conversation
        self.conversation_repo.add_message(conversation.id, "user", user_input)
        
        # Add user input to messages
        messages.append({"role": "user", "content": user_input})
        
        # Get the AI provider
        provider = self.ai_factory.get_provider(node.backend)
        
        # Send request to provider
        return provider.chat(
            model=node.model,
            messages=messages,
            temperature=node.temperature,
            max_tokens=node.max_tokens,
            streaming=stream
        )
    
    def get_conversation_history(self, node_id: str) -> List[Dict[str, Any]]:
        """Get conversation history for a node."""
        conversations = self.conversation_repo.get_by_node(node_id)
        if not conversations:
            return []
            
        # Get the most recent conversation
        conversation = conversations[0]
        
        # Convert messages to dict
        history = []
        for message in conversation.messages:
            history.append({
                "role": message.role,
                "content": message.content
            })
            
        return history
    
    def clear_conversation(self, node_id: str) -> bool:
        """Clear conversation for a node."""
        conversations = self.conversation_repo.get_by_node(node_id)
        if not conversations:
            return True
            
        # Delete all conversations for the node
        for conversation in conversations:
            self.conversation_repo.delete(conversation.id)
            
        return True