import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.database import SessionLocal

router = APIRouter()
logger = logging.getLogger(__name__)


def _database_health() -> dict[str, str]:
    """Check PostgreSQL once and return a credential-safe status payload."""
    db = None
    db_status = "ok"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
    except Exception:
        logger.warning("Health check could not reach the database")
        db_status = "unavailable"
    finally:
        if db is not None:
            db.close()

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
    }


@router.get("/health")
def health_check():
    """Compatibility health response; clients should use /health/ready for probes."""
    return _database_health()


@router.get("/health/live")
def liveness_check():
    """Report that the API process can answer requests; does not contact PostgreSQL."""
    return {"status": "ok"}


@router.get("/health/ready")
def readiness_check():
    """Report readiness for database-backed requests using an HTTP failure when degraded."""
    result = _database_health()
    return JSONResponse(status_code=200 if result["database"] == "ok" else 503, content=result)
