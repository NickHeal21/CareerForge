"""Roadmap routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_session, get_current_user_id
from app.schemas.common import StandardResponse
from app.schemas.roadmap import RoadmapGenerateRequest, MilestoneUpdateRequest
from app.services.roadmap_service import RoadmapService

router = APIRouter()


@router.post("/generate", summary="Generate AI roadmap")
async def generate_roadmap(
    data: RoadmapGenerateRequest,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = RoadmapService(session)
    result = await service.generate(
        user_id=user_id,
        target_role=data.target_role,
        current_skills=data.current_skills,
        skill_gaps=data.skill_gaps,
        weeks=data.weeks,
    )
    if "error" in result:
        return StandardResponse.error(result["error"])
    return StandardResponse.ok(data=result, message="Roadmap generated")


@router.get("", summary="List user roadmaps")
async def list_roadmaps(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = RoadmapService(session)
    roadmaps = await service.get_user_roadmaps(user_id)
    return StandardResponse.ok(data=roadmaps)


@router.patch("/{roadmap_id}/milestones/{milestone_id}", summary="Update milestone")
async def update_milestone(
    roadmap_id: str,
    milestone_id: str,
    data: MilestoneUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = RoadmapService(session)
    result = await service.update_milestone(milestone_id, data.is_completed)
    if "error" in result:
        return StandardResponse.error(result["error"])
    return StandardResponse.ok(data=result, message="Milestone updated")
