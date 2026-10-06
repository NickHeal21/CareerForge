from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ApplicationCreate(BaseModel):
    job_id: int = Field(gt=0)
    resume_id: int = Field(gt=0)


class ApplicationJob(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_name: str


class ApplicationResume(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    original_filename: str


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    job_id: int
    resume_id: int | None
    status: str
    applied_at: datetime
    job: ApplicationJob
    resume: ApplicationResume | None
