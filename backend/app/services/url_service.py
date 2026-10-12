from app.models.url import Url
from app.extensions import db


def get_urls_by_productbook(pb_id):
    return Url.query.filter_by(productbook_id=pb_id).all()


def create_url(data):
    item = Url(
        producto=data["producto"],
        imagen=data.get("imagen"),
        descripcion=data.get("descripcion"),
        valor=data.get("valor"),
        url=data.get("url"),
        productbook_id=data["productbook_id"]
    )

    db.session.add(item)
    db.session.commit()

    return item


def delete_url(item_id):
    item = Url.query.get(item_id)

    if not item:
        return None

    db.session.delete(item)
    db.session.commit()

    return item


def update_url(item_id, data):
    item = Url.query.get(item_id)

    if not item:
        return None

    item.producto = data.get("producto", item.producto)
    item.imagen = data.get("imagen", item.imagen)
    item.descripcion = data.get("descripcion", item.descripcion)
    item.valor = data.get("valor", item.valor)
    item.url = data.get("url", item.url)

    db.session.commit()

    return item
# backend/app/services/url_service.py
