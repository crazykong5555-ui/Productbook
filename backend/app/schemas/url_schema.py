def validate_url(data):
    if not data.get("producto"):
        return "Producto requerido"

    if not data.get("productbook_id"):
        return "productbook_id requerido"

    return None
