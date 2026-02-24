import uuid

from flask import Blueprint, g, jsonify, request

from app.auth_utils import require_auth
from app.db import get_db

bp = Blueprint("profile", __name__)


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "firstName": row["first_name"] or "",
        "lastName": row["last_name"] or "",
        "email": row["email"] or "",
        "phone": row["phone"] or "",
        "location": row["location"] or "",
        "website": row["website"] or "",
        "linkedin": row["linkedin"] or "",
        "github": row["github"] or "",
        "updatedAt": row["updated_at"],
    }


def _ensure_profile(db, user_id: str) -> None:
    db.execute(
        "INSERT OR IGNORE INTO profiles (id, user_id) VALUES (?, ?)",
        (str(uuid.uuid4()), user_id),
    )
    db.commit()


@bp.get("/profile")
@require_auth
def get_profile():
    db = get_db()
    _ensure_profile(db, g.user_id)
    row = db.execute(
        "SELECT * FROM profiles WHERE user_id = ?", (g.user_id,)
    ).fetchone()
    return jsonify(_row_to_dict(row)), 200


@bp.put("/profile")
@require_auth
def save_profile():
    data = request.get_json(silent=True) or {}
    db = get_db()
    _ensure_profile(db, g.user_id)
    db.execute(
        """UPDATE profiles SET
            first_name = ?,
            last_name  = ?,
            email      = ?,
            phone      = ?,
            location   = ?,
            website    = ?,
            linkedin   = ?,
            github     = ?,
            updated_at = datetime('now')
        WHERE user_id = ?""",
        (
            data.get("firstName"),
            data.get("lastName"),
            data.get("email"),
            data.get("phone"),
            data.get("location"),
            data.get("website"),
            data.get("linkedin"),
            data.get("github"),
            g.user_id,
        ),
    )
    db.commit()
    row = db.execute(
        "SELECT id, updated_at FROM profiles WHERE user_id = ?", (g.user_id,)
    ).fetchone()
    return jsonify({"id": row["id"], "updatedAt": row["updated_at"]}), 200


@bp.post("/profile/photos")
@require_auth
def upload_photo():
    return jsonify({"id": "stub", "filename": "stub.jpg", "isMain": False, "url": "https://placehold.co/200x200"}), 201


@bp.delete("/profile/photos/<photo_id>")
@require_auth
def delete_photo(photo_id: str):
    return "", 204


@bp.put("/profile/photos/<photo_id>/select-main")
@require_auth
def select_main_photo(photo_id: str):
    return jsonify({"message": "Main photo updated"}), 200
