from flask import jsonify

def register_error_handlers(app):

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Ruta no encontrada"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Error interno"}), 500

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Solicitud inválida"}), 400
