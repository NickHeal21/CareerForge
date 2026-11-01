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
            Settings(_env_file=None, app_env="production", secret_key="change-this-secret-key")
        with self.assertRaises(ValidationError):
            Settings(_env_file=None, app_env="production", secret_key="too-short")
        Settings(
            _env_file=None,
            app_env="production",
            secret_key="a-strong-unique-test-secret-at-least-32-chars",
            database_url="postgresql://test:test@db.example.test/careerforge_prod",
            cors_origins="https://app.example.test",
        )

    def test_app_env_accepts_only_documented_values(self):
        self.assertEqual(Settings(_env_file=None, app_env="development").app_env, "development")
        self.assertEqual(
            Settings(
                _env_file=None,
                app_env="prod",
                secret_key="a-strong-unique-test-secret-at-least-32-chars",
                database_url="postgresql://test:test@db.example.test/careerforge_prod",
                cors_origins="https://app.example.test",
            ).app_env,
            "production",
        )
        for value in ("prodution", "staging", "", "test"):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                Settings(_env_file=None, app_env=value)

    def test_production_rejects_obviously_weak_long_jwt_secrets(self):
        weak_secrets = (
            "a" * 48,
            "password" * 6,
            "0123456789abcdef" * 3,
            "your-secret-value-please-replace-me-123456789",
        )
        for secret in weak_secrets:
            with self.subTest(secret_kind="weak"), self.assertRaises(ValidationError):
                Settings(
                    _env_file=None,
                    app_env="production",
                    secret_key=secret,
                    database_url="postgresql://test:test@db.example.test/careerforge_prod",
                    cors_origins="https://app.example.test",
                )

    def test_cors_origins_keep_local_defaults_and_reject_unsafe_production_values(self):
        local = Settings(_env_file=None)
        self.assertEqual(
            local.cors_origin_list,
            ["http://localhost:5173", "http://localhost:3000"],
        )
        base = {
            "_env_file": None,
            "app_env": "production",
            "secret_key": "a-strong-unique-test-secret-at-least-32-chars",
            "database_url": "postgresql://test:test@db.example.test/careerforge_prod",
        }
        with self.assertRaises(ValidationError):
            Settings(**base, cors_origins="*")
        with self.assertRaises(ValidationError):
            Settings(**base, cors_origins="https://*.example.test")
        with self.assertRaises(ValidationError):
            Settings(**base, cors_origins="http://localhost:5173")

    def test_production_cors_accepts_canonical_https_origins(self):
        settings = Settings(
            _env_file=None,
            app_env="production",
            secret_key="a-strong-unique-test-secret-at-least-32-chars",
            database_url="postgresql://test:test@db.example.test/careerforge_prod",
            cors_origins="https://app.example.test:443,https://api.example.test:8443",
        )
        self.assertEqual(
            settings.cors_origin_list,
            ["https://app.example.test", "https://api.example.test:8443"],
        )

    def test_production_cors_rejects_malformed_or_ambiguous_origins(self):
        base = {
            "_env_file": None,
            "app_env": "production",
            "secret_key": "a-strong-unique-test-secret-at-least-32-chars",
            "database_url": "postgresql://test:test@db.example.test/careerforge_prod",
        }
        invalid_origins = (
            "",
            "https://app.example.test,",
            "https://app.example.test,,https://other.example.test",
            "https://*.example.test",
            "https://localhost",
            "https://sub.localhost",
            "https://127.0.0.1",
            "https://[::1]",
            "https://[::ffff:127.0.0.1]",
            "https://app.example.test/path",
            "https://app.example.test?query=1",
            "https://app.example.test?",
            "https://app.example.test#fragment",
            "https://app.example.test#",
            "https://user@app.example.test",
            "https://app.example.test:invalid",
            "https://app.example.test:70000",
            "https://bad_host.example.test",
            "https://-bad.example.test",
            "https://singlelabel",
            "https://app.example.test.",
            "https://app.example.test:443,https://app.example.test",
        )
        for origin in invalid_origins:
            with self.subTest(origin=origin), self.assertRaises(ValidationError):
                Settings(**base, cors_origins=origin)

    def test_production_rejects_local_database_fallback(self):
        with self.assertRaises(ValidationError):
            Settings(
                _env_file=None,
                app_env="production",
                secret_key="a-strong-unique-test-secret-at-least-32-chars",
                cors_origins="https://app.example.test",
                database_url="postgresql://test:test@localhost:5432/careerforge",
            )

    def test_initializer_accepts_supported_postgres_urls_without_exposing_credentials(self):
        from app.init_db import parse_database_destination

        destination = parse_database_destination(
            "postgresql+psycopg2://private-user:private-password@DB.Example.test:5444/careerforge_prod?sslmode=require"
        )
        self.assertEqual(destination.host, "db.example.test")
        self.assertEqual(destination.port, 5444)
        self.assertEqual(destination.database, "careerforge_prod")
        self.assertEqual(destination.confirmation, "db.example.test:5444/careerforge_prod")
        self.assertNotIn("private-user", destination.safe_display())
        self.assertNotIn("private-password", destination.safe_display())

    def test_initializer_rejects_missing_malformed_or_ambiguous_database_urls(self):
        from app.init_db import DestinationValidationError, parse_database_destination

        invalid_urls = (
            "postgresql://db.example.test/",
            "postgresql://db.example.test",
            "postgresql://db.example.test/careerforge/extra",
            "postgresql://db.example.test/careerforge%2Fextra/segment",
            "postgresql://db.example.test/careerforge?host=other.example.test",
            "postgresql://db.example.test/careerforge?%68ost=other.example.test",
            "postgresql://db.example.test/careerforge?%64bname=other",
            "postgresql://db.example.test/careerforge?hostaddr=127.0.0.1",
            "postgresql://db.example.test/careerforge?dbname=other",
            "postgresql://db.example.test/careerforge?service=other",
            "postgresql://db.example.test/careerforge?options=-c%20search_path=other",
            "postgresql://db.example.test/careerforge?sslmode=require&sslmode=disable",
            "postgresql://db.example.test/careerforge?",
            "postgresql://db.example.test:invalid/careerforge",
            "postgresql://db.example.test:0/careerforge",
            "postgresql://db.example.test:65536/careerforge",
            "postgresql://bad_host.example.test/careerforge",
            "postgresql://-bad.example.test/careerforge",
            "postgresql://[not-ipv6]/careerforge",
            "postgresql:///careerforge",
            "postgresql://db1.example.test:5432,db2.example.test:5432/careerforge",
            "not-a-postgres-url",
            "postgresql://db.example.test/careerforge%ZZ",
        )
        for database_url in invalid_urls:
            with self.subTest(url_kind="invalid"), self.assertRaises(DestinationValidationError):
                parse_database_destination(database_url)

    def test_initializer_accepts_single_ipv6_host_and_rejects_multihost_urls(self):
        from app.init_db import DestinationValidationError, parse_database_destination

        destination = parse_database_destination("postgresql://[2001:db8::1]:5444/careerforge_prod")
        self.assertEqual(destination.host, "2001:db8::1")
        self.assertEqual(destination.port, 5444)
        self.assertEqual(destination.confirmation, "[2001:db8::1]:5444/careerforge_prod")
        with self.assertRaises(DestinationValidationError):
            parse_database_destination(
                "postgresql://db1.example.test:5432,db2.example.test:5432/careerforge_prod"
            )

    def test_initializer_preserves_encoded_database_path_value(self):
        from app.init_db import parse_database_destination

        destination = parse_database_destination("postgresql://db.example.test/career%2Fforge")
        self.assertEqual(destination.database, "career%2Fforge")
        self.assertEqual(destination.confirmation, "db.example.test:5432/career%252Fforge")

    def test_initializer_confirmation_requires_host_port_and_database_match(self):
        from app.init_db import DestinationValidationError, run_initialization

        database_url = "postgresql://db.example.test:5433/careerforge_prod"
        for confirmation in (
            "other.example.test:5433/careerforge_prod",
            "db.example.test:5432/careerforge_prod",
            "db.example.test:5433/other_db",
        ):
            create_tables = unittest.mock.Mock()
            with self.subTest(confirmation=confirmation), self.assertRaises(DestinationValidationError):
                run_initialization(database_url, confirmation, app_env="production", create_tables_fn=create_tables)
            create_tables.assert_not_called()

    def test_initializer_keeps_sample_jobs_opt_in(self):
        from app.init_db import parse_database_destination, run_initialization

        database_url = "postgresql://db.example.test/careerforge_prod"
        confirmation = parse_database_destination(database_url).confirmation
        create_tables = unittest.mock.Mock()
        seed_jobs = unittest.mock.Mock()
        run_initialization(
            database_url,
            confirmation,
            app_env="production",
            create_tables_fn=create_tables,
            seed_jobs_fn=seed_jobs,
        )
        create_tables.assert_called_once_with()
        seed_jobs.assert_not_called()

        create_tables.reset_mock()
        run_initialization(
            database_url,
            confirmation,
            include_sample_jobs=True,
            app_env="production",
            create_tables_fn=create_tables,
            seed_jobs_fn=seed_jobs,
        )
        create_tables.assert_called_once_with()
        seed_jobs.assert_called_once_with()

    def test_initializer_errors_are_credential_safe_and_report_stage(self):
        from app.init_db import InitializationFailure, parse_database_destination, run_initialization

        database_url = "postgresql://private-user:private-password@db.example.test/careerforge_prod"
        confirmation = parse_database_destination(database_url).confirmation
        with self.assertRaises(InitializationFailure) as raised:
            run_initialization(
                database_url,
                confirmation,
                app_env="production",
                create_tables_fn=lambda: (_ for _ in ()).throw(RuntimeError("private-password in driver error")),
            )
        self.assertIn("schema preparation", str(raised.exception))
        self.assertNotIn("private-password", str(raised.exception))

        with self.assertRaises(InitializationFailure) as seed_raised:
            run_initialization(
                database_url,
                confirmation,
                include_sample_jobs=True,
                app_env="production",
                create_tables_fn=lambda: None,
                seed_jobs_fn=lambda: (_ for _ in ()).throw(RuntimeError("sensitive driver detail")),
            )
        self.assertIn("sample-job insertion", str(seed_raised.exception))
        self.assertNotIn("sensitive driver detail", str(seed_raised.exception))

    def test_cli_confirmation_mismatch_aborts_before_initializer_and_hides_url_credentials(self):
        from app import init_db

        database_url = "postgresql://private-user:private-password@db.example.test:5433/careerforge_prod"
        output = io.StringIO()
        error = io.StringIO()
        with (
            patch.object(init_db, "get_settings", return_value=SimpleNamespace(app_env="production", database_url=database_url)),
            patch.object(init_db, "run_initialization") as initialize,
            contextlib.redirect_stdout(output),
            contextlib.redirect_stderr(error),
        ):
            result = init_db.main(["--confirm-destination", "db.example.test:5432/careerforge_prod"])
        self.assertEqual(result, 2)
        initialize.assert_not_called()
        self.assertIn("host=db.example.test port=5433", output.getvalue())
        self.assertNotIn("private-user", output.getvalue() + error.getvalue())
        self.assertNotIn("private-password", output.getvalue() + error.getvalue())

    def test_cli_invalid_url_aborts_before_initializer(self):
        from app import init_db

        output = io.StringIO()
        error = io.StringIO()
        with (
            patch.object(init_db, "get_settings", return_value=SimpleNamespace(app_env="production", database_url="postgresql://bad/db/extra")),
            patch.object(init_db, "run_initialization") as initialize,
            contextlib.redirect_stdout(output),
            contextlib.redirect_stderr(error),
        ):
            result = init_db.main(["--confirm-destination", "bad:5432/db"])
        self.assertEqual(result, 2)
        initialize.assert_not_called()
        self.assertIn("Invalid database destination", error.getvalue())

    def test_cli_invalid_settings_abort_before_initializer_without_printing_details(self):
        from app import init_db

        output = io.StringIO()
        error = io.StringIO()
        with (
            patch.object(init_db, "get_settings", side_effect=RuntimeError("private config detail")),
            patch.object(init_db, "run_initialization") as initialize,
            contextlib.redirect_stdout(output),
            contextlib.redirect_stderr(error),
        ):
            result = init_db.main(["--confirm-destination", "db.example.test:5432/careerforge"])
        self.assertEqual(result, 2)
        initialize.assert_not_called()
        self.assertNotIn("private config detail", output.getvalue() + error.getvalue())

    def test_invalid_url_or_confirmation_does_not_import_database_operations(self):
        from app.init_db import DestinationValidationError, run_initialization

        real_import = __import__

        def reject_database_import(name, *args, **kwargs):
            if name in {"app.database", "app.models", "app.seed"}:
                raise AssertionError("database operations imported before destination validation")
            return real_import(name, *args, **kwargs)

        with patch("builtins.__import__", side_effect=reject_database_import):
            with self.assertRaises(DestinationValidationError):
                run_initialization("postgresql://db.example.test/careerforge/extra", "unused", app_env="production")
            with self.assertRaises(DestinationValidationError):
                run_initialization("postgresql://db.example.test/careerforge", "wrong:5432/name", app_env="production")

    def test_cli_eof_and_unexpected_confirmation_abort(self):
        from app import init_db

        database_url = "postgresql://db.example.test/careerforge"
        for input_result, expected_error in ((EOFError(), "No destination confirmation"), ("unexpected", "did not match")):
            output = io.StringIO()
            error = io.StringIO()
            with (
                patch.object(init_db, "get_settings", return_value=SimpleNamespace(app_env="production", database_url=database_url)),
                patch.object(init_db, "run_initialization") as initialize,
                patch("builtins.input", side_effect=input_result if isinstance(input_result, Exception) else None, return_value=None if isinstance(input_result, Exception) else input_result),
                contextlib.redirect_stdout(output),
                contextlib.redirect_stderr(error),
            ):
                result = init_db.main([])
            self.assertEqual(result, 2)
            initialize.assert_not_called()
            self.assertIn(expected_error, error.getvalue())

    def test_cli_initialization_failure_is_sanitized_and_nonzero(self):
        from app import init_db
        from app.init_db import InitializationFailure

        database_url = "postgresql://private-user:private-password@db.example.test/careerforge"
        output = io.StringIO()
        error = io.StringIO()
        with (
            patch.object(init_db, "get_settings", return_value=SimpleNamespace(app_env="production", database_url=database_url)),
            patch.object(
                init_db,
                "run_initialization",
                side_effect=InitializationFailure("Database initialization failed during schema preparation (RuntimeError); details were withheld."),
            ),
            patch("builtins.input", return_value="db.example.test:5432/careerforge"),
            contextlib.redirect_stdout(output),
            contextlib.redirect_stderr(error),
        ):
            result = init_db.main([])
        self.assertEqual(result, 1)
        self.assertIn("schema preparation", error.getvalue())
        self.assertNotIn("private-user", output.getvalue() + error.getvalue())
        self.assertNotIn("private-password", output.getvalue() + error.getvalue())

    def test_cli_interactive_confirmation_is_required_before_initialization(self):
        from app import init_db

        database_url = "postgresql://private-user:private-password@db.example.test:5433/careerforge_prod"
        output = io.StringIO()
        with (
            patch.object(init_db, "get_settings", return_value=SimpleNamespace(app_env="production", database_url=database_url)),
            patch.object(init_db, "run_initialization") as initialize,
            patch("builtins.input", return_value="db.example.test:5433/careerforge_prod"),
            contextlib.redirect_stdout(output),
        ):
            result = init_db.main([])
        self.assertEqual(result, 0)
        initialize.assert_called_once_with(
            database_url,
            "db.example.test:5433/careerforge_prod",
            include_sample_jobs=False,
            app_env="production",
        )
        self.assertNotIn("private-user", output.getvalue())
        self.assertNotIn("private-password", output.getvalue())

    def test_production_startup_skips_all_database_initialization(self):
        from app import main

        with (
            patch.object(main, "settings", SimpleNamespace(app_env="production")),
            patch.object(main, "create_tables") as create_tables,
            patch.object(main, "seed_jobs") as seed_jobs,
            contextlib.redirect_stdout(io.StringIO()),
        ):
            main.on_startup()
        create_tables.assert_not_called()
        seed_jobs.assert_not_called()

    def test_production_disables_swagger_redoc_and_openapi(self):
        from app.config import api_documentation_options

        self.assertEqual(
            api_documentation_options("production"),
            {"docs_url": None, "redoc_url": None, "openapi_url": None},
        )
        self.assertEqual(
            api_documentation_options("development"),
            {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"},
        )

    def test_development_startup_preserves_local_initialization(self):
        from app import main

        with (
            patch.object(main, "settings", SimpleNamespace(app_env="development")),
            patch.object(main, "create_tables") as create_tables,
            patch.object(main, "seed_jobs") as seed_jobs,
            contextlib.redirect_stdout(io.StringIO()),
        ):
            main.on_startup()
        create_tables.assert_called_once_with()
        seed_jobs.assert_called_once_with()

    def test_health_response_hides_database_exception_and_closes_session(self):
        session = SimpleNamespace(execute=lambda query: (_ for _ in ()).throw(RuntimeError("password=private-secret")))
        session.close = unittest.mock.Mock()
        with patch.object(health, "SessionLocal", return_value=session):
            response = health.health_check()
        self.assertEqual(response, {"status": "degraded", "database": "unavailable"})
        session.close.assert_called_once()
        self.assertNotIn("private-secret", str(response))

    def test_health_liveness_does_not_access_database(self):
        with patch.object(health, "SessionLocal", side_effect=AssertionError("database must not be accessed")):
            self.assertEqual(health.liveness_check(), {"status": "ok"})

    def test_health_readiness_returns_503_when_database_is_unavailable(self):
        session = SimpleNamespace(execute=lambda query: (_ for _ in ()).throw(RuntimeError("unavailable")))
        session.close = unittest.mock.Mock()
        with patch.object(health, "SessionLocal", return_value=session):
            response = health.readiness_check()
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.body, b'{"status":"degraded","database":"unavailable"}')
        session.close.assert_called_once()

    def test_health_readiness_returns_200_when_database_is_available(self):
        session = SimpleNamespace(execute=unittest.mock.Mock())
        session.close = unittest.mock.Mock()
        with patch.object(health, "SessionLocal", return_value=session):
            response = health.readiness_check()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.body, b'{"status":"ok","database":"ok"}')
        session.close.assert_called_once()

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
