import json
import re
from backend.services.ollama_client import call_ollama


def extract_json_from_text(text: str) -> str:
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        text = text[start:end]
    return text


def attempt_parse(text: str):
    try:
        cleaned = extract_json_from_text(text)
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        return None


async def repair_json(broken_text: str, max_retries: int = 2):
    for attempt in range(max_retries):
        repair_prompt = f"""The following text is supposed to be valid JSON but it is broken.
Fix it and return ONLY valid JSON with no extra text, no markdown, no explanation.

BROKEN JSON:
{broken_text}

Return ONLY the fixed JSON object:"""

        fixed = await call_ollama(repair_prompt, temperature=0.0)
        result = attempt_parse(fixed)
        if result is not None:
            return result
    return None


async def parse_with_repair(raw_text: str):
    result = attempt_parse(raw_text)
    if result is not None:
        return result
    result = await repair_json(raw_text)
    return result