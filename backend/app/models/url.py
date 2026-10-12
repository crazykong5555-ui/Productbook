from ..extensions import db

class Url(db.Model):
    __tablename__ = "urls"

    id = db.Column(db.Integer, primary_key=True)
    producto = db.Column(db.String(255))
    imagen = db.Column(db.Text)
    descripcion = db.Column(db.Text)
    valor = db.Column(db.Float)
    url = db.Column(db.Text)

    productbook_id = db.Column(db.Integer, db.ForeignKey("productbooks.id"))
# backend/app/models/url.py

