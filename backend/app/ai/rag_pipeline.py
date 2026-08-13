"""
RAG Pipeline — the core AI engineering component.

Pipeline: document loading → chunking → embeddings → ChromaDB → similarity retrieval → context injection → Gemini response.
"""

import os
import logging
from pathlib import Path
from typing import List, Optional

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.ai.vector_store import get_vector_store
from app.ai.llm_provider import get_chat_model

logger = logging.getLogger(__name__)


def load_knowledge_base(kb_dir: str = None) -> List[Document]:
    """Load all markdown files from the knowledge base directory."""
    if kb_dir is None:
        kb_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "knowledge_base")

    documents = []
    kb_path = Path(kb_dir)

    if not kb_path.exists():
        logger.warning(f"Knowledge base directory not found: {kb_dir}")
        return documents

    for md_file in kb_path.rglob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
            # Extract category from relative path
            rel_path = md_file.relative_to(kb_path)
            category = str(rel_path.parent).replace(os.sep, "/")
            if category == ".":
                category = "general"

            documents.append(Document(
                page_content=content,
                metadata={
                    "source": str(rel_path),
                    "category": category,
                    "filename": md_file.name,
                },
            ))
            logger.info(f"Loaded: {rel_path}")
        except Exception as e:
            logger.error(f"Failed to load {md_file}: {e}")

    return documents


def chunk_documents(documents: List[Document], chunk_size: int = 1000, chunk_overlap: int = 200) -> List[Document]:
    """Split documents into chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n", ". ", " "],
    )
    chunks = splitter.split_documents(documents)
    logger.info(f"Split {len(documents)} documents into {len(chunks)} chunks")
    return chunks


def ingest_knowledge_base(kb_dir: str = None) -> int:
    """
    Full ingestion pipeline: load → chunk → embed → store in ChromaDB.
    Returns the number of chunks ingested.
    """
    logger.info("Starting knowledge base ingestion...")

    # Step 1: Load documents
    documents = load_knowledge_base(kb_dir)
    if not documents:
        logger.warning("No documents found to ingest")
        return 0

    # Step 2: Chunk documents
    chunks = chunk_documents(documents)

    # Step 3: Store in ChromaDB (embeddings are computed automatically by LangChain)
    vector_store = get_vector_store()
    vector_store.add_documents(chunks)

    logger.info(f"Successfully ingested {len(chunks)} chunks into ChromaDB")
    return len(chunks)


def retrieve_context(query: str, top_k: int = 5, category_filter: Optional[str] = None) -> List[Document]:
    """
    Retrieve relevant context from ChromaDB via similarity search.
    """
    vector_store = get_vector_store()

    if category_filter:
        results = vector_store.similarity_search(
            query,
            k=top_k,
            filter={"category": category_filter},
        )
    else:
        results = vector_store.similarity_search(query, k=top_k)

    return results


def query_with_rag(
    query: str,
    system_prompt: str = "",
    top_k: int = 5,
    category_filter: Optional[str] = None,
    temperature: float = 0.7,
) -> str:
    """
    Full RAG query: retrieve context → inject into prompt → call Gemini → return response.
    """
    # Step 1: Retrieve relevant context
    context_docs = retrieve_context(query, top_k=top_k, category_filter=category_filter)

    # Step 2: Build context string
    context_parts = []
    for doc in context_docs:
        source = doc.metadata.get("source", "unknown")
        context_parts.append(f"[Source: {source}]\n{doc.page_content}")
    context_str = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant context found."

    # Step 3: Build prompt with injected context
    full_prompt = f"""{system_prompt}

Use the following knowledge base context to inform your response. If the context is relevant, use it. If not, use your general knowledge.

=== KNOWLEDGE BASE CONTEXT ===
{context_str}
=== END CONTEXT ===

User Query: {query}
"""

    # Step 4: Call Gemini via LangChain
    llm = get_chat_model(temperature=temperature)
    response = llm.invoke(full_prompt)

    return response.content
