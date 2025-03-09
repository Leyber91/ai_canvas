import os
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_migrate import Migrate

# Import database instance
from .models import db

# Initialize SocketIO for real-time communication
socketio = SocketIO()
migrate = Migrate()

def create_app(test_config=None):
    """Create and configure the Flask application"""
    app = Flask(__name__, static_folder='../../static', template_folder='../templates')
    
    # Configure the app
    if test_config is None:
        # Load the instance config from environment variables when not testing
        app.config.from_mapping(
            SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
            SQLALCHEMY_DATABASE_URI=os.environ.get(
                'DATABASE_URL', 
                'sqlite:///' + os.path.join(os.path.dirname(app.instance_path), 'ai_canvas.sqlite')
            ),
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
        )
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)
    
    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Initialize extensions
    initialize_extensions(app)
    
    # Register blueprints
    register_blueprints(app)
    
    return app

def initialize_extensions(app):
    """Initialize Flask extensions"""
    # Set up allowed CORS origins for security
    allowed_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '*')
    if allowed_origins != '*':
        # Split comma-separated origins into a list
        allowed_origins = [origin.strip() for origin in allowed_origins.split(',')]
    
    # Initialize CORS with proper origins
    CORS(app)
    
    # Initialize the database
    db.init_app(app)
    
    # Initialize database migrations
    migrate.init_app(app, db)
    
    # Initialize SocketIO
    socketio.init_app(app, cors_allowed_origins=allowed_origins)
    
    # Create database tables if they don't exist
    with app.app_context():
        # In production or with migrations, you would run flask db upgrade instead
        if not app.config.get('TESTING') and not os.environ.get('USE_MIGRATIONS'):
            db.create_all()

def register_blueprints(app):
    """Register Flask blueprints"""
    # Register main routes
    from .routes import main_bp
    app.register_blueprint(main_bp)
    
    # Register API routes
    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')