"""
Interview service — generate questions and evaluate answers using RAG + Gemini.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_provider import get_chat_model
from app.ai.prompts.interview import GENERATE_QUESTIONS_PROMPT, EVALUATE_ANSWER_PROMPT
from app.ai.rag_pipeline import retrieve_context
from app.models.interview import InterviewSession, InterviewQA, InterviewType, InterviewStatus
from app.repositories.base import BaseRepository

logger = logging.getLogger(__name__)


class InterviewService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = BaseRepository(InterviewSession, session)

    async def start_interview(self, user_id: str, interview_type: str, topic: str, num_questions: int = 5) -> dict:
        """Start a mock interview session with AI-generated questions."""

        # RAG: retrieve relevant interview questions from knowledge base
        rag_docs = retrieve_context(
            f"{interview_type} interview questions about {topic}",
            top_k=5,
        )
        rag_context = "\n\n".join([doc.page_content for doc in rag_docs]) if rag_docs else "No specific context available."

        try:
            llm = get_chat_model(temperature=0.7)
            prompt = GENERATE_QUESTIONS_PROMPT.format(
                num_questions=num_questions,
                interview_type=interview_type,
                topic=topic,
                difficulty="medium",
                rag_context=rag_context[:3000],
            )
            response = llm.invoke(prompt)
            content = response.content.strip()

            if content.startswith("```"):
                content = content.split("\n", 1)[1] if "\n" in content else content
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()

            questions_data = json.loads(content)

            # Map interview type
            type_map = {
                "technical": InterviewType.TECHNICAL,
                "hr": InterviewType.HR,
                "behavioral": InterviewType.BEHAVIORAL,
            }
            itype = type_map.get(interview_type.lower(), InterviewType.TECHNICAL)

            # Save session to database
            session_obj = InterviewSession(
                user_id=user_id,
                type=itype,
                topic=topic,
                status=InterviewStatus.IN_PROGRESS,
                score=0,
                feedback={"questions_generated": len(questions_data.get("questions", []))},
            )
            session_obj = await self.repo.create(session_obj)

            # Save questions
            qa_repo = BaseRepository(InterviewQA, self.session)
            questions = questions_data.get("questions", [])
            for i, q in enumerate(questions):
                qa = InterviewQA(
                    session_id=session_obj.id,
                    question=q.get("question", ""),
                    order_index=i,
                )
                self.session.add(qa)

            await self.session.flush()

            return {
                "session_id": str(session_obj.id),
                "interview_type": interview_type,
                "topic": topic,
                "questions": questions,
            }

        except Exception as e:
            logger.error(f"Interview generation failed: {e}")
            return {"error": str(e), "questions": []}

    async def submit_answer(self, session_id: str, question_index: int, question: str, answer: str) -> dict:
        """Evaluate a single answer using Gemini."""
        try:
            llm = get_chat_model(temperature=0.3)
            prompt = EVALUATE_ANSWER_PROMPT.format(
                question=question,
                user_answer=answer,
            )
            response = llm.invoke(prompt)
            content = response.content.strip()

            if content.startswith("```"):
                content = content.split("\n", 1)[1] if "\n" in content else content
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()

            evaluation = json.loads(content)
            return evaluation

        except Exception as e:
            logger.error(f"Answer evaluation failed: {e}")
            return {"score": 0, "max_score": 10, "feedback": f"Evaluation error: {str(e)}"}

    async def get_session_feedback(self, session_id: str) -> dict:
        """Get feedback for a completed interview session."""
        session_obj = await self.repo.get_by_id(session_id)
        if not session_obj:
            return {"error": "Session not found"}

        return {
            "session_id": str(session_obj.id),
            "type": session_obj.type.value if session_obj.type else "technical",
            "topic": session_obj.topic,
            "score": session_obj.score,
            "status": session_obj.status.value if session_obj.status else "completed",
            "feedback": session_obj.feedback,
        }
