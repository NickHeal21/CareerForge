import logging
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileResponse, ProfileUpdate

router = APIRouter(tags=["profile"])
logger = logging.getLogger(__name__)
PHOTO_DIRECTORY = Path(__file__).resolve().parents[2] / "uploads" / "profile_photos"
MAX_PHOTO_BYTES = 5 * 1024 * 1024
PHOTO_TYPES = {
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
}


def empty_profile(user_id: int) -> ProfileResponse:
    return ProfileResponse(user_id=user_id)


@router.get("", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    return profile if profile else empty_profile(current_user.id)


@router.put("", response_model=ProfileResponse)
def update_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile is None:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    for field, value in body.model_dump().items():
        setattr(profile, field, str(value) if value is not None and field.endswith("_url") else value)

    db.commit()
    db.refresh(profile)
    return profile


@router.post("/photo", response_model=ProfileResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    suffix = Path(file.filename or "").suffix.lower()
    expected = PHOTO_TYPES.get(suffix)
    if expected is None:
        await file.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please choose a JPG, JPEG, or PNG image.")

    content_type, signature = expected
    if file.content_type not in (content_type, "application/octet-stream"):
        await file.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The selected image type does not match JPG, JPEG, or PNG.")

    try:
        content = await file.read(MAX_PHOTO_BYTES + 1)
    finally:
        await file.close()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The selected image is empty.")
    if len(content) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Profile photos must be 5 MB or smaller.")

    valid_signature = content.startswith(signature)
    if suffix == ".png":
        valid_signature = valid_signature and content[12:16] == b"IHDR"
    if not valid_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The file contents are not a valid JPG or PNG image.")

    filename = f"user-{current_user.id}-{uuid4().hex}{suffix}"
    try:
        PHOTO_DIRECTORY.mkdir(parents=True, exist_ok=True)
        stored_path = PHOTO_DIRECTORY / filename
        stored_path.write_bytes(content)
    except OSError as exc:
        logger.exception("Could not store applicant profile photo")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="The profile photo could not be saved. Please try again.") from exc

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile is None:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
    old_filename = profile.profile_image
    profile.profile_image = filename
    try:
        db.commit()
        db.refresh(profile)
    except SQLAlchemyError as exc:
        db.rollback()
        stored_path.unlink(missing_ok=True)
        logger.exception("Could not update applicant profile photo reference")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="The profile photo could not be saved. Please try again.") from exc

    if old_filename and old_filename != filename and Path(old_filename).name == old_filename:
        old_path = (PHOTO_DIRECTORY / old_filename).resolve()
        if old_path.parent == PHOTO_DIRECTORY.resolve():
            try:
                old_path.unlink(missing_ok=True)
            except OSError:
                logger.warning("Could not remove replaced profile photo for user %s", current_user.id)
    return profile


@router.get("/photo")
def get_profile_photo(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile is None or not profile.profile_image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No profile photo has been uploaded.")

    filename = profile.profile_image
    if Path(filename).name != filename or Path(filename).suffix.lower() not in PHOTO_TYPES:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile photo not found.")
    photo_path = (PHOTO_DIRECTORY / filename).resolve()
    if photo_path.parent != PHOTO_DIRECTORY.resolve() or not photo_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile photo not found.")

    media_type = PHOTO_TYPES[photo_path.suffix.lower()][0]
    return FileResponse(
        photo_path,
        media_type=media_type,
        filename=filename,
        content_disposition_type="inline",
        headers={"Cache-Control": "private, no-store"},
    )
