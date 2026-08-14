from functools import wraps
from flask import request, jsonify
import jwt

from config import Config


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        token = request.headers.get("Authorization")

        if not token:
            return jsonify({
                "message": "Token is missing"
            }), 401

        try:
            token = token.replace("Bearer ", "")

            data = jwt.decode(
                token,
                Config.JWT_SECRET_KEY,
                algorithms=["HS256"]
            )

        except Exception:
            return jsonify({
                "message": "Invalid Token"
            }), 401

        return f(data, *args, **kwargs)

    return decorated