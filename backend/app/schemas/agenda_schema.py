def validate_agenda(data):
    if not data.get("nombre"):
        return "Nombre requerido"

    if not data.get("telefono"):
        return "Teléfono requerido"

    return None
