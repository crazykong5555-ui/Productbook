import os
import datetime
from sqlalchemy.engine import URL
from dotenv import load_dotenv

load_dotenv()


class Config:
    # =========================
    # DATABASE
    # =========================
    DB_USER = os.getenv("MYSQL_USER", "root")
    DB_PASSWORD = os.getenv("MYSQL_PASSWORD", "BaseDeDatos555")
    DB_HOST = os.getenv("MYSQL_HOST", "localhost")
    DB_PORT = int(os.getenv("MYSQL_PORT", "3306"))
    DB_NAME = os.getenv("MYSQL_DB", "productbook")

    DATABASE_URL = os.getenv("DATABASE_URL")
    if DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        SQLALCHEMY_DATABASE_URI = URL.create(
            "mysql+pymysql",
            username=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Evita caídas de conexión ("MySQL server has gone away")
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
        "pool_size": 10,
        "max_overflow": 20,
    }

    # =========================
    # JWT
    # =========================
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("JWT_SECRET", "clave_secreta_jwt_productbook_2026"))
    # Token dura 30 días en lugar de los 15 minutos por defecto de Flask-JWT-Extended
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(days=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_DAYS", "30")))

    # =========================
    # FLASK
    # =========================
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    PORT = int(os.getenv("PORT", "5000"))
