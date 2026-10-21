from ..extensions import db

class User(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

    productbooks = db.relationship("ProductBook", backref="user", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {"id": self.id, "nombre": self.nombre, "email": self.email}
