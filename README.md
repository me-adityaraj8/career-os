# Career OS

An all-in-one job search management platform — track applications, manage resumes,
prep for interviews, run a networking CRM, and get AI-powered insights, all in one
workspace.

> **Status:** built in phases. See "Build progress" below for what's wired up.

## Tech stack

| Layer     | Tech                                                                  |
| --------- | --------------------------------------------------------------------- |
| Frontend  | React + Vite + TypeScript, Tailwind, shadcn-style UI, React Query, Zustand, React Router, Recharts, Framer Motion, dnd-kit |
| Backend   | Node + Express + TypeScript, PostgreSQL via `pg` (raw SQL + migrations), Zod validation, JWT + bcrypt |
| AI        | Anthropic SDK (Claude), with a clearly-marked mock fallback when no API key is set |
| Dev/Infra | Docker Compose (db + backend + frontend), SQL migration runner, seed script |

## Architecture

```
backend/
  migrations/            versioned SQL (001_init.sql, 002_resumes.sql, ...)
  src/
    config/              env loading + validation
    db/                  pg pool, migrate runner, seed
    routes/              express routers (thin) — mount per feature
    controllers/         request/response handling
    services/            business logic (AI, analytics, auth)
    data/                raw SQL queries (data-access layer)
    validation/          zod schemas per feature
    middleware/          auth, validation, central error handler
    types/               shared domain/API types
frontend/
  src/
    components/ui/        shadcn-style base components
    components/           app components (layout, kanban, ...)
    pages/                route pages
    stores/               zustand (auth, theme)
    hooks/                react-query hooks per feature
    lib/                  api client, utils
    types/                shared API types (mirror backend)
```

Request flow on the backend: **route → validate (zod) → controller → service → data (SQL)**,
with a central error-handling middleware normalizing all errors to
`{ error: { code, message, details? } }`.

## Quick start (Docker — recommended)

```bash
# 1. From the project root, create env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# (optional) put a real ANTHROPIC_API_KEY in backend/.env to enable live AI

# 2. Start the stack (Postgres + backend + frontend)
docker compose up --build

# 3. In another terminal, run migrations + seed sample data
docker compose exec backend npm run migrate
docker compose exec backend npm run seed
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api/v1/health
- Demo login (after seeding): `demo@careeros.dev` / `password123`

> Migrations also run automatically on backend container start; the explicit
> `migrate` command is safe to re-run (it's idempotent).

## Quick start (local, without Docker)

Requires Node 22+ and a local PostgreSQL 13+.

```bash
# Backend
cd backend
cp .env.example .env        # set DATABASE_URL to your local Postgres
npm install
npm run migrate
npm run seed
npm run dev                 # http://localhost:4000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Environment variables

**backend/.env**

| Var                 | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`      | Postgres connection string                                     |
| `JWT_SECRET`        | Secret for signing JWTs (use a long random string)             |
| `JWT_EXPIRES_IN`    | Token lifetime (e.g. `7d`)                                      |
| `ANTHROPIC_API_KEY` | Anthropic key. **Leave blank to run AI features in mock mode** |
| `ANTHROPIC_MODEL`   | Model id (default `claude-sonnet-5`)                           |
| `CORS_ORIGIN`       | Allowed frontend origin                                        |
| `UPLOAD_DIR`        | Where resume PDFs are stored                                   |

**frontend/.env**

| Var            | Purpose                                     |
| -------------- | ------------------------------------------- |
| `VITE_API_URL` | Backend base URL incl. `/api/v1`            |

## Scripts

Backend (`cd backend`): `npm run dev`, `npm run migrate`, `npm run seed`,
`npm run test`, `npm run typecheck`.

Frontend (`cd frontend`): `npm run dev`, `npm run build`, `npm run typecheck`.

## Features

- **Auth** — email/password register + login, JWT, bcrypt, protected routes.
- **Application tracker** — Kanban board with drag-and-drop stages, list view, search + tag filters, priority, tags, notes, per-application resume link.
- **Resume manager** — upload multiple PDF versions, tag them, mark a default, download, link to applications.
- **Interviews** — interview rounds per application (type, schedule, outcome, prep/feedback notes).
- **Networking CRM** — contacts with relationship types and follow-up flags.
- **AI Tools** — job analyzer (summary, required skills, ATS keywords, resume-match score), cover letter generator (editable + savable), interview coach (categorized questions). Runs live via Anthropic or in a clearly-labeled **mock mode** when no key is set.
- **Analytics** — applications per week, conversion funnel, response/interview/offer rates, most-used resume (Recharts).
- **Goals** — targets with progress bars computed live from application data.
- **Dark mode** — toggle persisted locally and synced to your account.

## Testing

Backend business logic is unit-tested with Vitest (auth hashing/JWT/error paths,
resume-match scoring, and analytics calculations):

```bash
cd backend && npm test
```

## AI configuration

The AI features work out of the box in **mock mode** (realistic placeholder
responses, labeled as mock in the UI and stored with `is_mock = true`). To enable
live AI, set `ANTHROPIC_API_KEY` in `backend/.env`; the model is configurable via
`ANTHROPIC_MODEL` (default `claude-opus-4-8`). The resume-match score is always
computed deterministically in code (`computeMatchScore`), independent of the model.

## Build progress

All phases complete. The full stack was verified end-to-end locally against
PostgreSQL 16 — migrations, seed, every API (auth, applications, resumes,
interviews, contacts, AI in mock mode, analytics, goals), and the UI. Docker
Compose is provided for one-command startup.

- [x] Phase 1 — Scaffolding (structure, Docker, migrations, env, health check)
- [x] Phase 2 — Auth
- [x] Phase 3 — Application tracker (Kanban + CRUD)
- [x] Phase 4 — Resume manager (upload + versioning)
- [x] Phase 5 — Interviews + Networking CRM
- [x] Phase 6 — AI features (analyzer, cover letter, interview coach + mock fallback)
- [x] Phase 7 — Analytics dashboard
- [x] Phase 8 — Goal tracker
- [x] Phase 9 — Dark mode + polish
- [x] Phase 10 — Final README + verification
