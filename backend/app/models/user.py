from ..extensions import db

class User(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(255))

    def to_dict(self):
        return {"id": self.id, "nombre": self.nombre, "email": self.email}
# backend/app/models/user.py
