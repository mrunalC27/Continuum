from backend.services.github_service import get_latest_sha
from backend.database.models import Snapshot
from sqlalchemy.orm import Session


async def check_stale(snapshot: Snapshot, repo: str, pat: str = None) -> bool:
    if not snapshot.commit_sha:
        return True
    latest_sha = await get_latest_sha(repo, pat)
    if not latest_sha:
        return False
    return snapshot.commit_sha != latest_sha


async def mark_stale_snapshots(project_id: int, repo: str, db: Session, pat: str = None):
    snapshots = db.query(Snapshot).filter(Snapshot.project_id == project_id).all()
    
    try:
        latest_sha = await get_latest_sha(repo, pat)
    except Exception:
        return  # can't reach GitHub — don't crash, just skip
    
    if not latest_sha:
        return

    for snapshot in snapshots:
        is_stale = (snapshot.commit_sha != latest_sha) if snapshot.commit_sha else True
        snapshot.is_stale = 1 if is_stale else 0

    db.commit()