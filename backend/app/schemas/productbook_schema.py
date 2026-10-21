def validate_productbook(data):
    if not isinstance(data, dict):
        return "Se requieren datos válidos en formato JSON"

    nombre = data.get("nombre")
    if not isinstance(nombre, str) or not nombre.strip():
        return "El nombre es obligatorio"

    if len(nombre.strip()) > 100:
        return "El nombre no puede superar 100 caracteres"

    return None
