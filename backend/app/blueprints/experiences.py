import json
import uuid

from flask import Blueprint, g, jsonify, request

from app.auth_utils import require_auth
from app.db import get_db

bp = Blueprint("experiences", __name__)


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "category": row["category"],
        "title": row["title"],
        "organization": row["organization"],
        "startDate": row["start_date"],
        "endDate": row["end_date"],
        "description": row["description"] or "",
        "keywords": json.loads(row["keywords"]),
    }


@bp.get("/experiences")
@require_auth
def list_experiences():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM experiences WHERE user_id = ? ORDER BY start_date DESC",
        (g.user_id,),
    ).fetchall()
    return jsonify([_row_to_dict(r) for r in rows]), 200


@bp.post("/experiences")
@require_auth
def add_experience():
    data = request.get_json(silent=True) or {}
    exp_id = str(uuid.uuid4())
    db = get_db()
    db.execute(
        """INSERT INTO experiences
            (id, user_id, category, title, organization, start_date, end_date, description, keywords)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            exp_id,
            g.user_id,
            data.get("category"),
            data.get("title"),
            data.get("organization"),
            data.get("startDate"),
            data.get("endDate"),
            data.get("description", ""),
            json.dumps(data.get("keywords", [])),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM experiences WHERE id = ?", (exp_id,)).fetchone()
    return jsonify(_row_to_dict(row)), 201


@bp.put("/experiences/<exp_id>")
@require_auth
def update_experience(exp_id: str):
    data = request.get_json(silent=True) or {}
    db = get_db()
    db.execute(
        """UPDATE experiences SET
            category     = ?,
            title        = ?,
            organization = ?,
            start_date   = ?,
            end_date     = ?,
            description  = ?,
            keywords     = ?
           WHERE id = ? AND user_id = ?""",
        (
            data.get("category"),
            data.get("title"),
            data.get("organization"),
            data.get("startDate"),
            data.get("endDate"),
            data.get("description", ""),
            json.dumps(data.get("keywords", [])),
            exp_id,
            g.user_id,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM experiences WHERE id = ?", (exp_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_row_to_dict(row)), 200


@bp.delete("/experiences/<exp_id>")
@require_auth
def delete_experience(exp_id: str):
    db = get_db()
    db.execute(
        "DELETE FROM experiences WHERE id = ? AND user_id = ?", (exp_id, g.user_id)
    )
    db.commit()
    return "", 204
