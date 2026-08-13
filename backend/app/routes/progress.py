"""Progress and dashboard routes — simple aggregation queries."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_session, get_current_user_id
from app.schemas.common import StandardResponse
from app.models.resume import Resume
from app.models.interview import InterviewSession
from app.models.roadmap import Roadmap, RoadmapMilestone

router = APIRouter()


@router.get("/dashboard", summary="Dashboard aggregates")
async def get_dashboard(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    # Count resumes
    result = await session.execute(
        select(func.count()).select_from(Resume).where(Resume.user_id == user_id)
    )
    resume_count = result.scalar() or 0

    # Get latest ATS score
    result = await session.execute(
        select(Resume.ats_score)
        .where(Resume.user_id == user_id)
        .order_by(Resume.created_at.desc())
        .limit(1)
    )
    latest_ats = result.scalar() or 0

    # Count interviews
    result = await session.execute(
        select(func.count()).select_from(InterviewSession).where(InterviewSession.user_id == user_id)
    )
    interview_count = result.scalar() or 0

    # Count roadmaps and milestones
    result = await session.execute(
        select(func.count()).select_from(Roadmap).where(Roadmap.user_id == user_id)
    )
    roadmap_count = result.scalar() or 0

    # Count completed milestones
    result = await session.execute(
        select(func.count()).select_from(RoadmapMilestone)
        .join(Roadmap, RoadmapMilestone.roadmap_id == Roadmap.id)
        .where(Roadmap.user_id == user_id, RoadmapMilestone.is_completed == True)
    )
    completed_milestones = result.scalar() or 0

    result = await session.execute(
        select(func.count()).select_from(RoadmapMilestone)
        .join(Roadmap, RoadmapMilestone.roadmap_id == Roadmap.id)
        .where(Roadmap.user_id == user_id)
    )
    total_milestones = result.scalar() or 0

    roadmap_progress = round((completed_milestones / total_milestones * 100) if total_milestones > 0 else 0)

    return StandardResponse.ok(data={
        "resume_score": latest_ats,
        "resume_count": resume_count,
        "interview_count": interview_count,
        "roadmap_count": roadmap_count,
        "roadmap_progress": roadmap_progress,
        "completed_milestones": completed_milestones,
        "total_milestones": total_milestones,
    })
