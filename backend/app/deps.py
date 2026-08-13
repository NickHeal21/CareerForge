"""
FastAPI dependency injection providers.
Centralizes all injectable dependencies for clean separation of concerns.
"""

from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db
from app.utils.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Inject async DB session."""
    async for session in get_db():
        yield session


def get_config() -> Settings:
    """Inject application settings."""
    return get_settings()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    settings: Settings = Depends(get_config),
) -> str:
    """
    Extract and validate the current user ID from the JWT bearer token.
    Returns the user UUID as a string.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return user_id


async def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    settings: Settings = Depends(get_config),
) -> str | None:
    """Optional authentication — returns None if no token provided."""
    if credentials is None:
        return None
    try:
        return await get_current_user_id(credentials, settings)
    except HTTPException:
        return None
