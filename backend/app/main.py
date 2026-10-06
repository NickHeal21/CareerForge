from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables
import app.models  # noqa: F401 — registers all models with SQLAlchemy before create_tables()
from app.routes import health, auth, profile, resumes, jobs, applications, readiness, roadmaps, recruiter, mentor
from app.seed import seed_jobs

settings = get_settings()

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CareerForge API",
    description="AI-powered career development platform for students",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the React dev server to talk to this API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://localhost:3000",   # fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router, prefix="/api")
app.include_router(auth.router,   prefix="/api/auth")
app.include_router(profile.router, prefix="/api/profile")
app.include_router(resumes.router, prefix="/api/resumes")
app.include_router(jobs.router, prefix="/api/jobs")
app.include_router(applications.router, prefix="/api/applications")
app.include_router(readiness.router, prefix="/api/readiness")
app.include_router(roadmaps.router, prefix="/api/roadmaps")
app.include_router(recruiter.router, prefix="/api/recruiter")
app.include_router(mentor.router, prefix="/api/mentor")

# Future routers (uncomment as phases progress):
# app.include_router(resumes.router, prefix="/api/resumes", tags=["resumes"])
# app.include_router(jobs.router,    prefix="/api/jobs",    tags=["jobs"])

# ---------------------------------------------------------------------------
# Startup event — create tables on first run
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    create_tables()
    seed_jobs()
    print("[OK] CareerForge API started")
    print(f"     Environment : {settings.app_env}")
    print(f"     Database URL: {settings.database_url[:40]}...")


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Welcome to CareerForge API. Visit /docs for the API reference."}
