from flask import Blueprint, jsonify

bp = Blueprint("blurbs", __name__)

_STUB_BLURB = {
    "id": "stub-blurb-id-0001",
    "type": "summary",
    "content": "Stub summary blurb — replace me with real AI-generated content.",
    "jobDescriptionId": None,
    "createdAt": "2026-01-01T00:00:00Z",
}


@bp.get("/blurbs")
def list_blurbs():
    return jsonify([_STUB_BLURB]), 200


@bp.post("/blurbs")
def save_blurb():
    return jsonify({**_STUB_BLURB, "id": "stub-blurb-id-new"}), 201


@bp.put("/blurbs/<blurb_id>")
def update_blurb(blurb_id: str):
    return jsonify({**_STUB_BLURB, "id": blurb_id}), 200


@bp.delete("/blurbs/<blurb_id>")
def delete_blurb(blurb_id: str):
    return "", 204
