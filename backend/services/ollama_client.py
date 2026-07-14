import httpx
import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
USE_GROQ = os.getenv("USE_GROQ", "false").lower() == "true"


async def call_ollama(prompt: str, model: str = None, temperature: float = 0.1) -> str:
    """
    Smart router — uses Groq if USE_GROQ=true or GROQ_API_KEY is set,
    otherwise falls back to local Ollama.
    """
    if USE_GROQ or GROQ_API_KEY:
        from backend.services.groq_client import call_groq
        return await call_groq(prompt, temperature)

    # local Ollama
    model = model or OLLAMA_MODEL
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": 2048
        }
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()


async def check_ollama_health() -> dict:
    """Check Ollama or Groq depending on config."""
    if USE_GROQ or GROQ_API_KEY:
        from backend.services.groq_client import check_groq_health
        return await check_groq_health()

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            models = [m["name"] for m in response.json().get("models", [])]
            return {"status": "ok", "available_models": models}
        except Exception as e:
            return {"status": "error", "message": str(e)}