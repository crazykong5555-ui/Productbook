from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.productbook import ProductBook
from flask_jwt_extended import jwt_required, get_jwt_identity

pb_bp = Blueprint("productbooks", __name__)

@pb_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    user_id = get_jwt_identity()
    pbs = ProductBook.query.filter_by(user_id=user_id).all()

    return jsonify([{
        "id": pb.id,
        "nombre": pb.nombre,
        "descripcion": pb.descripcion
    } for pb in pbs])


@pb_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    user_id = get_jwt_identity()
    data = request.json

    pb = ProductBook(
        nombre=data["nombre"],
        descripcion=data["descripcion"],
        user_id=user_id
    )

    db.session.add(pb)
    db.session.commit()

    return jsonify({"msg": "ProductBook creado"})


@pb_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete(id):
    pb = ProductBook.query.get(id)
    db.session.delete(pb)
    db.session.commit()

    return jsonify({"msg": "Eliminado"})
# backend/app/routes/productbook_routes.py