"""Authentication routes — register, login, token refresh."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.deps import get_session, get_config
from app.schemas.user import UserRegister, UserLogin, UserResponse
from app.schemas.common import StandardResponse, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", summary="Register with email/password")
async def register(
    data: UserRegister,
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_config),
):
    service = AuthService(session, settings)
    result = await service.register(data)
    user_data = UserResponse.model_validate(result["user"])
    return StandardResponse.ok(
        data={
            "user": user_data.model_dump(mode="json"),
            "tokens": result["tokens"],
        },
        message="Registration successful",
    )


@router.post("/login", summary="Login with email/password")
async def login(
    data: UserLogin,
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_config),
):
    service = AuthService(session, settings)
    result = await service.login(data)
    user_data = UserResponse.model_validate(result["user"])
    return StandardResponse.ok(
        data={
            "user": user_data.model_dump(mode="json"),
            "tokens": result["tokens"],
        },
        message="Login successful",
    )


@router.post("/refresh", summary="Refresh access token")
async def refresh_token(
    body: dict,
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_config),
):
    service = AuthService(session, settings)
    result = await service.refresh(body.get("refresh_token", ""))
    return StandardResponse.ok(data=result, message="Token refreshed")
