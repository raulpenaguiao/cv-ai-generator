from flask import Blueprint, jsonify

bp = Blueprint("api_keys", __name__)

_STUB_KEY = {
    "id": "stub-key-id-0001",
    "name": "My OpenAI Key (stub)",
    "provider": "openai",
    "createdAt": "2026-01-01T00:00:00Z",
}


@bp.get("/api-keys")
def list_keys():
    return jsonify([_STUB_KEY]), 200


@bp.post("/api-keys")
def add_key():
    return jsonify(_STUB_KEY), 201


@bp.put("/api-keys/<key_id>")
def update_key(key_id: str):
    return jsonify({**_STUB_KEY, "id": key_id}), 200


@bp.delete("/api-keys/<key_id>")
def delete_key(key_id: str):
    return "", 204
