import os
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

# Import database instance
from .models import db

# Initialize SocketIO for real-time communication
socketio = SocketIO()

def create_app(test_config=None):
    app = Flask(__name__, static_folder='../../static', template_folder='../templates')
    
    # Configure the app
    if test_config is None:
        # Load the instance config, if it exists, when not testing
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
    CORS(app)
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Register blueprints
    from .routes import main_bp
    app.register_blueprint(main_bp)
    
    # Register API routes
    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app
