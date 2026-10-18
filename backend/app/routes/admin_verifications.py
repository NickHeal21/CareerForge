from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.dependencies import get_current_admin, get_db
from app.models.recruiter_profile import RecruiterProfile
from app.models.recruiter_verification import RecruiterVerification, VerificationDocument
from app.models.user import User
from app.schemas.recruiter_verification import (
    AdminRecruiterVerificationDetail,
    AdminRecruiterVerificationListItem,
    AdminVerificationDecision,
)

router = APIRouter(tags=["admin recruiter verification"])
DOCUMENT_DIRECTORY = Path(__file__).resolve().parents[2] / "uploads" / "recruiter_verifications"
DOCUMENT_TYPES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


def verification_list_item(verification: RecruiterVerification, user: User, profile: RecruiterProfile | None):
    return AdminRecruiterVerificationListItem(
        id=verification.id,
        user_id=user.id,
        recruiter_name=user.name,
        recruiter_email=user.email,
        company_name=profile.company_name if profile else None,
        designation=profile.designation if profile else None,
        location=profile.location if profile else None,
        status=verification.status,
        submitted_at=verification.submitted_at,
        document_types=[document.document_type for document in verification.documents],
    )


@router.get("/recruiter-verifications", response_model=list[AdminRecruiterVerificationListItem])
def list_recruiter_verifications(
    search: str | None = None,
    status_filter: Literal["PENDING", "APPROVED", "DENIED"] | None = Query(default="PENDING", alias="status"),
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(RecruiterVerification, User, RecruiterProfile)
        .join(User, RecruiterVerification.user_id == User.id)
        .outerjoin(RecruiterProfile, RecruiterProfile.user_id == User.id)
        .options(selectinload(RecruiterVerification.documents))
    )
    if status_filter:
        query = query.filter(RecruiterVerification.status == status_filter)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(term), User.email.ilike(term), RecruiterProfile.company_name.ilike(term)))
    rows = query.order_by(RecruiterVerification.submitted_at.desc(), RecruiterVerification.id.desc()).all()
    return [verification_list_item(*row) for row in rows]


@router.get("/recruiter-verifications/{verification_id}", response_model=AdminRecruiterVerificationDetail)
def get_recruiter_verification(
    verification_id: int,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    verification = (
        db.query(RecruiterVerification)
        .options(selectinload(RecruiterVerification.documents))
        .filter(RecruiterVerification.id == verification_id)
        .first()
    )
    if verification is None:
        raise HTTPException(status_code=404, detail="Recruiter verification was not found.")
    profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == verification.user_id).first()
    item = verification_list_item(verification, verification.user, profile).model_dump()
    item.update(
        company_description=profile.company_description if profile else None,
        website=profile.website if profile else None,
        reviewed_at=verification.reviewed_at,
        admin_note=verification.admin_note,
        documents=verification.documents,
    )
    return AdminRecruiterVerificationDetail.model_validate(item)


@router.get("/recruiter-verifications/{verification_id}/documents/{document_id}")
def get_recruiter_verification_document(
    verification_id: int,
    document_id: int,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    document = (
        db.query(VerificationDocument)
        .filter(
            VerificationDocument.id == document_id,
            VerificationDocument.verification_id == verification_id,
        )
        .first()
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Verification document was not found.")

    stored_path = Path(document.file_path)
    try:
        resolved_path = stored_path.resolve(strict=True)
        allowed_directory = DOCUMENT_DIRECTORY.resolve(strict=True)
    except OSError as exc:
        raise HTTPException(status_code=404, detail="Verification document is not available.") from exc
    if resolved_path.parent != allowed_directory or not resolved_path.is_file():
        raise HTTPException(status_code=404, detail="Verification document is not available.")

    media_type = DOCUMENT_TYPES.get(resolved_path.suffix.lower())
    if media_type is None:
        raise HTTPException(status_code=404, detail="Verification document is not available.")
    safe_filename = document.original_filename.replace("\r", "").replace("\n", "")
    return FileResponse(
        resolved_path,
        media_type=media_type,
        filename=safe_filename,
        content_disposition_type="inline",
        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"},
    )


@router.patch("/recruiter-verifications/{verification_id}", response_model=AdminRecruiterVerificationDetail)
def review_recruiter_verification(
    verification_id: int,
    body: AdminVerificationDecision,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    verification = (
        db.query(RecruiterVerification)
        .filter(RecruiterVerification.id == verification_id)
        .with_for_update()
        .first()
    )
    if verification is None:
        raise HTTPException(status_code=404, detail="Recruiter verification was not found.")
    if verification.status != "PENDING" or verification.user.verification_status != "PENDING":
        raise HTTPException(status_code=409, detail="This verification is no longer pending review.")

    verification.status = body.status
    verification.reviewed_at = datetime.now(timezone.utc)
    verification.reviewed_by = admin.id
    verification.admin_note = body.admin_note.strip() if body.admin_note and body.admin_note.strip() else None
    verification.user.verification_status = body.status
    try:
        db.commit()
        db.refresh(verification)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="The verification decision could not be saved.") from exc

    profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == verification.user_id).first()
    item = verification_list_item(verification, verification.user, profile).model_dump()
    item.update(
        company_description=profile.company_description if profile else None,
        website=profile.website if profile else None,
        reviewed_at=verification.reviewed_at,
        admin_note=verification.admin_note,
        documents=verification.documents,
    )
    return AdminRecruiterVerificationDetail.model_validate(item)
