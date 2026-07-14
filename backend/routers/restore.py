from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import Snapshot
from backend.services.restoration import generate_continuation_prompt
from backend.services.diff import diff_snapshots
import json

router = APIRouter(prefix="/restore", tags=["restore"])


@router.get("/{snapshot_id}")
def restore_snapshot(
    snapshot_id: int,
    target_ai: str = Query(default="generic"),
    db: Session = Depends(get_db)
):
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    prompt = generate_continuation_prompt(snapshot, target_ai)

    return {
        "snapshot_id": snapshot_id,
        "version": snapshot.version,
        "project_id": snapshot.project_id,
        "target_ai": target_ai,
        "continuation_prompt": prompt,
        "token_estimate": len(prompt.split())
    }


@router.get("/diff/{project_id}")
def diff_project_snapshots(project_id: int, v1: int, v2: int, db: Session = Depends(get_db)):
    snap1 = (
        db.query(Snapshot)
        .filter(Snapshot.project_id == project_id, Snapshot.version == v1)
        .first()
    )
    snap2 = (
        db.query(Snapshot)
        .filter(Snapshot.project_id == project_id, Snapshot.version == v2)
        .first()
    )

    if not snap1 or not snap2:
        raise HTTPException(status_code=404, detail="One or both snapshot versions not found")

    diff = diff_snapshots(
        json.loads(snap1.structured_data),
        json.loads(snap2.structured_data)
    )

    return {
        "project_id": project_id,
        "v1": v1,
        "v2": v2,
        "changes": diff,
        "has_changes": len(diff) > 0
    }