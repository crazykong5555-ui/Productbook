from app.models.url import Url
from app.extensions import db


def get_urls_by_productbook(pb_id):
    return Url.query.filter_by(productbook_id=pb_id).order_by(Url.id.desc()).all()


def get_url_by_id(item_id, pb_id):
    return Url.query.filter_by(id=item_id, productbook_id=pb_id).first()


def create_url(data, pb_id):
    try:
        raw_qty = data.get("cantidad", 1)
        try:
            qty = max(0, int(raw_qty))
        except (TypeError, ValueError):
            qty = 1

        item = Url(
            producto=data["producto"].strip(),
            imagen=data.get("imagen", "") or "",
            descripcion=data.get("descripcion", "") or "",
            valor=data.get("valor"),
            url=data.get("url", "") or "",
            cantidad=qty,
            productbook_id=pb_id,
        )
        db.session.add(item)
        db.session.commit()
        return item, None
    except Exception as err:
        db.session.rollback()
        return None, str(err)


def delete_url(item_id, pb_id):
    try:
        item = Url.query.filter_by(id=item_id, productbook_id=pb_id).first()
        if not item:
            return None, "Producto no encontrado"

        db.session.delete(item)
        db.session.commit()
        return item, None
    except Exception as err:
        db.session.rollback()
        return None, str(err)


def update_url(item_id, data, pb_id):
    try:
        item = Url.query.filter_by(id=item_id, productbook_id=pb_id).first()
        if not item:
            return None, "Producto no encontrado"

        for key, value in data.items():
            if hasattr(item, key):
                if key == "cantidad":
                    try:
                        value = max(0, int(value))
                    except (TypeError, ValueError):
                        value = item.cantidad
                setattr(item, key, value)

        db.session.commit()
        return item, None
    except Exception as err:
        db.session.rollback()
        return None, str(err)
