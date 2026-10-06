from sqlalchemy import create_engine  #get SQLAlchemy engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Create the SQLAlchemy engine
engine = create_engine(
    settings.database_url,
    # For development: echo=True shows every SQL statement in the console
    echo=settings.app_env == "development",
)

# Session factory — each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """All SQLAlchemy models will inherit from this class."""
    pass


def create_tables():
    """Create all database tables that don't exist yet."""
    Base.metadata.create_all(bind=engine)
