import asyncio
import sys
import json

sys.path.append(".")

from backend.services.extractor import extract_snapshot
from backend.schemas.conversation_schema import Message

SAMPLE_CONVERSATION = [
    Message(role="user", content="Let's build a FastAPI backend for a todo app"),
    Message(role="assistant", content="Sure! I'll use FastAPI with SQLite, SQLAlchemy as ORM, Pydantic for validation. Endpoints: create, read, update, delete todos."),
    Message(role="user", content="Add JWT authentication too"),
    Message(role="assistant", content="I'll add JWT auth using python-jose and passlib. Two new tables: users and tokens. Login returns JWT, protected routes verify the token."),
    Message(role="user", content="What's still pending?"),
    Message(role="assistant", content="Pending: password reset flow, email verification, rate limiting on login. Known issue: token expiry is hardcoded to 30 minutes, should be configurable via env var."),
]


async def run_test():
    print("=" * 50)
    print("ContextBridge — Phase 0 Feasibility Test")
    print("=" * 50)
    print(f"\nInput: {len(SAMPLE_CONVERSATION)} messages")
    print("Running extraction pipeline...\n")

    try:
        result = await extract_snapshot(messages=SAMPLE_CONVERSATION, compression_level="standard")
        print("✓ Extraction successful\n")
        print(json.dumps(result.model_dump(), indent=2))
        print("\n✓ Phase 0 passed")
    except Exception as e:
        print(f"\n✗ Failed: {e}")
        print("\nCheck:")
        print("  1. ollama serve is running")
        print("  2. ollama pull llama3.1:8b is done")
        print("  3. OLLAMA_BASE_URL in .env is correct")


if __name__ == "__main__":
    asyncio.run(run_test())