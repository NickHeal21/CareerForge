"""
LLM Provider — simplified to use Gemini via LangChain.
Keeps the provider abstraction for easy future extension.
"""

from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


def get_chat_model(temperature: float = 0.7, max_tokens: int = 4096) -> BaseChatModel:
    """Get a ready-to-use LangChain Gemini chat model."""
    settings = get_settings()

    if not settings.GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is required. Set it in your .env file. "
            "Get a free key at https://aistudio.google.com/apikey"
        )

    logger.info(f"Using LLM: gemini/{settings.LLM_MODEL}")

    return ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
