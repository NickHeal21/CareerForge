"""User profile routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_session, get_current_user_id
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.common import StandardResponse

router = APIRouter()


@router.get("/me", summary="Get current user profile")
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if not user:
        return StandardResponse.error("User not found")
    user_data = UserResponse.model_validate(user)
    return StandardResponse.ok(data=user_data.model_dump(mode="json"))


@router.put("/me", summary="Update user profile")
async def update_profile(
    data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if not user:
        return StandardResponse.error("User not found")
    update_data = data.model_dump(exclude_unset=True)
    user = await repo.update(user, update_data)
    user_data = UserResponse.model_validate(user)
    return StandardResponse.ok(data=user_data.model_dump(mode="json"), message="Profile updated")
