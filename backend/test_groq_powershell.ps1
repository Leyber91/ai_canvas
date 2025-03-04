# This script tests the Groq API using PowerShell, following the official documentation example.
# Replace YOUR_API_KEY with your actual Groq API key.

Write-Host "Testing Groq API with PowerShell..."
Write-Host "Make sure to replace YOUR_API_KEY with your actual Groq API key."

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_API_KEY"
}

$body = @{
    model = "llama-3.3-70b-versatile"
    messages = @(
        @{
            role = "user"
            content = "Explain the importance of fast language models"
        }
    )
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.groq.com/openai/v1/chat/completions" -Method Post -Headers $headers -Body $body -ContentType "application/json"

Write-Host "Response:"
$response | ConvertTo-Json -Depth 10

Write-Host "`nTest completed."
