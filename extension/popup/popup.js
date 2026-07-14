const API_BASE = "http://localhost:8000";

// DOM refs
const projectSelect = document.getElementById("projectSelect");
const newProjectBtn = document.getElementById("newProjectBtn");
const newProjectForm = document.getElementById("newProjectForm");
const projectNameInput = document.getElementById("projectName");
const githubRepoInput = document.getElementById("githubRepo");
const createProjectBtn = document.getElementById("createProjectBtn");
const compressionLevel = document.getElementById("compressionLevel");
const extractBtn = document.getElementById("extractBtn");
const statusDiv = document.getElementById("status");
const resultArea = document.getElementById("resultArea");
const snapshotPreview = document.getElementById("snapshotPreview");
const openDashboard = document.getElementById("openDashboard");


// ── Helpers ──────────────────────────────────────────────────────────────

function showStatus(message, type = "loading") {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove("hidden");
}


// ── Load projects on popup open ──────────────────────────────────────────

async function loadProjects() {
    try {
        const res = await fetch(`${API_BASE}/projects/`);
        const projects = await res.json();
        projectSelect.innerHTML = '<option value="">-- select a project --</option>';
        projects.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.name;
            projectSelect.appendChild(opt);
        });
    } catch (err) {
        showStatus("Backend not reachable — is it running on port 8000?", "error");
    }
}


// ── Enable extract button when project is selected ───────────────────────

projectSelect.addEventListener("change", () => {
    extractBtn.disabled = projectSelect.value === "";
});


// ── New project form toggle ──────────────────────────────────────────────

newProjectBtn.addEventListener("click", () => {
    newProjectForm.classList.toggle("hidden");
});

createProjectBtn.addEventListener("click", async () => {
    const name = projectNameInput.value.trim();
    if (!name) return showStatus("Enter a project name", "error");

    try {
        const res = await fetch(`${API_BASE}/projects/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                github_repo: githubRepoInput.value.trim() || null
            })
        });
        const data = await res.json();
        showStatus(`Project "${name}" created`, "success");
        newProjectForm.classList.add("hidden");
        projectNameInput.value = "";
        githubRepoInput.value = "";
        await loadProjects();
        projectSelect.value = data.id;
        extractBtn.disabled = false;
    } catch (err) {
        showStatus("Failed to create project", "error");
    }
});


// ── Extract ──────────────────────────────────────────────────────────────

extractBtn.addEventListener("click", async () => {
    const projectId = projectSelect.value;
    if (!projectId) return;

    showStatus("Step 1/3 — Scraping conversation from page...", "loading");
    extractBtn.disabled = true;
    resultArea.classList.add("hidden");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // detect platform from URL
    const url = tab.url || "";
    const isClaude = url.includes("claude.ai");
    const isChatGPT = url.includes("chatgpt.com") || url.includes("chat.openai.com");

    if (!isClaude && !isChatGPT) {
        showStatus("Open a ChatGPT or Claude conversation first", "error");
        extractBtn.disabled = false;
        return;
    }

    const platform = isClaude ? "Claude" : "ChatGPT";

    // save last used project for keyboard shortcut
    chrome.storage.local.set({ lastProjectId: parseInt(projectId) });

    chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_REQUEST" }, async (scrapeResult) => {
        if (chrome.runtime.lastError || !scrapeResult) {
            showStatus(`Could not scrape — open a ${platform} conversation first`, "error");
            extractBtn.disabled = false;
            return;
        }

        if (!scrapeResult.success) {
            showStatus(scrapeResult.error || "Scraping failed", "error");
            extractBtn.disabled = false;
            return;
        }

        if (scrapeResult.method !== "primary") {
            showStatus(`Warning: used fallback scraping on ${platform}`, "warning");
        }

        // save to storage so background can finish even if popup closes
        chrome.storage.local.set({
            pendingExtraction: {
                projectId: parseInt(projectId),
                messages: scrapeResult.messages,
                compressionLevel: compressionLevel.value,
                count: scrapeResult.count,
                method: scrapeResult.method,
                platform
            }
        });

        // hand off to background service worker
        chrome.runtime.sendMessage({
            type: "START_EXTRACTION",
            projectId: parseInt(projectId),
            messages: scrapeResult.messages,
            compressionLevel: compressionLevel.value,
            count: scrapeResult.count
        });

        showStatus(
            `Captured ${scrapeResult.count} messages from ${platform}. Extracting — close this anytime.`,
            "loading"
        );
        extractBtn.disabled = false;
    });
});


// ── Open dashboard ───────────────────────────────────────────────────────

openDashboard.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:5173" });
});


// ── Init — check if extraction finished while popup was closed ────────────

chrome.storage.local.get("lastExtractionResult", (data) => {
    if (data.lastExtractionResult) {
        const result = data.lastExtractionResult;
        if (result.success) {
            const sd = result.structuredData;
            showStatus(
                `✓ Extraction done — Snapshot v${result.version} saved at ${new Date(result.timestamp).toLocaleTimeString()}`,
                "success"
            );
            snapshotPreview.textContent = [
                `Goal: ${sd.project_goal}`,
                `Stack: ${sd.tech_stack?.join(", ")}`,
                `Done: ${sd.completed_features?.length} features`,
                `Pending: ${sd.pending_tasks?.length} tasks`,
                `Issues: ${sd.known_issues?.length} known`
            ].join("\n");
            resultArea.classList.remove("hidden");
        } else {
            showStatus(`Last extraction failed: ${result.error}`, "error");
        }
        chrome.storage.local.remove("lastExtractionResult");
    }
});

loadProjects();