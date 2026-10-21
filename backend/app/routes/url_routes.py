from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..services.user_productbook_service import get_user_productbook
from ..services.url_service import (
    get_urls_by_productbook,
    get_url_by_id,
    create_url,
    update_url,
    delete_url,
)
from ..schemas.url_schema import validate_url

url_bp = Blueprint("urls", __name__)


def sanitize_product_data(data, current=None):
    name = data.get("producto", current.producto if current else "")
    raw_price = data.get("valor", current.valor if current else None)

    if raw_price in (None, ""):
        price = None
    else:
        try:
            price = float(raw_price)
            if price < 0:
                return None, "El precio debe ser un número igual o mayor que cero"
        except (TypeError, ValueError):
            return None, "El precio debe ser un número igual o mayor que cero"

    raw_qty = data.get("cantidad", current.cantidad if current else 1)
    try:
        quantity = max(0, int(raw_qty)) if raw_qty not in (None, "") else 1
    except (TypeError, ValueError):
        quantity = 1

    result = {
        "producto": (name or "").strip(),
        "imagen": data.get("imagen", current.imagen if current else "") or "",
        "descripcion": data.get("descripcion", current.descripcion if current else "") or "",
        "valor": price,
        "url": data.get("url", current.url if current else "") or "",
        "cantidad": quantity,
    }
    return result, None


@url_bp.route("/", methods=["GET"])
@jwt_required()
def list_products():
    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al cargar ProductBook: {err}"}), 500

    products = get_urls_by_productbook(book.id)
    return jsonify([item.to_dict() for item in products])


@url_bp.route("/", methods=["POST"])
@jwt_required()
def create_product():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        payload = {}

    error = validate_url(payload)
    if error:
        return jsonify({"error": error}), 400

    clean_data, error = sanitize_product_data(payload)
    if error:
        return jsonify({"error": error}), 400

    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al obtener ProductBook: {err}"}), 500

    product, err = create_url(clean_data, book.id)
    if err:
        return jsonify({"error": f"Error al guardar producto: {err}"}), 500

    return jsonify(product.to_dict()), 201


@url_bp.route("/<int:product_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_product(product_id):
    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al obtener ProductBook: {err}"}), 500

    item = get_url_by_id(product_id, book.id)
    if not item:
        return jsonify({"error": "Producto no encontrado"}), 404

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        payload = {}

    update_data = {}
    if "producto" in payload:
        name = str(payload["producto"]).strip()
        if not name:
            return jsonify({"error": "El nombre del producto no puede estar vacío"}), 400
        update_data["producto"] = name

    if "cantidad" in payload:
        try:
            qty = max(0, int(payload["cantidad"]))
            update_data["cantidad"] = qty
        except (TypeError, ValueError):
            return jsonify({"error": "La cantidad debe ser un número entero mayor o igual a 0"}), 400

    if "valor" in payload:
        val = payload["valor"]
        if val in (None, ""):
            update_data["valor"] = None
        else:
            try:
                price = float(val)
                if price < 0:
                    return jsonify({"error": "El precio debe ser un número mayor o igual a 0"}), 400
                update_data["valor"] = price
            except (TypeError, ValueError):
                return jsonify({"error": "El precio debe ser un número válido"}), 400

    if "imagen" in payload:
        update_data["imagen"] = payload["imagen"] or ""

    if "url" in payload:
        update_data["url"] = payload["url"] or ""

    if "descripcion" in payload:
        update_data["descripcion"] = payload["descripcion"] or ""

    product, err = update_url(product_id, update_data, book.id)
    if err:
        return jsonify({"error": err}), 500

    return jsonify(product.to_dict())


@url_bp.route("/<int:product_id>/stock", methods=["POST", "PATCH"])
@jwt_required()
def adjust_product_stock(product_id):
    """Carga manual de existencias: permite establecer stock absoluto o sumar/restar."""
    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al obtener ProductBook: {err}"}), 500

    item = get_url_by_id(product_id, book.id)
    if not item:
        return jsonify({"error": "Producto no encontrado"}), 404

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Se requieren datos en formato JSON"}), 400

    if "ajuste" in payload:
        try:
            delta = int(payload["ajuste"])
            new_qty = max(0, item.cantidad + delta)
        except (TypeError, ValueError):
            return jsonify({"error": "El ajuste debe ser un número entero"}), 400
    elif "cantidad" in payload:
        try:
            new_qty = max(0, int(payload["cantidad"]))
        except (TypeError, ValueError):
            return jsonify({"error": "La cantidad debe ser un número entero mayor o igual a 0"}), 400
    else:
        return jsonify({"error": "Debes especificar 'cantidad' o 'ajuste'"}), 400

    product, err = update_url(product_id, {"cantidad": new_qty}, book.id)
    if err:
        return jsonify({"error": err}), 500

    return jsonify({
        "message": f"Existencias de {product.producto} actualizadas a {product.cantidad} unidades",
        "product": product.to_dict()
    })


@url_bp.route("/batch-stock", methods=["POST"])
@jwt_required()
def batch_update_stock():
    """Actualización masiva de existencias para múltiples productos."""
    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al obtener ProductBook: {err}"}), 500

    payload = request.get_json(silent=True)
    if not isinstance(payload, list):
        return jsonify({"error": "Se requiere una lista de productos con id y cantidad"}), 400

    updated = []
    for entry in payload:
        if not isinstance(entry, dict) or "id" not in entry or "cantidad" not in entry:
            continue
        try:
            qty = max(0, int(entry["cantidad"]))
            prod, err = update_url(entry["id"], {"cantidad": qty}, book.id)
            if prod:
                updated.append(prod.to_dict())
        except Exception:
            continue

    return jsonify({"message": f"{len(updated)} productos actualizados", "products": updated})


@url_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    book, err = get_user_productbook(get_jwt_identity())
    if err:
        return jsonify({"error": f"Error al obtener ProductBook: {err}"}), 500

    product, err = delete_url(product_id, book.id)
    if err:
        status_code = 404 if "no encontrado" in err.lower() else 500
        return jsonify({"error": err}), status_code

    return jsonify({"message": "Producto eliminado"})
