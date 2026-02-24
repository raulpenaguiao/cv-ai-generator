import base64
import json

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from flask import Blueprint, current_app, g, jsonify, request
from openai import OpenAI

from app.auth_utils import require_auth
from app.db import get_db

bp = Blueprint("agent", __name__)

_HKDF_SALT = b"cv-ai-generator-api-keys"
_HKDF_INFO = b"api-key-encryption"

_BLURB_TYPE_DESCRIPTIONS = {
    "summary": "a 2-3 sentence professional summary",
    "skills": "a concise list of key technical and soft skills",
    "motivation": "a short paragraph about motivation for the role",
    "closing": "a confident one-sentence closing statement for a CV",
}


def _fernet() -> Fernet:
    raw = current_app.config["SECRET_KEY"].encode()
    derived = HKDF(
        algorithm=SHA256(),
        length=32,
        salt=_HKDF_SALT,
        info=_HKDF_INFO,
    ).derive(raw)
    return Fernet(base64.urlsafe_b64encode(derived))


def _get_openai_key(db, user_id: str) -> str | None:
    row = db.execute(
        "SELECT encrypted_key FROM api_keys WHERE user_id = ? AND provider = 'openai' LIMIT 1",
        (user_id,),
    ).fetchone()
    if not row:
        return None
    return _fernet().decrypt(row["encrypted_key"].encode()).decode()


@bp.post("/agent/generate-blurb")
@require_auth
def generate_blurb():
    data = request.get_json(silent=True) or {}
    blurb_type = data.get("type", "summary")
    mode = data.get("mode", "full")
    previous_blurb = data.get("previousBlurb")
    job_description_id = data.get("jobDescriptionId")

    db = get_db()
    api_key = _get_openai_key(db, g.user_id)
    if not api_key:
        return jsonify({"error": "No OpenAI API key configured. Add one in Settings."}), 400

    job_text = ""
    if job_description_id:
        row = db.execute(
            "SELECT title, company, description FROM job_descriptions WHERE id = ? AND user_id = ?",
            (job_description_id, g.user_id),
        ).fetchone()
        if row:
            job_text = (
                f"\n\nTarget Job:\nTitle: {row['title']}"
                f"\nCompany: {row['company']}"
                f"\nDescription: {row['description']}"
            )

    type_desc = _BLURB_TYPE_DESCRIPTIONS.get(blurb_type, blurb_type)

    if mode == "full":
        prompt = f"Write {type_desc} for a CV.{job_text}\n\nReturn only the text, no preamble."
    elif mode == "modify":
        prompt = (
            f"Improve and rephrase this {blurb_type} blurb for a CV:\n\n"
            f"{previous_blurb}{job_text}\n\nReturn only the improved text."
        )
    else:  # double-check
        prompt = (
            f"Fix any grammar, spelling, and ATS-friendliness issues in this {blurb_type} blurb. "
            f"Return only the corrected text:\n\n{previous_blurb}"
        )

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a professional CV writing assistant. Be concise and impactful.",
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=400,
        temperature=0.7,
    )
    generated = response.choices[0].message.content.strip()
    return jsonify({"generatedBlurb": generated}), 200


@bp.post("/agent/analyze-job")
@require_auth
def analyze_job():
    data = request.get_json(silent=True) or {}
    job_description_id = data.get("jobDescriptionId")

    if not job_description_id:
        return jsonify({"error": "jobDescriptionId is required"}), 400

    db = get_db()
    api_key = _get_openai_key(db, g.user_id)
    if not api_key:
        return jsonify({"error": "No OpenAI API key configured. Add one in Settings."}), 400

    row = db.execute(
        "SELECT * FROM job_descriptions WHERE id = ? AND user_id = ?",
        (job_description_id, g.user_id),
    ).fetchone()
    if not row:
        return jsonify({"error": "Job description not found"}), 404

    prompt = (
        f"Analyze this job description and return a JSON object with exactly these keys:\n"
        f'- "keywords": array of important keywords/technologies (max 10)\n'
        f'- "requiredSkills": array of required skills (max 8)\n'
        f'- "seniorityLevel": a single string like "Junior", "Mid-level", "Senior", or "Lead"\n\n'
        f"Job Title: {row['title']}\nCompany: {row['company']}\nDescription: {row['description']}\n\n"
        f"Return only valid JSON, no markdown or explanation."
    )

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a job description analyst. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=300,
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    analysis = json.loads(response.choices[0].message.content)

    db.execute(
        "UPDATE job_descriptions SET analysis_json = ? WHERE id = ?",
        (json.dumps(analysis), job_description_id),
    )
    db.commit()

    return jsonify(analysis), 200
