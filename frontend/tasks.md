# Frontend Tasks — React + TypeScript + Vite

## Stack
- **Framework:** Vite + React + TypeScript
- **Styling:** Tailwind CSS (via Vite plugin — no `tailwind.config.js` or `postcss.config.js`)
- **UI Components:** shadcn/ui (accessible, themeable)
- **Routing:** TanStack Router (sole routing solution — no `react-router-dom`)
- **Linter / Formatter:** Biome (`biome.json` — no ESLint or Prettier)
- **Single tsconfig:** `tsconfig.json` only (no `tsconfig.app.json` or `tsconfig.node.json`)
- **Deployment:** GitHub Pages (`gh-pages` branch), base path set in `vite.config.ts`
- **Data fetching:** Plain `fetch` — no TanStack Query or external data-fetching library

---

## Implementation Strategy

### Phase 1 — Project Scaffolding
- [ ] `npm create vite@latest` with React + TypeScript template
- [ ] Remove default tsconfig splits; keep single `tsconfig.json`
- [ ] Install and configure Tailwind CSS via Vite plugin
- [ ] Install and configure shadcn/ui
- [ ] Install TanStack Router (`@tanstack/react-router`)
- [ ] Install Biome; add `biome.json`; remove ESLint / Prettier configs
- [ ] Install `gh-pages`; add `predeploy` and `deploy` npm scripts
- [ ] Set `base` in `vite.config.ts` to the GitHub Pages repo path
- [ ] Set up dark/light theme provider using shadcn/ui theming system

### Phase 2 — Routing Structure (TanStack Router)
```
/                    → Landing page
/profile             → Personal info + photo management
/experiences         → Work, education & hobby experience list
/projects            → Projects list
/job-descriptions    → Saved job descriptions
/blurbs              → Saved blurbs viewer
/generate            → AI blurb generation workspace
/compile             → CV compilation & download
/settings            → API key management
```

### Phase 3 — API Integration Layer

All API calls live in `src/api/`. Each module maps 1-to-1 with a backend blueprint. No external data-fetching library — plain `fetch` wrapped in typed async functions. JWT token stored in `localStorage` and attached as `Authorization: Bearer <token>` header.

---

## API Endpoints Used by Frontend

### 1. Auth — `src/api/auth.ts`

| Action | Method | Path |
|--------|--------|------|
| Register | `POST` | `/auth/register` |
| Login | `POST` | `/auth/login` |
| Logout | `POST` | `/auth/logout` |
| Request password reset | `POST` | `/auth/reset-password/request` |
| Confirm password reset | `POST` | `/auth/reset-password/confirm` |

---

### 2. API Key Management — `src/api/apiKeys.ts`

| Action | Method | Path |
|--------|--------|------|
| List keys | `GET` | `/api-keys` |
| Add key | `POST` | `/api-keys` |
| Update key | `PUT` | `/api-keys/{id}` |
| Delete key | `DELETE` | `/api-keys/{id}` |

---

### 3. Profile — `src/api/profile.ts`

| Action | Method | Path |
|--------|--------|------|
| Get profile | `GET` | `/profile` |
| Save / update profile | `PUT` | `/profile` |
| Upload photo | `POST` | `/profile/photos` |
| Delete photo | `DELETE` | `/profile/photos/{photoId}` |
| Set main photo | `PUT` | `/profile/photos/{photoId}/select-main` |

---

### 4. Experiences — `src/api/experiences.ts`

| Action | Method | Path |
|--------|--------|------|
| List experiences | `GET` | `/experiences` |
| Add experience | `POST` | `/experiences` |
| Edit experience | `PUT` | `/experiences/{id}` |
| Delete experience | `DELETE` | `/experiences/{id}` |

---

### 5. Projects — `src/api/projects.ts`

| Action | Method | Path |
|--------|--------|------|
| List projects | `GET` | `/projects` |
| Add project | `POST` | `/projects` |
| Edit project | `PUT` | `/projects/{id}` |
| Delete project | `DELETE` | `/projects/{id}` |

---

### 6. Job Descriptions — `src/api/jobDescriptions.ts`

| Action | Method | Path |
|--------|--------|------|
| List job descriptions | `GET` | `/job-descriptions` |
| Add job description | `POST` | `/job-descriptions` |
| Edit job description | `PUT` | `/job-descriptions/{id}` |
| Delete job description | `DELETE` | `/job-descriptions/{id}` |

---

### 7. Blurbs — `src/api/blurbs.ts`

| Action | Method | Path |
|--------|--------|------|
| List blurbs | `GET` | `/blurbs` |
| Save blurb | `POST` | `/blurbs` |
| Edit blurb | `PUT` | `/blurbs/{id}` |
| Delete blurb | `DELETE` | `/blurbs/{id}` |

---

### 8. AI / Agentic — `src/api/agent.ts`

| Action | Method | Path |
|--------|--------|------|
| Generate / modify blurb | `POST` | `/agent/generate-blurb` |
| Analyse job description | `POST` | `/agent/analyze-job` |

**Generate blurb modes available in UI:**
- `full` — Generate from scratch
- `modify` — Rephrase, keep structure & meaning
- `double-check` — Grammar & ATS check

**Blurb types (4 template fields — MVP):**
- `summary`, `skills`, `motivation`, `closing`

---

### 9. LaTeX / PDF — `src/api/latex.ts`

| Action | Method | Path |
|--------|--------|------|
| Compile CV | `POST` | `/latex/compile` |
| Download PDF | `GET` | `/latex/download/{filename}` |
| Download `.tex` | `GET` | `/latex/download-tex/{filename}` |

---

## Phase 4 — Pages & Components

### `/` — Landing
- [ ] App name, short intro paragraph
- [ ] Navigation links to main sections
- [ ] Dark/light mode toggle (shadcn/ui)

### `/profile` — Personal Information
- [ ] Form (shadcn/ui `Card` + `Input`) for all profile fields
- [ ] Photo upload with preview; button to set main photo; delete button

### `/experiences` — Experiences
- [ ] Tabbed view by category: Work / Education / Hobby (shadcn/ui `Tabs`)
- [ ] List of experience `Card` components with Edit / Delete actions
- [ ] Add/edit form in a `Dialog`

### `/projects` — Projects
- [ ] List of project `Card` components
- [ ] Add/edit form in a `Dialog`

### `/job-descriptions` — Job Descriptions
- [ ] List with title + company
- [ ] Add/edit form; trigger analysis from here
- [ ] Display analysis results (keywords, skills, seniority)

### `/generate` — AI Blurb Workspace (core MVP screen)
- [ ] Select active job description
- [ ] For each of the 4 template fields show a blurb editor card with three action buttons:
  - **Generate** (`mode: full`)
  - **Rephrase** (`mode: modify`)
  - **Check Grammar** (`mode: double-check`)
- [ ] Display generated blurb in editable textarea
- [ ] Save blurb button → `POST /blurbs`
- [ ] Loading state during AI calls

### `/compile` — CV Compilation
- [ ] Select template (MVP: one template `modern-1`)
- [ ] Select font size
- [ ] Select which experiences / projects to include
- [ ] Compile button → `POST /latex/compile`
- [ ] Show PDF download link and `.tex` download link on success

### `/settings` — API Key Management
- [ ] List stored keys (name + provider, no raw key shown)
- [ ] Add key form (name, provider, key value)
- [ ] Delete key button

---

## Phase 5 — Shared Concerns
- [ ] `src/lib/fetchClient.ts` — base fetch wrapper: attaches JWT, handles 401, returns typed errors
- [ ] `src/types/` — TypeScript interfaces mirroring all API request/response shapes
- [ ] `src/components/ThemeProvider.tsx` — shadcn/ui theme context
- [ ] `src/components/Navbar.tsx` — navigation + dark/light toggle
- [ ] Error boundary component for route-level error display
- [ ] Consistent loading spinner component

## Phase 6 — Build & Deploy
- [ ] Verify `npm run dev` works locally
- [ ] Confirm Biome passes (`npx biome check .`)
- [ ] `npm run build` produces clean `dist/`
- [ ] `npm run deploy` pushes `dist/` to `gh-pages` branch via `gh-pages` package
