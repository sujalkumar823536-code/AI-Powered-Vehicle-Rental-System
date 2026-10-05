"""Reads the files in app/ai/knowledge_base and stores them in the vector database.

Run from the backend folder (and again whenever you edit those files):
    python -m app.ai.ingest
"""
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.ai.vector_store import get_vector_store

KB_DIR = Path(__file__).parent / "knowledge_base"


def main() -> None:
    docs = [
        Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
        for p in sorted(KB_DIR.glob("*.md"))
    ]
    if not docs:
        print(f"No .md files found in {KB_DIR}")
        return

    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
    chunks = splitter.split_documents(docs)

    # Start clean so re-running never creates duplicates
    try:
        get_vector_store().delete_collection()
    except Exception:
        pass

    store = get_vector_store()
    store.add_documents(chunks)
    print(f"Stored {len(chunks)} chunks from {len(docs)} file(s).")


if __name__ == "__main__":
    main()
