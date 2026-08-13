"""
Authentication service — register, login, token refresh.
"""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models.user import User, AuthProvider
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserRegister, UserLogin
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)


class AuthService:
    def __init__(self, session: AsyncSession, settings: Settings):
        self.repo = UserRepository(session)
        self.settings = settings

    async def register(self, data: UserRegister) -> dict:
        """Register a new user with email/password."""
        if await self.repo.email_exists(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            auth_provider=AuthProvider.LOCAL,
        )
        user = await self.repo.create(user)

        tokens = self._create_tokens(str(user.id))
        return {
            "user": user,
            "tokens": tokens,
        }

    async def login(self, data: UserLogin) -> dict:
        """Authenticate user with email/password."""
        user = await self.repo.get_by_email(data.email)
        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        tokens = self._create_tokens(str(user.id))
        return {
            "user": user,
            "tokens": tokens,
        }

    async def refresh(self, refresh_token: str) -> dict:
        """Issue new access token from valid refresh token."""
        payload = decode_refresh_token(
            refresh_token,
            self.settings.JWT_SECRET_KEY,
            self.settings.JWT_ALGORITHM,
        )
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        user_id = payload.get("sub")
        user = await self.repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or deactivated",
            )

        access_token = create_access_token(
            subject=str(user.id),
            secret_key=self.settings.JWT_SECRET_KEY,
            algorithm=self.settings.JWT_ALGORITHM,
            expires_minutes=self.settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    def _create_tokens(self, user_id: str) -> dict:
        access_token = create_access_token(
            subject=user_id,
            secret_key=self.settings.JWT_SECRET_KEY,
            algorithm=self.settings.JWT_ALGORITHM,
            expires_minutes=self.settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )
        refresh_token = create_refresh_token(
            subject=user_id,
            secret_key=self.settings.JWT_SECRET_KEY,
            algorithm=self.settings.JWT_ALGORITHM,
            expires_days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS,
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
