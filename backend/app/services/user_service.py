from app.models.user import User
from app.models.productbook import ProductBook
from app.extensions import db, bcrypt
from sqlalchemy.exc import IntegrityError


def create_user(data):
    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        nombre=data["nombre"].strip(),
        email=data["email"].strip().lower(),
        password=hashed,
    )

    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return None, "El email ya está registrado"

    # Create initial productbook for user
    default_pb = ProductBook(
        nombre="Mi ProductBook",
        descripcion="Catálogo personal",
        user_id=user.id,
    )
    db.session.add(default_pb)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    return user, None


def get_user_by_email(email):
    if not isinstance(email, str) or not email.strip():
        return None
    return User.query.filter_by(email=email.strip().lower()).first()


def verify_password(user, password):
    return bool(
        user
        and isinstance(password, str)
        and password
        and bcrypt.check_password_hash(user.password, password)
    )
