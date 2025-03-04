#!/bin/bash

# This script tests the Groq API using curl, following the official documentation example.
# Replace YOUR_API_KEY with your actual Groq API key.

echo "Testing Groq API with curl..."
echo "Make sure to replace YOUR_API_KEY with your actual Groq API key."

curl https://api.groq.com/openai/v1/chat/completions -s \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_API_KEY" \
-d '{
"model": "llama-3.3-70b-versatile",
"messages": [{
    "role": "user",
    "content": "Explain the importance of fast language models"
}]
}'

echo -e "\n\nTest completed."
