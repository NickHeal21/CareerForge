"""Resume schemas — request/response models."""

from typing import List, Optional
from pydantic import BaseModel


class ResumeUploadResponse(BaseModel):
    resume_id: str
    filename: str
    ats_score: float
    ats_feedback: List[str]
    skills: list
    experience: list
    education: list
    summary: str


class ResumeListItem(BaseModel):
    id: str
    file_name: str
    ats_score: Optional[float] = None
    ats_feedback: Optional[list] = None
    parsed_data: Optional[dict] = None
    created_at: Optional[str] = None
