from ..extensions import db

class Agenda(db.Model):
    __tablename__ = "agenda"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(100), nullable=True)

    productbook_id = db.Column(db.Integer, db.ForeignKey("productbooks.id", ondelete="CASCADE"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "telefono": self.telefono,
            "email": self.email,
            "productbook_id": self.productbook_id,
        }
