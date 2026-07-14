from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database.db import get_db
from backend.database.models import Project, Snapshot, MergeRecord

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    github_repo: Optional[str] = None
    github_pat: Optional[str] = None
    tags: Optional[str] = None


class ProjectUpdate(BaseModel):
    tags: Optional[str] = None
    name: Optional[str] = None


@router.post("/")
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=payload.name,
        github_repo=payload.github_repo,
        github_pat=payload.github_pat,
        tags=payload.tags
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"id": project.id, "name": project.name, "message": "Project created"}


@router.get("/")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    result = []
    for p in projects:
        last_snapshot = (
            db.query(Snapshot)
            .filter(Snapshot.project_id == p.id)
            .order_by(Snapshot.created_at.desc())
            .first()
        )
        result.append({
            "id": p.id,
            "name": p.name,
            "github_repo": p.github_repo,
            "tags": p.tags,
            "created_at": p.created_at,
            "last_activity": last_snapshot.created_at if last_snapshot else None,
            "snapshot_count": db.query(Snapshot).filter(Snapshot.project_id == p.id).count()
        })
    return result


@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}")
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if payload.tags is not None:
        project.tags = payload.tags
    if payload.name is not None:
        project.name = payload.name
    db.commit()
    return {"message": "Project updated"}


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.query(MergeRecord).filter(
        MergeRecord.project_id == project_id
    ).delete(synchronize_session=False)

    db.query(Snapshot).filter(
        Snapshot.project_id == project_id
    ).delete(synchronize_session=False)

    db.delete(project)
    db.commit()
    return {"message": "Project and all data deleted"}