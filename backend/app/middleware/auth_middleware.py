from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def require_auth():
    verify_jwt_in_request()
    return get_jwt_identity()
