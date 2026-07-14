import json
import asyncio
from pathlib import Path
from backend.services.ollama_client import call_ollama
from backend.services.extractor import extract_snapshot
from backend.services.restoration import generate_continuation_prompt
from backend.eval.scorer import score_response
from backend.schemas.conversation_schema import Message
from backend.database.models import Snapshot
from datetime import datetime


# Standard test question asked in all 3 conditions
TEST_QUESTION = (
    "What is this project trying to build? "
    "What has been completed so far and what still needs to be done? "
    "What are the key technical decisions made?"
)


def build_full_context_prompt(messages: list[dict]) -> str:
    """Condition A — give AI the full raw conversation."""
    lines = []
    for m in messages:
        role = "USER" if m["role"] == "user" else "ASSISTANT"
        lines.append(f"[{role}]: {m['content']}")
    conversation = "\n\n".join(lines)
    return f"Here is the full project conversation:\n\n{conversation}\n\n{TEST_QUESTION}"


def build_snapshot_prompt(snapshot_text: str) -> str:
    """Condition B — give AI only the structured snapshot."""
    return f"{snapshot_text}\n\n{TEST_QUESTION}"


def build_no_context_prompt() -> str:
    """Condition C — give AI nothing."""
    return (
        "You are continuing work on a software project "
        "but have no previous context available.\n\n"
        + TEST_QUESTION
    )


async def run_single_eval(
    conversation: list[dict],
    conversation_name: str
) -> dict:
    """
    Run full eval for one conversation across 3 conditions.
    Returns scores for each condition.
    """
    print(f"\n--- Evaluating: {conversation_name} ---")

    # Convert to Message objects
    messages = [Message(**m) for m in conversation]

    # Ground truth = the snapshot structured data
    snapshot_data = await extract_snapshot(messages, compression_level="standard")
    ground_truth = json.dumps(snapshot_data.model_dump(), indent=2)

    # Build a fake Snapshot object for restoration
    class FakeSnapshot:
        structured_data = json.dumps(snapshot_data.model_dump())
        version = 1
        project_id = 0

    continuation_prompt = generate_continuation_prompt(FakeSnapshot())

    results = {}

    # Condition A — full conversation
    print("  Running condition A (full context)...")
    prompt_a = build_full_context_prompt(conversation)
    response_a = await call_ollama(prompt_a)
    score_a = await score_response(ground_truth, response_a, TEST_QUESTION)
    results["full_context"] = {
        "response": response_a,
        "scores": score_a
    }
    print(f"  Condition A score: {score_a['overall']}/10")

    # Condition B — snapshot only
    print("  Running condition B (snapshot)...")
    prompt_b = build_snapshot_prompt(continuation_prompt)
    response_b = await call_ollama(prompt_b)
    score_b = await score_response(ground_truth, response_b, TEST_QUESTION)
    results["snapshot"] = {
        "response": response_b,
        "scores": score_b
    }
    print(f"  Condition B score: {score_b['overall']}/10")

    # Condition C — no context
    print("  Running condition C (no context)...")
    prompt_c = build_no_context_prompt()
    response_c = await call_ollama(prompt_c)
    score_c = await score_response(ground_truth, response_c, TEST_QUESTION)
    results["no_context"] = {
        "response": response_c,
        "scores": score_c
    }
    print(f"  Condition C score: {score_c['overall']}/10")

    # Token comparison
    full_tokens = len(" ".join([m["content"] for m in conversation]).split())
    snapshot_tokens = len(continuation_prompt.split())
    compression = round((1 - snapshot_tokens / max(full_tokens, 1)) * 100, 1)

    return {
        "conversation": conversation_name,
        "token_counts": {
            "full_context": full_tokens,
            "snapshot": snapshot_tokens,
            "compression_pct": compression
        },
        "scores": {
            "full_context": score_a["overall"],
            "snapshot": score_b["overall"],
            "no_context": score_c["overall"]
        },
        "detailed_scores": results
    }


async def run_full_benchmark(conversations: list[dict]) -> dict:
    """
    Run eval across all conversations.
    Each conversation: {"name": "...", "messages": [...]}
    """
    all_results = []

    for conv in conversations:
        result = await run_single_eval(conv["messages"], conv["name"])
        all_results.append(result)

    # Aggregate averages
    avg_full = round(
        sum(r["scores"]["full_context"] for r in all_results) / len(all_results), 1
    )
    avg_snapshot = round(
        sum(r["scores"]["snapshot"] for r in all_results) / len(all_results), 1
    )
    avg_no_context = round(
        sum(r["scores"]["no_context"] for r in all_results) / len(all_results), 1
    )
    avg_compression = round(
        sum(r["token_counts"]["compression_pct"] for r in all_results) / len(all_results), 1
    )

    summary = {
        "timestamp": datetime.utcnow().isoformat(),
        "total_conversations": len(all_results),
        "averages": {
            "full_context": avg_full,
            "snapshot": avg_snapshot,
            "no_context": avg_no_context,
            "compression_pct": avg_compression
        },
        "results": all_results
    }

    # Save results to file
    output_path = Path(__file__).parent / "results" / "latest_run.json"
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(json.dumps(summary, indent=2))
    print(f"\n✓ Results saved to {output_path}")

    return summary