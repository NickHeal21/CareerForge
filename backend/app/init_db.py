"""Explicit, operator-confirmed database preparation; never called by the web server."""

import argparse
from dataclasses import dataclass
import ipaddress
import re
import sys
from urllib.parse import parse_qsl, quote, urlsplit

from sqlalchemy.engine import make_url

from app.config import get_settings


SUPPORTED_DRIVERS = {"postgresql", "postgresql+psycopg2"}
SAFE_NON_ROUTING_QUERY_OPTIONS = {
    "application_name",
    "channel_binding",
    "connect_timeout",
    "keepalives",
    "keepalives_count",
    "keepalives_idle",
    "keepalives_interval",
    "sslcert",
    "sslkey",
    "sslmode",
    "sslrootcert",
    "tcp_user_timeout",
}


class DestinationValidationError(ValueError):
    """A credential-safe database URL validation failure."""


class InitializationFailure(RuntimeError):
    """A sanitized failure from a database preparation operation."""


@dataclass(frozen=True)
class DatabaseDestination:
    host: str
    port: int
    database: str

    @property
    def confirmation(self) -> str:
        # Percent-encoding makes the token unambiguous even if a database name
        # contains reserved characters. The SQLAlchemy-parsed name is preserved.
        host = f"[{self.host}]" if ":" in self.host else self.host
        database = quote(self.database, safe="-._~")
        return f"{host}:{self.port}/{database}"

    def safe_display(self) -> str:
        return f"host={self.host} port={self.port} database={quote(self.database, safe='-._~')}"


def _validate_query(raw_query: str) -> None:
    if not raw_query:
        raise DestinationValidationError("DATABASE_URL must not contain an empty query string.")
    if re.search(r"%(?![0-9a-fA-F]{2})", raw_query):
        raise DestinationValidationError("DATABASE_URL contains malformed URL encoding.")
    try:
        parameters = parse_qsl(raw_query, keep_blank_values=True, strict_parsing=True, errors="strict")
    except (UnicodeDecodeError, ValueError):
        raise DestinationValidationError("DATABASE_URL contains malformed query parameters.") from None
    keys = [key for key, _ in parameters]
    if len(keys) != len(set(keys)):
        raise DestinationValidationError("DATABASE_URL contains duplicate query parameters.")
    if any(key not in SAFE_NON_ROUTING_QUERY_OPTIONS for key in keys):
        raise DestinationValidationError("DATABASE_URL contains an unsupported or destination-changing query parameter.")
    if any(not value or any(ord(char) < 32 for char in value) for _, value in parameters):
        raise DestinationValidationError("DATABASE_URL contains an invalid query parameter value.")


def parse_database_destination(database_url: str) -> DatabaseDestination:
    """Parse a supported SQLAlchemy PostgreSQL URL without connecting or exposing secrets."""
    if not isinstance(database_url, str) or not database_url:
        raise DestinationValidationError("DATABASE_URL is missing or invalid.")
    if re.search(r"%(?![0-9a-fA-F]{2})", database_url):
        raise DestinationValidationError("DATABASE_URL contains malformed URL encoding.")

    try:
        parts = urlsplit(database_url)
        url = make_url(database_url)
        port = url.port
    except Exception:
        raise DestinationValidationError("DATABASE_URL is malformed; no database action was taken.") from None

    if url.drivername not in SUPPORTED_DRIVERS:
        raise DestinationValidationError("DATABASE_URL must use PostgreSQL with the configured psycopg2 driver.")
    if port is not None and not 1 <= port <= 65535:
        raise DestinationValidationError("DATABASE_URL must contain a valid PostgreSQL port.")
    if parts.fragment or "#" in database_url:
        raise DestinationValidationError("DATABASE_URL must not contain a fragment.")
    if "?" in database_url:
        _validate_query(parts.query)

    # Keep SQLAlchemy's parsed database value unchanged: it is what this project
    # passes to psycopg2. Require exactly one literal URL path segment so an
    # accidental extra segment can never be truncated for confirmation.
    raw_path = parts.path
    if not raw_path.startswith("/") or raw_path.startswith("//") or "/" in raw_path[1:]:
        raise DestinationValidationError("DATABASE_URL must contain exactly one database-name path segment.")
    if not url.database or url.database != raw_path[1:]:
        raise DestinationValidationError("DATABASE_URL must contain one unambiguous database name.")
    try:
        database_name_bytes = url.database.encode("utf-8") if url.database else b""
    except UnicodeError:
        raise DestinationValidationError("DATABASE_URL contains an invalid database name.") from None
    if (
        url.database in {".", ".."}
        or len(database_name_bytes) > 63
        or any(char.isspace() or ord(char) < 32 or char in "\\?#" for char in url.database)
    ):
        raise DestinationValidationError("DATABASE_URL contains an invalid database name.")

    host = url.host
    if not host or any(char.isspace() for char in host) or any(char in host for char in "/\\@%,?#"):
        raise DestinationValidationError("DATABASE_URL must contain one valid database host.")
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        if host.endswith(".") or len(host) > 253:
            raise DestinationValidationError("DATABASE_URL must contain one valid database host.")
        try:
            ascii_host = host.encode("idna").decode("ascii").lower()
        except UnicodeError:
            raise DestinationValidationError("DATABASE_URL must contain one valid database host.") from None
        label_pattern = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")
        if any(not label_pattern.fullmatch(label) for label in ascii_host.split(".")):
            raise DestinationValidationError("DATABASE_URL must contain one valid database host.")
        normalized_host = ascii_host
    else:
        normalized_host = address.compressed.lower()

    # This command is for a separately provisioned production database. Do not
    # allow a confirmation prompt to make a recognized local target acceptable.
    try:
        host_address = ipaddress.ip_address(normalized_host)
    except ValueError:
        is_local_host = normalized_host == "localhost" or normalized_host.endswith(".localhost") or normalized_host == "localhost.localdomain"
    else:
        mapped_address = host_address.ipv4_mapped if host_address.version == 6 else None
        is_local_host = (
            host_address.is_loopback
            or host_address.is_unspecified
            or (mapped_address is not None and (mapped_address.is_loopback or mapped_address.is_unspecified))
        )
    if is_local_host:
        raise DestinationValidationError("DATABASE_URL must target a non-local production database.")

    return DatabaseDestination(host=normalized_host, port=5432 if port is None else port, database=url.database)


def run_initialization(
    database_url: str,
    confirmation: str,
    include_sample_jobs: bool = False,
    *,
    app_env: str | None = None,
    create_tables_fn=None,
    seed_jobs_fn=None,
) -> DatabaseDestination:
    """Validate and confirm before lazily importing or invoking database operations."""
    if app_env != "production":
        raise DestinationValidationError("APP_ENV must be production; no database action was taken.")
    destination = parse_database_destination(database_url)
    if confirmation != destination.confirmation:
        raise DestinationValidationError("Destination confirmation did not match; no database action was taken.")

    stage = "schema preparation"
    try:
        if create_tables_fn is None or (include_sample_jobs and seed_jobs_fn is None):
            import app.models  # noqa: F401 — register every model before create_all()
            from app import database
            from app.seed import seed_jobs

            database.engine.echo = False
            create_tables_fn = create_tables_fn or database.create_tables
            seed_jobs_fn = seed_jobs_fn or seed_jobs

        create_tables_fn()
        if include_sample_jobs:
            stage = "sample-job insertion"
            seed_jobs_fn()
    except Exception as exc:
        # Never include exception text: driver errors may include connection details.
        raise InitializationFailure(
            f"Database initialization failed during {stage} ({type(exc).__name__}); details were withheld."
        ) from None
    return destination


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Explicitly prepare CareerForge tables for a confirmed PostgreSQL destination."
    )
    parser.add_argument(
        "--confirm-destination",
        help="Supply the exact host:port/database token non-interactively; reserved database characters are percent-encoded.",
    )
    parser.add_argument(
        "--seed-sample-jobs",
        action="store_true",
        help="Also insert development/demo sample listings (opt-in).",
    )
    args = parser.parse_args(argv)

    try:
        settings = get_settings()
    except Exception as exc:
        print(
            f"Configuration could not be loaded ({type(exc).__name__}); no database action was taken.",
            file=sys.stderr,
        )
        return 2

    if getattr(settings, "app_env", None) != "production":
        print("APP_ENV must be production; no database action was taken.", file=sys.stderr)
        return 2

    try:
        destination = parse_database_destination(settings.database_url)
    except DestinationValidationError as exc:
        print(f"Invalid database destination: {exc}", file=sys.stderr)
        return 2

    print(f"Configured PostgreSQL destination: {destination.safe_display()}")
    if args.confirm_destination is None:
        try:
            confirmation = input(f"Type {destination.confirmation!r} to confirm this destination: ")
        except EOFError:
            print("No destination confirmation was received; no database action was taken.", file=sys.stderr)
            return 2
    else:
        confirmation = args.confirm_destination
    if confirmation != destination.confirmation:
        print("Destination confirmation did not match; no database action was taken.", file=sys.stderr)
        return 2

    try:
        run_initialization(
            settings.database_url,
            confirmation,
            include_sample_jobs=args.seed_sample_jobs,
            app_env=settings.app_env,
        )
    except (DestinationValidationError, InitializationFailure) as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print("Database preparation completed for the confirmed configured destination.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
