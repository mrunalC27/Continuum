from pydantic import BaseModel
from typing import List, Optional


class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None


class ConversationInput(BaseModel):
    project_id: int
    messages: List[Message]
    compression_level: str = "standard"
    github_repo: Optional[str] = None