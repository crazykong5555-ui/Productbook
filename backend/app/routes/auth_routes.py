from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from app.services.user_service import create_user, get_user_by_email, verify_password
from app.schemas.user_schema import validate_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = {}

    error = validate_user(data)
    if error:
        return jsonify({"error": error}), 400

    user, err = create_user(data)

    if err:
        return jsonify({"error": err}), 400

    return jsonify(user.to_dict()), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = {}

    user = get_user_by_email(data.get("email"))

    if not verify_password(user, data.get("password")):
        return jsonify({"error": "Credenciales inválidas"}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": token,
        "user": user.to_dict()
    })

# backend/app/routes/auth_routes.py
