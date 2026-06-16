"""
Routes for handling chat interactions with AI models.
"""

import time

from flask import request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

from . import api_bp
from ..models import db, Node, Conversation, Message
from ..services import ollama_service, groq_service, nvidia_service
from ..services.reasoning import fold_reasoning_into_content


def _extract_openai(resp):
    """Pull (content, reasoning) from an OpenAI-compatible response; raise on error."""
    if not isinstance(resp, dict):
        raise RuntimeError("Invalid response")
    if resp.get('error'):
        err = resp['error']
        raise RuntimeError(err.get('message', str(err)) if isinstance(err, dict) else str(err))
    choices = resp.get('choices') or []
    if not choices:
        raise RuntimeError("No choices in response")
    message = choices[0].get('message') or {}
    return message.get('content', ''), (message.get('reasoning_content') or message.get('reasoning'))

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

@api_bp.route('/nvidia/chat', methods=['POST'])
def nvidia_chat():
    """Direct chat with NVIDIA NIM API."""
    data = request.json
    result = nvidia_service.chat(data)
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
    
    # Verify the node exists before persisting anything for it. Prevents orphan
    # conversation/message rows (and, with SQLite FK enforcement on, a raw 500).
    if not Node.query.get(node_id):
        current_app.logger.warning(f"node_chat received unknown node_id: {node_id}")
        return jsonify({"error": f"Node {node_id} not found"}), 404

    # Store the user message in the database. Initialise first so that a DB
    # failure below does not leave `conversation` unbound when we later dispatch
    # to a backend (which would turn a recoverable DB error into a raw 500).
    conversation = None
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
        result = ollama_service.handle_chat(model, messages, temperature, max_tokens, stream, node_id, conversation.id if conversation else None)
        if isinstance(result, dict) and result.get('error'):
            current_app.logger.error(f"Ollama error: {result.get('error')}")
            return jsonify(result), 500
        return result if stream else jsonify(result)
    elif backend == "groq":
        result = groq_service.handle_chat(model, messages, temperature, max_tokens, node_id, conversation.id if conversation else None)
        if isinstance(result, dict) and result.get('error'):
            current_app.logger.error(f"Groq error: {result.get('error')}")
            return jsonify(result), 500
        return jsonify(result)
    elif backend == "nvidia":
        result = nvidia_service.handle_chat(model, messages, temperature, max_tokens, node_id, conversation.id if conversation else None)
        if isinstance(result, dict) and result.get('error'):
            current_app.logger.error(f"NVIDIA error: {result.get('error')}")
            return jsonify(result), 500
        return jsonify(result)
    else:
        current_app.logger.error(f"Unsupported backend: {backend}")
        return jsonify({"error": f"Unsupported backend: {backend}"}), 400


@api_bp.route('/chat/compare', methods=['POST'])
def chat_compare():
    """Stateless reasoning-diff: fan ONE prompt across several models and return
    each result with its reasoning trace folded uniformly (<think>...</think>).

    Body: { prompt, system_message?, models:[{backend, model}], temperature?, max_tokens? }
    Powers the side-by-side reasoning-diff view. No DB writes, no node required.
    """
    data = request.json or {}
    prompt = data.get('prompt', '')
    system = data.get('system_message') or 'You are a helpful assistant.'
    models = data.get('models', [])
    temperature = data.get('temperature', 0.6)
    max_tokens = data.get('max_tokens', 1024)

    if not prompt or not models:
        return jsonify({"error": "prompt and models are required"}), 400

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt},
    ]

    results = []
    for spec in models:
        backend = (spec.get('backend') or '').lower()
        model = spec.get('model')
        t0 = time.time()
        try:
            if backend in ('groq', 'nvidia'):
                svc = groq_service if backend == 'groq' else nvidia_service
                resp = svc.chat({
                    "model": model, "messages": messages,
                    "temperature": temperature, "max_tokens": max_tokens,
                })
                content, reasoning = _extract_openai(resp)
                folded = fold_reasoning_into_content(content, reasoning)
            elif backend == 'ollama':
                resp = ollama_service.chat({
                    "model": model, "messages": messages, "stream": False,
                    "options": {"temperature": temperature, "num_predict": max_tokens},
                })
                if isinstance(resp, dict) and resp.get('error'):
                    raise RuntimeError(resp['error'])
                # Distilled local models inline <think> themselves; leave as-is.
                folded = (resp.get('message') or {}).get('content', '')
            else:
                raise RuntimeError(f"Unsupported backend: {backend}")

            results.append({
                "backend": backend, "model": model, "content": folded,
                "latency_ms": int((time.time() - t0) * 1000), "error": None,
            })
        except Exception as e:
            current_app.logger.error(f"compare error for {backend}/{model}: {str(e)}")
            results.append({
                "backend": backend, "model": model, "content": None,
                "latency_ms": int((time.time() - t0) * 1000), "error": str(e),
            })

    return jsonify({"results": results})
