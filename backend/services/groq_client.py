import httpx
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"


async def call_groq(prompt: str, temperature: float = 0.1) -> str:
    """
    Call Groq API — same interface as call_ollama.
    Uses OpenAI-compatible chat completions endpoint.
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set in environment")

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
        "max_tokens": 2048
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            GROQ_BASE_URL,
            json=payload,
            headers=headers
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()


async def check_groq_health() -> dict:
    """Check if Groq API key is valid."""
    if not GROQ_API_KEY:
        return {"status": "error", "message": "GROQ_API_KEY not set"}
    return {"status": "ok", "model": GROQ_MODEL}