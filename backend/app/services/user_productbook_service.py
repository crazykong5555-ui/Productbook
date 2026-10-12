from ..extensions import db
from ..models.productbook import ProductBook


def get_user_productbook(user_id):
    """Return the user's book, creating a default one on first use."""
    user_id = int(user_id)
    book = ProductBook.query.filter_by(user_id=user_id).order_by(ProductBook.id.asc()).first()
    if book:
        return book

    book = ProductBook(
        nombre="Mi ProductBook",
        descripcion="Catálogo personal",
        user_id=user_id,
    )
    db.session.add(book)
    db.session.commit()
    return book
