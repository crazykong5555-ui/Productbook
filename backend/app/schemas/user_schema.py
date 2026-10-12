import re


def validate_user(data):
    if not isinstance(data, dict):
        return "Se requieren datos válidos"

    nombre = data.get("nombre")
    if not isinstance(nombre, str) or not nombre.strip():
        return "Nombre requerido"

    if len(nombre.strip()) > 100:
        return "El nombre no puede superar 100 caracteres"

    raw_email = data.get("email")
    if not isinstance(raw_email, str) or not raw_email.strip():
        return "Email requerido"

    email = raw_email.strip().lower()
    if len(email) > 100 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        return "Ingresa un email válido"

    password = data.get("password")
    if not isinstance(password, str) or not password:
        return "Password requerido"

    if len(password) < 8:
        return "La contraseña debe tener al menos 8 caracteres"
    if len(password) > 72:
        return "La contraseña no puede superar 72 caracteres"

    return None
