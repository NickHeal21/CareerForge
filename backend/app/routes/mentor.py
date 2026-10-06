from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.ai.gemini import GeminiRateLimitError, GeminiUnavailableError, mentor_reply
from app.dependencies import get_current_user, get_db
from app.models.profile import Profile
from app.models.readiness_analysis import ReadinessAnalysis
from app.models.resume import Resume
from app.models.roadmap import Roadmap
from app.models.user import User
from app.schemas.mentor import MentorChatRequest, MentorChatResponse, MentorContextUsed

router = APIRouter(tags=["mentor"])


def build_career_context(db: Session, user: User) -> tuple[dict, MentorContextUsed]:
    """Collect a compact snapshot from records owned by the authenticated applicant."""
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id, Resume.is_default.is_(True))
        .order_by(Resume.updated_at.desc(), Resume.id.desc())
        .first()
    )
    if resume is None:
        resume = (
            db.query(Resume)
            .filter(Resume.user_id == user.id)
            .order_by(Resume.updated_at.desc(), Resume.id.desc())
            .first()
        )

    readiness_query = db.query(ReadinessAnalysis).options(joinedload(ReadinessAnalysis.job)).filter(
        ReadinessAnalysis.user_id == user.id
    )
    readiness = None
    if resume is not None:
        readiness = readiness_query.filter(ReadinessAnalysis.resume_id == resume.id).order_by(
            ReadinessAnalysis.created_at.desc(), ReadinessAnalysis.id.desc()
        ).first()
    if readiness is None:
        readiness = readiness_query.order_by(
            ReadinessAnalysis.created_at.desc(), ReadinessAnalysis.id.desc()
        ).first()

    roadmap = (
        db.query(Roadmap)
        .options(joinedload(Roadmap.items), joinedload(Roadmap.job))
        .filter(Roadmap.user_id == user.id)
        .order_by(Roadmap.created_at.desc(), Roadmap.id.desc())
        .first()
    )

    context = {
        "applicant_name": user.name,
        "profile": None,
        "resume": None,
        "latest_readiness": None,
        "latest_roadmap": None,
    }
    if profile is not None:
        context["profile"] = {
            "education": {
                "tenth_percentage": profile.tenth_percentage,
                "twelfth_percentage": profile.twelfth_percentage,
                "undergraduate_degree": profile.ug_degree,
                "undergraduate_cgpa": profile.ug_cgpa,
                "postgraduate_degree": profile.pg_degree,
                "postgraduate_cgpa": profile.pg_cgpa,
            },
            "skills": (profile.skills or "")[:1500],
            "bio": (profile.bio or "")[:700],
            "location": profile.location,
            "links": {
                "linkedin": profile.linkedin_url,
                "github": profile.github_url,
                "leetcode": profile.leetcode_url,
                "portfolio": profile.portfolio_url,
            },
        }
    if resume is not None:
        context["resume"] = {
            "name": resume.name,
            "extracted_text": (resume.extracted_text or "")[:6000],
        }
    if readiness is not None:
        context["latest_readiness"] = {
            "job": {
                "title": readiness.job.title,
                "company": readiness.job.company_name,
                "required_skills": readiness.job.required_skills[:1200],
            },
            "readiness_percentage": readiness.readiness_percentage,
            "matching_skills": readiness.matching_skills[:12],
            "missing_skills": readiness.missing_skills[:12],
            "strengths": readiness.strengths[:8],
            "weaknesses": readiness.weaknesses[:8],
            "recommendations": readiness.recommendations[:8],
        }
    if roadmap is not None:
        items = [
            {
                "order": item.order_index,
                "title": item.title,
                "description": item.description[:500],
                "estimated_duration": item.estimated_duration,
                "completed": item.completed,
            }
            for item in roadmap.items[:12]
        ]
        completed_count = sum(1 for item in items if item["completed"])
        context["latest_roadmap"] = {
            "title": roadmap.title,
            "job_title": roadmap.job.title,
            "items": items,
            "progress_percentage": round(completed_count * 100 / len(items)) if items else 0,
        }

    context_used = MentorContextUsed(
        resume=resume is not None,
        profile=profile is not None,
        readiness=readiness is not None,
        roadmap=roadmap is not None,
    )
    return context, context_used


def get_current_applicant(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "APPLICANT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AI Mentor is available to applicant accounts only.")
    return current_user


@router.post("/chat", response_model=MentorChatResponse)
def chat_with_mentor(
    body: MentorChatRequest,
    current_user: User = Depends(get_current_applicant),
    db: Session = Depends(get_db),
):
    context, context_used = build_career_context(db, current_user)
    history = [message.model_dump() for message in body.history[-12:]]
    try:
        reply = mentor_reply(context=context, history=history, message=body.message)
    except GeminiRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI Mentor is temporarily unavailable because the AI service has reached its usage limit. Please try again later.",
        ) from exc
    except GeminiUnavailableError as exc:
        configured = "not configured" in str(exc).lower()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE if configured else status.HTTP_502_BAD_GATEWAY,
            detail="AI Mentor is not configured yet. Please contact the administrator." if configured else "AI Mentor is temporarily unavailable. Please try again later.",
        ) from exc

    return MentorChatResponse(reply=reply, context_used=context_used)
