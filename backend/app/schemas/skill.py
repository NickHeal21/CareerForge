"""Skill gap analysis schemas."""

from pydantic import BaseModel


class SkillGapRequest(BaseModel):
    job_description: str
