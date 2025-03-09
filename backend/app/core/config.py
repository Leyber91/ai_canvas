"""
Configuration settings for the AI Canvas application.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration."""
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    
    # SQLAlchemy settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        'sqlite:///ai_canvas.sqlite'
    )
    
    # API settings
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    
    # CORS settings
    CORS_ENABLED = True
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '*')
    
    # SocketIO settings
    SOCKETIO_ASYNC_MODE = 'threading'


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'TEST_DATABASE_URL', 
        'sqlite:///:memory:'
    )
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    
    # In production, ensure a proper secret key is set
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if SECRET_KEY == 'dev':
        raise ValueError(
            'SECRET_KEY environment variable not set. '
            'This is insecure and unacceptable in a production environment.'
        )
    
    # Security settings
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True


# Create a configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Return the appropriate configuration object based on the environment."""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])