from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database.db import get_db
from backend.database.models import Project, Snapshot
from backend.services.github_service import (
    get_recent_commits,
    get_latest_sha,
    verify_claims_against_commits
)
from backend.services.stale_checker import mark_stale_snapshots
import json

router = APIRouter(prefix="/github", tags=["github"])


class LinkRepoRequest(BaseModel):
    project_id: int
    repo: str          # "owner/repo"
    pat: Optional[str] = None


@router.post("/link")
async def link_repo(payload: LinkRepoRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        latest_sha = await get_latest_sha(payload.repo, payload.pat)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not reach repo: {str(e)}")

    project.github_repo = payload.repo
    if payload.pat:
        project.github_pat = payload.pat
    db.commit()

    return {
        "message": f"Repo {payload.repo} linked successfully",
        "latest_sha": latest_sha
    }

@router.get("/commits/{project_id}")
async def get_commits(project_id: int, db: Session = Depends(get_db)):
    """Get recent commits for a project's linked repo."""
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.github_repo:
        raise HTTPException(status_code=400, detail="No repo linked to this project")

    try:
        commits = await get_recent_commits(
            project.github_repo,
            project.github_pat
        )
        return {"repo": project.github_repo, "commits": commits}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stale/{project_id}")
async def check_stale(project_id: int, db: Session = Depends(get_db)):
    """Check and update stale status for all snapshots in a project."""
    project = db.query(Project).filter(Project.id == payload.project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.github_repo:
        raise HTTPException(status_code=400, detail="No repo linked to this project")

    await mark_stale_snapshots(project_id, project.github_repo, db, project.github_pat)

    snapshots = db.query(Snapshot).filter(Snapshot.project_id == project_id).all()
    return {
        "repo": project.github_repo,
        "snapshots": [
            {"id": s.id, "version": s.version, "is_stale": bool(s.is_stale)}
            for s in snapshots
        ]
    }


@router.post("/verify/{snapshot_id}")
async def verify_claims(snapshot_id: int, db: Session = Depends(get_db)):
    """
    Cross-check completed_features from a snapshot
    against actual commit messages in the linked repo.
    """
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    project = db.query(Project).filter(Project.id == snapshot.project_id).first()
    if not project or not project.github_repo:
        raise HTTPException(status_code=400, detail="No repo linked to this project")

    data = json.loads(snapshot.structured_data)
    claims = data.get("completed_features", [])

    results = await verify_claims_against_commits(
        claims,
        project.github_repo,
        pat=project.github_pat
    )

    return {
        "snapshot_id": snapshot_id,
        "repo": project.github_repo,
        "verification": results
    }