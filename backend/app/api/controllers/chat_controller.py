# app/api/controllers/chat_controller.py
from flask import Blueprint, jsonify, request
from ...core.exceptions import AppException, ResourceNotFoundError, ValidationError
from ...domain.services.chat_service import ChatService
from ...domain.services.node_service import NodeService

chat_bp = Blueprint('chat', __name__, url_prefix='/api')
chat_service = ChatService()
node_service = NodeService()

@chat_bp.route('/node/chat', methods=['POST'])
def node_chat():
    """Chat with a specific node, with context from parent nodes."""
    try:
        data = request.json
        node_id = data.get('node_id')
        backend = data.get('backend')
        model = data.get('model')
        system_message = data.get('system_message', '')
        parent_contexts = data.get('parent_contexts', [])
        conversation_history = data.get('conversation_history', [])
        user_input = data.get('user_input', '')
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1024)
        
        # Check if streaming is requested
        stream = data.get('stream', False)
        
        # Construct the prompt with parent contexts
        context_text = ""
        for parent in parent_contexts:
            context_text += f"Context from parent node {parent['node_id']}: {parent['last_response']}\n\n"
        
        # Create the message list
        messages = [{"role": "system", "content": system_message + "\n\n" + context_text}]
        
        # Add conversation history
        messages.extend(conversation_history)
        
        # Send the message
        response = chat_service.chat_with_node(
            node_id=node_id,
            messages=messages,
            parent_contexts=parent_contexts,
            user_input=user_input,
            stream=stream
        )
        
        # If it's a streaming response, return it directly
        if stream and isinstance(response, Response):
            return response
        
        return jsonify(response)
    
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except ValidationError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error processing chat: {str(e)}'
        }), 500

@chat_bp.route('/nodes/<node_id>/conversations', methods=['GET'])
def get_conversations(node_id):
    """Get all conversations for a node."""
    try:
        # Check if node exists
        node = node_service.get_node(node_id)
        
        history = chat_service.get_conversation_history(node_id)
        
        return jsonify({
            'status': 'success',
            'data': history
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve conversations: {str(e)}'
        }), 500

@chat_bp.route('/nodes/<node_id>/conversations', methods=['DELETE'])
def clear_conversation(node_id):
    """Clear all conversations for a node."""
    try:
        # Check if node exists
        node = node_service.get_node(node_id)
        
        chat_service.clear_conversation(node_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Conversations cleared successfully'
        })
    except ResourceNotFoundError as e:
        return jsonify(e.to_dict()), e.status_code
    except AppException as e:
        return jsonify(e.to_dict()), e.status_code
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to clear conversations: {str(e)}'
        }), 500