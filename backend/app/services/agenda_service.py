from app.models.agenda import Agenda
from app.extensions import db


def get_agenda_by_productbook(pb_id):
    return Agenda.query.filter_by(productbook_id=pb_id).all()


def create_agenda_item(data):
    item = Agenda(
        nombre=data["nombre"],
        telefono=data.get("telefono"),
        email=data.get("email"),
        productbook_id=data["productbook_id"]
    )

    db.session.add(item)
    db.session.commit()

    return item


def delete_agenda_item(item_id):
    item = Agenda.query.get(item_id)

    if not item:
        return None

    db.session.delete(item)
    db.session.commit()

    return item


def update_agenda_item(item_id, data):
    item = Agenda.query.get(item_id)

    if not item:
        return None

    item.nombre = data.get("nombre", item.nombre)
    item.telefono = data.get("telefono", item.telefono)
    item.email = data.get("email", item.email)

    db.session.commit()

    return item
# backend/app/services/agenda_service.py
