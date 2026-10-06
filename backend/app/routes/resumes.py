from pathlib import Path
from uuid import uuid4

import fitz
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeRename, ResumeResponse

router = APIRouter(tags=["resumes"])
UPLOAD_DIRECTORY = Path(__file__).resolve().parents[2] / "uploads" / "resumes"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def owned_resume(resume_id: int, user: User, db: Session) -> Resume:
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user.id).first()
    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    return resume


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    original_filename = Path(file.filename or "").name
    if not original_filename:
        raise HTTPException(status_code=400, detail="A PDF file is required.")
    if Path(original_filename).suffix.lower() != ".pdf" or file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    content = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="PDF files must be 10 MB or smaller.")
    if not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF.")

    try:
        with fitz.open(stream=content, filetype="pdf") as document:
            if document.is_encrypted:
                raise HTTPException(status_code=400, detail="Password-protected PDFs are not supported.")
            extracted_text = "\n".join(page.get_text() for page in document)
    except HTTPException:
        raise
    except (fitz.FileDataError, RuntimeError, ValueError):
        raise HTTPException(status_code=400, detail="The uploaded PDF could not be read.")

    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
    stored_path = UPLOAD_DIRECTORY / f"{current_user.id}-{uuid4().hex}.pdf"
    stored_path.write_bytes(content)
    try:
        db.query(User).filter(User.id == current_user.id).with_for_update().one()
        is_first = db.query(Resume.id).filter(Resume.user_id == current_user.id).first() is None
        resume = Resume(
            user_id=current_user.id,
            name=Path(original_filename).stem[:150] or "My resume",
            original_filename=original_filename[:255],
            file_path=str(stored_path),
            extracted_text=extracted_text,
            is_default=is_first,
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume
    except Exception:
        db.rollback()
        stored_path.unlink(missing_ok=True)
        raise


@router.get("", response_model=list[ResumeResponse])
def list_resumes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc(), Resume.id.desc()).all()


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return owned_resume(resume_id, current_user, db)


@router.get("/{resume_id}/file")
def preview_resume(resume_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = owned_resume(resume_id, current_user, db)
    path = Path(resume.file_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Resume file is no longer available.")
    return FileResponse(path, media_type="application/pdf", filename=resume.original_filename, content_disposition_type="inline")


@router.patch("/{resume_id}", response_model=ResumeResponse)
def rename_resume(resume_id: int, body: ResumeRename, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = owned_resume(resume_id, current_user, db)
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Resume name cannot be empty.")
    resume.name = name
    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(resume_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = owned_resume(resume_id, current_user, db)
    file_path = Path(resume.file_path)
    db.delete(resume)
    db.commit()
    file_path.unlink(missing_ok=True)


@router.post("/{resume_id}/default", response_model=ResumeResponse)
def set_default_resume(resume_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(User).filter(User.id == current_user.id).with_for_update().one()
    resume = owned_resume(resume_id, current_user, db)
    db.query(Resume).filter(Resume.user_id == current_user.id, Resume.id != resume.id).update(
        {Resume.is_default: False}, synchronize_session=False
    )
    resume.is_default = True
    db.commit()
    db.refresh(resume)
    return resume
