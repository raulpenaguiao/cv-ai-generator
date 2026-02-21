from flask import Blueprint, jsonify

bp = Blueprint("experiences", __name__)

_STUB_EXPERIENCES = [
    {
        "id": "stub-exp-id-0001",
        "category": "work",
        "title": "Senior Software Engineer (stub)",
        "organization": "Acme Corp",
        "startDate": "2022-01-01",
        "endDate": None,
        "description": "Built things with code.",
        "keywords": ["Python", "Flask", "PostgreSQL"],
    },
    {
        "id": "stub-exp-id-0002",
        "category": "education",
        "title": "BSc Computer Science (stub)",
        "organization": "University of Somewhere",
        "startDate": "2018-09-01",
        "endDate": "2022-06-01",
        "description": "Studied computer science.",
        "keywords": ["Algorithms", "Data Structures"],
    },
]


@bp.get("/experiences")
def list_experiences():
    return jsonify(_STUB_EXPERIENCES), 200


@bp.post("/experiences")
def add_experience():
    return jsonify({**_STUB_EXPERIENCES[0], "id": "stub-exp-id-new"}), 201


@bp.put("/experiences/<exp_id>")
def update_experience(exp_id: str):
    return jsonify({**_STUB_EXPERIENCES[0], "id": exp_id}), 200


@bp.delete("/experiences/<exp_id>")
def delete_experience(exp_id: str):
    return "", 204
