import logging

from fastapi import APIRouter
from sqlalchemy import text
from app.database import SessionLocal

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
def health_check():
    """
    Simple health-check endpoint.
    Returns 'ok' if the API is running and the database is reachable.
    """
    # Try to reach the database
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
