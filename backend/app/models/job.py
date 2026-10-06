from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Job(Base):
    """A locally managed sample job listing."""
    __tablename__ = "jobs"
    __table_args__ = (UniqueConstraint("title", "company_name", name="uq_jobs_title_company"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    company_name: Mapped[str] = mapped_column(String(180), nullable=False)
    location: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    required_skills: Mapped[str] = mapped_column(Text, nullable=False, default="")
    application_url: Mapped[str] = mapped_column(String(500), nullable=False)
    recruiter_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    recruiter = relationship("User", back_populates="recruiter_jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    readiness_analyses = relationship("ReadinessAnalysis", back_populates="job", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="job", cascade="all, delete-orphan")
