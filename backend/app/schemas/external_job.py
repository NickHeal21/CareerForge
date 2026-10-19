from pydantic import BaseModel, ConfigDict


class ExternalJobResponse(BaseModel):
    """Normalized JSearch listing kept separate from internal CareerForge jobs."""

    model_config = ConfigDict(extra="ignore")

    source: str = "external"
    external_job_id: str | None = None
    title: str | None = None
    company_name: str | None = None
    company_logo_url: str | None = None
    location: str | None = None
    employment_type: str | None = None
    description: str | None = None
    application_url: str | None = None
    posted_at: str | None = None


class ExternalJobSearchResponse(BaseModel):
    query: str
    location: str | None = None
    next_cursor: str | None = None
    jobs: list[ExternalJobResponse]
