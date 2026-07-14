from pathlib import Path
from typing import List, Optional
from backend.schemas.conversation_schema import Message
from backend.schemas.snapshot_schema import SnapshotData
from backend.services.preprocessor import preprocess, format_for_prompt
from backend.services.ollama_client import call_ollama
from backend.services.json_repair import parse_with_repair

import os
from dotenv import load_dotenv
load_dotenv()
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
def load_prompt(filename: str) -> str:
    prompt_path = Path(__file__).parent.parent / "prompts" / filename
    return prompt_path.read_text()


def build_extraction_prompt(conversation_text: str, commits_text: str = "") -> str:
    template = load_prompt("extract_prompt.txt")
    return template.replace("{conversation}", conversation_text).replace("{commits}", commits_text or "None provided")


def apply_compression(text: str, level: str) -> str:
    lines = text.split("\n\n")
    limits = {"minimal": 30, "standard": 80, "verbose": len(lines)}
    limit = limits.get(level, 80)
    if len(lines) > limit:
        return "\n\n".join(lines[-limit:])
    return text


async def extract_snapshot(
    messages: List[Message],
    commits: Optional[List[dict]] = None,
    compression_level: str = "standard"
) -> SnapshotData:

    if MOCK_MODE:
        return SnapshotData(
            project_goal="Cross platform AI context manager",
            tech_stack=["FastAPI", "SQLite", "Vue"],  # Vue instead of React — conflict
            completed_features=["Chrome extension", "Extraction pipeline"],
            pending_tasks=["Dashboard", "Eval", "Merge UI"],
            known_issues=["DOM scraping breaks on ChatGPT updates"],
            constraints=["Local only, no cloud in v1"]
        )
        
    cleaned = preprocess(messages)
    conversation_text = format_for_prompt(cleaned)
    conversation_text = apply_compression(conversation_text, compression_level)

    commits_text = ""
    if commits:
        commits_text = "\n".join([
            f"- [{c.get('sha', '')[:7]}] {c.get('message', '')} ({c.get('files_changed', '')})"
            for c in commits[:20]
        ])

    prompt = build_extraction_prompt(conversation_text, commits_text)
    
    raw_response = await call_ollama(prompt)
    

    parsed = await parse_with_repair(raw_response)
    if parsed is None:
        raise ValueError("Ollama failed to produce valid JSON after repair attempts")

    return SnapshotData(**parsed)