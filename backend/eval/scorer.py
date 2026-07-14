import json
from backend.services.ollama_client import call_ollama
from backend.services.json_repair import parse_with_repair
from pathlib import Path


def load_prompt(filename: str) -> str:
    prompt_path = Path(__file__).parent.parent / "prompts" / filename
    return prompt_path.read_text()


def build_judge_prompt(ground_truth: str, ai_response: str, question: str) -> str:
    template = load_prompt("judge_prompt.txt")
    return (
        template
        .replace("{ground_truth}", ground_truth)
        .replace("{ai_response}", ai_response)
        .replace("{question}", question)
    )


async def score_response(
    ground_truth: str,
    ai_response: str,
    question: str
) -> dict:
    """
    Use Ollama as judge to score how well the AI response
    continues the project given the context provided.
    Returns scores across 5 dimensions.
    if no context condition, cap score at 4 unless response is genuinely vague
    this is handled by the judge prompt fix above
    """
    prompt = build_judge_prompt(ground_truth, ai_response, question)
    raw = await call_ollama(prompt, temperature=0.0)
    parsed = await parse_with_repair(raw)

    if parsed is None:
        return {
            "goal_accuracy": {"score": 0, "reason": "Judge failed to parse"},
            "architecture_accuracy": {"score": 0, "reason": "Judge failed to parse"},
            "task_accuracy": {"score": 0, "reason": "Judge failed to parse"},
            "no_hallucinations": {"score": 0, "reason": "Judge failed to parse"},
            "code_accuracy": {"score": 0, "reason": "Judge failed to parse"},
            "overall": 0,
            "summary": "Scoring failed"
        }

    # Calculate overall if not provided
    if "overall" not in parsed or parsed["overall"] == 0:
        scores = [
            parsed.get("goal_accuracy", {}).get("score", 0),
            parsed.get("architecture_accuracy", {}).get("score", 0),
            parsed.get("task_accuracy", {}).get("score", 0),
            parsed.get("no_hallucinations", {}).get("score", 0),
            parsed.get("code_accuracy", {}).get("score", 0),
        ]
        parsed["overall"] = round(sum(scores) / len(scores), 1)

    return parsed