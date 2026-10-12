from ..extensions import db

class ProductBook(db.Model):
    __tablename__ = "productbooks"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    descripcion = db.Column(db.Text)

    user_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"))
# backend/app/models/productbook.py
