"""Tests that the database schema is created correctly."""
import pytest
from app.db import get_db

EXPECTED_TABLES = {
    "users",
    "profiles",
    "photos",
    "experiences",
    "projects",
    "job_descriptions",
    "blurbs",
    "api_keys",
}

EXPECTED_COLUMNS = {
    "users": {"id", "email", "password_hash", "created_at"},
    "profiles": {
        "id", "user_id", "first_name", "last_name", "email",
        "phone", "location", "website", "linkedin", "github", "updated_at",
    },
    "photos": {"id", "user_id", "filename", "is_main"},
    "experiences": {
        "id", "user_id", "category", "title", "organization",
        "start_date", "end_date", "description", "keywords",
    },
    "projects": {"id", "user_id", "title", "description", "keywords"},
    "job_descriptions": {
        "id", "user_id", "title", "company", "description", "analysis_json", "created_at",
    },
    "blurbs": {"id", "user_id", "type", "content", "job_description_id", "created_at"},
    "api_keys": {"id", "user_id", "name", "provider", "encrypted_key", "created_at"},
}


def test_all_tables_exist(app):
    with app.app_context():
        db = get_db()
        rows = db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).fetchall()
        actual = {row["name"] for row in rows}
        assert EXPECTED_TABLES == actual, (
            f"Missing tables: {EXPECTED_TABLES - actual}. "
            f"Unexpected tables: {actual - EXPECTED_TABLES}."
        )


def test_table_columns(app):
    with app.app_context():
        db = get_db()
        for table, expected_cols in EXPECTED_COLUMNS.items():
            info = db.execute(f"PRAGMA table_info({table})").fetchall()
            actual_cols = {row["name"] for row in info}
            assert expected_cols == actual_cols, (
                f"Table '{table}': missing {expected_cols - actual_cols}, "
                f"unexpected {actual_cols - expected_cols}."
            )


def test_foreign_keys_enabled(app):
    with app.app_context():
        db = get_db()
        row = db.execute("PRAGMA foreign_keys").fetchone()
        assert row[0] == 1, "Foreign key enforcement should be ON."


def test_experiences_category_constraint(app):
    """The category column only accepts 'work', 'education', 'hobby'."""
    import sqlite3
    with app.app_context():
        db = get_db()
        db.execute(
            "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
            ("u1", "test@test.com", "hash"),
        )
        db.commit()

        # Valid category should succeed
        db.execute(
            "INSERT INTO experiences "
            "(id, user_id, category, title, organization, start_date) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("e1", "u1", "work", "Engineer", "Acme", "2020-01-01"),
        )
        db.commit()

        # Invalid category should raise
        with pytest.raises(sqlite3.IntegrityError):
            db.execute(
                "INSERT INTO experiences "
                "(id, user_id, category, title, organization, start_date) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                ("e2", "u1", "invalid_category", "Engineer", "Acme", "2020-01-01"),
            )
            db.commit()


def test_blurbs_type_constraint(app):
    """The type column only accepts 'summary', 'skills', 'motivation', 'closing'."""
    import sqlite3
    with app.app_context():
        db = get_db()
        db.execute(
            "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
            ("u2", "b@test.com", "hash"),
        )
        db.commit()

        db.execute(
            "INSERT INTO blurbs (id, user_id, type, content) VALUES (?, ?, ?, ?)",
            ("b1", "u2", "summary", "Great summary."),
        )
        db.commit()

        with pytest.raises(sqlite3.IntegrityError):
            db.execute(
                "INSERT INTO blurbs (id, user_id, type, content) VALUES (?, ?, ?, ?)",
                ("b2", "u2", "bad_type", "Oops."),
            )
            db.commit()
