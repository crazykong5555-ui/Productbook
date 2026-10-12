from ..models.productbook import ProductBook
from ..extensions import db
from ..services.productbook_service import (
    get_productbooks_by_user,
    create_productbook,
    delete_productbook
)


def get_productbooks_by_user(user_id):
    return ProductBook.query.filter_by(user_id=user_id).all()


def create_productbook(data, user_id):
    pb = ProductBook(
        nombre=data["nombre"],
        descripcion=data.get("descripcion", ""),
        user_id=user_id
    )

    db.session.add(pb)
    db.session.commit()

    return pb


def delete_productbook(pb_id, user_id):
    pb = ProductBook.query.get(pb_id)

    if not pb:
        return None, "No existe"

    if pb.user_id != user_id:
        return None, "No autorizado"

    db.session.delete(pb)
    db.session.commit()

    return pb, None


def update_productbook(pb_id, data, user_id):
    pb = ProductBook.query.get(pb_id)

    if not pb:
        return None, "No existe"

    if pb.user_id != user_id:
        return None, "No autorizado"

    pb.nombre = data.get("nombre", pb.nombre)
    pb.descripcion = data.get("descripcion", pb.descripcion)

    db.session.commit()

    return pb, None
# backend/app/services/productbook_service.py
