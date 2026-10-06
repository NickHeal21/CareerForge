from sqlalchemy import create_engine, text  #get SQLAlchemy engine
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
    # create_all does not add columns to an already existing table. Keep the
    # recruiter ownership addition safe for existing PostgreSQL installations.
    if engine.dialect.name == "postgresql":
        with engine.begin() as connection:
            connection.execute(text(
                "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_id "
                "INTEGER REFERENCES users(id) ON DELETE SET NULL"
            ))
            connection.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_jobs_recruiter_id ON jobs (recruiter_id)"
            ))
