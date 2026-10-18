import logging
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.dependencies import get_current_recruiter_account, get_db
from app.models.recruiter_verification import RecruiterVerification, VerificationDocument
from app.models.user import User
from app.schemas.recruiter_verification import RecruiterVerificationStatusResponse

router = APIRouter(tags=["recruiter verification"])
logger = logging.getLogger(__name__)
DOCUMENT_DIRECTORY = Path(__file__).resolve().parents[2] / "uploads" / "recruiter_verifications"
MAX_DOCUMENT_BYTES = 5 * 1024 * 1024
SUPPORTED_FORMATS = {
    ".pdf": ("application/pdf", b"%PDF-"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
}


def status_response(user: User, verification: RecruiterVerification | None):
    return RecruiterVerificationStatusResponse(
        role=user.role,
        verification_status=user.verification_status,
        submitted_at=verification.submitted_at if verification else None,
        reviewed_at=verification.reviewed_at if verification else None,
        admin_note=verification.admin_note if verification else None,
        documents=verification.documents if verification else [],
    )


def read_document(upload: UploadFile, document_type: str):
    original = (upload.filename or "document").replace("\\", "/").split("/")[-1].strip()
    suffix = Path(original).suffix.lower()
    expected = SUPPORTED_FORMATS.get(suffix)
    if expected is None:
        upload.file.close()
        raise HTTPException(status_code=400, detail=f"{document_type.replace('_', ' ').title()} must be a PDF, JPG, JPEG, or PNG file.")

    expected_type, signature = expected
    if upload.content_type not in (None, "", expected_type, "application/octet-stream"):
        upload.file.close()
        raise HTTPException(status_code=400, detail="The document content type does not match its file format.")

    content_parts = []
    total = 0
    try:
        while True:
            part = upload.file.read(min(64 * 1024, MAX_DOCUMENT_BYTES + 1 - total))
            if not part:
                break
            total += len(part)
            if total > MAX_DOCUMENT_BYTES:
                raise HTTPException(status_code=413, detail="Each verification document must be 5 MB or smaller.")
            content_parts.append(part)
    finally:
        upload.file.close()

    content = b"".join(content_parts)
    signature_valid = content.startswith(signature)
    if suffix == ".png":
        signature_valid = signature_valid and content[12:16] == b"IHDR"
    if not content or not signature_valid:
        raise HTTPException(status_code=400, detail="The file contents do not match a supported PDF, JPG, or PNG document.")

    # Remove control characters and keep only a safe basename for the admin UI.
    safe_original = "".join(char for char in original if char.isprintable())[:255] or f"{document_type.lower()}{suffix}"
    return safe_original, suffix, content


@router.get("/verification-status", response_model=RecruiterVerificationStatusResponse)
def get_recruiter_verification_status(
    current_user: User = Depends(get_current_recruiter_account),
    db: Session = Depends(get_db),
):
    verification = db.query(RecruiterVerification).filter(RecruiterVerification.user_id == current_user.id).first()
    return status_response(current_user, verification)


@router.post("/verification-documents", response_model=RecruiterVerificationStatusResponse, status_code=status.HTTP_201_CREATED)
def submit_recruiter_verification_documents(
    company_id: UploadFile = File(...),
    aadhaar: UploadFile | None = File(default=None),
    pan: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_recruiter_account),
    db: Session = Depends(get_db),
):
    existing = db.query(RecruiterVerification).filter(RecruiterVerification.user_id == current_user.id).first()
    if existing is not None:
        if existing.status == "APPROVED":
            raise HTTPException(status_code=409, detail="Your recruiter account is already approved; documents cannot be resubmitted.")
        if existing.status == "PENDING":
            raise HTTPException(status_code=409, detail="Your verification documents are already submitted and awaiting review.")
        raise HTTPException(status_code=409, detail="Resubmission after denial is not enabled. Contact an administrator for next steps.")

    uploads = [("COMPANY_ID", company_id), ("AADHAAR", aadhaar), ("PAN", pan)]
    prepared = []
    for kind, upload in uploads:
        if upload is not None and upload.filename:
            original, suffix, content = read_document(upload, kind)
            prepared.append((kind, original, suffix, content))
    if not any(kind == "COMPANY_ID" for kind, *_ in prepared):
        raise HTTPException(status_code=400, detail="A Company ID document is required.")

    stored_paths: list[Path] = []
    document_rows = []
    try:
        DOCUMENT_DIRECTORY.mkdir(parents=True, exist_ok=True)
        for kind, original, suffix, content in prepared:
            path = DOCUMENT_DIRECTORY / f"verification-{current_user.id}-{uuid4().hex}{suffix}"
            stored_paths.append(path)
            path.write_bytes(content)
            document_rows.append(VerificationDocument(
                document_type=kind,
                original_filename=original,
                file_path=str(path.resolve()),
            ))

        verification = RecruiterVerification(
            user_id=current_user.id,
            status="PENDING",
            documents=document_rows,
        )
        current_user.verification_status = "PENDING"
        db.add(verification)
        db.commit()
        db.refresh(verification)
    except HTTPException:
        raise
    except (OSError, SQLAlchemyError) as exc:
        db.rollback()
        for path in stored_paths:
            path.unlink(missing_ok=True)
        logger.exception("Recruiter verification submission failed for user %s", current_user.id)
        raise HTTPException(status_code=500, detail="The verification documents could not be saved. Please try again.") from exc

    return status_response(current_user, verification)
