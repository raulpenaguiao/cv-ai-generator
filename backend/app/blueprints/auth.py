import secrets
import uuid

import bcrypt
from flask import Blueprint, jsonify, request

from app.auth_utils import generate_token
from app.db import get_db

bp = Blueprint("auth", __name__)


@bp.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required"}), 400

    db = get_db()
    if db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
        return jsonify({"error": "Email already registered"}), 409

    password = secrets.token_urlsafe(12)
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user_id = str(uuid.uuid4())

    db.execute(
        "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
        (user_id, email, password_hash),
    )
    db.commit()

    return jsonify({"generatedPassword": password, "userId": user_id}), 201


@bp.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_db()
    user = db.execute(
        "SELECT id, password_hash FROM users WHERE email = ?", (email,)
    ).fetchone()

    if not user or not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(user["id"])
    return jsonify({"token": token, "userId": user["id"]}), 200


@bp.post("/auth/logout")
def logout():
    return jsonify({"message": "Logged out"}), 200


@bp.post("/auth/reset-password/request")
def reset_password_request():
    return jsonify({"message": "Password reset not yet implemented"}), 200


@bp.post("/auth/reset-password/confirm")
def reset_password_confirm():
    return jsonify({"message": "Password reset not yet implemented"}), 200
