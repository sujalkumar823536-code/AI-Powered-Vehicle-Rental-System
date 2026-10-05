from functools import lru_cache

from langchain.chat_models import init_chat_model

from app.core.config import settings


@lru_cache
def get_llm():
    """Chat model chosen by LLM_PROVIDER / LLM_MODEL in .env.
    The API key is read from the provider's own variable (ANTHROPIC_API_KEY,
    OPENAI_API_KEY or GOOGLE_API_KEY)."""
    return init_chat_model(
        settings.LLM_MODEL,
        model_provider=settings.LLM_PROVIDER,
        temperature=0.3,
    )
