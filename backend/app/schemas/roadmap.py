"""Roadmap schemas."""

from typing import Optional
from pydantic import BaseModel


class RoadmapGenerateRequest(BaseModel):
    target_role: str
    current_skills: str = ""
    skill_gaps: str = ""
    weeks: int = 8


class MilestoneUpdateRequest(BaseModel):
    is_completed: bool
