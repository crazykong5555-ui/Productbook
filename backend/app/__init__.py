from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .extensions import db, jwt, bcrypt, migrate


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)

    # Manejadores de errores personalizados para JWT
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            "code": "token_expired"
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({
            "error": "Token de sesión no válido. Por favor, inicia sesión nuevamente.",
            "code": "token_invalid"
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify({
            "error": "No has iniciado sesión o falta el token de autorización.",
            "code": "authorization_required"
        }), 401

    from .middleware.error_handler import register_error_handlers
    register_error_handlers(app)

    # Import models so SQLAlchemy registers all tables
    from . import models  # noqa: F401

    from .routes.auth_routes import auth_bp
    from .routes.productbook_routes import pb_bp
    from .routes.agenda_routes import agenda_bp
    from .routes.url_routes import url_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(pb_bp, url_prefix="/api/productbooks")
    app.register_blueprint(agenda_bp, url_prefix="/api/agenda")
    app.register_blueprint(url_bp, url_prefix="/api/urls")

    return app
