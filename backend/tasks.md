# Backend Tasks — Flask / Python

## Stack
- **Framework:** Flask (Python)
- **Database:** SQLite via raw parameterised SQL (no ORM)
- **Auth:** Flask-Login + bcrypt, JWT tokens
- **AI:** OpenAI API (`gpt-4o-mini`)
- **PDF:** LaTeX compilation via `pdflatex` + Jinja2 templating
- **Encryption:** Fernet (API keys at rest), HKDF-SHA256 derived from `SECRET_KEY`
- **Rate limiting:** Flask-Limiter on auth & agent endpoints
- **File validation:** `python-magic` for MIME checking

---

## Implementation Strategy

### Phase 1 — Project Scaffolding
- [ ] Initialise Flask app with application factory pattern (`create_app`)
- [ ] Configure SQLite connection with `sqlite3`, `Row` factory
- [ ] Set up environment config (`.env` / `config.py`) for `SECRET_KEY`, `SMTP_*`, `DATABASE_PATH`
- [ ] Initialise Flask-Login, Flask-Limiter, CORS
- [ ] Register all Blueprints
- [ ] Write `schema.sql` and `db_init` function to create tables on first run

### Phase 2 — Database Schema (`schema.sql`)
```sql
users          (id, email, password_hash)
profiles       (id, user_id, first_name, last_name, email, phone, location, website, linkedin, github)
photos         (id, user_id, filename, is_main)
experiences    (id, user_id, category, title, organization, start_date, end_date, description, keywords)
projects       (id, user_id, title, description, keywords)
job_descriptions (id, user_id, title, company, description, analysis_json)
blurbs         (id, user_id, type, content, job_description_id)
api_keys       (id, user_id, name, provider, encrypted_key, created_at)
```

### Phase 3 — Blueprints / Endpoints

Each blueprint lives in `app/blueprints/<name>/routes.py`.

---

## API Endpoints

### 1. Auth & API Key Management — `/auth`, `/api-keys`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register user; server generates password, returns it once |
| `POST` | `/auth/login` | Login; returns JWT |
| `POST` | `/auth/logout` | Invalidate session |
| `POST` | `/auth/reset-password/request` | Send single-use token via SMTP |
| `POST` | `/auth/reset-password/confirm` | Consume token, set new password |
| `GET`  | `/api-keys` | List stored API keys (names/providers only, no plaintext key) |
| `POST` | `/api-keys` | Store new key (encrypted at rest with Fernet) |
| `PUT`  | `/api-keys/{id}` | Update key name or replace key value |
| `DELETE` | `/api-keys/{id}` | Delete API key |

**Notes:**
- Auth endpoints rate-limited via Flask-Limiter
- Password reset tokens are SHA-256 hashed in DB, 1-hour expiry, single-use
- API keys encrypted with Fernet; key derived from `SECRET_KEY` via HKDF-SHA256

---

### 2. Profile Management — `/profile`

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/profile` | Read personal information |
| `PUT`  | `/profile` | Create or update personal information |
| `POST` | `/profile/photos` | Upload photo (multipart/form-data, max 5 MB, whitelist validated) |
| `DELETE` | `/profile/photos/{photoId}` | Delete photo |
| `PUT`  | `/profile/photos/{photoId}/select-main` | Set photo as main profile photo |

**Notes:**
- Photos validated by extension whitelist + `python-magic` MIME check
- Stored outside web root with UUID-prefixed filename

---

### 3. Work Experience — `/experiences`

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/experiences` | List all experiences for authenticated user |
| `POST` | `/experiences` | Add experience |
| `PUT`  | `/experiences/{id}` | Edit experience |
| `DELETE` | `/experiences/{id}` | Delete experience |

**Request body (POST / PUT):**
```json
{
  "category": "work | education | hobby",
  "title": "string",
  "organization": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD | null",
  "description": "string",
  "keywords": ["string"]
}
```

---

### 4. Projects — `/projects`

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/projects` | List all projects |
| `POST` | `/projects` | Add project |
| `PUT`  | `/projects/{id}` | Edit project |
| `DELETE` | `/projects/{id}` | Delete project |

**Request body:**
```json
{
  "title": "string",
  "description": "string",
  "keywords": ["string"]
}
```

---

### 5. Job Descriptions — `/job-descriptions`

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/job-descriptions` | List saved job descriptions |
| `POST` | `/job-descriptions` | Add job description |
| `PUT`  | `/job-descriptions/{id}` | Edit job description |
| `DELETE` | `/job-descriptions/{id}` | Delete job description |

**Request body:**
```json
{
  "title": "string",
  "company": "string",
  "description": "string"
}
```

---

### 6. Saved Blurbs — `/blurbs`

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/blurbs` | List blurbs (optionally filtered by `?jobDescriptionId=`) |
| `POST` | `/blurbs` | Save a blurb |
| `PUT`  | `/blurbs/{id}` | Edit blurb content |
| `DELETE` | `/blurbs/{id}` | Delete blurb |

**Blurb types (MVP — 4 template fields):**
- `summary`
- `skills`
- `motivation`
- `closing`

---

### 7. AI / Agentic Endpoints — `/agent`

> Require a valid API key configured for the user. Rate-limited.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/agent/generate-blurb` | Generate or modify a blurb |
| `POST` | `/agent/analyze-job` | Analyse a job description |

**`/agent/generate-blurb` request:**
```json
{
  "type": "summary | skills | motivation | closing",
  "mode": "full | modify | adapt | double-check",
  "previousBlurb": "string | null",
  "jobDescriptionId": "string | null"
}
```

**`/agent/generate-blurb` response:**
```json
{ "generatedBlurb": "string" }
```

**`/agent/analyze-job` request:**
```json
{ "jobDescriptionId": "string" }
```

**`/agent/analyze-job` response:**
```json
{
  "keywords": ["string"],
  "requiredSkills": ["string"],
  "seniorityLevel": "string"
}
```

**AI config:**
- Model: `gpt-4o-mini`
- Temperature `0.3` for analysis, `0.7` for generation
- Analysis result stored as JSON in `job_descriptions.analysis_json`
- Decrypts user's API key only in memory at call time

---

### 8. LaTeX / PDF Compilation — `/latex`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/latex/compile` | Compile CV to PDF |
| `GET`  | `/latex/download/{filename}` | Download compiled PDF |
| `GET`  | `/latex/download-tex/{filename}` | Download raw `.tex` source |

**`/latex/compile` request:**
```json
{
  "template": "modern-1",
  "fontSize": 11,
  "blurbIds": ["string"],
  "experienceIds": ["string"],
  "projectIds": ["string"]
}
```

**`/latex/compile` response:**
```json
{ "pdfUrl": "/latex/download/<filename>" }
```

**Notes:**
- Jinja2 renders `.tex` using `\VAR{}` / `\BLOCK{}` delimiters
- All user text sanitised (LaTeX special-character escaping) before render
- `pdflatex` invoked twice, `--no-shell-escape`, 30 s timeout
- Output written to isolated temp dir, then moved to per-user output dir

---

## Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description"
  }
}
```

Common codes: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `AI_ERROR`, `COMPILE_ERROR`

---

## Phase 4 — Cross-cutting Concerns
- [ ] CSRF token middleware (all state-changing endpoints)
- [ ] JWT auth decorator (`@login_required`)
- [ ] Centralised error handler returning standard error JSON
- [ ] Input validation helpers (dates, category enum, file size)
- [ ] `keywords` stored as JSON string in SQLite, serialised/deserialised in service layer

## Phase 5 — Testing
- [ ] Unit tests for service functions (AI mocked)
- [ ] Integration tests for each blueprint with a test SQLite DB
- [ ] LaTeX compilation test with a fixture template
