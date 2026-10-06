from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, JSON, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReadinessAnalysis(Base):
    """A saved readiness result for one user's resume and a selected job."""
    __tablename__ = "readiness_analyses"
    __table_args__ = (
        CheckConstraint("readiness_percentage >= 0 AND readiness_percentage <= 100", name="ck_readiness_percentage_range"),
        UniqueConstraint("user_id", "resume_id", "job_id", name="uq_readiness_user_resume_job"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    readiness_percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    matching_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    missing_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    strengths: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    weaknesses: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    recommendations: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="readiness_analyses")
    resume = relationship("Resume", back_populates="readiness_analyses")
    job = relationship("Job", back_populates="readiness_analyses")
    roadmap = relationship("Roadmap", back_populates="readiness_analysis", uselist=False, cascade="all, delete-orphan")
