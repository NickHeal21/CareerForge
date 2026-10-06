from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from pathlib import Path

from app.dependencies import get_current_recruiter, get_db
from app.models.application import Application
from app.models.job import Job
from app.models.profile import Profile
from app.models.readiness_analysis import ReadinessAnalysis
from app.models.recruiter_profile import RecruiterProfile
from app.models.resume import Resume
from app.models.roadmap import Roadmap
from app.models.user import User
from app.schemas.application import (
    ApplicationStatusUpdate,
    CandidateReadiness,
    CandidateResume,
    RecruiterApplicationDetail,
    RecruiterApplicationListItem,
    RecruiterCandidateProfile,
    RecruiterJobInfo,
)
from app.schemas.job import RecruiterJobCreate, RecruiterJobResponse, RecruiterJobUpdate
from app.schemas.recruiter_profile import RecruiterProfileResponse, RecruiterProfileUpdate

router = APIRouter(tags=["recruiter"])

APPLICATION_STATUSES = {"APPLIED", "SHORTLISTED", "INTERVIEW", "REJECTED", "HIRED"}


def owned_job(job_id: int, recruiter: User, db: Session) -> Job:
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == recruiter.id).first()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return job


def job_with_application_count(job: Job, db: Session) -> RecruiterJobResponse:
    count = db.query(func.count(Application.id)).filter(Application.job_id == job.id).scalar() or 0
    return RecruiterJobResponse.model_validate(job).model_copy(update={"application_count": count})


def owned_application(application_id: int, recruiter: User, db: Session) -> Application:
    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .options(joinedload(Application.user), joinedload(Application.resume), joinedload(Application.job))
        .filter(Application.id == application_id, Job.recruiter_id == recruiter.id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return application


def readiness_for_application(application: Application, db: Session) -> ReadinessAnalysis | None:
    if application.resume_id is None:
        return None
    return (
        db.query(ReadinessAnalysis)
        .filter(
            ReadinessAnalysis.user_id == application.user_id,
            ReadinessAnalysis.resume_id == application.resume_id,
            ReadinessAnalysis.job_id == application.job_id,
        )
        .order_by(ReadinessAnalysis.created_at.desc(), ReadinessAnalysis.id.desc())
        .first()
    )


def application_list_item(application: Application, db: Session) -> RecruiterApplicationListItem:
    readiness = readiness_for_application(application, db)
    resume = CandidateResume.model_validate(application.resume) if application.resume else None
    return RecruiterApplicationListItem(
        id=application.id,
        applicant_id=application.user.id,
        applicant_name=application.user.name,
        applicant_email=application.user.email,
        status=application.status,
        applied_at=application.applied_at,
        resume=resume,
        readiness_percentage=readiness.readiness_percentage if readiness else None,
    )


@router.get("/jobs/{job_id}/applications", response_model=list[RecruiterApplicationListItem])
def list_recruiter_job_applications(
    job_id: int,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    owned_job(job_id, current_user, db)
    applications = (
        db.query(Application)
        .options(joinedload(Application.user), joinedload(Application.resume))
        .filter(Application.job_id == job_id)
        .order_by(Application.applied_at.desc(), Application.id.desc())
        .all()
    )
    return [application_list_item(application, db) for application in applications]


@router.get("/applications/{application_id}", response_model=RecruiterApplicationDetail)
def get_recruiter_application(
    application_id: int,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    application = owned_application(application_id, current_user, db)
    profile = db.query(Profile).filter(Profile.user_id == application.user_id).first()
    readiness = readiness_for_application(application, db)
    return RecruiterApplicationDetail(
        id=application.id,
        applicant_id=application.user.id,
        applicant_name=application.user.name,
        applicant_email=application.user.email,
        status=application.status,
        applied_at=application.applied_at,
        job=RecruiterJobInfo.model_validate(application.job),
        profile=RecruiterCandidateProfile.model_validate(profile) if profile else None,
        resume=CandidateResume.model_validate(application.resume) if application.resume else None,
        readiness=CandidateReadiness.model_validate(readiness) if readiness else None,
    )


@router.patch("/applications/{application_id}/status")
def update_recruiter_application_status(
    application_id: int,
    body: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    application = owned_application(application_id, current_user, db)
    application.status = body.status
    db.commit()
    return {"id": application.id, "status": application.status}


@router.get("/applications/{application_id}/resume")
def get_recruiter_application_resume(
    application_id: int,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    application = owned_application(application_id, current_user, db)
    if application.resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The applicant's resume is no longer available.")
    path = Path(application.resume.file_path)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The resume file is no longer available.")
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=application.resume.original_filename,
        content_disposition_type="inline",
    )


@router.post("/jobs", response_model=RecruiterJobResponse, status_code=status.HTTP_201_CREATED)
def create_recruiter_job(
    body: RecruiterJobCreate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    values = body.model_dump()
    values["application_url"] = str(values["application_url"])
    job = Job(**values, recruiter_id=current_user.id)
    db.add(job)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A job with this title and company already exists.") from exc
    db.refresh(job)
    return job_with_application_count(job, db)


@router.get("/jobs", response_model=list[RecruiterJobResponse])
def list_recruiter_jobs(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).order_by(Job.created_at.desc(), Job.id.desc()).all()
    if not jobs:
        return []
    counts = dict(
        db.query(Application.job_id, func.count(Application.id))
        .filter(Application.job_id.in_([job.id for job in jobs]))
        .group_by(Application.job_id)
        .all()
    )
    return [
        RecruiterJobResponse.model_validate(job).model_copy(update={"application_count": counts.get(job.id, 0)})
        for job in jobs
    ]


@router.get("/jobs/{job_id}", response_model=RecruiterJobResponse)
def get_recruiter_job(
    job_id: int,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    return job_with_application_count(owned_job(job_id, current_user, db), db)


@router.put("/jobs/{job_id}", response_model=RecruiterJobResponse)
def update_recruiter_job(
    job_id: int,
    body: RecruiterJobUpdate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    job = owned_job(job_id, current_user, db)
    for field, value in body.model_dump().items():
        setattr(job, field, str(value) if field == "application_url" else value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A job with this title and company already exists.") from exc
    db.refresh(job)
    return job_with_application_count(job, db)


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recruiter_job(
    job_id: int,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    job = owned_job(job_id, current_user, db)
    has_applications = db.query(Application.id).filter(Application.job_id == job.id).first() is not None
    has_readiness = db.query(ReadinessAnalysis.id).filter(ReadinessAnalysis.job_id == job.id).first() is not None
    has_roadmaps = db.query(Roadmap.id).filter(Roadmap.job_id == job.id).first() is not None
    if has_applications or has_readiness or has_roadmaps:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This job has applications or saved readiness data and cannot be deleted.",
        )
    db.delete(job)
    db.commit()


@router.get("/profile", response_model=RecruiterProfileResponse)
def get_recruiter_profile(
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == current_user.id).first()
    return profile if profile else RecruiterProfileResponse(user_id=current_user.id)


@router.put("/profile", response_model=RecruiterProfileResponse)
def update_recruiter_profile(
    body: RecruiterProfileUpdate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == current_user.id).first()
    if profile is None:
        profile = RecruiterProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in body.model_dump().items():
        setattr(profile, field, str(value) if value is not None and field in ("company_logo", "website") else value)

    db.commit()
    db.refresh(profile)
    return profile
