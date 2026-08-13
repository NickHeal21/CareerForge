"""
JobDescription and JDSkill models.
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class JobDescription(BaseModel):
    __tablename__ = "job_descriptions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_requirements: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    experience_level: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    user = relationship("User", back_populates="job_descriptions")
    required_skills = relationship("JDSkill", back_populates="job_description", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="target_jd")

    def __repr__(self) -> str:
        return f"<JobDescription {self.title} @ {self.company}>"


class JDSkill(BaseModel):
    __tablename__ = "jd_skills"

    jd_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    job_description = relationship("JobDescription", back_populates="required_skills")
