# app/core/exceptions.py
from typing import Optional, Dict, Any

class AppException(Exception):
    """Base exception for application errors."""
    
    status_code = 500
    code = "internal_error"
    message = "An unexpected error occurred"
    
    def __init__(
        self, 
        message: Optional[str] = None, 
        status_code: Optional[int] = None,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if message:
            self.message = message
        if status_code:
            self.status_code = status_code
        if code:
            self.code = code
        self.details = details
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response."""
        result = {
            "status": "error",
            "code": self.code,
            "message": self.message,
        }
        if self.details:
            result["details"] = self.details
        return result

class ResourceNotFoundError(AppException):
    """Raised when a requested resource is not found."""
    
    status_code = 404
    code = "not_found"
    message = "The requested resource was not found"

class ValidationError(AppException):
    """Raised when input validation fails."""
    
    status_code = 400
    code = "validation_error"
    message = "Invalid input data"

class ProviderError(AppException):
    """Raised when an external service provider fails."""
    
    status_code = 502
    code = "provider_error"
    message = "External service provider error"

class WorkflowError(AppException):
    """Raised when workflow execution fails."""
    
    status_code = 400
    code = "workflow_error"
    message = "Workflow execution failed"