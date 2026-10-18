from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AdminUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    created_at: datetime


class AdminProfileSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    phone: str | None = None
    location: str | None = None
    bio: str | None = None
    ug_degree: str | None = None
    pg_degree: str | None = None
    skills: str | None = None


class AdminRecruiterProfileSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_name: str | None = None
    company_logo: str | None = None
    designation: str | None = None
    company_description: str | None = None
    location: str | None = None
    website: str | None = None


class AdminUserDetail(BaseModel):
    user: AdminUserSummary
    profile: AdminProfileSummary | None = None
    recruiter_profile: AdminRecruiterProfileSummary | None = None
    resume_count: int = 0
    application_count: int = 0
    job_count: int = 0


class AdminRecruiterSummary(AdminUserSummary):
    company_name: str | None = None
    designation: str | None = None
    location: str | None = None
    job_count: int = 0


class AdminJobSummary(BaseModel):
    id: int
    title: str
    company_name: str
    location: str
    description: str
    required_skills: str
    application_url: str
    recruiter_id: int | None = None
    recruiter_name: str | None = None
    recruiter_email: str | None = None
    application_count: int = 0
    created_at: datetime


class AdminApplicationSummary(BaseModel):
    id: int
    status: str
    applied_at: datetime
    applicant_id: int
    applicant_name: str
    applicant_email: str
    job_id: int
    job_title: str
    company_name: str
    recruiter_id: int | None = None
    recruiter_name: str | None = None


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_applicants: int
    total_recruiters: int
    total_jobs: int
    total_applications: int
    recent_users: list[AdminUserSummary]
    recent_jobs: list[AdminJobSummary]
    recent_applications: list[AdminApplicationSummary]
