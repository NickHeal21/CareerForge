"""
Roadmap and RoadmapMilestone models.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class RoadmapStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Roadmap(BaseModel):
    __tablename__ = "roadmaps"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_jd_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("job_descriptions.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    skill_gaps: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[RoadmapStatus] = mapped_column(Enum(RoadmapStatus), default=RoadmapStatus.ACTIVE)
    estimated_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    user = relationship("User", back_populates="roadmaps")
    target_jd = relationship("JobDescription", back_populates="roadmaps")
    milestones = relationship("RoadmapMilestone", back_populates="roadmap", cascade="all, delete-orphan",
                              order_by="RoadmapMilestone.week_number, RoadmapMilestone.order_index")
    learning_plans = relationship("LearningPlan", back_populates="roadmap", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="roadmap")

    def __repr__(self) -> str:
        return f"<Roadmap {self.title} ({self.status.value})>"


class RoadmapMilestone(BaseModel):
    __tablename__ = "roadmap_milestones"

    roadmap_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    roadmap = relationship("Roadmap", back_populates="milestones")
