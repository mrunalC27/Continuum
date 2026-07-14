import json
from typing import Any


def diff_lists(old: list, new: list) -> dict:
    """Find added and removed items between two lists."""
    old_set = set(old)
    new_set = set(new)
    return {
        "added": list(new_set - old_set),
        "removed": list(old_set - new_set)
    }


def diff_snapshots(old_data: dict, new_data: dict) -> dict:
    """
    Compare two snapshot structured_data dicts.
    Returns a field-by-field diff showing what changed.
    """
    diff = {}

    # Simple string fields
    for field in ["project_goal"]:
        old_val = old_data.get(field, "")
        new_val = new_data.get(field, "")
        if old_val != new_val:
            diff[field] = {"before": old_val, "after": new_val}

    # List fields — show added/removed items
    for field in ["tech_stack", "completed_features", "pending_tasks", "known_issues", "constraints"]:
        old_list = old_data.get(field, [])
        new_list = new_data.get(field, [])
        result = diff_lists(old_list, new_list)
        if result["added"] or result["removed"]:
            diff[field] = result

    # Architecture decisions — compare by decision text
    old_decisions = {d["decision"] for d in old_data.get("architecture_decisions", [])}
    new_decisions = {d["decision"] for d in new_data.get("architecture_decisions", [])}
    added = new_decisions - old_decisions
    removed = old_decisions - new_decisions
    if added or removed:
        diff["architecture_decisions"] = {
            "added": list(added),
            "removed": list(removed)
        }

    return diff