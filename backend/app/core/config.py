from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeAtlas AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Storage for cloned repositories
    REPOS_DIR: Path = Path("storage/repos")
    
    # Cerebras / LLM Config
    CEREBRAS_API_KEY: str = os.getenv("CEREBRAS_API_KEY", "")
    CEREBRAS_BASE_URL: str = "https://api.cerebras.ai/v1"
    GEMMA_MODEL: str = "gemma-4-31b"

    # Xiaomi MiMo Config
    MIMO_API_KEY: str = os.getenv("MIMO_API_KEY", "")
    MIMO_BASE_URL: str = os.getenv("MIMO_BASE_URL", "https://api.xiaomimimo.com/v1")
    MIMO_MODEL: str = os.getenv("MIMO_MODEL", "mimo-v1")

    class Config:
        env_file = ".env"

settings = Settings()

# Ensure repos directory exists
settings.REPOS_DIR.mkdir(parents=True, exist_ok=True)
