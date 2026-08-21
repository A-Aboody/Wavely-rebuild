# Development Setup

## Prerequisites

- **Node.js 18+** — `nvm use` picks up the version in `.nvmrc`
- **Docker Desktop** — running before you start

## Quick start

```bash
npm run setup   # env files, dependencies, containers, migrations, seed data
npm run dev     # API + web, both watching for changes
```

| Service      | URL                              |
| ------------ | -------------------------------- |
| Web          | http://localhost:5173            |
| API          | http://localhost:3001/api        |
| Health check | http://localhost:3001/api/health |

Seeded logins — `alice@wavely.dev`, `bob@wavely.dev`, `carol@wavely.dev`, password `password123`.

`npm run setup` is idempotent; re-run it any time. It never overwrites an existing `.env`.

## What setup does

1. Creates `backend/.env` and `frontend/.env` from their `.env.example` templates, generating real JWT and session secrets
2. Installs dependencies in `backend/` and `frontend/`
3. Starts Postgres and Redis via Docker, waiting until both report healthy
4. Generates the Prisma client and applies migrations
5. Seeds three users with waves, comments, likes, and follows

## Everyday commands

Run these from the repo root.

```bash
npm run dev            # start everything (brings containers up first)
npm run build          # production build, both packages
npm run lint           # check both packages
npm run lint:fix       # check and autofix
npm run format         # Prettier across the repo
npm run typecheck      # tsc --noEmit, both packages
npm test               # backend unit tests
```

Database:

```bash
npm run db:up          # start Postgres + Redis
npm run db:down        # stop them (data survives in volumes)
npm run db:migrate     # create + apply a migration after editing schema.prisma
npm run db:seed        # re-run seed data
npm run db:reset       # drop, re-migrate, re-seed
npm run db:studio      # browse the database in a GUI
```

## Project layout

```
backend/          NestJS API
  prisma/         schema, migrations, seed
  src/            feature modules (auth, waves, comments, users, upload, email)
frontend/         React 18 + Vite + TanStack Router/Query + Zustand
  src/routes/     file-based routes
  src/stores/     Zustand stores
shared/           types shared by both, imported as @wavely/shared
scripts/          repo tooling
```

## Docker images

Images build from the **repo root**, not from `backend/` or `frontend/`, because both packages
reference `shared/` and it has to be inside the build context.

```bash
docker build -f backend/Dockerfile.prod -t wavely-backend .
docker build -f frontend/Dockerfile.prod -t wavely-frontend .
```

Running a build from inside a package directory fails to resolve `@wavely/shared`.

The backend runtime image ships without the Prisma CLI, so run migrations from CI or a dev
checkout (`npm run db:deploy`) rather than from the running container.

## Changing the database schema

1. Edit `backend/prisma/schema.prisma`
2. Run `npm run db:migrate` and give the migration a name
3. **Commit the generated migration** in `backend/prisma/migrations/`

CI runs `prisma migrate deploy`, which fails if a schema change lands without its migration.

## Optional services

These hold placeholders in `backend/.env`. Everything else works without them.

| Feature                     | Needs                                       |
| --------------------------- | ------------------------------------------- |
| Media uploads               | `AWS_*` (S3 bucket + IAM keys)              |
| "Sign in with Google"       | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` |
| Verification & reset emails | `EMAIL_*` (a Gmail app password works)      |

Email/password auth, feeds, waves, comments, likes, and follows all run without them.

## Notes

**Postgres runs on port 5433**, not 5432, because a system Postgres install commonly owns 5432. Override with `POSTGRES_PORT` in a root `.env` if you prefer something else — `DATABASE_URL` in `backend/.env` must match. Both containers bind to `127.0.0.1` only, so they are never exposed to your network.

**Lint has a warning ceiling.** The frontend allows exactly 4 warnings, all `react-hooks/exhaustive-deps`. The ceiling fails the build if anyone adds a new one; lower it in `frontend/package.json` as the existing ones get fixed.

**Backend can't reach the database** — check `docker compose ps` shows both containers healthy, and that `DATABASE_URL` matches the port mapping in `docker-compose.yml`.
