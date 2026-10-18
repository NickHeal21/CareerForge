from sqlalchemy import ForeignKey, Integer, String, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Profile(Base):
    """Optional education, skills, and contact details for a user."""
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    profile_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    location: Mapped[str | None] = mapped_column(String(150), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenth_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    twelfth_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    ug_degree: Mapped[str | None] = mapped_column(String(150), nullable=True)
    ug_cgpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    pg_degree: Mapped[str | None] = mapped_column(String(150), nullable=True)
    pg_cgpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    leetcode_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user = relationship("User", back_populates="profile")
