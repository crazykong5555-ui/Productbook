from ..extensions import db
from sqlalchemy.dialects.mysql import LONGTEXT


class Url(db.Model):
    __tablename__ = "urls"

    id = db.Column(db.Integer, primary_key=True)
    producto = db.Column(db.String(255), nullable=False)
    imagen = db.Column(db.Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    descripcion = db.Column(db.Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    valor = db.Column(db.Float, nullable=True)
    url = db.Column(db.Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    cantidad = db.Column(db.Integer, default=1, nullable=False)

    productbook_id = db.Column(db.Integer, db.ForeignKey("productbooks.id", ondelete="CASCADE"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "producto": self.producto,
            "imagen": self.imagen,
            "descripcion": self.descripcion,
            "valor": self.valor,
            "url": self.url,
            "cantidad": self.cantidad if self.cantidad is not None else 1,
            "productbook_id": self.productbook_id,
        }
