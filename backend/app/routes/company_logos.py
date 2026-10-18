import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.routes.recruiter import COMPANY_LOGO_DIRECTORY, COMPANY_LOGO_TYPES

router = APIRouter(tags=["company logos"])
LOGO_FILENAME = re.compile(r"recruiter-\d+-[0-9a-f]{32}\.(?:jpg|jpeg|png)")


@router.get("/company-logos/{filename}")
def get_company_logo(filename: str):
    """Serve only generated company-logo files; never expose the uploads directory."""
    if not LOGO_FILENAME.fullmatch(filename):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company logo not found.")

    logo_path = (COMPANY_LOGO_DIRECTORY / filename).resolve()
    if logo_path.parent != COMPANY_LOGO_DIRECTORY.resolve() or not logo_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company logo not found.")

    return FileResponse(
        logo_path,
        media_type=COMPANY_LOGO_TYPES[logo_path.suffix.lower()][0],
        filename=filename,
        content_disposition_type="inline",
        headers={"Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff"},
    )
