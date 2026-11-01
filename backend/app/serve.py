"""Production-friendly Uvicorn entry point that honors the host-assigned port."""

import os

import uvicorn


def resolve_port(value: str | None = None) -> int:
    """Return a valid TCP port, defaulting to the local development port."""
    raw_value = value if value is not None else os.environ.get("PORT", "8000")
    try:
        port = int(raw_value)
    except (TypeError, ValueError) as exc:
        raise ValueError("PORT must be an integer between 1 and 65535.") from exc
    if not 1 <= port <= 65535:
        raise ValueError("PORT must be an integer between 1 and 65535.")
    return port


def main() -> None:
    uvicorn.run("app.main:app", host="0.0.0.0", port=resolve_port())


if __name__ == "__main__":
    main()
