"""Interview routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_session, get_current_user_id
from app.schemas.common import StandardResponse
from app.schemas.interview import InterviewStartRequest, InterviewAnswerRequest
from app.services.interview_service import InterviewService

router = APIRouter()


@router.post("/start", summary="Start mock interview")
async def start_interview(
    data: InterviewStartRequest,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = InterviewService(session)
    result = await service.start_interview(
        user_id=user_id,
        interview_type=data.interview_type,
        topic=data.topic,
        num_questions=data.num_questions,
    )
    if "error" in result:
        return StandardResponse.error(result["error"])
    return StandardResponse.ok(data=result, message="Interview started")


@router.post("/{session_id}/answer", summary="Submit answer")
async def submit_answer(
    session_id: str,
    data: InterviewAnswerRequest,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = InterviewService(session)
    result = await service.submit_answer(
        session_id=session_id,
        question_index=data.question_index,
        question=data.question,
        answer=data.answer,
    )
    return StandardResponse.ok(data=result, message="Answer evaluated")


@router.get("/{session_id}/feedback", summary="Get session feedback")
async def get_feedback(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = InterviewService(session)
    result = await service.get_session_feedback(session_id)
    if "error" in result:
        return StandardResponse.error(result["error"])
    return StandardResponse.ok(data=result)
