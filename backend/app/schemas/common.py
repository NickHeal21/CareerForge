"""
Common Pydantic schemas — standardized API responses, pagination.
"""

from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int = 1
    per_page: int = 20
    total: int = 0
    total_pages: int = 0


class StandardResponse(BaseModel, Generic[T]):
    """Standardized API response wrapper."""
    success: bool = True
    message: str = "OK"
    data: Optional[T] = None
    meta: Optional[PaginationMeta] = None
    errors: Optional[List[dict]] = None

    @classmethod
    def ok(cls, data: Any = None, message: str = "OK", meta: PaginationMeta | None = None):
        return cls(success=True, message=message, data=data, meta=meta)

    @classmethod
    def error(cls, message: str, errors: list | None = None):
        return cls(success=False, message=message, errors=errors)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
