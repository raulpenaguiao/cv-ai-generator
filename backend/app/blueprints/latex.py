import json
import subprocess
import uuid
from pathlib import Path

from flask import Blueprint, current_app, g, jsonify, request, send_file

from app.auth_utils import require_auth
from app.db import get_db

bp = Blueprint("latex", __name__)

_LATEX_SPECIAL = str.maketrans({
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
    "\\": r"\textbackslash{}",
})


def _e(text: str) -> str:
    """Escape special LaTeX characters."""
    return (text or "").translate(_LATEX_SPECIAL)


def _output_dir() -> Path:
    d = Path(current_app.instance_path) / "compiled"
    d.mkdir(exist_ok=True)
    return d


def _pdflatex_available() -> bool:
    try:
        subprocess.run(["pdflatex", "--version"], capture_output=True, timeout=5)
        return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _build_tex(profile: dict, blurbs: list, experiences: list, projects: list, font_size: int) -> str:
    # Header
    first = _e(profile.get("first_name") or "")
    last = _e(profile.get("last_name") or "")
    name = f"{first} {last}".strip() or "Your Name"

    contact_parts = []
    if profile.get("email"):
        contact_parts.append(_e(profile["email"]))
    if profile.get("phone"):
        contact_parts.append(_e(profile["phone"]))
    if profile.get("location"):
        contact_parts.append(_e(profile["location"]))
    if profile.get("website"):
        contact_parts.append(rf"\href{{{_e(profile['website'])}}}{{{_e(profile['website'])}}}")
    if profile.get("linkedin"):
        contact_parts.append(rf"\href{{{_e(profile['linkedin'])}}}{{{_e(profile['linkedin'])}}}")
    if profile.get("github"):
        contact_parts.append(rf"\href{{{_e(profile['github'])}}}{{{_e(profile['github'])}}}")
    contact_line = r" $\cdot$ ".join(contact_parts)

    # Blurbs
    blurb_map = {b["type"]: b["content"] for b in blurbs}

    summary_tex = ""
    if blurb_map.get("summary"):
        summary_tex = f"\\section{{Summary}}\n{_e(blurb_map['summary'])}\n"

    skills_tex = ""
    if blurb_map.get("skills"):
        skills_tex = f"\\section{{Skills}}\n{_e(blurb_map['skills'])}\n"

    motivation_tex = ""
    if blurb_map.get("motivation"):
        motivation_tex = f"\\section{{Motivation}}\n{_e(blurb_map['motivation'])}\n"

    closing_tex = ""
    if blurb_map.get("closing"):
        closing_tex = f"\\section{{Closing Statement}}\n{_e(blurb_map['closing'])}\n"

    # Experiences
    exp_tex = ""
    if experiences:
        items = []
        for exp in experiences:
            start = _e(exp.get("start_date") or "")
            end = _e(exp.get("end_date") or "Present")
            desc = _e(exp.get("description") or "")
            keywords = json.loads(exp.get("keywords") or "[]")
            kw_line = f"\n\n\\textit{{Keywords: {_e(', '.join(keywords))}}}" if keywords else ""
            desc_line = f"\n\n{desc}" if desc else ""
            items.append(
                f"\\textbf{{{_e(exp['title'])}}} \\hfill {start} -- {end} \\\\\n"
                f"\\textit{{{_e(exp['organization'])}}}"
                f"{desc_line}{kw_line}"
            )
        exp_tex = "\\section{Experience}\n" + "\n\n\\medskip\n\n".join(items) + "\n"

    # Projects
    proj_tex = ""
    if projects:
        items = []
        for proj in projects:
            desc = _e(proj.get("description") or "")
            keywords = json.loads(proj.get("keywords") or "[]")
            kw_line = f"\n\n\\textit{{Keywords: {_e(', '.join(keywords))}}}" if keywords else ""
            desc_line = f"\n\n{desc}" if desc else ""
            items.append(
                f"\\textbf{{{_e(proj['title'])}}}"
                f"{desc_line}{kw_line}"
            )
        proj_tex = "\\section{Projects}\n" + "\n\n\\medskip\n\n".join(items) + "\n"

    return rf"""
\documentclass[{font_size}pt, a4paper]{{article}}
\usepackage[margin=2cm]{{geometry}}
\usepackage[T1]{{fontenc}}
\usepackage{{lmodern}}
\usepackage[hidelinks]{{hyperref}}
\usepackage{{titlesec}}
\usepackage{{parskip}}
\usepackage{{xcolor}}

\definecolor{{accent}}{{HTML}}{{2563EB}}

\hypersetup{{colorlinks=true, urlcolor=accent}}

\titleformat{{\section}}{{\large\bfseries\color{{accent}}}}{{}}{{0em}}{{}}[\titlerule]
\titlespacing{{\section}}{{0pt}}{{1.2ex}}{{0.6ex}}

\pagestyle{{empty}}

\begin{{document}}

\begin{{center}}
  {{\LARGE\bfseries {name}}}\\[0.4em]
  {contact_line}
\end{{center}}

\vspace{{0.5em}}

{summary_tex}
{skills_tex}
{exp_tex}
{proj_tex}
{motivation_tex}
{closing_tex}

\end{{document}}
""".strip()


@bp.post("/latex/compile")
@require_auth
def compile_cv():
    if not _pdflatex_available():
        return jsonify({"error": "pdflatex is not installed on this server"}), 501

    data = request.get_json(silent=True) or {}
    font_size = int(data.get("fontSize", 11))
    blurb_ids = data.get("blurbIds", [])
    exp_ids = data.get("experienceIds", [])
    proj_ids = data.get("projectIds", [])

    db = get_db()

    profile_row = db.execute(
        "SELECT * FROM profiles WHERE user_id = ?", (g.user_id,)
    ).fetchone()
    profile = dict(profile_row) if profile_row else {}

    def fetch_by_ids(table: str, ids: list) -> list:
        if not ids:
            return []
        placeholders = ",".join("?" * len(ids))
        rows = db.execute(
            f"SELECT * FROM {table} WHERE id IN ({placeholders}) AND user_id = ?",
            (*ids, g.user_id),
        ).fetchall()
        return [dict(r) for r in rows]

    blurbs = fetch_by_ids("blurbs", blurb_ids)
    experiences = fetch_by_ids("experiences", exp_ids)
    projects = fetch_by_ids("projects", proj_ids)

    tex_content = _build_tex(profile, blurbs, experiences, projects, font_size)

    out_dir = _output_dir()
    job_id = str(uuid.uuid4())
    tex_path = out_dir / f"{job_id}.tex"
    tex_path.write_text(tex_content, encoding="utf-8")

    result = subprocess.run(
        [
            "pdflatex",
            "-interaction=nonstopmode",
            "-output-directory", str(out_dir),
            str(tex_path),
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )

    pdf_path = out_dir / f"{job_id}.pdf"
    if not pdf_path.exists():
        return jsonify({"error": "LaTeX compilation failed", "details": result.stdout[-2000:]}), 500

    return jsonify({"pdfUrl": f"/latex/download/{job_id}.pdf"}), 200


@bp.get("/latex/download/<filename>")
@require_auth
def download_pdf(filename: str):
    if not filename.endswith(".pdf") or "/" in filename or ".." in filename:
        return jsonify({"error": "Invalid filename"}), 400
    path = _output_dir() / filename
    if not path.exists():
        return jsonify({"error": "File not found"}), 404
    return send_file(path, mimetype="application/pdf", as_attachment=True, download_name="cv.pdf")


@bp.get("/latex/download-tex/<filename>")
@require_auth
def download_tex(filename: str):
    if not filename.endswith(".pdf") or "/" in filename or ".." in filename:
        return jsonify({"error": "Invalid filename"}), 400
    tex_path = _output_dir() / filename.replace(".pdf", ".tex")
    if not tex_path.exists():
        return jsonify({"error": "File not found"}), 404
    return send_file(tex_path, mimetype="text/plain", as_attachment=True, download_name="cv.tex")
