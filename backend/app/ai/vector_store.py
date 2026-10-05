from functools import lru_cache

from langchain_chroma import Chroma

from app.ai.embeddings import LocalEmbeddings
from app.core.config import settings

COLLECTION = "rental_knowledge"


@lru_cache
def get_embeddings() -> LocalEmbeddings:
    return LocalEmbeddings()


def get_vector_store() -> Chroma:
    return Chroma(
        collection_name=COLLECTION,
        embedding_function=get_embeddings(),
        persist_directory=settings.CHROMA_DIR,
    )
