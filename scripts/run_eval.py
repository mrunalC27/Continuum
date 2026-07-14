"""
Run the benchmark evaluation locally.
Uses your real ChatGPT conversation histories as test cases.

Usage:
    python scripts/run_eval.py
"""

import asyncio
import sys
import json

sys.path.append(".")

from backend.eval.runner import run_full_benchmark

# Add your real conversations here
# The more real and varied these are, the more meaningful your results
TEST_CONVERSATIONS = [
    {
    "name": "ContextBridge Build",
    "messages": [
        {"role": "user", "content": "Let's build a Chrome extension that scrapes ChatGPT conversations"},
        {"role": "assistant", "content": "We'll use Manifest V3, content scripts for DOM scraping, FastAPI backend, SQLite for storage, Ollama for local AI extraction."},
        {"role": "user", "content": "Scraper is done, what files did we create?"},
        {"role": "assistant", "content": "Created: manifest.json, background.js, content/chatgpt.js, utils/scraper.js with 3 fallback strategies, popup/popup.html, popup.js, popup.css."},
        {"role": "user", "content": "Backend extraction pipeline is working too"},
        {"role": "assistant", "content": "Backend done: main.py FastAPI app, extractor.py with Ollama integration, json_repair.py for broken JSON, preprocessor.py strips filler messages, SQLite snapshots table with versioning."},
        {"role": "user", "content": "GitHub linking is working, what's pending?"},
        {"role": "assistant", "content": "Pending: React dashboard UI, eval benchmark, merge conflict UI polish. Known issues: DOM scraping may break if ChatGPT updates their HTML structure. Constraint: local only, no cloud sync in v1."},
    ]
    } 
]    
    # {
    #     "name": "Finance Tracker",
    #     "messages": [
    #     {
    #         "role": "user",
    #         "content": "I want to build a personal finance tracker web application."
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Great choice! We can build it using React for the frontend, FastAPI for the backend, PostgreSQL as the database, SQLAlchemy ORM, JWT authentication, and Chart.js for visualizing expenses and income."
    #     },
    #     {
    #         "role": "user",
    #         "content": "What core features should we include in the MVP?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "The MVP should include user registration and login, income and expense management, transaction categories, monthly summaries, filtering by date, dashboards with charts, and profile management."
    #     },
    #     {
    #         "role": "user",
    #         "content": "Can we organize the project structure before coding?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Yes. Separate the project into frontend and backend folders. The backend should have routes, models, schemas, services, and database modules. The frontend should contain components, pages, hooks, services, and context providers."
    #     },
    #     {
    #         "role": "user",
    #         "content": "Which database tables will we need?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "We'll need Users, Transactions, Categories, and optionally Budgets. Transactions will reference both the user and category using foreign keys."
    #     },
    #     {
    #         "role": "user",
    #         "content": "How should authentication work?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Use JWT authentication with hashed passwords using bcrypt. Users receive an access token after login, and protected API endpoints validate the token before allowing access."
    #     },
    #     {
    #         "role": "user",
    #         "content": "Should we validate user input on both frontend and backend?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Absolutely. Frontend validation improves user experience, while backend validation using Pydantic ensures data integrity and security regardless of the client."
    #     },
    #     {
    #         "role": "user",
    #         "content": "How can we categorize transactions?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Each transaction should belong to a category such as Food, Transport, Shopping, Entertainment, Bills, Healthcare, Salary, or Investments. Users can also create custom categories."
    #     },
    #     {
    #         "role": "user",
    #         "content": "I want users to search transactions quickly."
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Implement search by title, description, category, amount range, and date range. Combine these filters to help users find transactions efficiently."
    #     },
    #     {
    #         "role": "user",
    #         "content": "Can we add analytics?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Yes. Show monthly spending trends, category-wise pie charts, income versus expenses, highest spending categories, and savings over time."
    #     },
    #     {
    #         "role": "user",
    #         "content": "How should the API endpoints look?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Create REST endpoints such as POST /auth/register, POST /auth/login, GET /transactions, POST /transactions, PUT /transactions/{id}, DELETE /transactions/{id}, GET /categories, and GET /analytics."
    #     },
    #     {
    #         "role": "user",
    #         "content": "What error handling should we implement?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Return appropriate HTTP status codes, meaningful error messages, validation errors, authentication failures, and centralized exception handling for unexpected server errors."
    #     },
    #     {
    #         "role": "user",
    #         "content": "How can we optimize performance as data grows?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Use database indexes on frequently queried fields, pagination, caching for analytics, optimized SQL queries, lazy loading where appropriate, and API response compression."
    #     },
    #     {
    #         "role": "user",
    #         "content": "Can we make the dashboard responsive?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Yes. Use responsive layouts with CSS Grid or Flexbox, adaptive charts, collapsible navigation, and mobile-friendly cards so the dashboard works across desktop, tablet, and mobile devices."
    #     },
    #     {
    #         "role": "user",
    #         "content": "What testing strategy should we follow?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Write unit tests for business logic, integration tests for API endpoints, frontend component tests, and end-to-end tests covering registration, login, transaction creation, editing, and analytics workflows."
    #     },
    #     {
    #         "role": "user",
    #         "content": "How should we deploy the application?"
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "Containerize the application using Docker, deploy the backend behind a reverse proxy, host the frontend on a static hosting service, use PostgreSQL as a managed database, and configure environment variables for secrets and API keys."
    #     }
    #     ]
    
    # {
    #     "name": "React Dashboard Project",
    #     "messages": [
    #         {"role": "user", "content": "Building a React analytics dashboard"},
    #         {"role": "assistant", "content": "Using React with Vite, Recharts for charts, Zustand for state management, Tailwind for styling."},
    #         {"role": "user", "content": "What charts do we need?"},
    #         {"role": "assistant", "content": "Line chart for revenue over time, bar chart for user signups by month, pie chart for traffic sources. All data from /api/analytics endpoint."},
    #         {"role": "user", "content": "Backend API is ready, what's left on frontend?"},
    #         {"role": "assistant", "content": "Completed: sidebar nav, header, revenue line chart. Pending: bar chart component, pie chart, mobile responsive layout, dark mode toggle, export to CSV button. Known issue: charts flicker on data refresh."},
    #     ]
    # },
    # {
    #     "name": "Chrome Extension Project",
    #     "messages": [
    #         {"role": "user", "content": "Building a Chrome Manifest V3 extension"},
    #         {"role": "assistant", "content": "Manifest V3 uses service workers instead of background pages. We need manifest.json, content scripts, popup UI, and background service worker."},
    #         {"role": "user", "content": "How do we communicate between popup and content script?"},
    #         {"role": "assistant", "content": "Use chrome.tabs.sendMessage from popup to content script, chrome.runtime.onMessage listener in content script. For persistent data use chrome.storage.local."},
    #         {"role": "user", "content": "What's the current status?"},
    #         {"role": "assistant", "content": "Done: manifest.json, background.js service worker, content script injected on target pages. Pending: popup UI design, options page, publishing to Chrome Web Store. Bug: content script fails on pages with strict CSP headers."},
    #     ]
    # }



async def main():
    print("=" * 60)
    print("ContextBridge — Evaluation Benchmark")
    print("=" * 60)
    print(f"Running on {len(TEST_CONVERSATIONS)} conversations")
    print("3 conditions each: full context / snapshot / no context")
    print("This will take a few minutes...\n")

    results = await run_full_benchmark(TEST_CONVERSATIONS)

    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    avg = results["averages"]
    print(f"\n{'Condition':<25} {'Avg Score':>10}")
    print("-" * 36)
    print(f"{'Full conversation':<25} {avg['full_context']:>10}/10")
    print(f"{'Snapshot only':<25} {avg['snapshot']:>10}/10")
    print(f"{'No context':<25} {avg['no_context']:>10}/10")
    print(f"\nAverage compression: {avg['compression_pct']}% token reduction")
    print("\nDetailed results saved to backend/eval/results/latest_run.json")

    print("\n" + "=" * 60)
    print("PER-CONVERSATION BREAKDOWN")
    print("=" * 60)
    for r in results["results"]:
        print(f"\n{r['conversation']}")
        print(f"  Full context : {r['scores']['full_context']}/10")
        print(f"  Snapshot     : {r['scores']['snapshot']}/10")
        print(f"  No context   : {r['scores']['no_context']}/10")
        print(f"  Compression  : {r['token_counts']['compression_pct']}% fewer tokens")


if __name__ == "__main__":
    asyncio.run(main())