from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Puts every value from .env into the environment, so LangChain can read
# provider keys such as ANTHROPIC_API_KEY directly.
load_dotenv()


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "vehicle_rental"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:5173"  # comma-separated list

    # AI assistant
    LLM_PROVIDER: str = "anthropic"  # anthropic | openai | google_genai
    LLM_MODEL: str = "claude-haiku-4-5-20251001"
    CHROMA_DIR: str = "chroma_db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
