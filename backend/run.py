"""
Entry point for the AI Canvas application.
"""

import os
from dotenv import load_dotenv

# Force re-read of .env file every time run.py is executed
load_dotenv(override=True)

from app import create_app, socketio

# Get the application instance
app = create_app()

if __name__ == '__main__':
    # Get port number from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Determine if debug mode should be enabled based on the FLASK_ENV variable
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    # Run the application with SocketIO
    socketio.run(
        app,
        host='0.0.0.0',  # Allow connections from any device on the network
        port=port,
        debug=debug,
        allow_unsafe_werkzeug=debug  # Only allow unsafe Werkzeug in development
    )
