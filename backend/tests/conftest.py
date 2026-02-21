import os
import tempfile

import pytest

from app import create_app


@pytest.fixture
def app():
    """Create a test app with a temporary file-based SQLite database.

    Using a temp file rather than :memory: avoids the issue where each
    sqlite3.connect() call to ':memory:' returns a different, empty database.
    """
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    test_app = create_app({"TESTING": True, "DATABASE": db_path})
    yield test_app
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def runner(app):
    return app.test_cli_runner()
