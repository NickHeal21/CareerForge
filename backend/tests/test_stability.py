"""Focused, offline regression checks for startup, auth, and AI failures."""

import contextlib
import io
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import ValidationError
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import configure_mappers

from app.ai import gemini
from app.config import Settings
from app.database import Base
from app.dependencies import get_current_admin, get_current_recruiter, get_current_user
from app.routes import company_logos, health, recruiter_verification
from app.schemas.user import UserRegister


class StabilityTests(unittest.TestCase):
    def test_startup_does_not_print_database_url(self):
        from app import main

        output = io.StringIO()
        settings = SimpleNamespace(app_env="test", database_url="postgresql://user:private-secret@db.example/careerforge")
        with (
            patch.object(main, "settings", settings),
            patch.object(main, "create_tables"),
            patch.object(main, "seed_jobs"),
            contextlib.redirect_stdout(output),
        ):
            main.on_startup()
        self.assertNotIn("private-secret", output.getvalue())
        self.assertIn("Database    : configured", output.getvalue())

    def test_production_rejects_placeholder_or_short_jwt_secret(self):
        with self.assertRaises(ValidationError):
            Settings(app_env="production", secret_key="change-this-secret-key")
        with self.assertRaises(ValidationError):
            Settings(app_env="production", secret_key="too-short")
        Settings(app_env="production", secret_key="a-strong-unique-test-secret-at-least-32-chars")

    def test_health_response_hides_database_exception_and_closes_session(self):
        session = SimpleNamespace(execute=lambda query: (_ for _ in ()).throw(RuntimeError("password=private-secret")))
        session.close = unittest.mock.Mock()
        with patch.object(health, "SessionLocal", return_value=session):
            response = health.health_check()
        self.assertEqual(response, {"status": "degraded", "database": "unavailable"})
        session.close.assert_called_once()
        self.assertNotIn("private-secret", str(response))

    def test_malformed_jwt_subject_returns_401(self):
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")
        with patch("app.dependencies.decode_access_token", return_value={"sub": "not-a-user-id"}):
            with self.assertRaises(HTTPException) as raised:
                get_current_user(credentials, SimpleNamespace())
        self.assertEqual(raised.exception.status_code, 401)

    def test_role_guards_and_admin_registration(self):
        with self.assertRaises(HTTPException) as applicant:
            get_current_recruiter(SimpleNamespace(role="APPLICANT", verification_status="NOT_REQUIRED"))
        self.assertEqual(applicant.exception.status_code, 403)
        with self.assertRaises(HTTPException) as pending:
            get_current_recruiter(SimpleNamespace(role="RECRUITER", verification_status="PENDING"))
        self.assertEqual(pending.exception.status_code, 403)
        with self.assertRaises(HTTPException) as denied:
            get_current_recruiter(SimpleNamespace(role="RECRUITER", verification_status="DENIED"))
        self.assertEqual(denied.exception.status_code, 403)
        with self.assertRaises(HTTPException) as non_admin:
            get_current_admin(SimpleNamespace(role="APPLICANT"))
        self.assertEqual(non_admin.exception.status_code, 403)
        with self.assertRaises(ValidationError):
            UserRegister(name="Admin", email="admin@example.test", password="password", role="ADMIN")

    def test_ai_rate_limits_are_classified_for_each_provider_flow(self):
        class ProviderLimit(Exception):
            status_code = 429

        class Model:
            def generate_content(self, *args, **kwargs):
                raise ProviderLimit("rate limit reached")

        settings = SimpleNamespace(gemini_api_key="configured-for-test", gemini_model="test-model")
        with (
            patch.object(gemini, "get_settings", return_value=settings),
            patch.object(gemini.genai, "configure"),
            patch.object(gemini.genai, "GenerativeModel", return_value=Model()),
        ):
            calls = (
                lambda: gemini.analyze_readiness("resume", "title", "company", "description", "skills"),
                lambda: gemini.generate_roadmap(50, ["skill"], [], [], "title", "company", "skills"),
                lambda: gemini.mentor_reply({}, [], "help me"),
            )
            for call in calls:
                with self.subTest(call=call), self.assertRaises(gemini.GeminiRateLimitError):
                    call()

    def test_readiness_parser_rejects_out_of_range_percentages(self):
        with self.assertRaises(gemini.GeminiUnavailableError):
            gemini._parse_result(
                '{"readiness_percentage":101,"matching_skills":[],"missing_skills":[],"strengths":[],"weaknesses":[],"recommendations":[]}'
            )

    def test_all_models_and_relationships_create_in_isolated_sqlite(self):
        import app.models  # noqa: F401 — register every model before metadata inspection

        configure_mappers()
        engine = create_engine("sqlite://")
        try:
            Base.metadata.create_all(engine)
            tables = set(inspect(engine).get_table_names())
        finally:
            engine.dispose()
        self.assertTrue(
            {
                "users", "profiles", "resumes", "jobs", "applications", "readiness_analyses",
                "roadmaps", "roadmap_items", "recruiter_profiles", "recruiter_verifications",
                "verification_documents",
            }.issubset(tables)
        )

    def test_company_logo_route_only_serves_generated_logo_files(self):
        with TemporaryDirectory() as directory:
            filename = "recruiter-42-" + "a" * 32 + ".png"
            path = Path(directory, filename)
            path.write_bytes(b"logo")
            with patch.object(company_logos, "COMPANY_LOGO_DIRECTORY", Path(directory)):
                response = company_logos.get_company_logo(filename)
                self.assertEqual(Path(response.path), path)
                with self.assertRaises(HTTPException) as raised:
                    company_logos.get_company_logo("../recruiter_verifications/private.pdf")
                self.assertEqual(raised.exception.status_code, 404)

    def test_verification_upload_rejects_extension_signature_mismatch(self):
        from io import BytesIO
        from starlette.datastructures import UploadFile

        upload = UploadFile(
            filename="company-id.pdf",
            file=BytesIO(b"not a PDF"),
            headers={"content-type": "application/pdf"},
        )
        with self.assertRaises(HTTPException) as raised:
            recruiter_verification.read_document(upload, "COMPANY_ID")
        self.assertEqual(raised.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
