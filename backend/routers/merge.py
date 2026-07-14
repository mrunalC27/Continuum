import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import Snapshot, MergeRecord
from backend.schemas.merge_schema import MergeRequest, ConflictResolution
from backend.services.merger import merge_snapshots, apply_resolution
from backend.schemas.snapshot_schema import SnapshotData

router = APIRouter(prefix="/merge", tags=["merge"])


@router.post("/")
async def merge(payload: MergeRequest, db: Session = Depends(get_db)):
    """
    Merge two snapshots from the same project.
    Returns merged result + list of conflicts for user to resolve.
    """
    snap_a = db.query(Snapshot).filter(Snapshot.id == payload.snapshot_a_id).first()
    snap_b = db.query(Snapshot).filter(Snapshot.id == payload.snapshot_b_id).first()

    if not snap_a or not snap_b:
        raise HTTPException(status_code=404, detail="One or both snapshots not found")

    # if snap_a.project_id != payload.project_id or snap_b.project_id != payload.project_id:
    #     raise HTTPException(status_code=400, detail="Both snapshots must belong to the same project")

    data_a = json.loads(snap_a.structured_data)
    data_b = json.loads(snap_b.structured_data)

    try:
        result = await merge_snapshots(data_a, data_b)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Save merge record to DB
    merge_record = MergeRecord(
        project_id=payload.project_id,
        snapshot_a_id=payload.snapshot_a_id,
        snapshot_b_id=payload.snapshot_b_id,
        conflicts=json.dumps([c.model_dump() for c in result.conflicts]),
        resolved=0
    )
    db.add(merge_record)
    db.commit()
    db.refresh(merge_record)

    return {
        "merge_record_id": merge_record.id,
        "project_id": payload.project_id,
        "merged": result.merged.model_dump(),
        "conflicts": [c.model_dump() for c in result.conflicts],
        "conflict_count": len(result.conflicts),
        "message": (
            "Merged successfully with no conflicts"
            if not result.conflicts
            else f"{len(result.conflicts)} conflict(s) found — resolve them then call /merge/resolve"
        )
    }


@router.post("/resolve")
async def resolve_conflicts(payload: ConflictResolution, db: Session = Depends(get_db)):
    """
    Apply user's conflict resolutions and save final merged snapshot.
    Call this after /merge/ with the user's choices (a, b, or custom).
    """
    merge_record = db.query(MergeRecord).filter(
        MergeRecord.id == payload.merge_record_id
    ).first()

    if not merge_record:
        raise HTTPException(status_code=404, detail="Merge record not found")

    snap_a = db.query(Snapshot).filter(Snapshot.id == merge_record.snapshot_a_id).first()
    snap_b = db.query(Snapshot).filter(Snapshot.id == merge_record.snapshot_b_id).first()

    data_a = json.loads(snap_a.structured_data)
    data_b = json.loads(snap_b.structured_data)

    # Rebuild merged base first
    base_merge = await merge_snapshots(data_a, data_b)

    # Apply resolutions on top
    final = apply_resolution(
        base_merge.merged,
        data_a,
        data_b,
        payload.resolutions
    )

    # Get next version number
    last_snapshot = (
        db.query(Snapshot)
        .filter(Snapshot.project_id == merge_record.project_id)
        .order_by(Snapshot.version.desc())
        .first()
    )
    next_version = (last_snapshot.version + 1) if last_snapshot else 1

    # Save resolved merged snapshot
    new_snapshot = Snapshot(
        project_id=merge_record.project_id,
        version=next_version,
        structured_data=final.model_dump_json(),
        compression_level="standard",
    )

    # after
    db.add(new_snapshot)
    db.flush()  # ← this assigns the ID before commit

    # Mark merge record as resolved
    merge_record.resolved = 1
    merge_record.merged_snapshot_id = new_snapshot.id
    db.commit()
    db.refresh(new_snapshot)

    return {
        "message": "Conflicts resolved — merged snapshot saved",
        "snapshot_id": new_snapshot.id,
        "version": next_version,
        "final_snapshot": final.model_dump()
    }


@router.get("/records/{project_id}")
def get_merge_records(project_id: int, db: Session = Depends(get_db)):
    """Get all merge records for a project."""
    records = db.query(MergeRecord).filter(
        MergeRecord.project_id == project_id
    ).all()

    return [
        {
            "id": r.id,
            "snapshot_a_id": r.snapshot_a_id,
            "snapshot_b_id": r.snapshot_b_id,
            "conflict_count": len(json.loads(r.conflicts)) if r.conflicts else 0,
            "resolved": bool(r.resolved),
            "merged_snapshot_id": r.merged_snapshot_id,
            "created_at": r.created_at
        }
        for r in records
    ]


@router.delete("/records/{merge_record_id}")
def delete_merge_record(merge_record_id: int, db: Session = Depends(get_db)):
    record = db.query(MergeRecord).filter(MergeRecord.id == merge_record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Merge record not found")
    db.delete(record)
    db.commit()
    return {"message": "Merge record deleted"}



@router.delete("/records/{merge_record_id}")
def delete_merge_record(merge_record_id: int, db: Session = Depends(get_db)):
    record = db.query(MergeRecord).filter(MergeRecord.id == merge_record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Merge record not found")
    db.delete(record)
    db.commit()
    return {"message": f"Merge record {merge_record_id} deleted"}