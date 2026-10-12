def validate_productbook(data):
    if not data.get("nombre"):
        return "Nombre requerido"
    return None
