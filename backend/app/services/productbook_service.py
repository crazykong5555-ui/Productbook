from ..models.productbook import ProductBook
from ..extensions import db


def get_productbooks_by_user(user_id):
    return ProductBook.query.filter_by(user_id=int(user_id)).all()


def get_productbook_by_id(pb_id, user_id):
    pb = ProductBook.query.filter_by(id=pb_id, user_id=int(user_id)).first()
    if not pb:
        return None, "ProductBook no encontrado"
    return pb, None


def create_productbook(data, user_id):
    pb = ProductBook(
        nombre=data["nombre"].strip(),
        descripcion=data.get("descripcion", "").strip() if data.get("descripcion") else "",
        user_id=int(user_id),
    )

    db.session.add(pb)
    db.session.commit()

    return pb, None


def delete_productbook(pb_id, user_id):
    pb = ProductBook.query.filter_by(id=pb_id, user_id=int(user_id)).first()

    if not pb:
        return None, "ProductBook no encontrado"

    db.session.delete(pb)
    db.session.commit()

    return pb, None


def update_productbook(pb_id, data, user_id):
    pb = ProductBook.query.filter_by(id=pb_id, user_id=int(user_id)).first()

    if not pb:
        return None, "ProductBook no encontrado"

    if "nombre" in data and data["nombre"]:
        pb.nombre = data["nombre"].strip()
    if "descripcion" in data:
        pb.descripcion = (data["descripcion"] or "").strip()

    db.session.commit()

    return pb, None
