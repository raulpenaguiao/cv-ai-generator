import sqlite3
from pathlib import Path

from flask import Flask, g, current_app


def get_db() -> sqlite3.Connection:
    """Return the database connection for the current request context."""
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(e=None) -> None:
    """Close the database connection at the end of the request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app: Flask) -> None:
    """Create all tables on first run (CREATE TABLE IF NOT EXISTS)."""
    schema_path = Path(__file__).parent / "schema.sql"
    with app.app_context():
        db = get_db()
        with open(schema_path, "r") as f:
            db.executescript(f.read())
        db.commit()
