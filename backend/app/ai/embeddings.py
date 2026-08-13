"""
Gemini embeddings wrapper for RAG pipeline.
Uses Google's embedding-001 model via langchain-google-genai.
"""

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import get_settings


def get_embedding_model() -> GoogleGenerativeAIEmbeddings:
    """Return a Gemini embedding model instance."""
    settings = get_settings()
    if not settings.GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is required. Set it in your .env file. "
            "Get a free key at https://aistudio.google.com/apikey"
        )
    return GoogleGenerativeAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
    )
