from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.productbook_service import (
    get_productbooks_by_user,
    get_productbook_by_id,
    create_productbook,
    update_productbook,
    delete_productbook,
)
from app.schemas.productbook_schema import validate_productbook

pb_bp = Blueprint("productbooks", __name__)


@pb_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    user_id = get_jwt_identity()
    pbs = get_productbooks_by_user(user_id)
    return jsonify([pb.to_dict() for pb in pbs])


@pb_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_one(id):
    user_id = get_jwt_identity()
    pb, err = get_productbook_by_id(id, user_id)
    if err:
        return jsonify({"error": err}), 404
    return jsonify(pb.to_dict())


@pb_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Se requieren datos válidos en formato JSON"}), 400

    error = validate_productbook(data)
    if error:
        return jsonify({"error": error}), 400

    pb, err = create_productbook(data, user_id)
    if err:
        return jsonify({"error": err}), 400

    return jsonify({"msg": "ProductBook creado", "productbook": pb.to_dict()}), 201


@pb_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update(id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Se requieren datos válidos en formato JSON"}), 400

    pb, err = update_productbook(id, data, user_id)
    if err:
        return jsonify({"error": err}), 404 if "no encontrado" in err.lower() else 400

    return jsonify({"msg": "ProductBook actualizado", "productbook": pb.to_dict()})


@pb_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete(id):
    user_id = get_jwt_identity()
    pb, err = delete_productbook(id, user_id)
    if err:
        return jsonify({"error": err}), 404 if "no encontrado" in err.lower() else 400

    return jsonify({"msg": "Eliminado"})