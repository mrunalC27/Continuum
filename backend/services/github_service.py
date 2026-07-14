import httpx
from backend.config import GITHUB_PAT


def get_headers(pat: str = None) -> dict:
    token = pat or GITHUB_PAT
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


async def get_recent_commits(repo: str, pat: str = None, limit: int = 20) -> list:
    """
    Pull recent commits from a GitHub repo.
    repo format: "owner/repo" e.g. "mrunalC27/Synapse"
    Returns list of simplified commit objects.
    """
    url = f"https://api.github.com/repos/{repo}/commits?per_page={limit}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=get_headers(pat))
        response.raise_for_status()
        raw = response.json()

    commits = []
    for c in raw:
        commits.append({
            "sha": c["sha"],
            "message": c["commit"]["message"].split("\n")[0],  # first line only
            "author": c["commit"]["author"]["name"],
            "date": c["commit"]["author"]["date"],
            "files_changed": ""  # filled below if needed
        })

    return commits


async def get_commit_files(repo: str, sha: str, pat: str = None) -> list:
    """
    Get files changed in a specific commit.
    Used for claim verification.
    """
    url = f"https://api.github.com/repos/{repo}/commits/{sha}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=get_headers(pat))
        response.raise_for_status()
        data = response.json()

    return [f["filename"] for f in data.get("files", [])]


async def get_latest_sha(repo: str, pat: str = None) -> str:
    """Get the SHA of the latest commit — used for stale checking."""
    commits = await get_recent_commits(repo, pat, limit=1)
    if commits:
        return commits[0]["sha"]
    return ""


async def verify_claims_against_commits(
    claims: list[str],
    repo: str,
    since_sha: str = None,
    pat: str = None
) -> list[dict]:
    """
    Cross-check completed_features claims against recent commit messages.
    Returns each claim with a verified flag.
    
    Simple check: if any keyword from the claim appears in any commit message
    → mark as likely verified. Otherwise → unverified.
    """
    commits = await get_recent_commits(repo, pat, limit=30)
    commit_messages = " ".join([c["message"].lower() for c in commits])

    results = []
    for claim in claims:
        keywords = [w.lower() for w in claim.split() if len(w) > 3]
        matched = any(kw in commit_messages for kw in keywords)
        results.append({
            "claim": claim,
            "verified": matched,
            "note": "Found in recent commits" if matched else "Not found in recent commits — may be unverified"
        })

    return results