"""
Models package — import all models here for Alembic auto-detection.
"""

from app.models.base import BaseModel  # noqa: F401
from app.models.user import User, AuthProvider  # noqa: F401
from app.models.resume import Resume, ResumeSkill, Proficiency  # noqa: F401
from app.models.job_description import JobDescription, JDSkill  # noqa: F401
from app.models.skill import UserSkill, SkillSource  # noqa: F401
from app.models.roadmap import Roadmap, RoadmapMilestone, RoadmapStatus  # noqa: F401
from app.models.learning_plan import LearningPlan, LearningResource, PlanStatus, ResourceType, Difficulty  # noqa: F401
from app.models.project import Project, ProjectStatus  # noqa: F401
from app.models.interview import InterviewSession, InterviewQA, InterviewType, InterviewStatus  # noqa: F401
from app.models.progress import ProgressSnapshot  # noqa: F401
from app.models.conversation import AIConversation, ConversationContext  # noqa: F401
