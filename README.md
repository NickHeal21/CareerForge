# CareerForge

CareerForge is a career development platform for applicants and recruiters. Applicants can manage their profile and resumes, explore jobs, track applications, and use AI-assisted readiness analysis, career roadmaps, and a career mentor. Recruiters can manage job listings and review applications for their jobs. Administrators have protected platform management tools.

## Technology

- **Frontend:** React 18, Vite, React Router, and Tailwind CSS
- **Backend:** FastAPI, Pydantic, and SQLAlchemy 2
- **Database:** PostgreSQL
- **Resume text extraction:** PyMuPDF
- **AI:** Google Gemini for readiness analysis, roadmaps, and the career mentor
- **External job search:** JSearch through RapidAPI (optional)

## Project layout

```text
CareerForge/
├── backend/
│   ├── app/
│   │   ├── ai/             # Gemini integrations
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routes/         # FastAPI route modules
│   │   ├── config.py       # Environment-backed settings
│   │   ├── main.py         # FastAPI application
│   │   ├── serve.py        # Uvicorn runner honoring PORT
│   │   └── init_db.py      # Explicit, confirmed database preparation
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/            # API client and endpoint modules
    │   ├── components/
    │   ├── pages/
    │   └── store/
    ├── vercel.json         # SPA deep-link rewrite
    └── package.json
```

## Features

- JWT-based registration and login with Applicant and Recruiter roles
- Applicant profiles, PDF resume uploads, resume text extraction, and default resume selection
- Internal job listings and optional external JSearch results
- Job applications linked to the applicant's selected resume
- Gemini-powered job readiness analysis and saved results
- Personalized career roadmaps with completion tracking
- AI career mentor with saved conversation history
- Recruiter company profiles, verification workflow, job management, and applicant review
- Admin dashboards and protected user, job, application, and recruiter verification management

## Local development

### Prerequisites

- Python 3.10 or newer
- Node.js and npm
- A running PostgreSQL database for local development

### Backend

In PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` with your local PostgreSQL URL and a development JWT secret. Gemini and JSearch keys are optional for features that use those providers. Do not commit `.env` or put production credentials in it.

Start the backend from the `backend/` directory:

```powershell
python -m app.serve
```

The backend listens on `http://localhost:8000` by default and honors the `PORT` environment variable when one is provided. In development mode, application startup creates missing tables and seeds sample jobs. The API health endpoints are:

- `GET /api/health/live` — process liveness
- `GET /api/health/ready` — database readiness

Interactive API documentation is available at `http://localhost:8000/docs` in development.

### Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite prints the local frontend URL, normally `http://localhost:5173`. The API client defaults to `http://localhost:8000`; set `VITE_API_URL` when using a different backend. For a production Vercel build, set `VITE_API_URL` to the deployed backend origin, for example `https://your-backend.example.com` (without an `/api` suffix; API modules include their `/api/...` paths).

Create a production frontend build with:

```powershell
npm run build
```

The SPA rewrite in `frontend/vercel.json` lets Vercel serve the app entry point on direct navigation to client-side routes.

## Configuration

Backend settings are loaded from environment variables, with `backend/.env` used for local development. See [`backend/.env.example`](backend/.env.example) for variable names and safe placeholders:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL |
| `SECRET_KEY` | JWT signing secret |
| `ALGORITHM` | JWT algorithm (defaults to `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime |
| `APP_ENV` | `development` or `production` |
| `CORS_ORIGINS` | Comma-separated browser origins; production requires exact HTTPS origins |
| `GEMINI_API_KEY` | Optional Gemini integration credential |
| `GEMINI_MODEL` | Gemini model name |
| `JSEARCH_API_KEY` | Optional RapidAPI JSearch credential |

Production settings reject weak JWT secrets, invalid CORS origins, and local or unsupported database destinations. Keep secrets in the hosting provider's secret environment settings; never place them in frontend variables or source control.

## Database preparation

The production web application does not initialize or migrate the database during startup. Development startup retains the existing table creation and sample-job seeding behavior.

`python -m app.init_db` is a separate operator command. It requires `APP_ENV=production`, validates the PostgreSQL destination, rejects local hosts, and asks for an exact destination confirmation before database operations begin. Sample-job insertion is opt-in with `--seed-sample-jobs`. This initializer performs selected schema preparation operations; it is not a general database migration framework. Review [`DEPLOYMENT_PREPARATION.md`](DEPLOYMENT_PREPARATION.md) before using it. Never run it until the target database and intended changes have been independently verified.

## Tests

Backend tests are under `backend/tests/`. From the `backend/` directory, install the project requirements and run:

```powershell
python -m unittest discover -s tests
```

Frontend production build check:

```powershell
cd frontend
npm run build
```

## Deployment

The frontend and backend are deployed as separate services. Configure the frontend's `VITE_API_URL`, backend production environment variables, exact HTTPS `CORS_ORIGINS`, and PostgreSQL URL in their respective hosting services. Use persistent storage for backend-uploaded files if the hosting filesystem is ephemeral. See [`DEPLOYMENT_PREPARATION.md`](DEPLOYMENT_PREPARATION.md) for the project's deployment-specific settings and operational cautions.

## Security notes

- Public registration supports Applicant and Recruiter roles only; it does not allow public Admin registration.
- Admin and recruiter endpoints enforce roles on the backend.
- Do not commit `.env` files, production credentials, or private uploads.
- Treat uploaded resumes and recruiter verification documents as private user data.
