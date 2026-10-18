from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.job import Job
from app.models.recruiter_profile import RecruiterProfile
from app.models.user import User
from app.schemas.job import JobResponse

router = APIRouter(tags=["jobs"])


@router.get("", response_model=list[JobResponse])
def list_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.created_at.desc(), Job.id.asc()).all()
    logos = dict(db.query(RecruiterProfile.user_id, RecruiterProfile.company_logo).filter(
        RecruiterProfile.user_id.in_([job.recruiter_id for job in jobs if job.recruiter_id is not None])
    ).all()) if any(job.recruiter_id is not None for job in jobs) else {}
    return [JobResponse.model_validate(job).model_copy(update={"company_logo": logos.get(job.recruiter_id)}) for job in jobs]


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == job.recruiter_id).first() if job.recruiter_id else None
    return JobResponse.model_validate(job).model_copy(update={"company_logo": profile.company_logo if profile else None})
