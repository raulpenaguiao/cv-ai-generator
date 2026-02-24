import json
import uuid

from flask import Blueprint, g, jsonify, request

from app.auth_utils import require_auth
from app.db import get_db

bp = Blueprint("projects", __name__)


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"] or "",
        "keywords": json.loads(row["keywords"]),
    }


@bp.get("/projects")
@require_auth
def list_projects():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM projects WHERE user_id = ?", (g.user_id,)
    ).fetchall()
    return jsonify([_row_to_dict(r) for r in rows]), 200


@bp.post("/projects")
@require_auth
def add_project():
    data = request.get_json(silent=True) or {}
    proj_id = str(uuid.uuid4())
    db = get_db()
    db.execute(
        "INSERT INTO projects (id, user_id, title, description, keywords) VALUES (?, ?, ?, ?, ?)",
        (
            proj_id,
            g.user_id,
            data.get("title"),
            data.get("description", ""),
            json.dumps(data.get("keywords", [])),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (proj_id,)).fetchone()
    return jsonify(_row_to_dict(row)), 201


@bp.put("/projects/<project_id>")
@require_auth
def update_project(project_id: str):
    data = request.get_json(silent=True) or {}
    db = get_db()
    db.execute(
        """UPDATE projects SET
            title       = ?,
            description = ?,
            keywords    = ?
           WHERE id = ? AND user_id = ?""",
        (
            data.get("title"),
            data.get("description", ""),
            json.dumps(data.get("keywords", [])),
            project_id,
            g.user_id,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_row_to_dict(row)), 200


@bp.delete("/projects/<project_id>")
@require_auth
def delete_project(project_id: str):
    db = get_db()
    db.execute(
        "DELETE FROM projects WHERE id = ? AND user_id = ?", (project_id, g.user_id)
    )
    db.commit()
    return "", 204
