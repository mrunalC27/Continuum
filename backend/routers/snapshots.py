import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import Snapshot

router = APIRouter(prefix="/snapshots", tags=["snapshots"])


@router.get("/project/{project_id}")
def get_snapshots_for_project(project_id: int, db: Session = Depends(get_db)):
    snapshots = (
        db.query(Snapshot)
        .filter(Snapshot.project_id == project_id)
        .order_by(Snapshot.version.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "version": s.version,
            "project_id": s.project_id,
            "compression_level": s.compression_level,
            "is_stale": bool(s.is_stale),
            "commit_sha": s.commit_sha,
            "created_at": s.created_at,
            "structured_data": json.loads(s.structured_data)
        }
        for s in snapshots
    ]


@router.get("/{snapshot_id}")
def get_snapshot(snapshot_id: int, db: Session = Depends(get_db)):
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return {
        "id": snapshot.id,
        "version": snapshot.version,
        "project_id": snapshot.project_id,
        "compression_level": snapshot.compression_level,
        "is_stale": bool(snapshot.is_stale),
        "commit_sha": snapshot.commit_sha,
        "created_at": snapshot.created_at,
        "structured_data": json.loads(snapshot.structured_data)
    }

@router.delete("/{snapshot_id}")
def delete_snapshot(snapshot_id: int, db: Session = Depends(get_db)):
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    from backend.database.models import MergeRecord

    # delete any merge records that reference this snapshot
    db.query(MergeRecord).filter(
        (MergeRecord.snapshot_a_id == snapshot_id) |
        (MergeRecord.snapshot_b_id == snapshot_id) |
        (MergeRecord.merged_snapshot_id == snapshot_id)
    ).delete(synchronize_session=False)

    db.delete(snapshot)
    db.commit()
    return {"message": f"Snapshot {snapshot_id} deleted"}