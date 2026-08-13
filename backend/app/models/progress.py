"""
ProgressSnapshot model — weekly career progress tracking.
"""

import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ProgressSnapshot(BaseModel):
    __tablename__ = "progress_snapshots"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    skills_gained: Mapped[int] = mapped_column(Integer, default=0)
    milestones_completed: Mapped[int] = mapped_column(Integer, default=0)
    interviews_taken: Mapped[int] = mapped_column(Integer, default=0)
    avg_interview_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    overall_readiness: Mapped[float | None] = mapped_column(Float, nullable=True)
    weekly_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    user = relationship("User", back_populates="progress_snapshots")
