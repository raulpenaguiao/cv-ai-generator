import json
import uuid

from flask import Blueprint, g, jsonify, request

from app.auth_utils import require_auth
from app.db import get_db

bp = Blueprint("job_descriptions", __name__)


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "company": row["company"],
        "description": row["description"],
        "analysis": json.loads(row["analysis_json"]) if row["analysis_json"] else None,
    }


@bp.get("/job-descriptions")
@require_auth
def list_job_descriptions():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM job_descriptions WHERE user_id = ? ORDER BY created_at DESC",
        (g.user_id,),
    ).fetchall()
    return jsonify([_row_to_dict(r) for r in rows]), 200


@bp.post("/job-descriptions")
@require_auth
def add_job_description():
    data = request.get_json(silent=True) or {}
    job_id = str(uuid.uuid4())
    db = get_db()
    db.execute(
        """INSERT INTO job_descriptions (id, user_id, title, company, description)
           VALUES (?, ?, ?, ?, ?)""",
        (
            job_id,
            g.user_id,
            data.get("title"),
            data.get("company"),
            data.get("description"),
        ),
    )
    db.commit()
    row = db.execute(
        "SELECT * FROM job_descriptions WHERE id = ?", (job_id,)
    ).fetchone()
    return jsonify(_row_to_dict(row)), 201


@bp.put("/job-descriptions/<job_id>")
@require_auth
def update_job_description(job_id: str):
    data = request.get_json(silent=True) or {}
    db = get_db()
    db.execute(
        """UPDATE job_descriptions SET
            title       = ?,
            company     = ?,
            description = ?
           WHERE id = ? AND user_id = ?""",
        (
            data.get("title"),
            data.get("company"),
            data.get("description"),
            job_id,
            g.user_id,
        ),
    )
    db.commit()
    row = db.execute(
        "SELECT * FROM job_descriptions WHERE id = ?", (job_id,)
    ).fetchone()
    if row is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_row_to_dict(row)), 200


@bp.delete("/job-descriptions/<job_id>")
@require_auth
def delete_job_description(job_id: str):
    db = get_db()
    db.execute(
        "DELETE FROM job_descriptions WHERE id = ? AND user_id = ?", (job_id, g.user_id)
    )
    db.commit()
    return "", 204
