"""
Skill gap analysis service — compares user skills against job descriptions using Gemini.
"""

import json
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_provider import get_chat_model
from app.ai.prompts.skill_gap import SKILL_GAP_PROMPT
from app.models.resume import Resume, ResumeSkill

logger = logging.getLogger(__name__)


class SkillService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def analyze_gap(self, user_id: str, job_description: str) -> dict:
        """Analyze skill gap between user's resume skills and a job description."""

        # Get user's skills from their most recent resume
        user_skills = await self._get_user_skills(user_id)
        if not user_skills:
            return {
                "error": "No resume found. Please upload your resume first.",
                "match_percentage": 0,
            }

        skills_text = ", ".join([f"{s['name']} ({s['proficiency']})" for s in user_skills])

        try:
            llm = get_chat_model(temperature=0.3)
            prompt = SKILL_GAP_PROMPT.format(
                user_skills=skills_text,
                job_description=job_description[:3000],
            )
            response = llm.invoke(prompt)
            content = response.content.strip()

            # Clean markdown formatting
            if content.startswith("```"):
                content = content.split("\n", 1)[1] if "\n" in content else content
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()

            result = json.loads(content)
            result["user_skills"] = user_skills
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse skill gap response: {e}")
            return {"error": "Analysis failed", "match_percentage": 0}
        except Exception as e:
            logger.error(f"Skill gap analysis failed: {e}")
            return {"error": str(e), "match_percentage": 0}

    async def _get_user_skills(self, user_id: str) -> list:
        """Get skills from user's most recent resume."""
        result = await self.session.execute(
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc())
            .limit(1)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            return []

        result = await self.session.execute(
            select(ResumeSkill).where(ResumeSkill.resume_id == resume.id)
        )
        skills = result.scalars().all()
        return [
            {"name": s.skill_name, "proficiency": s.proficiency.value if s.proficiency else "beginner", "category": s.category or ""}
            for s in skills
        ]
