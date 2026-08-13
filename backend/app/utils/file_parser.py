"""
File parser — extract text from PDF and DOCX resumes.
"""

import io
from typing import Optional

from app.utils.logger import get_logger

logger = get_logger(__name__)


async def extract_text_from_pdf(file_bytes: bytes) -> Optional[str]:
    """Extract text content from a PDF file."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip() if text.strip() else None
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return None


async def extract_text_from_docx(file_bytes: bytes) -> Optional[str]:
    """Extract text content from a DOCX file."""
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join(para.text for para in doc.paragraphs if para.text.strip())
        return text.strip() if text.strip() else None
    except Exception as e:
        logger.error(f"DOCX extraction failed: {e}")
        return None


async def extract_text(file_bytes: bytes, filename: str) -> Optional[str]:
    """Route to appropriate parser based on file extension."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return await extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return await extract_text_from_docx(file_bytes)
    else:
        logger.warning(f"Unsupported file type: {ext}")
        return None
