from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.url import Url
from ..services.user_productbook_service import get_user_productbook

url_bp = Blueprint("urls", __name__)


def serialize_product(product):
    return {
        "id": product.id,
        "producto": product.producto,
        "imagen": product.imagen,
        "descripcion": product.descripcion,
        "valor": product.valor,
        "url": product.url,
        "productbook_id": product.productbook_id,
    }


def product_data(data, current=None):
    name = data.get("producto", current.producto if current else "")
    if not isinstance(name, str) or not name.strip():
        return None, "El nombre del producto es obligatorio"

    raw_price = data.get("valor", current.valor if current else None)
    if raw_price in (None, ""):
        price = None
    else:
        try:
            price = float(raw_price)
            if price < 0:
                raise ValueError
        except (TypeError, ValueError):
            return None, "El precio debe ser un número igual o mayor que cero"

    result = {
        "producto": name.strip(),
        "imagen": data.get("imagen", current.imagen if current else "") or "",
        "descripcion": data.get("descripcion", current.descripcion if current else "") or "",
        "valor": price,
        "url": data.get("url", current.url if current else "") or "",
    }
    return result, None


@url_bp.route("/", methods=["GET"])
@jwt_required()
def list_products():
    book = get_user_productbook(get_jwt_identity())
    products = Url.query.filter_by(productbook_id=book.id).order_by(Url.id.desc()).all()
    return jsonify([serialize_product(item) for item in products])


@url_bp.route("/", methods=["POST"])
@jwt_required()
def create_product():
    payload = request.get_json(silent=True)
    data, error = product_data(payload if isinstance(payload, dict) else {})
    if error:
        return jsonify({"error": error}), 400
    data["productbook_id"] = get_user_productbook(get_jwt_identity()).id
    product = Url(**data)
    db.session.add(product)
    db.session.commit()
    return jsonify(serialize_product(product)), 201


@url_bp.route("/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    book = get_user_productbook(get_jwt_identity())
    product = Url.query.filter_by(id=product_id, productbook_id=book.id).first()
    if not product:
        return jsonify({"error": "Producto no encontrado"}), 404
    payload = request.get_json(silent=True)
    data, error = product_data(payload if isinstance(payload, dict) else {}, product)
    if error:
        return jsonify({"error": error}), 400
    data["productbook_id"] = book.id
    for key, value in data.items():
        setattr(product, key, value)
    db.session.commit()
    return jsonify(serialize_product(product))


@url_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    book = get_user_productbook(get_jwt_identity())
    product = Url.query.filter_by(id=product_id, productbook_id=book.id).first()
    if not product:
        return jsonify({"error": "Producto no encontrado"}), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Producto eliminado"})
