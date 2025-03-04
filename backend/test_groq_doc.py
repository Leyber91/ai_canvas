"""
Test script for Groq API integration following the official documentation.
"""

import os
import json
import requests
from dotenv import load_dotenv

# Function to write to log file
def log(message):
    with open("groq_doc_test_log.txt", "a") as f:
        f.write(message + "\n")
    print(message)

# Clear previous log
with open("groq_doc_test_log.txt", "w") as f:
    f.write("Groq API Documentation Test Log\n============================\n\n")

# Load environment variables from .env file
load_dotenv()

# Get Groq API key from environment variables
groq_api_key = os.getenv('GROQ_API_KEY')
if not groq_api_key:
    log("Error: GROQ_API_KEY not found in environment variables")
    exit(1)

# Groq API endpoint - directly from documentation
groq_url = "https://api.groq.com/openai/v1/chat/completions"

# Headers for the request
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {groq_api_key}"
}

# Test data for the request - exactly as shown in documentation
test_data = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {
            "role": "user",
            "content": "Explain the importance of fast language models"
        }
    ]
}

# Log request details
log("Sending request to Groq API following documentation example:")
log(f"API Key (first 5 chars): {groq_api_key[:5]}...")
log(f"URL: {groq_url}")
log(f"Headers: {headers}")
log(f"Request data: {json.dumps(test_data, indent=2)}")

try:
    # Send the request
    log("\n--- Sending request ---")
    response = requests.post(groq_url, headers=headers, json=test_data)
    
    # Log response status code
    log(f"\nResponse status code: {response.status_code}")
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

log("\nTest completed. Check groq_doc_test_log.txt for full results.")
