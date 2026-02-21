from flask import Blueprint, jsonify, send_file

bp = Blueprint("latex", __name__)


@bp.post("/latex/compile")
def compile_cv():
    return jsonify({
        "pdfUrl": "/latex/download/stub-cv-output.pdf",
    }), 200


@bp.get("/latex/download/<filename>")
def download_pdf(filename: str):
    # Stub: returns a 404-style message until real compilation is implemented
    return jsonify({
        "error": {
            "code": "NOT_IMPLEMENTED",
            "message": f"PDF download not yet implemented. Requested: {filename}",
        }
    }), 501


@bp.get("/latex/download-tex/<filename>")
def download_tex(filename: str):
    return jsonify({
        "error": {
            "code": "NOT_IMPLEMENTED",
            "message": f".tex download not yet implemented. Requested: {filename}",
        }
    }), 501
