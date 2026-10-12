from ..extensions import db

class Agenda(db.Model):
    __tablename__ = "agenda"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(100))

    productbook_id = db.Column(db.Integer, db.ForeignKey("productbooks.id"))
# backend/app/models/agenda.py
