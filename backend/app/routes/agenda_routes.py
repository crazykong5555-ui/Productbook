from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.agenda import Agenda
from ..services.user_productbook_service import get_user_productbook

agenda_bp = Blueprint("agenda", __name__)


def serialize_contact(contact):
    return {
        "id": contact.id,
        "nombre": contact.nombre,
        "telefono": contact.telefono,
        "email": contact.email,
        "productbook_id": contact.productbook_id,
    }


@agenda_bp.route("/", methods=["GET"])
@jwt_required()
def list_contacts():
    book = get_user_productbook(get_jwt_identity())
    items = Agenda.query.filter_by(productbook_id=book.id).order_by(Agenda.id.desc()).all()
    return jsonify([serialize_contact(item) for item in items])


@agenda_bp.route("/", methods=["POST"])
@jwt_required()
def create_contact():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = {}
    nombre = data.get("nombre", "").strip()
    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400

    contact = Agenda(
        nombre=nombre,
        telefono=(data.get("telefono") or "").strip(),
        email=(data.get("email") or "").strip(),
        productbook_id=get_user_productbook(get_jwt_identity()).id,
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify(serialize_contact(contact)), 201


@agenda_bp.route("/<int:contact_id>", methods=["PUT"])
@jwt_required()
def update_contact(contact_id):
    book = get_user_productbook(get_jwt_identity())
    contact = Agenda.query.filter_by(id=contact_id, productbook_id=book.id).first()
    if not contact:
        return jsonify({"error": "Contacto no encontrado"}), 404
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = {}
    nombre = data.get("nombre", contact.nombre)
    if not isinstance(nombre, str) or not nombre.strip():
        return jsonify({"error": "El nombre es obligatorio"}), 400
    contact.nombre = nombre.strip()
    contact.telefono = (data.get("telefono", contact.telefono) or "").strip()
    contact.email = (data.get("email", contact.email) or "").strip()
    db.session.commit()
    return jsonify(serialize_contact(contact))


@agenda_bp.route("/<int:contact_id>", methods=["DELETE"])
@jwt_required()
def delete_contact(contact_id):
    book = get_user_productbook(get_jwt_identity())
    contact = Agenda.query.filter_by(id=contact_id, productbook_id=book.id).first()
    if not contact:
        return jsonify({"error": "Contacto no encontrado"}), 404
    db.session.delete(contact)
    db.session.commit()
    return jsonify({"message": "Contacto eliminado"})
