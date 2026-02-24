import io
import json
import uuid
import zipfile

from flask import Blueprint, g, jsonify, request, send_file

from app.auth_utils import require_auth
from app.blueprints.profile import _ensure_profile, _photos_dir
from app.db import get_db

bp = Blueprint("export_import", __name__)


@bp.get("/export")
@require_auth
def export_data():
    db = get_db()

    profile = db.execute(
        "SELECT * FROM profiles WHERE user_id = ?", (g.user_id,)
    ).fetchone()
    photos = db.execute(
        "SELECT * FROM photos WHERE user_id = ?", (g.user_id,)
    ).fetchall()
    experiences = db.execute(
        "SELECT * FROM experiences WHERE user_id = ?", (g.user_id,)
    ).fetchall()
    projects = db.execute(
        "SELECT * FROM projects WHERE user_id = ?", (g.user_id,)
    ).fetchall()
    job_descs = db.execute(
        "SELECT * FROM job_descriptions WHERE user_id = ?", (g.user_id,)
    ).fetchall()
    blurbs = db.execute(
        "SELECT * FROM blurbs WHERE user_id = ?", (g.user_id,)
    ).fetchall()
    api_keys = db.execute(
        "SELECT name, provider, created_at FROM api_keys WHERE user_id = ?",
        (g.user_id,),
    ).fetchall()

    data = {
        "version": 1,
        "profile": dict(profile) if profile else {},
        "photos": [
            {"id": r["id"], "filename": r["filename"], "isMain": bool(r["is_main"])}
            for r in photos
        ],
        "experiences": [
            {**dict(e), "keywords": json.loads(e["keywords"] or "[]")}
            for e in experiences
        ],
        "projects": [
            {**dict(p), "keywords": json.loads(p["keywords"] or "[]")}
            for p in projects
        ],
        "jobDescriptions": [
            {
                **dict(j),
                "analysisJson": json.loads(j["analysis_json"])
                if j["analysis_json"]
                else None,
            }
            for j in job_descs
        ],
        "blurbs": [dict(b) for b in blurbs],
        # Encrypted keys cannot be transferred — export names only as a reminder
        "apiKeysMetadata": [
            {"name": k["name"], "provider": k["provider"], "createdAt": k["created_at"]}
            for k in api_keys
        ],
    }

    photos_dir = _photos_dir()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("data.json", json.dumps(data, indent=2, default=str))
        for photo in photos:
            path = photos_dir / photo["filename"]
            if path.exists():
                zf.write(str(path), f"photos/{photo['filename']}")

    buf.seek(0)
    return send_file(
        buf,
        mimetype="application/zip",
        as_attachment=True,
        download_name="cv-export.zip",
    )


@bp.post("/import")
@require_auth
def import_data():
    if "file" not in request.files:
        return jsonify({"error": {"code": "NO_FILE", "message": "No file provided"}}), 400

    raw = request.files["file"].read()
    buf = io.BytesIO(raw)
    try:
        zf = zipfile.ZipFile(buf, "r")
    except zipfile.BadZipFile:
        return (
            jsonify({"error": {"code": "BAD_ZIP", "message": "Not a valid zip file"}}),
            400,
        )

    with zf:
        if "data.json" not in zf.namelist():
            return (
                jsonify(
                    {"error": {"code": "MISSING_DATA", "message": "data.json not found in zip"}}
                ),
                400,
            )

        data = json.loads(zf.read("data.json"))
        db = get_db()

        # --- Profile ---
        profile_data = data.get("profile", {})
        if profile_data:
            _ensure_profile(db, g.user_id)
            db.execute(
                """UPDATE profiles SET
                    first_name = ?, last_name = ?, email = ?,
                    phone = ?, location = ?, website = ?,
                    linkedin = ?, github = ?,
                    updated_at = datetime('now')
                WHERE user_id = ?""",
                (
                    profile_data.get("first_name") or profile_data.get("firstName"),
                    profile_data.get("last_name") or profile_data.get("lastName"),
                    profile_data.get("email"),
                    profile_data.get("phone"),
                    profile_data.get("location"),
                    profile_data.get("website"),
                    profile_data.get("linkedin"),
                    profile_data.get("github"),
                    g.user_id,
                ),
            )

        # --- Photos ---
        photos_dir = _photos_dir()
        db.execute("DELETE FROM photos WHERE user_id = ?", (g.user_id,))
        for meta in data.get("photos", []):
            zip_path = f"photos/{meta['filename']}"
            if zip_path in zf.namelist():
                (photos_dir / meta["filename"]).write_bytes(zf.read(zip_path))
            db.execute(
                "INSERT OR REPLACE INTO photos (id, user_id, filename, is_main) VALUES (?, ?, ?, ?)",
                (
                    meta["id"],
                    g.user_id,
                    meta["filename"],
                    1 if meta.get("isMain") else 0,
                ),
            )

        # --- Experiences ---
        db.execute("DELETE FROM experiences WHERE user_id = ?", (g.user_id,))
        for exp in data.get("experiences", []):
            db.execute(
                """INSERT INTO experiences
                    (id, user_id, category, title, organization, start_date, end_date, description, keywords)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    exp.get("id") or str(uuid.uuid4()),
                    g.user_id,
                    exp["category"],
                    exp["title"],
                    exp["organization"],
                    exp["start_date"],
                    exp.get("end_date"),
                    exp.get("description"),
                    json.dumps(exp.get("keywords", [])),
                ),
            )

        # --- Projects ---
        db.execute("DELETE FROM projects WHERE user_id = ?", (g.user_id,))
        for proj in data.get("projects", []):
            db.execute(
                "INSERT INTO projects (id, user_id, title, description, keywords) VALUES (?, ?, ?, ?, ?)",
                (
                    proj.get("id") or str(uuid.uuid4()),
                    g.user_id,
                    proj["title"],
                    proj.get("description"),
                    json.dumps(proj.get("keywords", [])),
                ),
            )

        # --- Job descriptions (must come before blurbs for FK) ---
        db.execute("DELETE FROM job_descriptions WHERE user_id = ?", (g.user_id,))
        for jd in data.get("jobDescriptions", []):
            db.execute(
                """INSERT INTO job_descriptions
                    (id, user_id, title, company, description, analysis_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    jd.get("id") or str(uuid.uuid4()),
                    g.user_id,
                    jd["title"],
                    jd["company"],
                    jd["description"],
                    json.dumps(jd["analysisJson"]) if jd.get("analysisJson") else None,
                    jd.get("created_at") or "datetime('now')",
                ),
            )

        # --- Blurbs ---
        db.execute("DELETE FROM blurbs WHERE user_id = ?", (g.user_id,))
        for blurb in data.get("blurbs", []):
            db.execute(
                """INSERT INTO blurbs
                    (id, user_id, type, content, job_description_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    blurb.get("id") or str(uuid.uuid4()),
                    g.user_id,
                    blurb["type"],
                    blurb["content"],
                    blurb.get("job_description_id"),
                    blurb.get("created_at") or "datetime('now')",
                ),
            )

        db.commit()

    return jsonify({"message": "Import successful"}), 200
