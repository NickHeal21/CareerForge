from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_name: str
    location: str
    description: str
    required_skills: str
    application_url: str
    recruiter_id: int | None = None
    created_at: datetime


class RecruiterJobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    company_name: str = Field(min_length=1, max_length=180)
    location: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=20000)
    required_skills: str = Field(min_length=1, max_length=5000)
    application_url: HttpUrl

    @field_validator("title", "company_name", "location", "description", "required_skills")
    @classmethod
    def strip_non_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value


class RecruiterJobUpdate(RecruiterJobCreate):
    pass


class RecruiterJobResponse(JobResponse):
    application_count: int = 0
