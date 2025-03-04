"""
Test script for Groq API integration.
"""

import os
import json
import requests
from dotenv import load_dotenv

# Function to write to log file
def log(message):
    with open("groq_test_log.txt", "a") as f:
        f.write(message + "\n")
    print(message)

# Clear previous log
with open("groq_test_log.txt", "w") as f:
    f.write("Groq API Test Log\n==================\n\n")

# Load environment variables from .env file
load_dotenv()

# Get Groq API key from environment variables
groq_api_key = os.getenv('GROQ_API_KEY')
if not groq_api_key:
    log("Error: GROQ_API_KEY not found in environment variables")
    exit(1)

# Groq API endpoint
groq_url = "https://api.groq.com/openai/v1/chat/completions"

# Headers for the request
headers = {
    "Authorization": f"Bearer {groq_api_key}",
    "Content-Type": "application/json"
}

# Test data for the request - trying with different parameter names
test_data = {
    "model": "llama-3.1-8b-versatile",  # Using one of the updated model names
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, how are you today?"}
    ],
    "temperature": 0.7,
    # Try both parameter names to see which one works
    "max_tokens": 1024  # Original parameter name
    # "max_completion_tokens": 1024  # Updated parameter name
}

# Alternative test data with a different model
alt_test_data = {
    "model": "mixtral-8x7b-32768",  # Try a different model
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, how are you today?"}
    ],
    "temperature": 0.7,
    "max_tokens": 1024
}

# Log request details
log("Sending request to Groq API:")
log(f"API Key (first 5 chars): {groq_api_key[:5]}...")
log(f"Model: {test_data['model']}")
log(f"Messages: {str(test_data['messages'])}")
log(f"Temperature: {test_data['temperature']}")
log(f"Max tokens: {test_data['max_tokens']}")

try:
    # Send the request
    log("\n--- Trying with first test data ---")
    response = requests.post(groq_url, headers=headers, json=test_data)
    
    # Log response status code
    log(f"\nResponse status code: {response.status_code}")
    
    # If first request fails, try with alternative data
    if response.status_code != 200:
        log("\n--- First request failed, trying with alternative test data ---")
        response = requests.post(groq_url, headers=headers, json=alt_test_data)
        log(f"Response status code: {response.status_code}")
    
    # Log response headers
    log(f"Response headers: {str(dict(response.headers))}")
    
    # Check if the response is valid JSON
    try:
        result = response.json()
        log("\nResponse JSON:")
        log(json.dumps(result, indent=2))
        
        # Extract and log the content if available
        if result.get('choices') and len(result['choices']) > 0 and result['choices'][0].get('message'):
            content = result['choices'][0]['message'].get('content', '')
            log("\nExtracted content:")
            log(content)
        elif 'error' in result:
            log("\nError in response:")
            log(str(result['error']))
        else:
            log("\nUnexpected response format")
    except json.JSONDecodeError as json_err:
        log(f"\nInvalid JSON response: {str(json_err)}")
        log(f"Response content preview: {response.text[:200]}...")
        
except Exception as e:
    log(f"\nError with request: {str(e)}")

log("\nTest completed. Check groq_test_log.txt for full results.")
