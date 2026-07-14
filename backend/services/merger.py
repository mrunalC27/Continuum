import json
from pathlib import Path
from backend.services.ollama_client import call_ollama
from backend.services.json_repair import parse_with_repair
from backend.schemas.snapshot_schema import SnapshotData
from backend.schemas.merge_schema import MergeResult, Conflict

MOCK_MODE_MERGE = True  # flip to False when Ollama is ready


def load_prompt(filename: str) -> str:
    prompt_path = Path(__file__).parent.parent / "prompts" / filename
    return prompt_path.read_text()


def build_merge_prompt(snapshot_a: dict, snapshot_b: dict) -> str:
    template = load_prompt("merge_prompt.txt")
    return (
        template
        .replace("{snapshot_a}", json.dumps(snapshot_a, indent=2))
        .replace("{snapshot_b}", json.dumps(snapshot_b, indent=2))
    )


def mock_merge(snapshot_a: dict, snapshot_b: dict) -> MergeResult:
    """
    Mock merge for testing without Ollama.
    Does a basic programmatic merge — detects real conflicts too.
    """
    conflicts = []

    # Check project_goal conflict
    goal_a = snapshot_a.get("project_goal", "")
    goal_b = snapshot_b.get("project_goal", "")
    if goal_a and goal_b and goal_a.lower() != goal_b.lower():
        conflicts.append(Conflict(
            field="project_goal",
            snapshot_a_value=goal_a,
            snapshot_b_value=goal_b,
            description="Both snapshots describe different project goals"
        ))

    # Check tech_stack conflicts
    stack_a = set(snapshot_a.get("tech_stack", []))
    stack_b = set(snapshot_b.get("tech_stack", []))
    only_in_a = stack_a - stack_b
    only_in_b = stack_b - stack_a
    if only_in_a and only_in_b:
        conflicts.append(Conflict(
            field="tech_stack",
            snapshot_a_value=", ".join(only_in_a),
            snapshot_b_value=", ".join(only_in_b),
            description="Tech stacks differ — some technologies only mentioned in one conversation"
        ))

    # Check architecture decision conflicts
    decisions_a = {d["decision"] for d in snapshot_a.get("architecture_decisions", [])}
    decisions_b = {d["decision"] for d in snapshot_b.get("architecture_decisions", [])}
    only_a = decisions_a - decisions_b
    only_b = decisions_b - decisions_a
    if only_a and only_b:
        conflicts.append(Conflict(
            field="architecture_decisions",
            snapshot_a_value=", ".join(only_a),
            snapshot_b_value=", ".join(only_b),
            description="Different architecture decisions recorded in each conversation"
        ))

    # Build merged snapshot — union of all lists
    merged_data = SnapshotData(
        project_goal=goal_a or goal_b,
        tech_stack=list(stack_a | stack_b),
        architecture_decisions=(
            snapshot_a.get("architecture_decisions", []) +
            [d for d in snapshot_b.get("architecture_decisions", [])
             if d["decision"] not in decisions_a]
        ),
        completed_features=list(set(
            snapshot_a.get("completed_features", []) +
            snapshot_b.get("completed_features", [])
        )),
        pending_tasks=list(set(
            snapshot_a.get("pending_tasks", []) +
            snapshot_b.get("pending_tasks", [])
        )),
        known_issues=list(set(
            snapshot_a.get("known_issues", []) +
            snapshot_b.get("known_issues", [])
        )),
        constraints=list(set(
            snapshot_a.get("constraints", []) +
            snapshot_b.get("constraints", [])
        )),
        key_code_references=(
            snapshot_a.get("key_code_references", []) +
            snapshot_b.get("key_code_references", [])
        )
    )

    return MergeResult(merged=merged_data, conflicts=conflicts)


async def merge_snapshots(snapshot_a: dict, snapshot_b: dict) -> MergeResult:
    """
    Main merge entry point.
    Uses mock merge if MOCK_MODE_MERGE is True.
    Uses Ollama when model is available.
    """
    if MOCK_MODE_MERGE:
        return mock_merge(snapshot_a, snapshot_b)

    # Ollama-powered merge
    prompt = build_merge_prompt(snapshot_a, snapshot_b)
    raw_response = await call_ollama(prompt)
    parsed = await parse_with_repair(raw_response)

    if parsed is None:
        raise ValueError("Ollama failed to produce valid merge JSON")

    merged = SnapshotData(**parsed["merged"])
    conflicts = [Conflict(**c) for c in parsed.get("conflicts", [])]
    return MergeResult(merged=merged, conflicts=conflicts)


def apply_resolution(
    merged: SnapshotData,
    snapshot_a: dict,
    snapshot_b: dict,
    resolutions: list[dict]
) -> SnapshotData:
    """
    Apply user's conflict resolutions to the merged snapshot.
    Each resolution: {"field": "tech_stack", "choice": "a"|"b"|"custom", "custom_value": "..."}
    """
    merged_dict = merged.model_dump()

    for resolution in resolutions:
        field = resolution.get("field")
        choice = resolution.get("choice")
        custom = resolution.get("custom_value")

        if not field:
            continue

        if choice == "a":
            merged_dict[field] = snapshot_a.get(field)
        elif choice == "b":
            merged_dict[field] = snapshot_b.get(field)
        elif choice == "custom" and custom is not None:
            merged_dict[field] = custom

    return SnapshotData(**merged_dict)