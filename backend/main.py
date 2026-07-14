from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.db import init_db
from backend.routers import extract, projects, snapshots, restore, merge, eval
from backend.services.ollama_client import check_ollama_health

app = FastAPI(
    title="ContextBridge API",
    description="Universal AI project memory system",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    print("Database initialized")

app.include_router(projects.router)
app.include_router(extract.router)
app.include_router(snapshots.router)
app.include_router(restore.router)
app.include_router(merge.router)
app.include_router(eval.router)

@app.get("/")
def root():
    return {"message": "ContextBridge API is running", "version": "0.1.0"}

@app.get("/health")
async def health():
    ollama_status = await check_ollama_health()
    return {"api": "ok", "ollama": ollama_status}