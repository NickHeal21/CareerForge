# This file marks the models/ directory as a Python package.
# Import all models here so SQLAlchemy discovers them when create_tables() runs.

from app.models.user import User  # noqa: F401  — Phase 2
from app.models.profile import Profile  # noqa: F401 — Phase 3A
from app.models.resume import Resume  # noqa: F401 — Phase 3B
from app.models.job import Job  # noqa: F401 — Phase 4A
from app.models.application import Application  # noqa: F401 — Phase 4B

# Future models (uncomment as phases progress):
# from app.models.resume import Resume
# from app.models.job import Job
