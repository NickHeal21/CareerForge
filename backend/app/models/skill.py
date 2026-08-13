"""
UserSkill model — the user's consolidated skill profile.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.resume import Proficiency


class SkillSource(str, enum.Enum):
    RESUME = "resume"
    SELF_ASSESSED = "self_assessed"
    AI_EVALUATED = "ai_evaluated"


class UserSkill(BaseModel):
    __tablename__ = "user_skills"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    proficiency: Mapped[Proficiency] = mapped_column(Enum(Proficiency), default=Proficiency.BEGINNER)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source: Mapped[SkillSource] = mapped_column(Enum(SkillSource), default=SkillSource.SELF_ASSESSED)
    assessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="user_skills")

    def __repr__(self) -> str:
        return f"<UserSkill {self.skill_name} ({self.proficiency.value})>"
