"""
Knowledge Base Ingestion Script.
Run: python -m scripts.ingest_kb (from the backend/ directory)
"""

import sys
import os
import logging

# Add parent dir to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(message)s")

from dotenv import load_dotenv
load_dotenv()

from app.ai.rag_pipeline import ingest_knowledge_base


def main():
    print("=" * 50)
    print("CareerForge — Knowledge Base Ingestion")
    print("=" * 50)

    kb_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge_base")
    print(f"\nKnowledge base directory: {kb_dir}")

    count = ingest_knowledge_base(kb_dir)
    print(f"\n✅ Successfully ingested {count} chunks into ChromaDB")
    print("ChromaDB data saved to: ./chroma_data/")


if __name__ == "__main__":
    main()
