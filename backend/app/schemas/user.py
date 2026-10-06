from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


# ---------------------------------------------------------------------------
# Request schemas  (what the frontend sends to us)
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    """Body for POST /api/auth/register"""
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    """Body for POST /api/auth/login"""
    email: EmailStr
    password: str


# ---------------------------------------------------------------------------
# Response schemas  (what we send back — never includes password_hash)
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    """Safe user object returned in API responses."""
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True   # allows building from SQLAlchemy model


class TokenResponse(BaseModel):
    """Returned on successful login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
