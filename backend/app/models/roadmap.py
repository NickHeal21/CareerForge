from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Roadmap(Base):
    """A saved, user-owned career plan generated from a readiness analysis."""
    __tablename__ = "roadmaps"
    __table_args__ = (UniqueConstraint("readiness_analysis_id", name="uq_roadmaps_readiness_analysis"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    readiness_analysis_id: Mapped[int] = mapped_column(
        ForeignKey("readiness_analyses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="roadmaps")
    resume = relationship("Resume", back_populates="roadmaps")
    job = relationship("Job", back_populates="roadmaps")
    readiness_analysis = relationship("ReadinessAnalysis", back_populates="roadmap")
    items = relationship("RoadmapItem", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapItem.order_index")


class RoadmapItem(Base):
    """One ordered action in a roadmap."""
    __tablename__ = "roadmap_items"
    __table_args__ = (UniqueConstraint("roadmap_id", "order_index", name="uq_roadmap_items_order"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    roadmap_id: Mapped[int] = mapped_column(ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_duration: Mapped[str] = mapped_column(String(80), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    roadmap = relationship("Roadmap", back_populates="items")
