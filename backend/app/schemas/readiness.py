from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReadinessAnalyzeRequest(BaseModel):
    job_id: int = Field(gt=0)
    resume_id: int | None = Field(default=None, gt=0)


class ReadinessJob(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_name: str


class ReadinessResume(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    original_filename: str


class ReadinessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    resume_id: int
    job_id: int
    readiness_percentage: int = Field(ge=0, le=100)
    matching_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    created_at: datetime
    job: ReadinessJob
    resume: ReadinessResume
