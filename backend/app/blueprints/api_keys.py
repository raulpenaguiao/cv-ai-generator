import base64
import uuid

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from flask import Blueprint, current_app, g, jsonify, request

from app.auth_utils import require_auth
from app.db import get_db

bp = Blueprint("api_keys", __name__)

_HKDF_SALT = b"cv-ai-generator-api-keys"
_HKDF_INFO = b"api-key-encryption"


def _fernet() -> Fernet:
    raw = current_app.config["SECRET_KEY"].encode()
    derived = HKDF(
        algorithm=SHA256(),
        length=32,
        salt=_HKDF_SALT,
        info=_HKDF_INFO,
    ).derive(raw)
    return Fernet(base64.urlsafe_b64encode(derived))


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "provider": row["provider"],
        "createdAt": row["created_at"],
    }


@bp.get("/api-keys")
@require_auth
def list_keys():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
        (g.user_id,),
    ).fetchall()
    return jsonify([_row_to_dict(r) for r in rows]), 200


@bp.post("/api-keys")
@require_auth
def add_key():
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    provider = data.get("provider")
    key_value = data.get("key")

    if not name or not provider or not key_value:
        return jsonify({"error": "name, provider and key are required"}), 400

    encrypted = _fernet().encrypt(key_value.encode()).decode()
    key_id = str(uuid.uuid4())
    db = get_db()
    db.execute(
        "INSERT INTO api_keys (id, user_id, name, provider, encrypted_key) VALUES (?, ?, ?, ?, ?)",
        (key_id, g.user_id, name, provider, encrypted),
    )
    db.commit()
    row = db.execute("SELECT * FROM api_keys WHERE id = ?", (key_id,)).fetchone()
    return jsonify(_row_to_dict(row)), 201


@bp.put("/api-keys/<key_id>")
@require_auth
def update_key(key_id: str):
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    key_value = data.get("key")

    if not name:
        return jsonify({"error": "name is required"}), 400

    db = get_db()
    row = db.execute(
        "SELECT * FROM api_keys WHERE id = ? AND user_id = ?", (key_id, g.user_id)
    ).fetchone()
    if row is None:
        return jsonify({"error": "Not found"}), 404

    encrypted = (
        _fernet().encrypt(key_value.encode()).decode()
        if key_value
        else row["encrypted_key"]
    )
    db.execute(
        "UPDATE api_keys SET name = ?, encrypted_key = ? WHERE id = ? AND user_id = ?",
        (name, encrypted, key_id, g.user_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM api_keys WHERE id = ?", (key_id,)).fetchone()
    return jsonify(_row_to_dict(row)), 200


@bp.delete("/api-keys/<key_id>")
@require_auth
def delete_key(key_id: str):
    db = get_db()
    db.execute(
        "DELETE FROM api_keys WHERE id = ? AND user_id = ?", (key_id, g.user_id)
    )
    db.commit()
    return "", 204
