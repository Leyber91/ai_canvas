"""
Test script to interact with the backend API and test both Groq and Ollama models.
"""

import requests
import json
import time
import os

# Base URL for the API
BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test the health endpoint to check if the API is running."""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Health check: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {str(e)}")
        return False

def test_ollama_chat():
    """Test the Ollama chat endpoint."""
    print("\n--- Testing Ollama Chat ---")
    
    data = {
        "node_id": "test-node-1",
        "backend": "ollama",
        "model": "llama3",
        "system_message": "You are a helpful assistant.",
        "parent_contexts": [],
        "conversation_history": [],
        "user_input": "Hello, how are you today?",
        "temperature": 0.7,
        "max_tokens": 1024,
        "stream": False
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/node/chat", json=data, timeout=30)
        end_time = time.time()
        
        print(f"Ollama response status: {response.status_code}")
        print(f"Response time: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            result = response.json()
            print("Response structure:", json.dumps(result, indent=2)[:200] + "...")
            
            # Check if the response has the expected structure
            if "message" in result and "content" in result["message"]:
                print("Ollama response content:", result["message"]["content"][:100] + "...")
                return True
            else:
                print("Unexpected response structure from Ollama")
                return False
        else:
            print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"Ollama chat test failed: {str(e)}")
        return False

def test_groq_chat():
    """Test the Groq chat endpoint."""
    print("\n--- Testing Groq Chat ---")
    
    data = {
        "node_id": "test-node-2",
        "backend": "groq",
        "model": "mixtral-8x7b-32768",
        "system_message": "You are a helpful assistant.",
        "parent_contexts": [],
        "conversation_history": [],
        "user_input": "Hello, how are you today?",
        "temperature": 0.7,
        "max_tokens": 1024,
        "stream": False
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/node/chat", json=data, timeout=30)
        end_time = time.time()
        
        print(f"Groq response status: {response.status_code}")
        print(f"Response time: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            result = response.json()
            print("Response structure:", json.dumps(result, indent=2)[:200] + "...")
            
            # Check if the response has the expected structure
            if "choices" in result and len(result["choices"]) > 0:
                print("Groq response content:", result["choices"][0]["message"]["content"][:100] + "...")
                return True
            else:
                print("Unexpected response structure from Groq")
                return False
        else:
            print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"Groq chat test failed: {str(e)}")
        return False

def test_direct_groq_api():
    """Test the Groq API directly to check if the API key is valid."""
    print("\n--- Testing Direct Groq API ---")
    
    # Get the Groq API key from the environment
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        # Try to read from .env file
        try:
            with open("../.env", "r") as f:
                for line in f:
                    if line.startswith("GROQ_API_KEY="):
                        groq_api_key = line.strip().split("=", 1)[1]
                        break
        except Exception as e:
            print(f"Error reading .env file: {str(e)}")
    
    if not groq_api_key:
        print("GROQ_API_KEY not found in environment variables or .env file")
        return False
    
    # Prepare the request
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "mixtral-8x7b-32768",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, how are you today?"}
        ],
        "temperature": 0.7,
        "max_completion_tokens": 1024
    }
    
    try:
        start_time = time.time()
        response = requests.post(url, headers=headers, json=data, timeout=30)
        end_time = time.time()
        
        print(f"Direct Groq API response status: {response.status_code}")
        print(f"Response time: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            result = response.json()
            print("Response structure:", json.dumps(result, indent=2)[:200] + "...")
            
            # Check if the response has the expected structure
            if "choices" in result and len(result["choices"]) > 0:
                print("Direct Groq API response content:", result["choices"][0]["message"]["content"][:100] + "...")
                return True
            else:
                print("Unexpected response structure from direct Groq API")
                return False
        else:
            print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"Direct Groq API test failed: {str(e)}")
        return False

def main():
    """Run all tests."""
    print("Starting API interaction tests...")
    
    # Test if the API is running
    if not test_health():
        print("API is not running. Please start the backend server.")
        return
    
    # Test Ollama chat
    ollama_success = test_ollama_chat()
    
    # Test Groq chat
    groq_success = test_groq_chat()
    
    # If Groq chat failed, test the direct Groq API
    if not groq_success:
        direct_groq_success = test_direct_groq_api()
        if direct_groq_success:
            print("\nDirect Groq API works, but the backend integration fails.")
        else:
            print("\nBoth Groq backend integration and direct API fail. Check the API key and network connection.")
    
    # Print summary
    print("\n--- Test Summary ---")
    print(f"Ollama chat: {'Success' if ollama_success else 'Failed'}")
    print(f"Groq chat: {'Success' if groq_success else 'Failed'}")
    
    # Provide recommendations
    print("\n--- Recommendations ---")
    if not ollama_success and not groq_success:
        print("Both Ollama and Groq failed. Check if the backend server is running correctly.")
    elif ollama_success and not groq_success:
        print("Ollama works but Groq fails. Check the Groq API key and network connection.")
        print("Make sure the GROQ_API_KEY environment variable is set correctly.")
    elif not ollama_success and groq_success:
        print("Groq works but Ollama fails. Check if Ollama is running locally.")
    else:
        print("Both Ollama and Groq are working correctly.")

if __name__ == "__main__":
    main()
