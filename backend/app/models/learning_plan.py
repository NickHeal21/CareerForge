"""
LearningPlan and LearningResource models.
"""

import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class PlanStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class ResourceType(str, enum.Enum):
    COURSE = "course"
    ARTICLE = "article"
    VIDEO = "video"
    DOCUMENTATION = "documentation"
    BOOK = "book"


class Difficulty(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class LearningPlan(BaseModel):
    __tablename__ = "learning_plans"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    roadmap_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roadmaps.id", ondelete="SET NULL"), nullable=True
    )
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[PlanStatus] = mapped_column(Enum(PlanStatus), default=PlanStatus.NOT_STARTED)

    # Relationships
    user = relationship("User", back_populates="learning_plans")
    roadmap = relationship("Roadmap", back_populates="learning_plans")
    resources = relationship("LearningResource", back_populates="plan", cascade="all, delete-orphan",
                             order_by="LearningResource.order_index")


class LearningResource(BaseModel):
    __tablename__ = "learning_resources"

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("learning_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[ResourceType] = mapped_column(Enum(ResourceType), default=ResourceType.ARTICLE)
    provider: Mapped[str | None] = mapped_column(String(255), nullable=True)
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty), default=Difficulty.BEGINNER)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    plan = relationship("LearningPlan", back_populates="resources")
