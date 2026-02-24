import uuid

from flask import Blueprint, g, jsonify, request

from app.auth_utils import require_auth
from app.db import get_db

bp = Blueprint("blurbs", __name__)


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "type": row["type"],
        "content": row["content"],
        "jobDescriptionId": row["job_description_id"],
    }


@bp.get("/blurbs")
@require_auth
def list_blurbs():
    db = get_db()
    job_description_id = request.args.get("jobDescriptionId")
    if job_description_id:
        rows = db.execute(
            "SELECT * FROM blurbs WHERE user_id = ? AND job_description_id = ? ORDER BY created_at DESC",
            (g.user_id, job_description_id),
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM blurbs WHERE user_id = ? ORDER BY created_at DESC",
            (g.user_id,),
        ).fetchall()
    return jsonify([_row_to_dict(r) for r in rows]), 200


@bp.post("/blurbs")
@require_auth
def save_blurb():
    data = request.get_json(silent=True) or {}
    blurb_id = str(uuid.uuid4())
    db = get_db()
    db.execute(
        """INSERT INTO blurbs (id, user_id, type, content, job_description_id)
           VALUES (?, ?, ?, ?, ?)""",
        (
            blurb_id,
            g.user_id,
            data.get("type"),
            data.get("content"),
            data.get("jobDescriptionId"),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM blurbs WHERE id = ?", (blurb_id,)).fetchone()
    return jsonify(_row_to_dict(row)), 201


@bp.put("/blurbs/<blurb_id>")
@require_auth
def update_blurb(blurb_id: str):
    data = request.get_json(silent=True) or {}
    db = get_db()
    db.execute(
        "UPDATE blurbs SET content = ? WHERE id = ? AND user_id = ?",
        (data.get("content"), blurb_id, g.user_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM blurbs WHERE id = ?", (blurb_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_row_to_dict(row)), 200


@bp.delete("/blurbs/<blurb_id>")
@require_auth
def delete_blurb(blurb_id: str):
    db = get_db()
    db.execute(
        "DELETE FROM blurbs WHERE id = ? AND user_id = ?", (blurb_id, g.user_id)
    )
    db.commit()
    return "", 204
