import os
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

    SQLALCHEMY_DATABASE_URI = URL.create(
        "mysql+pymysql",
        username=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # =========================
    # JWT
    # =========================
    JWT_SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-key")

    # =========================
    # FLASK
    # =========================
    DEBUG = os.getenv("FLASK_DEBUG", "True") == "True"
