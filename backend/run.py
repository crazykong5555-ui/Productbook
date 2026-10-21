import os
import re
import pymysql
from app import create_app
from app.config import Config
from app.extensions import db

app = create_app()


def ensure_database_exists():
    """Create the configured MySQL database before SQLAlchemy connects to it."""
    db_uri = str(app.config.get("SQLALCHEMY_DATABASE_URI", ""))
    if not db_uri.startswith("mysql"):
        return

    if not re.fullmatch(r"[A-Za-z0-9_]+", Config.DB_NAME):
        raise ValueError("MYSQL_DB solo puede contener letras, números y guion bajo")

    try:
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
    except pymysql.MySQLError as err:
        print(f"\n[AVISO] No se pudo conectar a MySQL para verificar la base de datos: {err}")
        print("Asegúrate de que el servicio MySQL esté corriendo y las credenciales en .env sean correctas.\n")
        raise err


if __name__ == "__main__":
    ensure_database_exists()
    with app.app_context():
        db.create_all()
    port = app.config.get("PORT", 5000)
    debug = app.config.get("DEBUG", True)
    print(f"\nServidor backend iniciado en http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
