from typing import Annotated, Literal
import re

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user
from app.jsearch import JSearchClient, JSearchError
from app.models.user import User
from app.schemas.external_job import ExternalJobSearchResponse

router = APIRouter(tags=["external jobs"])


@router.get("/external-jobs", response_model=ExternalJobSearchResponse)
def search_external_jobs(
    query: Annotated[str, Query(min_length=1, max_length=200)],
    location: Annotated[str | None, Query(max_length=200)] = None,
    cursor: Annotated[str | None, Query(max_length=2000)] = None,
    employment_type: Annotated[
        Literal["FULLTIME", "CONTRACTOR", "PARTTIME", "INTERN"] | None,
        Query(),
    ] = None,
    country: Annotated[str, Query(min_length=2, max_length=2)] = "us",
    date_posted: Annotated[Literal["all", "today", "3days", "week", "month"], Query()] = "all",
    _current_user: User = Depends(get_current_user),
):
    query = query.strip()
    location = location.strip() if location else None
    if not query:
        raise HTTPException(status_code=422, detail="Query cannot be blank.")
    if location == "":
        location = None
    cursor = cursor.strip() if cursor else None
    if cursor == "":
        cursor = None
    country = country.lower()
    if not re.fullmatch(r"[a-z]{2}", country):
        raise HTTPException(status_code=422, detail="Country must be a two-letter country code.")

    try:
        jobs, next_cursor = JSearchClient().search(
            query, location, cursor, employment_type, country, date_posted
        )
    except JSearchError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None

    return ExternalJobSearchResponse(query=query, location=location, next_cursor=next_cursor, jobs=jobs)
