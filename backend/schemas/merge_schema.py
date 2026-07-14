from pydantic import BaseModel
from typing import List, Optional
from backend.schemas.snapshot_schema import SnapshotData


class Conflict(BaseModel):
    field: str
    snapshot_a_value: str
    snapshot_b_value: str
    description: str


class MergeResult(BaseModel):
    merged: SnapshotData
    conflicts: List[Conflict]


class MergeRequest(BaseModel):
    project_id: int
    snapshot_a_id: int
    snapshot_b_id: int


class ConflictResolution(BaseModel):
    merge_record_id: int
    resolutions: List[dict]
    # each resolution: {"field": "tech_stack", "choice": "a" | "b" | "custom", "custom_value": "..."}