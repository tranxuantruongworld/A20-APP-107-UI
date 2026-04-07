from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # AI API Keys
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEFAULT_MODEL: str = "claude-sonnet-4-20250514"
    LOG_LEVEL: str = "INFO"

    AI_LOG_SERVER: str = "https://ai-logs.note.transformerlabs.ai/api/ingest"
    AI_LOG_API_KEY: str = ""
    AI_LOG_DIR: str = ".ai-log"

    # MongoDB Configuration
    MONGO_URI: str 
    DATABASE_NAME: str = "app_db"
    MONGO_USER: str = "admin"
    MONGO_PASS: str = "password"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

ANTHROPIC_API_KEY = settings.ANTHROPIC_API_KEY
OPENAI_API_KEY = settings.OPENAI_API_KEY
DEFAULT_MODEL = settings.DEFAULT_MODEL
LOG_LEVEL = settings.LOG_LEVEL
AI_LOG_SERVER = settings.AI_LOG_SERVER
AI_LOG_API_KEY = settings.AI_LOG_API_KEY
AI_LOG_DIR = settings.AI_LOG_DIR
MONGO_URI = settings.MONGO_URI
DATABASE_NAME = settings.DATABASE_NAME
MONGO_USER = settings.MONGO_USER
MONGO_PASS = settings.MONGO_PASS