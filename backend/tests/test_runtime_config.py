"""Isolated checks for deployment runtime settings; no application or database import."""

import os
import unittest
from unittest.mock import patch

from app.config import api_documentation_options
from app.serve import main, resolve_port


class RuntimeConfigurationTests(unittest.TestCase):
    def test_resolve_port_defaults_to_local_port(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(resolve_port(), 8000)

    def test_resolve_port_uses_host_assigned_port(self):
        with patch.dict(os.environ, {"PORT": "10000"}, clear=True):
            self.assertEqual(resolve_port(), 10000)

    def test_resolve_port_rejects_invalid_values(self):
        for value in ("", "abc", "0", "65536", "-1"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                resolve_port(value)

    def test_server_entry_point_passes_host_port_without_importing_app(self):
        with patch("app.serve.uvicorn.run") as run, patch.dict(os.environ, {"PORT": "12345"}):
            main()
        run.assert_called_once_with("app.main:app", host="0.0.0.0", port=12345)

    def test_production_docs_are_disabled_and_development_docs_remain_available(self):
        self.assertEqual(
            api_documentation_options("production"),
            {"docs_url": None, "redoc_url": None, "openapi_url": None},
        )
        self.assertEqual(
            api_documentation_options("development"),
            {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"},
        )


if __name__ == "__main__":
    unittest.main()
