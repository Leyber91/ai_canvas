"""
Utility functions for handling streaming responses.
"""

import json
from flask import Response, stream_with_context, current_app
from sqlalchemy.exc import SQLAlchemyError

from ..models import db, Message

def create_stream_response(generate_func):
    """Create a streaming response from a generator function."""
    return Response(stream_with_context(generate_func()), mimetype='text/event-stream')

def stream_ollama_response(response, conversation_id=None):
    """
    Stream the response from Ollama to the client.
    
    Args:
        response: The streaming response from Ollama
        conversation_id: Optional ID of the conversation to store the message
    
    Returns:
        A generator that yields SSE-formatted data
    """
    def generate():
        try:
            if response.status_code != 200:
                error_msg = f"Ollama API returned status code {response.status_code}"
                current_app.logger.error(error_msg)
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
                return
            
            # Initialize variables to accumulate the full response
            full_content = ""
            
            # Process each line in the streaming response
            for line in response.iter_lines(decode_unicode=True):
                if line:
                    try:
                        # Parse the JSON object
                        json_obj = json.loads(line)
                        
                        # Extract the content chunk
                        if json_obj.get('message', {}).get('content'):
                            content_chunk = json_obj['message']['content']
                            full_content += content_chunk
                            
                            # Yield the chunk to the client
                            yield f"data: {content_chunk}\n\n"
                        
                        # If this is the final message, store it in the database
                        if json_obj.get('done', False) and conversation_id:
                            try:
                                assistant_message = Message(
                                    conversation_id=conversation_id,
                                    role="assistant",
                                    content=full_content
                                )
                                db.session.add(assistant_message)
                                db.session.commit()
                            except SQLAlchemyError as e:
                                current_app.logger.error(f"Database error storing assistant message: {str(e)}")
                    except json.JSONDecodeError as e:
                        current_app.logger.error(f"Error parsing JSON from Ollama stream: {str(e)}")
                        continue
        except Exception as e:
            error_msg = f"Error streaming from Ollama: {str(e)}"
            current_app.logger.error(error_msg)
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
    
    return generate

def parse_ollama_response(response):
    """
    Parse a non-streaming response from Ollama.
    
    Args:
        response: The response from Ollama
        
    Returns:
        A dictionary with the parsed response
    """
    try:
        if response.status_code != 200:
            return {
                "error": f"Ollama API returned status code {response.status_code}"
            }
        
        # Ollama returns a JSON object per line in streaming mode
        # We need to parse each line and extract the last valid message
        lines = response.text.strip().split('\n')
        
        # Get the last complete JSON object
        last_response = None
        full_content = ""
        
        for line in lines:
            try:
                json_obj = json.loads(line)
                last_response = json_obj
                # For compatibility with the frontend, reconstruct a complete response
                if json_obj.get('message', {}).get('content'):
                    full_content += json_obj['message']['content']
            except json.JSONDecodeError:
                continue
        
        # If we found valid response data
        if last_response:
            # Construct a final response with the full accumulated content
            return {
                "model": last_response.get('model', ''),
                "message": {
                    "role": "assistant",
                    "content": full_content
                }
            }
        else:
            return {"error": "No valid response data found"}
    except Exception as e:
        return {"error": str(e)}
