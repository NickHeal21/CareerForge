"""
Basic health check and smoke tests.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "CareerForge"


@pytest.mark.asyncio
async def test_docs_available_in_debug(client: AsyncClient):
    response = await client.get("/docs")
    assert response.status_code == 200
