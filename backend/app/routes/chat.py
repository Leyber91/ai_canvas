"""
Routes for handling chat interactions with AI models.
"""

from flask import request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

from . import api_bp
from ..models import db, Conversation, Message
from ..services import ollama_service, groq_service

@api_bp.route('/ollama/chat', methods=['POST'])
def ollama_chat():
    """Direct chat with Ollama API."""
    data = request.json
    result = ollama_service.chat(data)
    return jsonify(result)

@api_bp.route('/groq/chat', methods=['POST'])
def groq_chat():
    """Direct chat with Groq API."""
    data = request.json
    result = groq_service.chat(data)
    return jsonify(result)

@api_bp.route('/node/chat', methods=['POST'])
def node_chat():
    """Chat with a specific node, with context from parent nodes."""
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
    
    # Log request details for debugging
    current_app.logger.info(f"Node chat request received for node {node_id}")
    current_app.logger.info(f"Backend: {backend}, Model: {model}")
    current_app.logger.info(f"Temperature: {temperature}, Max tokens: {max_tokens}")
    current_app.logger.info(f"Stream: {stream}")
    
    # Construct the prompt with parent contexts
    context_text = ""
    for parent in parent_contexts:
        context_text += f"Context from parent node {parent['node_id']}: {parent['last_response']}\n\n"
    
    # Create the message list
    messages = [{"role": "system", "content": system_message + "\n\n" + context_text}]
    
    # Add conversation history
    messages.extend(conversation_history)
    
    # Add the new user input
    messages.append({"role": "user", "content": user_input})
    
    # Store the user message in the database
    try:
        # Find or create a conversation for this node
        conversation = Conversation.query.filter_by(node_id=node_id).first()
        if not conversation:
            conversation = Conversation(node_id=node_id)
            db.session.add(conversation)
            db.session.commit()
        
        # Add the user message
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=user_input
        )
        db.session.add(user_message)
        db.session.commit()
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error storing user message: {str(e)}")
        # Continue with the chat even if database storage fails
    
    # Route to the appropriate backend
    if backend == "ollama":
        result = ollama_service.handle_chat(model, messages, temperature, max_tokens, stream, node_id, conversation.id)
        if isinstance(result, dict) and result.get('error'):
            current_app.logger.error(f"Ollama error: {result.get('error')}")
            return jsonify(result), 500
        return result if stream else jsonify(result)
    elif backend == "groq":
        result = groq_service.handle_chat(model, messages, temperature, max_tokens, node_id, conversation.id)
        if isinstance(result, dict) and result.get('error'):
            current_app.logger.error(f"Groq error: {result.get('error')}")
            return jsonify(result), 500
        return jsonify(result)
    else:
        current_app.logger.error(f"Unsupported backend: {backend}")
        return jsonify({"error": f"Unsupported backend: {backend}"}), 400
