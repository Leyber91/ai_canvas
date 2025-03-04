from dotenv import load_dotenv
from app import create_app, socketio
import os

# Force reload environment variables from .env file
load_dotenv(override=True)

# Print the API key to verify it's loaded (first 5 chars only for security)
groq_api_key = os.getenv('GROQ_API_KEY')
if groq_api_key:
    print(f"Loaded GROQ_API_KEY: {groq_api_key[:5]}...")
else:
    print("Warning: GROQ_API_KEY not found in environment variables")

app = create_app()

if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
