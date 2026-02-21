from flask import Blueprint, jsonify

bp = Blueprint("auth", __name__)


@bp.post("/auth/register")
def register():
    return jsonify({
        "generatedPassword": "Stub-P@ssw0rd-42!",
        "userId": "stub-user-id-0001",
    }), 201


@bp.post("/auth/login")
def login():
    return jsonify({
        "token": "stub.jwt.token",
        "userId": "stub-user-id-0001",
    }), 200


@bp.post("/auth/logout")
def logout():
    return jsonify({"message": "Logged out (stub)"}), 200


@bp.post("/auth/reset-password/request")
def reset_password_request():
    return jsonify({"message": "Password reset email sent (stub)"}), 200


@bp.post("/auth/reset-password/confirm")
def reset_password_confirm():
    return jsonify({"message": "Password reset successful (stub)"}), 200
