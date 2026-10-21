from app.models.agenda import Agenda
from app.extensions import db


def get_agenda_by_productbook(pb_id):
    return Agenda.query.filter_by(productbook_id=pb_id).order_by(Agenda.id.desc()).all()


def get_agenda_item_by_id(item_id, pb_id):
    return Agenda.query.filter_by(id=item_id, productbook_id=pb_id).first()


def create_agenda_item(data, pb_id):
    try:
        item = Agenda(
            nombre=data["nombre"].strip(),
            telefono=(data.get("telefono") or "").strip(),
            email=(data.get("email") or "").strip(),
            productbook_id=pb_id,
        )
        db.session.add(item)
        db.session.commit()
        return item, None
    except Exception as err:
        db.session.rollback()
        return None, str(err)


def delete_agenda_item(item_id, pb_id):
    try:
        item = Agenda.query.filter_by(id=item_id, productbook_id=pb_id).first()
        if not item:
            return None, "Contacto no encontrado"

        db.session.delete(item)
        db.session.commit()
        return item, None
    except Exception as err:
        db.session.rollback()
        return None, str(err)


def update_agenda_item(item_id, data, pb_id):
    try:
        item = Agenda.query.filter_by(id=item_id, productbook_id=pb_id).first()
        if not item:
            return None, "Contacto no encontrado"

        if "nombre" in data and data["nombre"]:
            item.nombre = data["nombre"].strip()
        if "telefono" in data:
            item.telefono = (data.get("telefono") or "").strip()
        if "email" in data:
            item.email = (data.get("email") or "").strip()

        db.session.commit()
        return item, None
    except Exception as err:
        db.session.rollback()
        return None, str(err)
