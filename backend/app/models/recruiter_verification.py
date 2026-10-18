from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RecruiterVerification(Base):
    """One document review record for each recruiter account."""
    __tablename__ = "recruiter_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="recruiter_verification", foreign_keys=[user_id])
    reviewer = relationship("User", back_populates="reviewed_verifications", foreign_keys=[reviewed_by])
    documents = relationship("VerificationDocument", back_populates="verification", cascade="all, delete-orphan", order_by="VerificationDocument.id")


class VerificationDocument(Base):
    """Private locally stored file metadata for a recruiter verification."""
    __tablename__ = "verification_documents"
    __table_args__ = (UniqueConstraint("verification_id", "document_type", name="uq_verification_document_type"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    verification_id: Mapped[int] = mapped_column(ForeignKey("recruiter_verifications.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(20), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    verification = relationship("RecruiterVerification", back_populates="documents")
