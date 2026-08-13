"""
AIConversation model — tracks AI chat sessions with context type.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ConversationContext(str, enum.Enum):
    MENTOR = "mentor"
    INTERVIEW = "interview"
    ROADMAP = "roadmap"
    GENERAL = "general"


class AIConversation(BaseModel):
    __tablename__ = "ai_conversations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    context_type: Mapped[ConversationContext] = mapped_column(
        Enum(ConversationContext), default=ConversationContext.GENERAL
    )
    session_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="ai_conversations")
