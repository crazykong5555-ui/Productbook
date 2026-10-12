from flask import Flask
from .config import Config
from .extensions import db, jwt, bcrypt
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    from .middleware.error_handler import register_error_handlers
    register_error_handlers(app)

    from .routes.auth_routes import auth_bp
    from .routes.productbook_routes import pb_bp
    from .routes.agenda_routes import agenda_bp
    from .routes.url_routes import url_bp

    # Import models so SQLAlchemy registers all tables before create_all().
    from . import models  # noqa: F401

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(pb_bp, url_prefix="/api/productbooks")
    app.register_blueprint(agenda_bp, url_prefix="/api/agenda")
    app.register_blueprint(url_bp, url_prefix="/api/urls")

    return app


# backend/app/utils/_init_.py
