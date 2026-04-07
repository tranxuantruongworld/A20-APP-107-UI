import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "claude-sonnet-4-20250514")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    APP_NAME: str = "FastAPI MongoDB"
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://admin:password@mongodb:27017")
    DATABASE_NAME: str = "app_db"

settings = Settings()