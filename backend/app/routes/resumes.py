"""Resume routes — upload, list, and analyze resumes."""

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_session, get_current_user_id
from app.schemas.common import StandardResponse
from app.services.resume_service import ResumeService

router = APIRouter()


@router.post("/upload", summary="Upload and parse resume")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    # Validate file type
    allowed = {".pdf", ".docx", ".doc", ".txt"}
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        return StandardResponse.error(f"Unsupported file type. Allowed: {', '.join(allowed)}")

    file_bytes = await file.read()
    service = ResumeService(session)
    result = await service.upload_and_parse(user_id, file_bytes, file.filename)

    if "error" in result:
        return StandardResponse.error(result["error"])
    return StandardResponse.ok(data=result, message="Resume uploaded and analyzed")


@router.get("", summary="List user resumes")
async def list_resumes(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = ResumeService(session)
    resumes = await service.get_user_resumes(user_id)
    return StandardResponse.ok(data=resumes)


@router.get("/{resume_id}/analysis", summary="Get resume analysis")
async def get_analysis(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = ResumeService(session)
    result = await service.get_resume_analysis(resume_id)
    if "error" in result:
        return StandardResponse.error(result["error"])
    return StandardResponse.ok(data=result)
