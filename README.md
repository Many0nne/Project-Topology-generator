# Project Topology Generator

**Goal:** Save time bootstrapping projects and avoid redundant setup where teammates overwrite each other’s code. This generator scaffolds consistent frontends/backends, wires Docker dev environments, and bakes in authentication best practices.

## What It Does
- **Scaffolds templates:** React/Vite frontends, Express backend, with optional auth.
- **Auth built-in:** JWT access + httpOnly refresh cookies, rotation with `tokenVersion`, secure defaults.
- **Database ready:** Prisma ORM with Postgres, schema + client generation.
- **Dev environment:** Docker Compose for fullstack auth setups (frontend + backend + Postgres).
- **Frontend state:** Zustand store for tokens; Axios with interceptors for auto-refresh and retries.
- **CLI workflow:** Interactive choices to stitch frontend/backend and Docker modules.

## Current Templates
- Frontend:
  - React + Vite
  - React + Vite (Auth)
- Backend:
  - Express
  - Express (Auth)
- Docker modules:
  - Frontend dev (Vite)
  - Fullstack dev (backend + frontend)
  - Fullstack dev (Auth: adds Postgres)

See mappings and CLI in [src/templates.js](src/templates.js) and [src/cli.js](src/cli.js).

## Quick Start (Local Dev)
1. Install dependencies and link the CLI:

```bash
npm install
npm link
```

2. Generate a new app:

```bash
create-my-app
```

3. Choose your frontend/backend and whether to include auth. The generator creates a test app (e.g., under `test/my-app/`).

4. Run with Docker Compose from the generated app folder:

```bash
cd test/my-app
docker-compose up -d --build
```

- Frontend dev server: http://localhost:5173
- Backend (auth variant): http://localhost:3001
- Postgres (auth variant): localhost:5432

Admin panel (pgAdmin) setup
- Register a new server in pgAdmin.
- For the Host name, use: `<your-app-name>-db-1` (for example `my-app-db-1`).
- Enter the Postgres **username** and **password** from your Compose file (defaults: `postgres` / `postgres`).
- Save — you should now be able to browse the database from pgAdmin (default UI at http://localhost:5050).

5. Migrate the database (auth backends):

```bash
# inside backend container or local backend folder
npm run prisma:migrate:dev
```

## Configuration
- Frontend API base URL: set via `VITE_API_BASE_URL` in Compose or environment.
- Backend secrets: see `.env.example` in backend templates for `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, etc.
- Cookies: refresh token cookie is `httpOnly`, `sameSite=lax`, path-scoped to `/auth/refresh`.

## Auth Endpoints
- `POST /auth/register`: create user
- `POST /auth/login`: returns `accessToken`, sets refresh cookie
- `POST /auth/refresh`: rotates refresh, returns new `accessToken`
- `POST /auth/logout`: revokes refresh via `tokenVersion`, clears cookie
- `GET /auth/me`: returns current user (requires `Authorization: Bearer <accessToken>`) 

Backend implementations live under templates:
- Express: [templates/backend/express-auth/src/routes/auth.js](templates/backend/express-auth/src/routes/auth.js)

## Frameworks & Features Roadmap

### Frameworks
- [x] React + Vite
- [ ] Vue.js + Vite (planned)
- [x] Express backend
- [ ] Python (FastAPI) backend (planned)
- [ ] Python (Django) backend (planned)
- [ ] NestJS backend (planned)

### Features
- [x] Auth (JWT + refresh cookies)
- [x] Dockerisation
- [ ] Admin panel (planned)
- [ ] Testing setup (planned)
- [ ] CI/CD templates (planned)
- [ ] precommit hooks (husky lint prettier) (planned)
- [ ] tailwindcss (planned)
- [ ] file / folders structure options (planned)
- [ ] logging setup (winston, pino) (planned)

## Contributing
- Keep changes minimal and focused; match template style.
- Prefer fixing root causes (e.g., Prisma generation order with mounted volumes).
- Validate with Docker Compose and run Prisma migrations for auth templates.
- If you have advices on how to make this project better, i will gladly take it as i never did anything like it before

## Notes
-- With bind-mounted volumes, ensure Prisma client is generated at runtime (`postinstall` or startup) so it isn’t hidden by empty `node_modules`.
