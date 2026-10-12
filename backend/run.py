import re
import pymysql
from app import create_app
from app.config import Config
from app.extensions import db

app = create_app()

def ensure_database_exists():
    """Create the configured MySQL database before SQLAlchemy connects to it."""
    if not re.fullmatch(r"[A-Za-z0-9_]+", Config.DB_NAME):
        raise ValueError("MYSQL_DB solo puede contener letras, números y guion bajo")

    connection = pymysql.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        charset="utf8mb4",
        autocommit=True,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
    finally:
        connection.close()


if __name__ == "__main__":
    ensure_database_exists()
    with app.app_context():
        db.create_all()
    app.run(debug=app.config["DEBUG"])
