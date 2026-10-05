from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables
from app.routes import health

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

# Future routers go here, e.g.:
# app.include_router(auth.router,    prefix="/api/auth",    tags=["auth"])
# app.include_router(resumes.router, prefix="/api/resumes", tags=["resumes"])
# app.include_router(jobs.router,    prefix="/api/jobs",    tags=["jobs"])

# ---------------------------------------------------------------------------
# Startup event — create tables on first run
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    create_tables()
    print("✅ CareerForge API started")
    print(f"   Environment : {settings.app_env}")
    print(f"   Database URL: {settings.database_url[:40]}...")


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Welcome to CareerForge API. Visit /docs for the API reference."}
