"""
ChromaDB vector store using PersistentClient.
No separate server needed — data persists to local directory.
"""

import chromadb
from langchain_chroma import Chroma

from app.config import get_settings
from app.ai.embeddings import get_embedding_model


def get_chroma_client() -> chromadb.ClientAPI:
    """Return a persistent ChromaDB client."""
    settings = get_settings()
    return chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)


def get_vector_store(collection_name: str = "careerforge_kb") -> Chroma:
    """Return a LangChain Chroma vector store for the given collection."""
    settings = get_settings()
    embedding_model = get_embedding_model()
    return Chroma(
        collection_name=collection_name,
        embedding_function=embedding_model,
        persist_directory=settings.CHROMA_PERSIST_DIR,
    )
