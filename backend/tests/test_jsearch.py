"""Offline JSearch client and route regression tests; never call RapidAPI."""

import unittest
from types import SimpleNamespace
from unittest.mock import patch

import httpx
from fastapi import HTTPException

from app import jsearch
from app.routes import external_jobs


def provider_response(status_code=200, payload=None):
    request = httpx.Request("GET", "https://jsearch.p.rapidapi.com/search-v2")
    if isinstance(payload, Exception):
        response = httpx.Response(status_code, request=request)
        response.json = lambda: (_ for _ in ()).throw(payload)
        return response
    return httpx.Response(status_code, json=payload, request=request)


class FakeClient:
    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error
        self.kwargs = None

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def get(self, url, **kwargs):
        self.kwargs = {"url": url, **kwargs}
        if self.error:
            raise self.error
        return self.response


class JSearchTests(unittest.TestCase):
    def setUp(self):
        self.settings = SimpleNamespace(jsearch_api_key="test-secret-value")

    def _search(self, response=None, error=None, **kwargs):
        fake = FakeClient(response, error)
        with (
            patch.object(jsearch, "get_settings", return_value=self.settings),
            patch.object(jsearch.httpx, "Client", return_value=fake) as client_factory,
        ):
            result = jsearch.JSearchClient().search("python developer", **kwargs)
        return result, fake, client_factory

    def test_valid_search_uses_official_endpoint_headers_and_parameters(self):
        (jobs, cursor), fake, factory = self._search(
            provider_response(200, {"status": "OK", "data": {"jobs": [{
                "job_id": "external-1", "job_title": "Python Developer",
                "employer_name": "Example Co", "job_city": "Pune",
                "job_country": "India", "job_description": "Build services.",
                "job_apply_link": "https://example.test/apply",
            }], "cursor": "next-provider-cursor"}}),
            location="Pune", cursor="next-token", employment_type="FULLTIME",
            country="us", date_posted="week",
        )
        self.assertEqual(jobs[0]["source"], "external")
        self.assertEqual(jobs[0]["location"], "Pune, India")
        self.assertEqual(cursor, "next-provider-cursor")
        self.assertEqual(fake.kwargs["url"], jsearch.JSEARCH_URL)
        self.assertEqual(fake.kwargs["url"], "https://jsearch.p.rapidapi.com/search-v2")
        self.assertEqual(fake.kwargs["headers"]["X-RapidAPI-Key"], "test-secret-value")
        self.assertEqual(fake.kwargs["headers"]["X-RapidAPI-Host"], jsearch.JSEARCH_HOST)
        self.assertEqual(fake.kwargs["params"], {
            "query": "python developer in Pune", "cursor": "next-token",
            "num_pages": 1, "country": "us", "date_posted": "week",
            "employment_types": "FULLTIME",
        })
        self.assertNotIn("location", fake.kwargs["params"])
        self.assertNotIn("page", fake.kwargs["params"])
        factory.assert_called_once_with(timeout=jsearch.REQUEST_TIMEOUT)

    def test_empty_and_missing_optional_fields_are_safe(self):
        (jobs, _), _, _ = self._search(provider_response(200, {"status": "OK", "data": {"jobs": []}}))
        self.assertEqual(jobs, [])
        (jobs, _), _, _ = self._search(provider_response(200, {"status": "OK", "data": {"jobs": [{"job_title": "Unknown"}]}}))
        self.assertEqual(jobs[0]["title"], "Unknown")
        self.assertIsNone(jobs[0]["company_name"])
        self.assertIsNone(jobs[0]["application_url"])

    def test_missing_key_returns_safe_configuration_error_without_http_call(self):
        with (
            patch.object(jsearch, "get_settings", return_value=SimpleNamespace(jsearch_api_key="")),
            patch.object(jsearch.httpx, "Client") as factory,
        ):
            with self.assertRaises(jsearch.JSearchError) as raised:
                jsearch.JSearchClient().search("engineer")
        self.assertEqual(raised.exception.status_code, 503)
        self.assertNotIn("test-secret-value", raised.exception.message)
        factory.assert_not_called()

    def test_provider_rate_limit_invalid_key_and_server_error(self):
        for status, expected in ((429, 429), (401, 502), (403, 502), (503, 502), (400, 422), (404, 502)):
            fake = FakeClient(provider_response(status, {"error": "private provider detail"}))
            with (
                self.subTest(status=status),
                patch.object(jsearch, "get_settings", return_value=self.settings),
                patch.object(jsearch.httpx, "Client", return_value=fake),
            ):
                with self.assertRaises(jsearch.JSearchError) as raised:
                    jsearch.JSearchClient().search("engineer")
            self.assertEqual(raised.exception.status_code, expected)
            self.assertNotIn("test-secret-value", raised.exception.message)
            self.assertNotIn("private provider detail", raised.exception.message)

    def test_timeout_and_transport_failure_are_safe(self):
        for error, expected in ((httpx.ReadTimeout("sensitive"), 504), (httpx.ConnectError("secret"), 502)):
            with (
                self.subTest(error=type(error).__name__),
                patch.object(jsearch, "get_settings", return_value=self.settings),
                patch.object(jsearch.httpx, "Client", return_value=FakeClient(error=error)),
            ):
                with self.assertRaises(jsearch.JSearchError) as raised:
                    jsearch.JSearchClient().search("engineer")
            self.assertEqual(raised.exception.status_code, expected)
            self.assertNotIn("secret", raised.exception.message)

    def test_invalid_json_malformed_payload_and_malformed_records(self):
        for payload in (ValueError("raw provider response"), {"data": "wrong"}, []):
            fake = FakeClient(provider_response(200, payload))
            with (
                patch.object(jsearch, "get_settings", return_value=self.settings),
                patch.object(jsearch.httpx, "Client", return_value=fake),
            ):
                with self.assertRaises(jsearch.JSearchError) as raised:
                    jsearch.JSearchClient().search("engineer")
            self.assertEqual(raised.exception.status_code, 502)
            self.assertNotIn("raw provider response", raised.exception.message)

        (jobs, _), _, _ = self._search(provider_response(200, {"status": "OK", "data": {"jobs": [None, "bad", {"job_title": "Valid"}]}}))
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]["title"], "Valid")

    def test_cursor_response_shape_is_supported(self):
        (jobs, cursor), _, _ = self._search(provider_response(200, {
            "status": "OK", "data": {"jobs": [{"job_title": "Engineer"}], "cursor": "cursor-next"}
        }))
        self.assertEqual(jobs[0]["title"], "Engineer")
        self.assertEqual(cursor, "cursor-next")

    def test_provider_error_envelope_is_not_mistaken_for_empty_results(self):
        with (
            patch.object(jsearch, "get_settings", return_value=self.settings),
            patch.object(jsearch.httpx, "Client", return_value=FakeClient(
                provider_response(200, {"status": "ERROR", "error": {"message": "private detail"}})
            )),
        ):
            with self.assertRaises(jsearch.JSearchError) as raised:
                jsearch.JSearchClient().search("engineer")
        self.assertEqual(raised.exception.status_code, 502)
        self.assertNotIn("private detail", raised.exception.message)

    def test_route_validation_auth_dependency_and_external_shape(self):
        from app.main import app

        parameters = app.openapi()["paths"]["/api/external-jobs"]["get"]["parameters"]
        schemas = {item["name"]: item["schema"] for item in parameters}
        self.assertEqual(schemas["query"]["minLength"], 1)
        self.assertEqual(schemas["query"]["maxLength"], 200)
        self.assertEqual(schemas["cursor"]["anyOf"][0]["maxLength"], 2000)
        self.assertEqual(schemas["country"]["default"], "us")
        self.assertEqual(schemas["country"]["minLength"], 2)
        self.assertEqual(schemas["country"]["maxLength"], 2)
        self.assertEqual(schemas["date_posted"]["enum"], ["all", "today", "3days", "week", "month"])
        self.assertEqual(schemas["employment_type"]["anyOf"][0]["enum"], ["FULLTIME", "CONTRACTOR", "PARTTIME", "INTERN"])
        route = next(route for route in external_jobs.router.routes if route.path == "/external-jobs")
        self.assertIsNotNone(route.dependant.dependencies)
        with patch.object(external_jobs, "JSearchClient") as factory:
            factory.return_value.search.return_value = ([{"source": "external", "title": "Engineer"}], "cursor")
            result = external_jobs.search_external_jobs(
                "engineer", "Remote", None, None, "us", "all", SimpleNamespace()
            )
        self.assertEqual(result.model_dump()["jobs"][0]["source"], "external")
        self.assertEqual(result.next_cursor, "cursor")
        with patch.object(external_jobs, "JSearchClient") as factory:
            factory.return_value.search.side_effect = jsearch.JSearchError(429, "Rate limited")
            with self.assertRaises(HTTPException) as raised:
                external_jobs.search_external_jobs("engineer", None, None, None, "us", "all", SimpleNamespace())
        self.assertEqual(raised.exception.status_code, 429)

    def test_settings_load_backend_env_independent_of_current_directory(self):
        from pathlib import Path
        from app.config import Settings

        configured_env = Path(Settings.model_config["env_file"])
        self.assertEqual(configured_env, Path(jsearch.__file__).resolve().parents[1] / ".env")

    def test_internal_job_router_is_separate_and_unchanged(self):
        from app.routes import jobs

        paths = {(route.path, tuple(sorted(route.methods or []))) for route in jobs.router.routes}
        self.assertIn(("", ("GET",)), paths)
        self.assertIn(("/{job_id}", ("GET",)), paths)
        self.assertNotIn(("/external-jobs", ("GET",)), paths)


if __name__ == "__main__":
    unittest.main()
