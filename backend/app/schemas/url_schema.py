def validate_url(data):
    if not isinstance(data, dict):
        return "Se requieren datos válidos en formato JSON"

    producto = data.get("producto")
    if not isinstance(producto, str) or not producto.strip():
        return "El nombre del producto es obligatorio"

    if len(producto.strip()) > 255:
        return "El nombre del producto no puede superar 255 caracteres"

    raw_price = data.get("valor")
    if raw_price not in (None, ""):
        try:
            price = float(raw_price)
            if price < 0:
                return "El precio debe ser un número igual o mayor que cero"
        except (TypeError, ValueError):
            return "El precio debe ser un número igual o mayor que cero"

    return None
