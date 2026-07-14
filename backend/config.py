import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
GITHUB_PAT = os.getenv("GITHUB_PAT", "")
DB_PATH = os.getenv("DB_PATH", "./data/contextbridge.db")