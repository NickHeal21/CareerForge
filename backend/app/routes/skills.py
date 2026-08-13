"""Skills and gap analysis routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_session, get_current_user_id
from app.schemas.common import StandardResponse
from app.schemas.skill import SkillGapRequest
from app.services.skill_service import SkillService

router = APIRouter()


@router.post("/analyze-gap", summary="Analyze skill gap against JD")
async def analyze_gap(
    data: SkillGapRequest,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = SkillService(session)
    result = await service.analyze_gap(user_id, data.job_description)
    if "error" in result and result.get("match_percentage", -1) == 0:
        return StandardResponse.error(result["error"])
    return StandardResponse.ok(data=result, message="Skill gap analysis complete")
