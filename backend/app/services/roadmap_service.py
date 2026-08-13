"""
Roadmap service — generates personalized learning roadmaps using RAG + Gemini.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_provider import get_chat_model
from app.ai.prompts.roadmap import ROADMAP_PROMPT
from app.ai.rag_pipeline import retrieve_context
from app.models.roadmap import Roadmap, RoadmapMilestone, RoadmapStatus
from app.repositories.base import BaseRepository

logger = logging.getLogger(__name__)


class RoadmapService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = BaseRepository(Roadmap, session)

    async def generate(self, user_id: str, target_role: str, current_skills: str, skill_gaps: str, weeks: int = 8) -> dict:
        """Generate a learning roadmap using RAG-augmented Gemini."""

        # RAG: retrieve relevant learning resources from knowledge base
        rag_docs = retrieve_context(
            f"learning roadmap for {target_role} skills: {skill_gaps}",
            top_k=5,
            category_filter=None,
        )
        rag_context = "\n\n".join([doc.page_content for doc in rag_docs]) if rag_docs else "No specific resources found."

        try:
            llm = get_chat_model(temperature=0.7)
            prompt = ROADMAP_PROMPT.format(
                target_role=target_role,
                current_skills=current_skills,
                skill_gaps=skill_gaps,
                weeks=weeks,
                rag_context=rag_context[:3000],
            )
            response = llm.invoke(prompt)
            content = response.content.strip()

            # Clean markdown
            if content.startswith("```"):
                content = content.split("\n", 1)[1] if "\n" in content else content
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()

            roadmap_data = json.loads(content)

            # Save to database
            roadmap = Roadmap(
                user_id=user_id,
                title=roadmap_data.get("title", f"Roadmap: {target_role}"),
                description=roadmap_data.get("description", ""),
                skill_gaps={"gaps": skill_gaps, "target_role": target_role},
                status=RoadmapStatus.ACTIVE,
                estimated_weeks=weeks,
            )
            roadmap = await self.repo.create(roadmap)

            # Save milestones
            milestones = roadmap_data.get("milestones", [])
            for i, m in enumerate(milestones):
                milestone = RoadmapMilestone(
                    roadmap_id=roadmap.id,
                    title=m.get("title", f"Week {i+1}"),
                    description=m.get("description", ""),
                    week_number=m.get("week", i + 1),
                    order_index=i,
                    is_completed=False,
                )
                self.session.add(milestone)

            await self.session.flush()

            roadmap_data["roadmap_id"] = str(roadmap.id)
            return roadmap_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse roadmap response: {e}")
            return {"error": "Roadmap generation failed", "milestones": []}
        except Exception as e:
            logger.error(f"Roadmap generation failed: {e}")
            return {"error": str(e), "milestones": []}

    async def get_user_roadmaps(self, user_id: str) -> list:
        """Get all roadmaps for a user."""
        roadmaps = await self.repo.get_all(filters=[Roadmap.user_id == user_id])
        results = []
        for r in roadmaps:
            # Get milestones
            from sqlalchemy import select
            ms_result = await self.session.execute(
                select(RoadmapMilestone)
                .where(RoadmapMilestone.roadmap_id == r.id)
                .order_by(RoadmapMilestone.order_index)
            )
            milestones = ms_result.scalars().all()

            results.append({
                "id": str(r.id),
                "title": r.title,
                "description": r.description,
                "status": r.status.value if r.status else "active",
                "estimated_weeks": r.estimated_weeks,
                "skill_gaps": r.skill_gaps,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "milestones": [
                    {
                        "id": str(m.id),
                        "title": m.title,
                        "description": m.description,
                        "week_number": m.week_number,
                        "is_completed": m.is_completed,
                    }
                    for m in milestones
                ],
            })
        return results

    async def update_milestone(self, milestone_id: str, is_completed: bool) -> dict:
        """Toggle milestone completion."""
        ms_repo = BaseRepository(RoadmapMilestone, self.session)
        milestone = await ms_repo.get_by_id(milestone_id)
        if not milestone:
            return {"error": "Milestone not found"}
        milestone = await ms_repo.update(milestone, {"is_completed": is_completed})
        return {"id": str(milestone.id), "is_completed": milestone.is_completed}
