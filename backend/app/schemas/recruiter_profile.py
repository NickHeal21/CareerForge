from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class RecruiterProfileUpdate(BaseModel):
    company_name: str | None = Field(default=None, max_length=180)
    company_logo: HttpUrl | None = None
    designation: str | None = Field(default=None, max_length=150)
    company_description: str | None = Field(default=None, max_length=5000)
    location: str | None = Field(default=None, max_length=180)
    website: HttpUrl | None = None


class RecruiterProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    user_id: int
    company_name: str | None = None
    company_logo: str | None = None
    designation: str | None = None
    company_description: str | None = None
    location: str | None = None
    website: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @field_validator("company_logo", "website", mode="before")
    @classmethod
    def normalize_url(cls, value):
        return str(value) if value is not None else None
