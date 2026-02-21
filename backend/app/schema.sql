-- CV AI Generator — SQLite schema
-- All tables use CREATE TABLE IF NOT EXISTS so this is safe to run on an existing database.

CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    email        TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name  TEXT,
    email      TEXT,
    phone      TEXT,
    location   TEXT,
    website    TEXT,
    linkedin   TEXT,
    github     TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photos (
    id       TEXT PRIMARY KEY,
    user_id  TEXT NOT NULL,
    filename TEXT NOT NULL,
    is_main  INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS experiences (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    category     TEXT NOT NULL CHECK (category IN ('work', 'education', 'hobby')),
    title        TEXT NOT NULL,
    organization TEXT NOT NULL,
    start_date   TEXT NOT NULL,
    end_date     TEXT,
    description  TEXT,
    keywords     TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    keywords    TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_descriptions (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    title         TEXT NOT NULL,
    company       TEXT NOT NULL,
    description   TEXT NOT NULL,
    analysis_json TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blurbs (
    id                 TEXT PRIMARY KEY,
    user_id            TEXT NOT NULL,
    type               TEXT NOT NULL CHECK (type IN ('summary', 'skills', 'motivation', 'closing')),
    content            TEXT NOT NULL,
    job_description_id TEXT,
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_description_id) REFERENCES job_descriptions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    name          TEXT NOT NULL,
    provider      TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
