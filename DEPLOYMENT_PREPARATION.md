# CareerForge Deployment Preparation

**Status:** preparation only. This document and the configuration changes in this phase do not mean the application has been deployed or production-tested.

## Current architecture

- React 18 and Vite build the frontend. React Router provides the single-page application routes; Tailwind CSS styles the pages and Axios calls the API.
- FastAPI serves the backend API. SQLAlchemy models and sessions use PostgreSQL through `psycopg2`.
- Gemini and JSearch are called from the backend. Their credentials must remain server-side.
- Original uploads are written to the backend filesystem under `backend/uploads/`.
- The shared `.gitignore` excludes `backend/uploads/`. Do not remove that rule.

## Configuration status

### Already implemented

- `backend/app/config.py` reads `backend/.env` independently of the process working directory and accepts environment variables.
- `APP_ENV` accepts only `development`, `production`, or the compatibility alias `prod` (normalized to `production`). Unknown values fail during settings initialization.
- Production settings reject placeholder, short, repeated-pattern, and low-diversity JWT secrets; this cannot prove cryptographic randomness, so configure a unique securely generated secret.
- Production requires explicit exact HTTPS CORS origins. Wildcards, localhost/loopback, credentials, paths, queries, fragments, malformed hosts, invalid ports, empty entries, and duplicate origins are rejected. Default HTTPS port 443 is normalized away to match browser Origin serialization.
- Production also requires a non-local PostgreSQL URL. This validates URL shape and recognized local hosts only; it cannot prove the target is newly provisioned or secure.
- SQL statement echo is enabled only when `APP_ENV=development`.
- Production disables Swagger (`/docs`), ReDoc (`/redoc`), and the OpenAPI schema (`/openapi.json`). Development retains all three.
- `python -m app.serve` binds Uvicorn to `0.0.0.0` and reads the host-provided `PORT`; it falls back to port `8000` for local use and rejects invalid port values.
- `frontend/src/api/client.js` reads `VITE_API_URL` and keeps the `/api/...` paths in the feature API modules. If unset, the frontend uses `http://localhost:8000` for local development.
- Vite proxies `/api` to `http://127.0.0.1:8000` in development.

### Prepared in this phase

- Backend CORS origins are configurable with comma-separated `CORS_ORIGINS`. The local default remains `http://localhost:5173,http://localhost:3000`.
- `backend/.env.example` documents `CORS_ORIGINS` with local-only example values. It contains placeholders, not production credentials.

### Required hosting configuration

Set these values in the hosting provider’s secret/environment-variable manager. Replace every placeholder before startup. Do not commit a populated `.env` file.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Dedicated production PostgreSQL connection URL. Must not point to localhost. |
| `SECRET_KEY` | Unique, securely generated random JWT signing key; at least 32 characters. Validation rejects obvious weak patterns but cannot prove randomness. |
| `APP_ENV` | Set to `production` (accepted values are `development`, `production`, and `prod`). |
| `ALGORITHM` | JWT signing algorithm; current default is `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration in minutes; current default is `30`. |
| `CORS_ORIGINS` | Comma-separated exact HTTPS frontend origins, without paths or wildcard. |
| `GEMINI_API_KEY` | Backend-only Gemini credential; required for AI functions. |
| `GEMINI_MODEL` | Gemini model identifier; current default is `gemini-3.8-flash`. |
| `JSEARCH_API_KEY` | Backend-only RapidAPI credential; optional if external job search is not enabled. |
| `VITE_API_URL` | Frontend build-time API origin, such as `https://api.example.com`; never put backend secrets here. |
| `PORT` | Supplied by the web-service host. `python -m app.serve` uses it for Uvicorn; local use defaults to `8000`. |

Safe placeholder examples (not usable production credentials):

```dotenv
# Backend environment; replace all placeholders in the hosting provider.
DATABASE_URL=postgresql://USER:PASSWORD@DB_HOST:5432/careerforge_prod
SECRET_KEY=your-very-secret-key-change-this-in-production
APP_ENV=production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=https://frontend.example.com
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-3.8-flash
JSEARCH_API_KEY=
```

The example JWT value is intentionally rejected by production validation. Do not use the example host, database name, credentials, or API key as real values. URL-encode reserved characters in database credentials as required by the provider.

The frontend is built with `VITE_API_URL` set to the API origin **before** running `npm run build`. The value should be the origin only; feature modules append `/api/...`. A production bundle built without this setting falls back to the visitor’s `localhost:8000` and will not reach the hosted API.

## Database preparation and startup behavior

The explicit initializer has not been run, and no PostgreSQL or configured/named local database was connected to, initialized, migrated, seeded, or modified through Phase 11I. The current state or emptiness of any database has not been verified. Previous offline backend checks included an isolated in-memory SQLite model-creation test; this is not evidence about any PostgreSQL database.

In local development (`APP_ENV=development`), the FastAPI startup hook runs `create_tables()` and `seed_jobs()` to preserve the existing first-run experience. In production (`APP_ENV=production` or `prod`), normal web-server startup does not call either function and performs no schema initialization, recruiter-status update, or sample-job seed. Other `APP_ENV` values are rejected before startup.

The explicit operator command `python -m app.init_db` (run from the `backend/` directory) requires `APP_ENV=production`, validates the configured PostgreSQL URL, rejects recognized local hosts (localhost names, IPv4/IPv6 loopback, and unspecified addresses), displays only the non-secret host, effective port, and database name, and requires the operator to type the complete destination token before importing or invoking database operations. The callable initializer also requires an explicit production environment and repeats URL and confirmation validation before its lazy imports. Credentials and query values are never displayed. For non-interactive use, `--confirm-destination <host>:<port>/<encoded-database-name>` supplies the same exact confirmation token. Add `--seed-sample-jobs` only when demo listings are intentionally wanted. The command is never invoked by the web server and has not been run. Production initialization must remain a separate, explicitly reviewed and approved operator action; do not put it in a build, deploy, release, or startup command.

Before running the initializer in production, the settings loader requires these environment values to pass configuration validation:

| Variable | Initializer requirement |
|---|---|
| `APP_ENV` | `production` or `prod` (normalized to production). |
| `DATABASE_URL` | Supported PostgreSQL URL with a host and exactly one database path segment; see URL rules below. |
| `SECRET_KEY` | Unique, securely generated value of at least 32 characters that passes the production weak-secret checks. |
| `CORS_ORIGINS` | One or more exact valid HTTPS origins, comma-separated. |

`GEMINI_API_KEY` and `JSEARCH_API_KEY` are not needed for database preparation; the initializer does not call either service. Other settings use their configured defaults unless the operator has a separate reason to provide them.

The initializer accepts `postgresql://` and `postgresql+psycopg2://` URLs. It requires one valid non-local host and one database path segment. An omitted port means PostgreSQL's default port `5432`; explicit ports must be between 1 and 65535. Recognized local targets, including `localhost`, names under `.localhost`, IPv4/IPv6 loopback, IPv4/IPv6 unspecified addresses, and IPv4-mapped IPv6 loopback/unspecified addresses, are rejected before any database operation is imported or invoked. Literal extra path segments, missing names/hosts, malformed URL encoding, fragments, duplicate or empty query parameters, and query options outside a small non-routing allowlist are rejected. The allowlist is `sslmode`, SSL certificate paths, `application_name`, `channel_binding`, and connection timeout/keepalive settings. Parameters that could redirect or ambiguously alter the target, including host, host address, port, database name, service, or libpq options, are rejected. Percent-encoded path text is kept exactly as SQLAlchemy passes it to the driver; the confirmation token percent-encodes that parsed value so reserved characters do not make the token ambiguous.

Host/port/database confirmation verifies the parsed configured URL only. It does not prove which server is reached after DNS resolution, proxying, failover, or infrastructure routing. Independently verify the configured destination with the database provider before using the command.

If URL validation fails, the command aborts before importing the database engine or invoking database operations. Initialization exceptions are reported with a sanitized stage and exception category; raw exception text and tracebacks are not printed. SQL echo is disabled for the explicit initializer.

After explicit confirmation, the initializer imports all SQLAlchemy models and calls `create_tables()`. It performs:

1. `Base.metadata.create_all()` asks SQLAlchemy to create missing model tables, indexes, and constraints. It does not alter arbitrary existing tables to match changed models.
2. On PostgreSQL, a separate `engine.begin()` transaction runs `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_id ...`, creates `ix_jobs_recruiter_id`, adds `profiles.profile_image`, adds `users.verification_status` with a `NOT_REQUIRED` default, and changes existing recruiter rows from `NOT_REQUIRED` to `PENDING`.
3. Only when `--seed-sample-jobs` is supplied, `seed_jobs()` inserts missing sample jobs by title/company pair and calls `Session.commit()`. It is not called by the initializer by default; development application startup calls it as part of the preserved local behavior.

These steps do not share one transaction. `create_all()` is a separate SQLAlchemy-managed schema operation; the PostgreSQL alterations, index, and recruiter update share the following `engine.begin()` transaction; sample inserts commit separately through the session. If a later step fails, previously completed and committed steps may remain. For example, failure in the PostgreSQL transaction can leave tables created by `create_all()` in place; failure during optional seeding can leave all schema/status changes committed while sample listings remain absent. PostgreSQL transactional DDL lets the explicit alteration block roll back as a unit, but the initializer does not provide an all-or-nothing transaction for the entire process.

If an operator independently provisions and verifies a suitable empty PostgreSQL database, `create_all()` is intended to create the current model tables and columns; the conditional PostgreSQL statements should then find those additions already present, and the recruiter update should have no rows to change. This describes code behavior only; no database has been verified as empty or ready. Initialization is for a specifically reviewed, suitable database, **not a general migration system**. It does not compare schema versions, migrate arbitrary existing structures, or provide a migration history.

Before future production initialization, an owner must provision a dedicated production PostgreSQL database, independently verify its provider/host/port/name and routing, establish backups and a restore process, verify the application account's DDL/DML privileges, review the schema and recruiter-status effects, decide whether sample listings are wanted, and approve the exact operation. Do not point the initializer at `careerforge_v1`, `careerforge_codex`, the older `careerforge` database, or any other local database. The production URL checks reject recognized loopback hosts, but cannot prove that a remote database is new or safe. No current database state is asserted here.

Recommended safe sequence for a future deployment:

1. Provision a dedicated production PostgreSQL database and restricted application account in the hosting provider. Record its URL only in the provider’s secret store; do not assume an existing database is empty.
2. Independently verify the database provider, host, port, database name, backups, network access and restore process. Keep all local databases untouched. DNS/proxies can route differently from the configured host, so the command's destination token is not proof of server identity.
3. Have an operator review the explicit initialization operations above and the target before running the command. Decide separately whether sample jobs are appropriate; the seed flag is opt-in.
4. Configure production environment variables, including a unique JWT secret and the production frontend origin.
5. Mount persistent upload storage at the resolved path below. Keep database initialization separate from web-service startup and run it only after explicit approval.
6. Start the service with the host-assigned port, then verify health, authentication, storage persistence and logs against the new production environment; none of these checks have been run against production in this phase.

Example interactive command (run from `backend/`, only after operator review and independently verifying the full configured destination):

```text
python -m app.init_db
```

Type the displayed `host:port/database` token when prompted. Append `--seed-sample-jobs` only to intentionally insert demo listings. This command can create tables and apply the listed PostgreSQL column/index/status operations. Do not run it as a substitute for reviewing the target and effects. Safe failures do not include raw connection or driver exception text, which is withheld because it may contain sensitive connection details.

Alembic or another migration framework was not introduced. Existing schema evolution remains a deployment decision and should not be treated as automatic migration support. **Production schema migration safety has not been established.** Before deployment, the database schema must be prepared through an explicitly reviewed procedure; this phase does not provide a reviewed migration plan.

## Upload storage and privacy

The application stores uploads on local disk at:

| Data | Code-resolved directory | Existing access path |
|---|---|
| Resumes | `backend/uploads/resumes/` | Authenticated owner; recruiter download is limited to applications for that recruiter’s jobs. |
| Applicant profile photos | `backend/uploads/profile_photos/` | Authenticated user’s own profile endpoint. |
| Company logos | `backend/uploads/company_logos/` | Public generated-filename route; this is intended for company branding. |
| Recruiter verification documents | `backend/uploads/recruiter_verifications/` | Admin-only download endpoint with resolved-path checks. |

These paths use `Path(__file__).resolve().parents[2] / "uploads" / <category>`; they are resolved relative to the backend source tree, not the process working directory. For the recommended Render Web Service configuration, set **Root Directory** to `backend`. Render's Python source root is `/opt/render/project/src`, so the shared upload root resolves to `/opt/render/project/src/uploads`. Attach the persistent disk at exactly `/opt/render/project/src/uploads`; all four category directories are children of that mount. This is a subdirectory mount, not the reserved source-root mount. If the service root directory or runtime layout differs, recalculate the path from the deployed `__file__` location before selecting a mount. A temporary filesystem can lose files during redeployment or instance replacement. Render disk snapshots are not a substitute for a separate file backup and restore test. Restrict access to verification documents.

**Repository exposure blocker:** the configured GitHub repository was verified public during the preceding read-only assessment, and its current default-branch tree still contained uploaded files even though the local index changes were prepared. Those files also appear in Git history. The Phase 11B deletions and ignore change have not been committed or pushed. Do not assume local untracking has removed remote copies; assess exposure and obtain approval for any history or remote remediation before deployment.

## Network, HTTPS and frontend routing

- Configure `CORS_ORIGINS` as exact origins, for example `https://frontend.example.com`. Use a comma-separated list only when multiple deployed frontend origins are required. Do not use `*`, localhost, or paths in production origins.
- Serve both frontend and API over HTTPS. Configure TLS at the hosting platform or reverse proxy; the application does not itself provision certificates.
- The frontend is a React Router single-page app. Configure static hosting/reverse proxy fallback so direct navigation and refresh of routes such as `/login`, `/jobs`, or `/recruiter` serves the frontend `index.html`.
- Vite’s `/api` proxy is development-only; production requests go directly to `VITE_API_URL`.
- In production, `/docs`, `/redoc`, and `/openapi.json` are disabled. They remain enabled in development. Production API schema access is not available through the public FastAPI app.
- `GET /api/health/live` is a process liveness check and does not contact PostgreSQL. `GET /api/health/ready` checks PostgreSQL and returns HTTP 503 when unavailable. Configure the host readiness probe to use `/api/health/ready`; use `/api/health/live` only for process liveness. The compatibility endpoint `GET /api/health` retains its prior JSON body and HTTP 200 behavior, including when it reports `degraded`.
- Readiness does not check Gemini, JSearch, upload-volume writability, or persistent storage. Add monitoring for these separately if the deployment requires it.

## Build and startup commands

Run from the repository root unless noted. These are commands for later preparation/verification; they have not been run against a production environment.

Backend local development command (from `backend/`):

```text
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Render Web Service settings (from the repository):

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `python -m app.serve`
- Health Check Path: `/api/health/ready`
- Persistent Disk Mount Path: `/opt/render/project/src/uploads`

The new `python -m app.serve` runner binds to `0.0.0.0` and reads Render's `PORT`; it uses `8000` only when `PORT` is absent. It imports the FastAPI application through Uvicorn, so production startup remains subject to the existing `APP_ENV` behavior and does not run the initializer or seed jobs.

Render Static Site settings:

- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Rewrite rule: `/*` to `/index.html` (Rewrite), so React Router routes work on refresh.
- Build-time variable: `VITE_API_URL` set to the backend HTTPS origin only, without `/api`.

Set `CORS_ORIGINS` in the backend service to the exact HTTPS origin assigned to the static site. Set `DATABASE_URL` to the selected Render Postgres internal connection URL, with the service and database in the same region. Put backend secrets only in the Render service's environment settings; `VITE_API_URL` is public build configuration. Render's `PORT` is supplied to the backend service and should not be added as a fixed local port.

Production web-service startup does not initialize or seed the database. Local development startup retains its existing initialization behavior.

Frontend production build (from `frontend/`, with `VITE_API_URL` set in the build environment first):

```text
npm ci
npm run build
```

The static files are emitted to `frontend/dist/`. `npm run preview` is for local preview, not a production web server. Backend packages are listed in `backend/requirements.txt`; install them in the deployment build environment using the host’s approved process.

Safe local verification after configuration changes:

```text
cd backend
python -m unittest discover -s tests -v
cd ..
npm --prefix frontend run build
git diff --check
```

The backend stability tests use an isolated in-memory SQLite engine for model creation and mocks for database-dependent startup/health checks. Do not run a test or application startup against a local PostgreSQL database as part of production preparation.

## Known limitations and decisions before deployment

- Local development startup still initializes tables and seeds demo jobs. Production startup skips these operations; schema preparation remains an explicit, separately reviewed operator action.
- The explicit initializer is not a migration framework and does not establish production schema migration safety.
- A remote, non-loopback `DATABASE_URL` is required by validation, but only an operator can ensure it points to a newly provisioned production database.
- Uploads require persistent storage; the application currently uses local filesystem paths.
- The project owner has stated that the five existing uploaded files are dummy assets and will be retained. Their contents were not inspected. The five files are retained in the current Git index and working tree; `backend/uploads/` remains excluded for future untracked uploads. The ignore rule does not remove already tracked files or paths from Git history.
- No deployment target, production URL, database, persistent volume, TLS configuration or external resource has been created. Render settings above are a plan, not deployed configuration.
- Provider quotas, production observability, backup/restore, log retention and operational ownership remain to be configured.
- The frontend stores the bearer token in browser `localStorage`; this phase preserves authentication behavior. Review the risk as part of a broader production security assessment.
- CORS and JWT configuration are checked at startup, but no production deployment or penetration test has been performed.

## Phase status

- **Already implemented:** local API defaults, JWT secret guard, development-only SQL echo, role-aware routes, feature APIs and local upload paths.
- **Prepared through Phase 11I:** strict environment validation for JWT secret/CORS/non-local PostgreSQL host, production startup separation, explicit database preparation command, host-port runner, separate liveness/readiness endpoints, production API-docs disabling, and provider-specific preparation instructions.
- **Must be configured later:** production secrets, database URL, frontend API URL, HTTPS origins, SPA fallback, database service, persistent disk, backups and monitoring.
- **Requires a decision/approval:** production database target and explicit initialization; deployment host/resource creation; data retention and backup policy. Production OpenAPI docs are disabled; exposing them again requires a deliberate security decision.

No deployment, database initialization, migration, seed operation or live AI/job-provider call was performed as part of this phase.
