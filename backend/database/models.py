from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    github_repo = Column(String(255), nullable=True)
    github_pat = Column(String(255), nullable=True)
    # find the Project class and add after github_pat line
    tags = Column(String(255), nullable=True)   # comma separated e.g. "work,hackathon"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    structured_data = Column(Text, nullable=False)
    raw_conversation = Column(Text, nullable=True)
    compression_level = Column(String(20), default="standard")
    commit_sha = Column(String(64), nullable=True)
    is_stale = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class MergeRecord(Base):
    __tablename__ = "merge_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    snapshot_a_id = Column(Integer, ForeignKey("snapshots.id"), nullable=False)
    snapshot_b_id = Column(Integer, ForeignKey("snapshots.id"), nullable=False)
    merged_snapshot_id = Column(Integer, ForeignKey("snapshots.id"), nullable=True)
    conflicts = Column(Text, nullable=True)
    resolved = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)