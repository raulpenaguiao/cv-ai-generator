from flask import Blueprint, jsonify

bp = Blueprint("job_descriptions", __name__)

_STUB_JOB = {
    "id": "stub-job-id-0001",
    "title": "Senior Backend Engineer (stub)",
    "company": "Startup Inc",
    "description": "Looking for a Python expert to build scalable APIs.",
    "analysis": None,
}


@bp.get("/job-descriptions")
def list_job_descriptions():
    return jsonify([_STUB_JOB]), 200


@bp.post("/job-descriptions")
def add_job_description():
    return jsonify({**_STUB_JOB, "id": "stub-job-id-new"}), 201


@bp.put("/job-descriptions/<job_id>")
def update_job_description(job_id: str):
    return jsonify({**_STUB_JOB, "id": job_id}), 200


@bp.delete("/job-descriptions/<job_id>")
def delete_job_description(job_id: str):
    return "", 204
