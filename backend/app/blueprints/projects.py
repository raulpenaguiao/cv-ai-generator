from flask import Blueprint, jsonify

bp = Blueprint("projects", __name__)

_STUB_PROJECTS = [
    {
        "id": "stub-proj-id-0001",
        "title": "CV AI Generator (stub)",
        "description": "AI-powered CV builder using Flask and React.",
        "keywords": ["Python", "React", "OpenAI"],
    },
]


@bp.get("/projects")
def list_projects():
    return jsonify(_STUB_PROJECTS), 200


@bp.post("/projects")
def add_project():
    return jsonify({**_STUB_PROJECTS[0], "id": "stub-proj-id-new"}), 201


@bp.put("/projects/<project_id>")
def update_project(project_id: str):
    return jsonify({**_STUB_PROJECTS[0], "id": project_id}), 200


@bp.delete("/projects/<project_id>")
def delete_project(project_id: str):
    return "", 204
