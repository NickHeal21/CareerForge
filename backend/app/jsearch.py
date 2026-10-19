"""Small synchronous client for RapidAPI's JSearch job search endpoint."""

import logging
from typing import Any

import httpx

from app.config import get_settings

JSEARCH_URL = "https://jsearch.p.rapidapi.com/search-v2"
JSEARCH_HOST = "jsearch.p.rapidapi.com"
REQUEST_TIMEOUT = httpx.Timeout(timeout=10.0, connect=3.0)
MAX_DESCRIPTION_LENGTH = 3000
logger = logging.getLogger(__name__)


class JSearchError(Exception):
    """A safe, user-facing provider failure with an HTTP status for the route."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def _optional_string(value: Any, max_length: int = 1000) -> str | None:
    if not isinstance(value, str):
        return None
    value = value.strip()
    return value[:max_length] or None


def normalize_job(record: Any) -> dict[str, str | None] | None:
    """Map one provider record to our stable external-job response shape."""
    if not isinstance(record, dict):
        return None

    city = _optional_string(record.get("job_city"), 160)
    state = _optional_string(record.get("job_state"), 160)
    country = _optional_string(record.get("job_country"), 160)
    location = ", ".join(part for part in (city, state, country) if part) or None
    # The JSearch response may already provide a compact location field.
    if location is None:
        location = _optional_string(record.get("job_location"), 400)

    description = _optional_string(record.get("job_description"), MAX_DESCRIPTION_LENGTH)
    return {
        "source": "external",
        "external_job_id": _optional_string(record.get("job_id"), 300),
        "title": _optional_string(record.get("job_title"), 300),
        "company_name": _optional_string(record.get("employer_name"), 300),
        "company_logo_url": _optional_string(record.get("employer_logo"), 2000),
        "location": location,
        "employment_type": _optional_string(record.get("job_employment_type"), 120),
        "description": description,
        "application_url": _optional_string(record.get("job_apply_link"), 2000),
        "posted_at": _optional_string(record.get("job_posted_at_datetime_utc"), 80)
        or _optional_string(record.get("job_posted_at"), 80),
    }


class JSearchClient:
    def search(
        self,
        query: str,
        location: str | None = None,
        cursor: str | None = None,
        employment_type: str | None = None,
        country: str = "us",
        date_posted: str = "all",
    ) -> tuple[list[dict[str, str | None]], str | None]:
        api_key = get_settings().jsearch_api_key.strip()
        if not api_key:
            raise JSearchError(503, "External job search is not configured. Contact the administrator.")

        # search-v2 accepts location as part of its free-form query; unlike
        # /search it does not document a separate location parameter.
        provider_query = f"{query} in {location}" if location else query
        params: dict[str, str | int] = {
            "query": provider_query,
            "num_pages": 1,
            "country": country,
            "date_posted": date_posted,
        }
        if cursor:
            params["cursor"] = cursor
        if employment_type:
            # JSearch documents employment_types as a comma-separated list.
            params["employment_types"] = employment_type

        headers = {"X-RapidAPI-Key": api_key, "X-RapidAPI-Host": JSEARCH_HOST}
        try:
            with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
                response = client.get(JSEARCH_URL, headers=headers, params=params)
        except httpx.TimeoutException:
            raise JSearchError(504, "External job search timed out. Please try again.") from None
        except httpx.RequestError:
            raise JSearchError(502, "External job search is temporarily unavailable. Please try again.") from None

        if response.status_code == 429:
            logger.warning("JSearch provider response: status=%s category=rate_limited", response.status_code)
            raise JSearchError(429, "External job search is rate limited. Please try again later.")
        if response.status_code in (401, 403):
            logger.warning("JSearch provider response: status=%s category=credentials_or_subscription", response.status_code)
            raise JSearchError(502, "External job search credentials were rejected.")
        if response.status_code >= 500:
            logger.warning("JSearch provider response: status=%s category=provider_failure", response.status_code)
            raise JSearchError(502, "The external job search provider is temporarily unavailable.")
        if response.status_code == 400:
            logger.warning("JSearch provider response: status=%s category=request_rejected", response.status_code)
            raise JSearchError(422, "The external job search provider rejected the search parameters.")
        if response.status_code == 404:
            logger.warning("JSearch provider response: status=%s category=endpoint_not_found", response.status_code)
            raise JSearchError(502, "The external job search provider did not find the configured endpoint.")
        if response.status_code >= 400:
            logger.warning("JSearch provider response: status=%s category=unexpected_client_error", response.status_code)
            raise JSearchError(502, "The external job search provider rejected the request.")

        try:
            payload = response.json()
        except (ValueError, TypeError):
            raise JSearchError(502, "The external job search provider returned an invalid response.") from None

        if not isinstance(payload, dict):
            raise JSearchError(502, "The external job search provider returned an invalid response.")
        if payload.get("status") not in (None, "OK"):
            logger.warning("JSearch provider response: status=%s category=provider_payload_error", response.status_code)
            raise JSearchError(502, "The external job search provider could not complete the search.")
        data = payload.get("data", [])
        next_cursor = None
        if isinstance(data, dict):
            records = data.get("jobs", data.get("results", []))
            next_cursor = _optional_string(data.get("cursor"), 2000)
        else:
            records = data
            next_cursor = _optional_string(payload.get("cursor"), 2000)
        if records is None:
            records = []
        if not isinstance(records, list):
            raise JSearchError(502, "The external job search provider returned an invalid response.")

        jobs = [normalized for record in records if (normalized := normalize_job(record)) is not None]
        return jobs, next_cursor
