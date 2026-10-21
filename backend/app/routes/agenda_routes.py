from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..services.user_productbook_service import get_user_productbook
from ..services.agenda_service import (
    get_agenda_by_productbook,
    create_agenda_item,
    update_agenda_item,
    delete_agenda_item,
)
from ..schemas.agenda_schema import validate_agenda

agenda_bp = Blueprint("agenda", __name__)


@agenda_bp.route("/", methods=["GET"])
@jwt_required()
def list_contacts():
    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al cargar ProductBook: {err}"}), 500

    items = get_agenda_by_productbook(book.id)
    return jsonify([item.to_dict() for item in items])


@agenda_bp.route("/", methods=["POST"])
@jwt_required()
def create_contact():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = {}

    error = validate_agenda(data)
    if error:
        return jsonify({"error": error}), 400

    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al obtener ProductBook: {err}"}), 500

    contact, err = create_agenda_item(data, book.id)
    if err:
        return jsonify({"error": f"Error al guardar contacto: {err}"}), 500

    return jsonify(contact.to_dict()), 201


@agenda_bp.route("/<int:contact_id>", methods=["PUT"])
@jwt_required()
def update_contact(contact_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = {}

    error = validate_agenda(data)
    if error:
        return jsonify({"error": error}), 400

    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al obtener ProductBook: {err}"}), 500

    contact, err = update_agenda_item(contact_id, data, book.id)
    if err:
        status_code = 404 if "no encontrado" in err.lower() else 500
        return jsonify({"error": err}), status_code

    return jsonify(contact.to_dict())


@agenda_bp.route("/<int:contact_id>", methods=["DELETE"])
@jwt_required()
def delete_contact(contact_id):
    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al obtener ProductBook: {err}"}), 500

    contact, err = delete_agenda_item(contact_id, book.id)
    if err:
        status_code = 404 if "no encontrado" in err.lower() else 500
        return jsonify({"error": err}), status_code

    return jsonify({"message": "Contacto eliminado"})
