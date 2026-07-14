from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ArchitectureDecision(BaseModel):
    decision: str
    reasoning: Optional[str] = None


class CodeReference(BaseModel):
    file: str
    purpose: Optional[str] = ""


class SnapshotData(BaseModel):
    project_goal: str = ""
    tech_stack: List[str] = Field(default_factory=list)
    architecture_decisions: List[ArchitectureDecision] = Field(default_factory=list)
    completed_features: List[str] = Field(default_factory=list)
    pending_tasks: List[str] = Field(default_factory=list)
    known_issues: List[str] = Field(default_factory=list)
    key_code_references: List[CodeReference] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)


class SnapshotCreate(BaseModel):
    project_id: int
    structured_data: SnapshotData
    compression_level: str = "standard"
    commit_sha: Optional[str] = None


class SnapshotResponse(BaseModel):
    id: int
    project_id: int
    version: int
    structured_data: SnapshotData
    compression_level: str
    commit_sha: Optional[str]
    is_stale: bool
    created_at: datetime

    class Config:
        from_attributes = True