from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from backend.eval.runner import run_full_benchmark, run_single_eval

router = APIRouter(prefix="/eval", tags=["eval"])


class EvalMessage(BaseModel):
    role: str
    content: str


class EvalConversation(BaseModel):
    name: str
    messages: List[EvalMessage]


class BenchmarkRequest(BaseModel):
    conversations: List[EvalConversation]


@router.post("/run")
async def run_eval(payload: BenchmarkRequest):
    """
    Run the full benchmark evaluation.
    Pass in test conversations, get back scores across 3 conditions.
    """
    if not payload.conversations:
        raise HTTPException(status_code=400, detail="No conversations provided")

    conversations = [
        {
            "name": c.name,
            "messages": [m.model_dump() for m in c.messages]
        }
        for c in payload.conversations
    ]

    try:
        results = await run_full_benchmark(conversations)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run-single")
async def run_single(conversation: EvalConversation):
    """Run eval on just one conversation — good for quick testing."""
    try:
        result = await run_single_eval(
            [m.model_dump() for m in conversation.messages],
            conversation.name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results")
def get_latest_results():
    """Get the results from the last benchmark run."""
    import json
    from pathlib import Path

    results_path = Path("backend/eval/results/latest_run.json")
    if not results_path.exists():
        raise HTTPException(status_code=404, detail="No eval results yet — run /eval/run first")

    return json.loads(results_path.read_text())