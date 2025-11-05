import os
from pathlib import Path

class PathConfig:
    # ------------------------------
    # DIR setup
    # ------------------------------

    BASE_DIR = Path(__file__).resolve().parent
    UPLOAD_DIR = BASE_DIR / "uploads"
    TEMPLATES_DIR = BASE_DIR / "templates"

class AuthConfig:
    # ------------------------------
    # Auth Options
    # ------------------------------
    SECRET_KEY = "supersecretkey123"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60

class EmbeddingConfig:
    # ------------------------------
    # Embedding Options
    # ------------------------------
    EMBEDDING_MODEL = "all-MiniLM-L6-v2"
    
class DBConfig:
    # ------------------------------
    # Database Options
    # ------------------------------
    DB_URL = os.getenv("DB_URL", "sqlite:///capstone_repo.db")

class OllamaConfig:
    # ------------------------------
    # Ollama Options
    # ------------------------------
    URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
    MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

class OpenAiConfig:
    OPENAI_KEY   = os.getenv("OPENAI_API_KEY")