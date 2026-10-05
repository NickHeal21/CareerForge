from fastapi import APIRouter
from sqlalchemy import text
from app.database import SessionLocal

router = APIRouter()


@router.get("/health")
def health_check():
    """
    Simple health-check endpoint.
    Returns 'ok' if the API is running and the database is reachable.
    """
    # Try to reach the database
    db_status = "ok"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "database": db_status,
    }
