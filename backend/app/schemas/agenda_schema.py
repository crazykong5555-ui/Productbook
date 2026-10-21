def validate_agenda(data):
    if not isinstance(data, dict):
        return "Se requieren datos válidos en formato JSON"

    nombre = data.get("nombre")
    if not isinstance(nombre, str) or not nombre.strip():
        return "El nombre es obligatorio"

    if len(nombre.strip()) > 100:
        return "El nombre no puede superar 100 caracteres"

    telefono = data.get("telefono")
    if telefono and isinstance(telefono, str) and len(telefono.strip()) > 20:
        return "El teléfono no puede superar 20 caracteres"

    email = data.get("email")
    if email and isinstance(email, str) and len(email.strip()) > 100:
        return "El email no puede superar 100 caracteres"

    return None
