from datetime import datetime
from typing import Literal
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


class CandidateResume(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    original_filename: str
    created_at: datetime


class CandidateReadiness(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    readiness_percentage: int
    matching_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    created_at: datetime


class RecruiterApplicationListItem(BaseModel):
    id: int
    applicant_id: int
    applicant_name: str
    applicant_email: str
    status: str
    applied_at: datetime
    resume: CandidateResume | None
    readiness_percentage: int | None = None


class RecruiterJobInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_name: str
    location: str


class RecruiterCandidateProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    phone: str | None = None
    location: str | None = None
    bio: str | None = None
    tenth_percentage: float | None = None
    twelfth_percentage: float | None = None
    ug_degree: str | None = None
    ug_cgpa: float | None = None
    pg_degree: str | None = None
    pg_cgpa: float | None = None
    skills: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    leetcode_url: str | None = None
    portfolio_url: str | None = None


class RecruiterApplicationDetail(BaseModel):
    id: int
    applicant_id: int
    applicant_name: str
    applicant_email: str
    status: str
    applied_at: datetime
    job: RecruiterJobInfo
    profile: RecruiterCandidateProfile | None
    resume: CandidateResume | None
    readiness: CandidateReadiness | None


class ApplicationStatusUpdate(BaseModel):
    status: Literal["APPLIED", "SHORTLISTED", "INTERVIEW", "REJECTED", "HIRED"]
