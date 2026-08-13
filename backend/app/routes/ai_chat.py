"""AI chat / mentor routes."""

from fastapi import APIRouter, Depends

from app.deps import get_current_user_id
from app.schemas.common import StandardResponse
from app.schemas.chat import ChatMessageRequest
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("/message", summary="Send message to AI mentor")
async def send_message(
    data: ChatMessageRequest,
    user_id: str = Depends(get_current_user_id),
):
    service = ChatService(user_id)
    result = service.send_message(data.message)
    return StandardResponse.ok(data=result, message="Response generated")


@router.get("/history", summary="Get chat history")
async def get_history(
    user_id: str = Depends(get_current_user_id),
):
    service = ChatService(user_id)
    history = service.get_history()
    return StandardResponse.ok(data=history)
