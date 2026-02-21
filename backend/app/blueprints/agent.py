from flask import Blueprint, jsonify

bp = Blueprint("agent", __name__)


@bp.post("/agent/generate-blurb")
def generate_blurb():
    return jsonify({
        "generatedBlurb": (
            "Stub blurb: results-driven professional with extensive experience in "
            "delivering high-quality solutions. Passionate about innovation and "
            "committed to exceeding expectations. [Replace with real AI output]"
        )
    }), 200


@bp.post("/agent/analyze-job")
def analyze_job():
    return jsonify({
        "keywords": ["Python", "Flask", "REST API", "PostgreSQL"],
        "requiredSkills": ["Backend development", "API design", "SQL"],
        "seniorityLevel": "Senior [stub]",
    }), 200
