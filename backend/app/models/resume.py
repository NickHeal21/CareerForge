from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Resume(Base):
    """A user's uploaded resume and its locally extracted text."""
    __tablename__ = "resumes"
    __table_args__ = (
        Index(
            "uq_resumes_one_default_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("is_default IS TRUE"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")
    readiness_analyses = relationship("ReadinessAnalysis", back_populates="resume", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="resume", cascade="all, delete-orphan")
