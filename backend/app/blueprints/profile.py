import uuid
from pathlib import Path

from flask import Blueprint, current_app, g, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from app.auth_utils import require_auth
from app.db import get_db

bp = Blueprint("profile", __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}


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


def _photos_dir() -> Path:
    d = Path(current_app.instance_path) / "uploads" / "photos"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _photo_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "filename": row["filename"],
        "isMain": bool(row["is_main"]),
        "url": f"/profile/photos/{row['id']}/file",
    }


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


@bp.get("/profile/photos")
@require_auth
def list_photos():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM photos WHERE user_id = ? ORDER BY is_main DESC",
        (g.user_id,),
    ).fetchall()
    return jsonify([_photo_to_dict(r) for r in rows]), 200


@bp.post("/profile/photos")
@require_auth
def upload_photo():
    if "photo" not in request.files:
        return jsonify({"error": {"code": "NO_FILE", "message": "No photo provided"}}), 400
    file = request.files["photo"]
    if not file.filename or not _allowed(file.filename):
        return jsonify({"error": {"code": "INVALID_TYPE", "message": "Unsupported file type"}}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    photo_id = str(uuid.uuid4())
    filename = f"{photo_id}.{ext}"

    file.save(str(_photos_dir() / filename))

    db = get_db()
    count = db.execute(
        "SELECT COUNT(*) FROM photos WHERE user_id = ?", (g.user_id,)
    ).fetchone()[0]
    is_main = 1 if count == 0 else 0

    db.execute(
        "INSERT INTO photos (id, user_id, filename, is_main) VALUES (?, ?, ?, ?)",
        (photo_id, g.user_id, filename, is_main),
    )
    db.commit()
    row = db.execute("SELECT * FROM photos WHERE id = ?", (photo_id,)).fetchone()
    return jsonify(_photo_to_dict(row)), 201


@bp.delete("/profile/photos/<photo_id>")
@require_auth
def delete_photo(photo_id: str):
    db = get_db()
    row = db.execute(
        "SELECT * FROM photos WHERE id = ? AND user_id = ?", (photo_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({"error": {"code": "NOT_FOUND", "message": "Photo not found"}}), 404

    try:
        (_photos_dir() / row["filename"]).unlink(missing_ok=True)
    except Exception:
        pass

    db.execute("DELETE FROM photos WHERE id = ?", (photo_id,))
    db.commit()
    return "", 204


@bp.put("/profile/photos/<photo_id>/select-main")
@require_auth
def select_main_photo(photo_id: str):
    db = get_db()
    row = db.execute(
        "SELECT id FROM photos WHERE id = ? AND user_id = ?", (photo_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({"error": {"code": "NOT_FOUND", "message": "Photo not found"}}), 404

    db.execute("UPDATE photos SET is_main = 0 WHERE user_id = ?", (g.user_id,))
    db.execute("UPDATE photos SET is_main = 1 WHERE id = ?", (photo_id,))
    db.commit()
    return jsonify({"message": "Main photo updated"}), 200


@bp.get("/profile/photos/<photo_id>/file")
@require_auth
def serve_photo(photo_id: str):
    db = get_db()
    row = db.execute(
        "SELECT * FROM photos WHERE id = ? AND user_id = ?", (photo_id, g.user_id)
    ).fetchone()
    if not row:
        return jsonify({"error": {"code": "NOT_FOUND", "message": "Photo not found"}}), 404

    return send_from_directory(str(_photos_dir()), row["filename"])
