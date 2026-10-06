from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RoadmapCreate(BaseModel):
    readiness_analysis_id: int = Field(gt=0)


class RoadmapItemUpdate(BaseModel):
    completed: bool = Field(strict=True)


class RoadmapItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    estimated_duration: str
    completed: bool
    order_index: int


class RoadmapJob(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_name: str


class RoadmapResume(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class RoadmapReadiness(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    readiness_percentage: int


class RoadmapResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    resume_id: int
    job_id: int
    readiness_analysis_id: int
    title: str
    created_at: datetime
    job: RoadmapJob
    resume: RoadmapResume
    readiness_analysis: RoadmapReadiness
    items: list[RoadmapItemResponse]


class RoadmapItemInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=3000)
    estimated_duration: str = Field(min_length=1, max_length=80)

    @field_validator("title", "description", "estimated_duration")
    @classmethod
    def non_empty_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value


class RoadmapResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=180)
    items: list[RoadmapItemInput] = Field(min_length=1, max_length=30)

    @field_validator("title")
    @classmethod
    def non_empty_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Roadmap title cannot be empty.")
        return value
