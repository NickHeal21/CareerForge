"""
Resume service — parse, analyze, and score resumes using Gemini.
"""

import json
import logging
import os
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_provider import get_chat_model
from app.ai.prompts.resume_analysis import RESUME_ANALYSIS_PROMPT
from app.config import get_settings
from app.models.resume import Resume, ResumeSkill, Proficiency
from app.repositories.base import BaseRepository
from app.utils.file_parser import extract_text_from_pdf, extract_text_from_docx

logger = logging.getLogger(__name__)


class ResumeService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = BaseRepository(Resume, session)
        self.settings = get_settings()

    async def upload_and_parse(self, user_id: str, file_bytes: bytes, filename: str) -> dict:
        """Upload a resume file, extract text, and analyze with Gemini."""

        # Step 1: Save file to disk
        ext = os.path.splitext(filename)[1].lower()
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(self.settings.UPLOAD_DIR, unique_name)
        os.makedirs(self.settings.UPLOAD_DIR, exist_ok=True)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Step 2: Extract text
        raw_text = ""
        if ext == ".pdf":
            raw_text = await extract_text_from_pdf(file_bytes) or ""
        elif ext in (".docx", ".doc"):
            raw_text = await extract_text_from_docx(file_bytes) or ""
        else:
            raw_text = file_bytes.decode("utf-8", errors="ignore")

        if not raw_text.strip():
            return {"error": "Could not extract text from the uploaded file"}

        # Step 3: Analyze with Gemini
        analysis = await self._analyze_resume(raw_text)

        # Step 4: Save to database
        resume = Resume(
            user_id=user_id,
            file_url=file_path,
            file_name=filename,
            raw_text=raw_text,
            parsed_data=analysis,
            ats_score=analysis.get("ats_score", 0),
            ats_feedback=analysis.get("ats_feedback", []),
            is_primary=True,
        )
        resume = await self.repo.create(resume)

        # Step 5: Save extracted skills
        skills = analysis.get("skills", [])
        for skill_data in skills:
            proficiency_str = skill_data.get("proficiency", "beginner").lower()
            try:
                proficiency = Proficiency(proficiency_str)
            except ValueError:
                proficiency = Proficiency.BEGINNER

            skill = ResumeSkill(
                resume_id=resume.id,
                skill_name=skill_data.get("name", ""),
                proficiency=proficiency,
                category=skill_data.get("category", ""),
            )
            self.session.add(skill)

        await self.session.flush()

        return {
            "resume_id": str(resume.id),
            "filename": filename,
            "ats_score": analysis.get("ats_score", 0),
            "ats_feedback": analysis.get("ats_feedback", []),
            "skills": skills,
            "experience": analysis.get("experience", []),
            "education": analysis.get("education", []),
            "summary": analysis.get("summary", ""),
        }

    async def get_user_resumes(self, user_id: str) -> list:
        """Get all resumes for a user."""
        resumes = await self.repo.get_all(filters=[Resume.user_id == user_id])
        return [
            {
                "id": str(r.id),
                "file_name": r.file_name,
                "ats_score": r.ats_score,
                "ats_feedback": r.ats_feedback,
                "parsed_data": r.parsed_data,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in resumes
        ]

    async def get_resume_analysis(self, resume_id: str) -> dict:
        """Get analysis for a specific resume."""
        resume = await self.repo.get_by_id(resume_id)
        if not resume:
            return {"error": "Resume not found"}
        return {
            "resume_id": str(resume.id),
            "file_name": resume.file_name,
            "ats_score": resume.ats_score,
            "ats_feedback": resume.ats_feedback,
            "parsed_data": resume.parsed_data,
            "raw_text": resume.raw_text[:500] if resume.raw_text else "",
        }

    async def _analyze_resume(self, resume_text: str) -> dict:
        """Call Gemini to analyze resume text."""
        try:
            llm = get_chat_model(temperature=0.3)
            prompt = RESUME_ANALYSIS_PROMPT.format(resume_text=resume_text[:5000])
            response = llm.invoke(prompt)
            content = response.content.strip()

            # Clean markdown formatting if present
            if content.startswith("```"):
                content = content.split("\n", 1)[1] if "\n" in content else content
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()

            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            return {"skills": [], "ats_score": 0, "ats_feedback": ["Analysis failed — could not parse AI response"], "summary": "Analysis incomplete"}
        except Exception as e:
            logger.error(f"Resume analysis failed: {e}")
            return {"skills": [], "ats_score": 0, "ats_feedback": [f"Analysis error: {str(e)}"], "summary": "Analysis failed"}
