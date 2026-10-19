from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.ai.gemini import GeminiRateLimitError, GeminiUnavailableError, analyze_readiness
from app.dependencies import get_current_user, get_db
from app.models.job import Job
from app.models.readiness_analysis import ReadinessAnalysis
from app.models.resume import Resume
from app.models.user import User
from app.schemas.readiness import ReadinessAnalyzeRequest, ReadinessResponse

router = APIRouter(tags=["readiness"])


def analysis_query(db: Session):
    return db.query(ReadinessAnalysis).options(
        joinedload(ReadinessAnalysis.job), joinedload(ReadinessAnalysis.resume)
    )


@router.post("/analyze", response_model=ReadinessResponse, status_code=status.HTTP_201_CREATED)
def create_readiness_analysis(
    body: ReadinessAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.get(Job, body.job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    if body.resume_id is None:
        resume = db.query(Resume).filter(Resume.user_id == current_user.id, Resume.is_default.is_(True)).first()
        if resume is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a resume and set it as default, or select a resume to analyze.")
    else:
        resume = db.query(Resume).filter(Resume.id == body.resume_id, Resume.user_id == current_user.id).first()
        if resume is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    if not resume.extracted_text.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="This resume has no extractable text. Upload a text-based PDF and try again.")

    # A saved result for the same immutable resume/job pair can be reused.
    existing = analysis_query(db).filter(
        ReadinessAnalysis.user_id == current_user.id,
        ReadinessAnalysis.resume_id == resume.id,
        ReadinessAnalysis.job_id == job.id,
    ).first()
    if existing:
        return existing

    try:
        result = analyze_readiness(resume.extracted_text, job.title, job.company_name, job.description, job.required_skills)
    except GeminiRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Job readiness analysis is temporarily unavailable because the AI service has reached its usage limit. Please try again later.",
        ) from exc
    except GeminiUnavailableError as exc:
        configured = "not configured" in str(exc).lower()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE if configured else status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    analysis = ReadinessAnalysis(
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=job.id,
        readiness_percentage=result.readiness_percentage,
        matching_skills=result.matching_skills,
        missing_skills=result.missing_skills,
        strengths=result.strengths,
        weaknesses=result.weaknesses,
        recommendations=result.recommendations,
    )
    db.add(analysis)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = analysis_query(db).filter(
            ReadinessAnalysis.user_id == current_user.id,
            ReadinessAnalysis.resume_id == resume.id,
            ReadinessAnalysis.job_id == job.id,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(analysis)
    return analysis_query(db).filter(ReadinessAnalysis.id == analysis.id).first()


@router.get("", response_model=list[ReadinessResponse])
def list_readiness_analyses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analysis_query(db).filter(ReadinessAnalysis.user_id == current_user.id).order_by(
        ReadinessAnalysis.created_at.desc(), ReadinessAnalysis.id.desc()
    ).all()


@router.get("/{analysis_id}", response_model=ReadinessResponse)
def get_readiness_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis = analysis_query(db).filter(
        ReadinessAnalysis.id == analysis_id,
        ReadinessAnalysis.user_id == current_user.id,
    ).first()
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Readiness analysis not found.")
    return analysis
