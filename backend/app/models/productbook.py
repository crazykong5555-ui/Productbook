from ..extensions import db

class ProductBook(db.Model):
    __tablename__ = "productbooks"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)

    agendas = db.relationship("Agenda", backref="productbook", cascade="all, delete-orphan", lazy=True)
    urls = db.relationship("Url", backref="productbook", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "user_id": self.user_id,
        }
