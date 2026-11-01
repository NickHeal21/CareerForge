"""Offline initializer guard tests; database operations are never imported or called."""

import contextlib
import io
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from app import init_db
from app.init_db import DestinationValidationError, parse_database_destination, run_initialization


class InitializerSafetyTests(unittest.TestCase):
    def test_cli_rejects_missing_or_nonproduction_app_env_before_destination_parse(self):
        database_url = "postgresql://user:placeholder@db.example.test/careerforge_prod"
        for app_env in (None, "development"):
            settings = SimpleNamespace(database_url=database_url)
            if app_env is not None:
                settings.app_env = app_env
            stderr = io.StringIO()
            with (
                self.subTest(app_env=app_env),
                patch.object(init_db, "get_settings", return_value=settings),
                patch.object(init_db, "parse_database_destination") as parse,
                patch.object(init_db, "run_initialization") as initialize,
                contextlib.redirect_stderr(stderr),
            ):
                result = init_db.main(["--confirm-destination", "db.example.test:5432/careerforge_prod"])
            self.assertEqual(result, 2)
            self.assertIn("APP_ENV must be production", stderr.getvalue())
            parse.assert_not_called()
            initialize.assert_not_called()

    def test_cli_invalid_settings_abort_without_operation_import(self):
        stderr = io.StringIO()
        with (
            patch.object(init_db, "get_settings", side_effect=RuntimeError("sensitive configuration detail")),
            patch.object(init_db, "run_initialization") as initialize,
            contextlib.redirect_stderr(stderr),
        ):
            result = init_db.main(["--confirm-destination", "db.example.test:5432/careerforge_prod"])
        self.assertEqual(result, 2)
        initialize.assert_not_called()
        self.assertNotIn("sensitive configuration detail", stderr.getvalue())

    def test_local_database_hosts_are_rejected(self):
        local_urls = (
            "postgresql://localhost/careerforge",
            "postgresql://db.localhost/careerforge",
            "postgresql://localhost.localdomain/careerforge",
            "postgresql://127.0.0.1/careerforge",
            "postgresql://127.24.5.6/careerforge",
            "postgresql://[::1]/careerforge",
            "postgresql://[::ffff:127.0.0.1]/careerforge",
            "postgresql://0.0.0.0/careerforge",
            "postgresql://[::]/careerforge",
        )
        for database_url in local_urls:
            with self.subTest(target_kind="local"), self.assertRaises(DestinationValidationError):
                parse_database_destination(database_url)

    def test_direct_initializer_rejects_nonproduction_or_missing_environment_before_operations(self):
        create_tables = Mock()
        database_url = "postgresql://db.example.test/careerforge_prod"
        confirmation = parse_database_destination(database_url).confirmation
        for app_env in (None, "development"):
            with self.subTest(app_env=app_env), self.assertRaises(DestinationValidationError):
                run_initialization(
                    database_url,
                    confirmation,
                    app_env=app_env,
                    create_tables_fn=create_tables,
                )
        create_tables.assert_not_called()

    def test_local_target_and_failed_confirmation_abort_before_operation_import(self):
        real_import = __import__

        def reject_database_operation_import(name, *args, **kwargs):
            if name in {"app.database", "app.models", "app.seed"}:
                raise AssertionError("database operation imported before validation and confirmation")
            return real_import(name, *args, **kwargs)

        with patch("builtins.__import__", side_effect=reject_database_operation_import):
            with self.assertRaises(DestinationValidationError):
                run_initialization(
                    "postgresql://[::1]/careerforge",
                    "[::1]:5432/careerforge",
                    app_env="production",
                )
            with self.assertRaises(DestinationValidationError):
                run_initialization(
                    "postgresql://db.example.test/careerforge_prod",
                    "wrong.example.test:5432/careerforge_prod",
                    app_env="production",
                )

    def test_valid_production_postgres_url_retains_explicit_confirmation(self):
        destination = parse_database_destination(
            "postgresql+psycopg2://user:password@db.example.test:5444/careerforge_prod?sslmode=require"
        )
        self.assertEqual(destination.confirmation, "db.example.test:5444/careerforge_prod")
        create_tables = Mock()
        result = run_initialization(
            "postgresql://db.example.test/careerforge_prod",
            "db.example.test:5432/careerforge_prod",
            app_env="production",
            create_tables_fn=create_tables,
        )
        self.assertEqual(result.database, "careerforge_prod")
        create_tables.assert_called_once_with()


if __name__ == "__main__":
    unittest.main()
