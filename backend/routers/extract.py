import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import Snapshot, Project
from backend.schemas.conversation_schema import ConversationInput
from backend.schemas.snapshot_schema import SnapshotData
from backend.services.extractor import extract_snapshot

router = APIRouter(prefix="/extract", tags=["extract"])


@router.post("/")
async def extract(payload: ConversationInput, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        snapshot_data: SnapshotData = await extract_snapshot(
            messages=payload.messages,
            compression_level=payload.compression_level
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    last_snapshot = (
        db.query(Snapshot)
        .filter(Snapshot.project_id == payload.project_id)
        .order_by(Snapshot.version.desc())
        .first()
    )
    next_version = (last_snapshot.version + 1) if last_snapshot else 1

    new_snapshot = Snapshot(
        project_id=payload.project_id,
        version=next_version,
        structured_data=snapshot_data.model_dump_json(),
        raw_conversation=json.dumps([m.model_dump() for m in payload.messages]),
        compression_level=payload.compression_level,
    )
    db.add(new_snapshot)
    db.commit()
    db.refresh(new_snapshot)

    return {
        "snapshot_id": new_snapshot.id,
        "version": new_snapshot.version,
        "project_id": payload.project_id,
        "structured_data": snapshot_data.model_dump(),
        "message": f"Snapshot v{next_version} created successfully"
    }


from pydantic import BaseModel as PydanticBase

class RawTextInput(PydanticBase):
    project_id: int
    raw_text: str
    compression_level: str = "standard"


@router.post("/from-text")
async def extract_from_text(payload: RawTextInput, db: Session = Depends(get_db)):
    """
    Extract snapshot from raw pasted conversation text.
    Handles any format — ChatGPT app copy, Gemini, any AI platform.
    """
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # parse raw text into messages
    messages = parse_raw_conversation(payload.raw_text)

    if not messages:
        raise HTTPException(status_code=422, detail="Could not parse any messages from the text")

    try:
        snapshot_data: SnapshotData = await extract_snapshot(
            messages=messages,
            compression_level=payload.compression_level
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    last_snapshot = (
        db.query(Snapshot)
        .filter(Snapshot.project_id == payload.project_id)
        .order_by(Snapshot.version.desc())
        .first()
    )
    next_version = (last_snapshot.version + 1) if last_snapshot else 1

    new_snapshot = Snapshot(
        project_id=payload.project_id,
        version=next_version,
        structured_data=snapshot_data.model_dump_json(),
        raw_conversation=json.dumps([m.model_dump() for m in messages]),
        compression_level=payload.compression_level,
    )
    db.add(new_snapshot)
    db.commit()
    db.refresh(new_snapshot)

    return {
        "snapshot_id": new_snapshot.id,
        "version": new_snapshot.version,
        "project_id": payload.project_id,
        "message_count": len(messages),
        "structured_data": snapshot_data.model_dump(),
        "message": f"Snapshot v{next_version} created from pasted text"
    }


def parse_raw_conversation(text: str):
    """
    Parse raw pasted conversation into Message objects.
    Handles multiple copy formats from different AI platforms.
    """
    from backend.schemas.conversation_schema import Message
    import re

    messages = []
    lines = text.strip().split("\n")

    # Format 1 — ChatGPT app copies as "You\n message \n ChatGPT\n response"
    # Format 2 — "User: message\nAssistant: response"
    # Format 3 — plain alternating paragraphs

    # try labeled format first
    user_patterns = [r"^(You|User|Human|Me):?\s*", r"^(YOU|USER|HUMAN):?\s*"]
    ai_patterns = [r"^(ChatGPT|Claude|Gemini|Grok|Assistant|AI|Bot):?\s*",
                   r"^(CHATGPT|CLAUDE|GEMINI|ASSISTANT):?\s*"]

    current_role = None
    current_content = []
    found_labels = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        is_user = any(re.match(p, stripped) for p in user_patterns)
        is_ai = any(re.match(p, stripped) for p in ai_patterns)

        if is_user or is_ai:
            found_labels = True
            if current_role and current_content:
                content = " ".join(current_content).strip()
                if content:
                    messages.append(Message(role=current_role, content=content))
            current_role = "user" if is_user else "assistant"
            # remove the label from content
            for p in (user_patterns + ai_patterns):
                stripped = re.sub(p, "", stripped).strip()
            current_content = [stripped] if stripped else []
        elif found_labels and current_role:
            current_content.append(stripped)

    # save last message
    if current_role and current_content:
        content = " ".join(current_content).strip()
        if content:
            messages.append(Message(role=current_role, content=content))

    # fallback — if no labels found, treat as alternating paragraphs
    if not messages:
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        for i, para in enumerate(paragraphs):
            messages.append(Message(
                role="user" if i % 2 == 0 else "assistant",
                content=para
            ))

    return messages