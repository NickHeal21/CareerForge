from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, aliased

from app.dependencies import get_current_admin, get_db
from app.models.application import Application
from app.models.job import Job
from app.models.profile import Profile
from app.models.recruiter_profile import RecruiterProfile
from app.models.resume import Resume
from app.models.user import User
from app.schemas.admin import (
    AdminApplicationSummary,
    AdminDashboardResponse,
    AdminJobSummary,
    AdminProfileSummary,
    AdminRecruiterProfileSummary,
    AdminRecruiterSummary,
    AdminUserDetail,
    AdminUserSummary,
)

router = APIRouter(tags=["admin"])

RoleFilter = Literal["APPLICANT", "RECRUITER", "ADMIN"]


def job_rows(db: Session, search: str | None = None, job_id: int | None = None):
    recruiter = aliased(User)
    application_counts = (
        db.query(Application.job_id.label("job_id"), func.count(Application.id).label("application_count"))
        .group_by(Application.job_id)
        .subquery()
    )
    query = (
        db.query(Job, recruiter, func.coalesce(application_counts.c.application_count, 0))
        .outerjoin(recruiter, Job.recruiter_id == recruiter.id)
        .outerjoin(application_counts, application_counts.c.job_id == Job.id)
    )
    if job_id is not None:
        query = query.filter(Job.id == job_id)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(Job.title.ilike(term), Job.company_name.ilike(term), Job.location.ilike(term), recruiter.name.ilike(term), recruiter.email.ilike(term)))
    return query


def admin_job_summary(job: Job, recruiter: User | None, count: int) -> AdminJobSummary:
    return AdminJobSummary(
        id=job.id,
        title=job.title,
        company_name=job.company_name,
        location=job.location,
        description=job.description,
        required_skills=job.required_skills,
        application_url=job.application_url,
        recruiter_id=job.recruiter_id,
        recruiter_name=recruiter.name if recruiter else None,
        recruiter_email=recruiter.email if recruiter else None,
        application_count=count,
        created_at=job.created_at,
    )


def application_rows(db: Session, search: str | None = None, status_filter: str | None = None):
    applicant = aliased(User)
    recruiter = aliased(User)
    query = (
        db.query(Application, applicant, Job, recruiter)
        .join(applicant, Application.user_id == applicant.id)
        .join(Job, Application.job_id == Job.id)
        .outerjoin(recruiter, Job.recruiter_id == recruiter.id)
    )
    if status_filter and status_filter.strip():
        query = query.filter(func.upper(Application.status) == status_filter.strip().upper())
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(applicant.name.ilike(term), applicant.email.ilike(term), Job.title.ilike(term), Job.company_name.ilike(term)))
    return query


def admin_application_summary(application: Application, applicant: User, job: Job, recruiter: User | None):
    return AdminApplicationSummary(
        id=application.id,
        status=application.status,
        applied_at=application.applied_at,
        applicant_id=applicant.id,
        applicant_name=applicant.name,
        applicant_email=applicant.email,
        job_id=job.id,
        job_title=job.title,
        company_name=job.company_name,
        recruiter_id=job.recruiter_id,
        recruiter_name=recruiter.name if recruiter else None,
    )


@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_admin_dashboard(_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    recent_users = db.query(User).order_by(User.created_at.desc(), User.id.desc()).limit(5).all()
    recent_jobs = job_rows(db).order_by(Job.created_at.desc(), Job.id.desc()).limit(5).all()
    recent_applications = application_rows(db).order_by(Application.applied_at.desc(), Application.id.desc()).limit(5).all()
    return AdminDashboardResponse(
        total_users=db.query(func.count(User.id)).scalar() or 0,
        total_applicants=db.query(func.count(User.id)).filter(User.role == "APPLICANT").scalar() or 0,
        total_recruiters=db.query(func.count(User.id)).filter(User.role == "RECRUITER").scalar() or 0,
        total_jobs=db.query(func.count(Job.id)).scalar() or 0,
        total_applications=db.query(func.count(Application.id)).scalar() or 0,
        recent_users=[AdminUserSummary.model_validate(user) for user in recent_users],
        recent_jobs=[admin_job_summary(*row) for row in recent_jobs],
        recent_applications=[admin_application_summary(*row) for row in recent_applications],
    )


@router.get("/users", response_model=list[AdminUserSummary])
def list_admin_users(
    search: str | None = None,
    role: RoleFilter | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(term), User.email.ilike(term)))
    users = query.order_by(User.created_at.desc(), User.id.desc()).offset(skip).limit(limit).all()
    return [AdminUserSummary.model_validate(user) for user in users]


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def get_admin_user(user_id: int, _admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    profile = db.query(Profile).filter(Profile.user_id == user.id).first() if user.role == "APPLICANT" else None
    recruiter_profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == user.id).first() if user.role == "RECRUITER" else None
    return AdminUserDetail(
        user=AdminUserSummary.model_validate(user),
        profile=AdminProfileSummary.model_validate(profile) if profile else None,
        recruiter_profile=AdminRecruiterProfileSummary.model_validate(recruiter_profile) if recruiter_profile else None,
        resume_count=db.query(func.count(Resume.id)).filter(Resume.user_id == user.id).scalar() or 0,
        application_count=db.query(func.count(Application.id)).filter(Application.user_id == user.id).scalar() or 0,
        job_count=db.query(func.count(Job.id)).filter(Job.recruiter_id == user.id).scalar() or 0,
    )


@router.get("/recruiters", response_model=list[AdminRecruiterSummary])
def list_admin_recruiters(
    search: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_counts = db.query(Job.recruiter_id.label("recruiter_id"), func.count(Job.id).label("job_count")).group_by(Job.recruiter_id).subquery()
    query = (
        db.query(User, RecruiterProfile, func.coalesce(job_counts.c.job_count, 0))
        .outerjoin(RecruiterProfile, RecruiterProfile.user_id == User.id)
        .outerjoin(job_counts, job_counts.c.recruiter_id == User.id)
        .filter(User.role == "RECRUITER")
    )
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(term), User.email.ilike(term), RecruiterProfile.company_name.ilike(term)))
    rows = query.order_by(User.created_at.desc(), User.id.desc()).offset(skip).limit(limit).all()
    return [
        AdminRecruiterSummary(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            company_name=profile.company_name if profile else None,
            designation=profile.designation if profile else None,
            location=profile.location if profile else None,
            job_count=count,
        )
        for user, profile, count in rows
    ]


@router.get("/jobs", response_model=list[AdminJobSummary])
def list_admin_jobs(
    search: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    rows = job_rows(db, search=search).order_by(Job.created_at.desc(), Job.id.desc()).offset(skip).limit(limit).all()
    return [admin_job_summary(*row) for row in rows]


@router.get("/jobs/{job_id}", response_model=AdminJobSummary)
def get_admin_job(job_id: int, _admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    row = job_rows(db, job_id=job_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return admin_job_summary(*row)


@router.get("/applications", response_model=list[AdminApplicationSummary])
def list_admin_applications(
    search: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    rows = application_rows(db, search=search, status_filter=status_filter).order_by(
        Application.applied_at.desc(), Application.id.desc()
    ).offset(skip).limit(limit).all()
    return [admin_application_summary(*row) for row in rows]
