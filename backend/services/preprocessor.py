import re
from backend.schemas.conversation_schema import Message
from typing import List

FILLER_PATTERNS = [
    r"^(hi|hello|hey|thanks|thank you|ok|okay|sure|got it|sounds good|great|perfect|yes|no|yep|nope)[!.,\s]*$",
    r"^(please continue|go on|continue|proceed|next)[!.,\s]*$",
    r"^(good|nice|awesome|excellent|well done|looks good)[!.,\s]*$",
]

COMPILED_FILLERS = [re.compile(p, re.IGNORECASE) for p in FILLER_PATTERNS]


def is_filler(message: Message) -> bool:
    content = message.content.strip()
    if len(content) < 3:
        return True
    for pattern in COMPILED_FILLERS:
        if pattern.match(content):
            return True
    return False


def deduplicate(messages: List[Message]) -> List[Message]:
    seen = set()
    result = []
    for msg in messages:
        key = (msg.role, msg.content.strip())
        if key not in seen:
            seen.add(key)
            result.append(msg)
    return result


def preprocess(messages: List[Message]) -> List[Message]:
    filtered = [m for m in messages if not is_filler(m)]
    return deduplicate(filtered)


def format_for_prompt(messages: List[Message]) -> str:
    lines = []
    for msg in messages:
        role = "USER" if msg.role == "user" else "ASSISTANT"
        lines.append(f"[{role}]: {msg.content.strip()}")
    return "\n\n".join(lines)