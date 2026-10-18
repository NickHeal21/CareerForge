from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class VerificationDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_type: Literal["COMPANY_ID", "AADHAAR", "PAN"]
    original_filename: str
    uploaded_at: datetime


class RecruiterVerificationStatusResponse(BaseModel):
    role: str
    verification_status: str
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    admin_note: str | None = None
    documents: list[VerificationDocumentResponse] = Field(default_factory=list)


class AdminRecruiterVerificationListItem(BaseModel):
    id: int
    user_id: int
    recruiter_name: str
    recruiter_email: str
    company_name: str | None = None
    designation: str | None = None
    location: str | None = None
    status: str
    submitted_at: datetime
    document_types: list[str]


class AdminRecruiterVerificationDetail(AdminRecruiterVerificationListItem):
    company_description: str | None = None
    website: str | None = None
    reviewed_at: datetime | None = None
    admin_note: str | None = None
    documents: list[VerificationDocumentResponse]


class AdminVerificationDecision(BaseModel):
    status: Literal["APPROVED", "DENIED"]
    admin_note: str | None = Field(default=None, max_length=2000)
