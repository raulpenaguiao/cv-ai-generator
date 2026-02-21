# CV AI Generator — Backend

A Flask API backend for the CV AI Generator. All endpoints currently return stub responses; the database schema is fully wired and tested.

## Stack

| Tool | Purpose |
|------|---------|
| Flask 3 | Web framework (application factory pattern) |
| SQLite + raw SQL | Database (no ORM) |
| bcrypt | Password hashing |
| Fernet / HKDF-SHA256 | API key encryption at rest |
| Flask-CORS | Cross-origin requests from the frontend |
| Flask-Limiter | Rate limiting on auth & agent endpoints |
| pytest + pytest-flask | Unit & integration tests |

---

## Project Structure

```
backend/
├── run.py                  # Entry point
├── config.py               # Config classes (Config, TestConfig)
├── requirements.txt
├── .env.example
├── app/
│   ├── __init__.py         # create_app factory
│   ├── db.py               # get_db / close_db / init_db
│   ├── schema.sql          # Full database schema (CREATE TABLE IF NOT EXISTS)
│   └── blueprints/
│       ├── auth.py
│       ├── api_keys.py
│       ├── profile.py
│       ├── experiences.py
│       ├── projects.py
│       ├── job_descriptions.py
│       ├── blurbs.py
│       ├── agent.py
│       └── latex.py
└── tests/
    ├── conftest.py
    ├── test_db.py          # Schema + constraint tests
    ├── test_auth.py        # Auth endpoint tests
    ├── test_profile.py     # Profile endpoint tests
    └── test_experiences.py # Experiences endpoint tests
```

---

## Getting Started

### 1. Create a virtual environment

```bash
cd backend

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

> **Note (Ubuntu/Debian):** if you get `ensurepip is not available`, install the venv package first:
> ```bash
> sudo apt install python3-venv
> ```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and set SECRET_KEY at minimum
```

### 4. Run the development server

```bash
python run.py
```

The API will be available at `http://localhost:5000`.

---

## Running Tests

```bash
pytest tests/ -v
```

All 25 tests should pass. The test suite covers:
- **Schema** — all 8 tables exist with correct columns, foreign keys enabled, CHECK constraints enforced
- **Auth** — all 5 endpoints return correct status codes and response shapes
- **Profile** — all 5 endpoints (GET, PUT, photo upload/delete/select-main)
- **Experiences** — list, add, update, delete

---

## Database Schema

Eight tables, all with `CREATE TABLE IF NOT EXISTS` so the schema is safe to re-apply:

| Table | Key columns |
|-------|-------------|
| `users` | id, email, password_hash |
| `profiles` | user_id (FK), first_name, last_name, email, phone, location, website, linkedin, github |
| `photos` | user_id (FK), filename, is_main |
| `experiences` | user_id (FK), category (`work`/`education`/`hobby`), title, organization, dates, keywords |
| `projects` | user_id (FK), title, description, keywords |
| `job_descriptions` | user_id (FK), title, company, description, analysis_json |
| `blurbs` | user_id (FK), type (`summary`/`skills`/`motivation`/`closing`), content, job_description_id |
| `api_keys` | user_id (FK), name, provider, encrypted_key |

---

## API Endpoints (all currently stub)

| Method | Path | Blueprint |
|--------|------|-----------|
| POST | `/auth/register` | auth |
| POST | `/auth/login` | auth |
| POST | `/auth/logout` | auth |
| POST | `/auth/reset-password/request` | auth |
| POST | `/auth/reset-password/confirm` | auth |
| GET/POST | `/api-keys` | api_keys |
| PUT/DELETE | `/api-keys/<id>` | api_keys |
| GET/PUT | `/profile` | profile |
| POST | `/profile/photos` | profile |
| DELETE | `/profile/photos/<id>` | profile |
| PUT | `/profile/photos/<id>/select-main` | profile |
| GET/POST | `/experiences` | experiences |
| PUT/DELETE | `/experiences/<id>` | experiences |
| GET/POST | `/projects` | projects |
| PUT/DELETE | `/projects/<id>` | projects |
| GET/POST | `/job-descriptions` | job_descriptions |
| PUT/DELETE | `/job-descriptions/<id>` | job_descriptions |
| GET/POST | `/blurbs` | blurbs |
| PUT/DELETE | `/blurbs/<id>` | blurbs |
| POST | `/agent/generate-blurb` | agent |
| POST | `/agent/analyze-job` | agent |
| POST | `/latex/compile` | latex |
| GET | `/latex/download/<filename>` | latex |
| GET | `/latex/download-tex/<filename>` | latex |
