<div align="center">

<img src="dashboard/public/favicon.svg" width="80" height="80" alt="Continuum Logo" />

# Continuum

### AI Project Memory System

**Pick up where you left off — on any AI.**

[![Live Demo](https://img.shields.io/badge/Dashboard-Live-4f8ef7?style=for-the-badge)](https://continuum-lilac.vercel.app)
[![Backend](https://img.shields.io/badge/API-Render-4f8ef7?style=for-the-badge)](https://continuum-backend-zgor.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## The Problem

AI conversations are session-based. Every time you hit a context limit, switch platforms, or start a new chat — you lose everything. You re-explain your architecture, your decisions, your pending tasks. From scratch. Every time.

**Continuum fixes this.**

---

## What It Does

Continuum extracts structured project knowledge from your AI conversations and saves it as a versioned snapshot. When you switch to a new AI platform or start a fresh session, you paste one continuation prompt and the AI instantly understands your full project context.

```
ChatGPT conversation (500 messages, 40,000 tokens)
              ↓ Extract
Continuum Snapshot (structured JSON, ~200 tokens)
              ↓ Restore
Claude / Gemini / Any AI — full context, zero re-explaining
```

---

## Features

| Feature | Description |
|---|---|
| **Chrome Extension** | One-click extraction from ChatGPT and Claude conversations |
| **Structured Extraction** | Converts raw conversations into goal, stack, decisions, tasks, issues |
| **Snapshot Versioning** | Every extraction creates a new version — full history preserved |
| **Visual Diff** | Git-style green/red comparison between any two snapshot versions |
| **Multi-Conversation Merge** | Reconcile two teammates' AI sessions — conflicts surfaced and resolved |
| **AI-Specific Prompts** | Continuation prompts optimized per platform — ChatGPT, Claude, Gemini |
| **Import from Any AI** | Paste conversations from mobile apps, Gemini, or any platform |
| **Export** | Download snapshots as JSON or Markdown |
| **Smart Search** | Search across all projects and snapshots instantly |
| **Project Tags** | Organize projects with custom tags and filter by them |
| **Keyboard Shortcut** | `Ctrl+Shift+E` triggers extraction without opening the popup |
| **Offline AI** | Local extraction via Ollama — no API keys, no rate limits, full privacy |
| **Cloud Deployment** | Groq-powered cloud inference for deployed version |

---

## Evaluation Results

Tested across real AI project conversations using a 5-dimension rubric (goal accuracy, architecture accuracy, task accuracy, hallucination rate, code reference accuracy). Scored by Ollama-as-judge for reproducibility.

| Condition | Score | Tokens Used |
|---|---|---|
| **Snapshot only** | **7.6 / 10** | ~200 tokens |
| Full conversation | 5.0 / 10 | ~2,400 tokens |
| No context | 1.0 / 10 | 0 tokens |

**Snapshot achieves 52% higher continuity score than raw conversation, using 92% fewer tokens.**

The snapshot outperforms even the full conversation because structured extraction removes noise, greetings, and redundant explanations — leaving only what another AI needs to continue the work.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ chatgpt.js  │  │  claude.js  │  │   background.js  │   │
│  │ DOM scraper │  │ DOM scraper │  │ async extractor  │   │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘   │
└─────────┼────────────────┼──────────────────┼──────────────┘
          │                │                  │
          └────────────────┴──────────────────┘
                           │ HTTP POST /extract
┌──────────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                             │
│  preprocessor.py → extractor.py → ollama/groq_client.py    │
│       ↓                                                     │
│  json_repair.py → Pydantic validation → SQLite             │
│                                                             │
│  /snapshots  /merge  /restore  /diff  /eval                │
└─────────────────────────────────────────────────────────────┘
          │                          │
┌─────────▼──────────┐   ┌──────────▼──────────────────────┐
│   SQLite Database  │   │      React Dashboard             │
│                    │   │                                  │
│  projects          │   │  Home → ProjectDetail            │
│  snapshots         │   │  SnapshotView → DiffView         │
│  merge_records     │   │  MergeView → ImportView          │
└────────────────────┘   └──────────────────────────────────┘
```

---

## Tech Stack

**Extension**
- Chrome Manifest V3
- Vanilla JS content scripts
- 3-strategy DOM fallback scraping

**Backend**
- FastAPI + Python
- SQLAlchemy + SQLite
- Pydantic v2 schema validation
- Ollama (`qwen2.5:3b`) — local inference
- Groq (`llama-3.1-8b-instant`) — cloud inference
- JSON self-repair with retry logic

**Frontend**
- React + Vite
- Zustand state management
- Custom component library (no UI framework)
- Axios

**Deployment**
- Backend → Render
- Frontend → Vercel
- Local AI → Ollama (privacy-first, offline capable)

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) (for local AI inference)

### Backend

```bash
# clone the repo
git clone https://github.com/mrunalC27/Continuum.git
cd Continuum

# install dependencies
pip install -r requirements.txt

# create .env
cp .env.example .env
# add your GROQ_API_KEY if using cloud inference

# pull Ollama model (for local inference)
ollama pull qwen2.5:3b

# start backend
uvicorn backend.main:app --reload --port 8000
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
# opens at localhost:5173
```

### Chrome Extension

```
1. Open chrome://extensions
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the extension/ folder
```

### Environment Variables

```env
# Local (.env)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.1-8b-instant
USE_GROQ=false          # true = Groq cloud, false = local Ollama
MOCK_MODE=false         # true = skip AI, return mock data
DB_PATH=./data/continuum.db
```

---

## How It Works

### Extraction Pipeline

```
Raw conversation (N messages)
        ↓
preprocessor.py — removes greetings, filler, duplicates
        ↓
extractor.py — builds structured prompt
        ↓
Ollama / Groq — returns JSON snapshot
        ↓
json_repair.py — fixes malformed output, retries
        ↓
Pydantic validation — enforces schema
        ↓
SQLite — saved as versioned snapshot
```

### Snapshot Schema

```json
{
  "project_goal": "one sentence describing the project",
  "tech_stack": ["FastAPI", "React", "SQLite"],
  "architecture_decisions": [
    { "decision": "Use local Ollama for privacy", "reasoning": "No data leaves the machine" }
  ],
  "completed_features": ["Chrome extension", "Extraction pipeline"],
  "pending_tasks": ["Eval benchmark", "README"],
  "known_issues": ["DOM selectors break on ChatGPT UI updates"],
  "key_code_references": [
    { "file": "extractor.py", "purpose": "Core extraction orchestrator" }
  ],
  "constraints": ["Local-only in v1, no cloud sync"]
}
```

### Merge & Conflict Resolution

When two teammates extract snapshots from separate AI conversations on the same project, Continuum reconciles them:

```
Snapshot A (teammate 1's conversation)
Snapshot B (teammate 2's conversation)
        ↓ POST /merge
Conflicts detected → surfaced to user
        ↓ User resolves each conflict (pick A / pick B)
        ↓ POST /merge/resolve
Merged snapshot saved as new version
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/extract/` | Extract snapshot from conversation |
| `POST` | `/extract/from-text` | Extract from pasted raw text |
| `GET` | `/snapshots/project/{id}` | All snapshots for a project |
| `GET` | `/restore/{id}` | Generate continuation prompt |
| `GET` | `/restore/diff/{id}` | Compare two snapshot versions |
| `POST` | `/merge/` | Merge two snapshots |
| `POST` | `/merge/resolve` | Apply conflict resolutions |
| `POST` | `/eval/run` | Run benchmark evaluation |

Full interactive docs: `https://continuum-backend-zgor.onrender.com/docs`

---

## Project Structure

```
Continuum/
├── extension/                  # Chrome Manifest V3
│   ├── content/
│   │   ├── chatgpt.js          # ChatGPT DOM scraper
│   │   └── claude.js           # Claude DOM scraper
│   ├── popup/                  # Extension UI
│   ├── utils/scraper.js        # 3-strategy fallback scraper
│   └── background.js           # Async extraction service worker
│
├── backend/                    # FastAPI
│   ├── routers/                # API endpoints
│   ├── services/
│   │   ├── extractor.py        # Core extraction pipeline
│   │   ├── ollama_client.py    # Ollama + Groq router
│   │   ├── groq_client.py      # Groq cloud inference
│   │   ├── json_repair.py      # LLM output self-healing
│   │   ├── preprocessor.py     # Conversation cleaning
│   │   ├── merger.py           # Snapshot reconciliation
│   │   └── restoration.py      # Continuation prompt generation
│   ├── schemas/                # Pydantic models
│   ├── prompts/                # LLM prompt templates
│   └── eval/                   # Benchmark runner + scorer
│
├── dashboard/                  # React + Vite
│   └── src/
│       ├── pages/              # Home, ProjectDetail, SnapshotView, etc.
│       ├── components/         # Layout, Logo, Toast, Modal, etc.
│       └── api/client.js       # Axios API wrapper
│
└── scripts/
    ├── test_extraction.py      # Phase 0 feasibility test
    └── run_eval.py             # Full benchmark runner
```

---

## Why Local-First?

Most AI memory tools send your conversation history to a third-party server. Continuum's default mode runs entirely on your machine:

- **Ollama** handles inference locally — your conversations never leave your device
- **SQLite** stores snapshots locally — no cloud database
- **Chrome extension** reads only what's visible on screen — no background scraping

Cloud deployment (Render + Groq) is available for portfolio demo purposes, with the same privacy model minus local inference.

---

## Roadmap

- [ ] Firefox extension support
- [ ] Gemini conversation scraping
- [ ] Ollama-powered merge conflict resolution (currently programmatic)
- [ ] Snapshot templates for common project types
- [ ] Team workspace with shared snapshot history
- [ ] Auto-extract on conversation end detection
- [ ] Chrome Web Store publication

---

<div align="center">

**Continuum** · AI Project Memory System

*No more starting over.*

</div>
