"""
FastAPI application factory.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.middleware.error_handler import register_exception_handlers
from app.utils.logger import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    settings = get_settings()
    setup_logging(settings.LOG_LEVEL, settings.LOG_FORMAT)

    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Starting {settings.APP_NAME} [{settings.APP_ENV}]")

    # Auto-create tables in development
    if settings.DEBUG:
        from app.database import init_db
        try:
            await init_db()
            logger.info("Database tables created/verified")
        except Exception as e:
            logger.warning(f"Could not auto-create tables: {e}")

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Import and register routes
    from app.routes import auth, users, resumes, skills, roadmaps, interviews, progress, ai_chat

    app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
    app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["Users"])
    app.include_router(resumes.router, prefix=f"{settings.API_V1_PREFIX}/resumes", tags=["Resumes"])
    app.include_router(skills.router, prefix=f"{settings.API_V1_PREFIX}/skills", tags=["Skills"])
    app.include_router(roadmaps.router, prefix=f"{settings.API_V1_PREFIX}/roadmaps", tags=["Roadmaps"])
    app.include_router(interviews.router, prefix=f"{settings.API_V1_PREFIX}/interviews", tags=["Interviews"])
    app.include_router(progress.router, prefix=f"{settings.API_V1_PREFIX}/progress", tags=["Progress"])
    app.include_router(ai_chat.router, prefix=f"{settings.API_V1_PREFIX}/chat", tags=["AI Chat"])

    logger.info("All routes registered")

    yield

    logger.info("Shutting down CareerForge")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        description="AI Career Copilot for Personalized Learning, Skill Gap Analysis, and Placement Preparation",
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handlers
    register_exception_handlers(app)

    # Health check (outside versioned API)
    @app.get("/health", tags=["System"])
    async def health_check():
        return {"status": "healthy", "service": settings.APP_NAME}

    return app


app = create_app()
