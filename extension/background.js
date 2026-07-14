const API_BASE = "http://localhost:8000";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "SCRAPE_RESULT") {
        chrome.storage.local.set({ latestScrape: message.data }, () => {
            sendResponse({ status: "stored" });
        });
        return true;
    }

    if (message.type === "START_EXTRACTION") {
        // Run in background — popup can close safely
        handleExtraction(message);
        sendResponse({ status: "started" });
        return true;
    }
});

async function handleExtraction(message) {
    try {
        const res = await fetch(`${API_BASE}/extract/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                project_id: message.projectId,
                messages: message.messages,
                compression_level: message.compressionLevel
            })
        });

        const data = await res.json();

        if (res.ok) {
            // Save result so popup can read it next time it opens
            chrome.storage.local.set({
                lastExtractionResult: {
                    success: true,
                    snapshotId: data.snapshot_id,
                    version: data.version,
                    structuredData: data.structured_data,
                    timestamp: new Date().toISOString()
                }
            });

            // Show Chrome notification
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icons/icon48.png",
                title: "ContextBridge",
                message: `Snapshot v${data.version} saved successfully`
            });

        } else {
            chrome.storage.local.set({
                lastExtractionResult: {
                    success: false,
                    error: data.detail || "Extraction failed"
                }
            });
        }

    } catch (err) {
        chrome.storage.local.set({
            lastExtractionResult: {
                success: false,
                error: err.message
            }
        });
    }
}

// Ctrl+Shift+E triggers extract on active ChatGPT tab
chrome.commands.onCommand.addListener(async (command) => {
    if (command === "trigger-extract") {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // get last selected project from storage
        chrome.storage.local.get("lastProjectId", async (data) => {
            if (!data.lastProjectId) {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "icons/icon48.png",
                    title: "ContextBridge",
                    message: "Open the extension and select a project first"
                });
                return;
            }

            chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_REQUEST" }, async (scrapeResult) => {
                if (!scrapeResult?.success) return;
                await handleExtraction({
                    projectId: data.lastProjectId,
                    messages: scrapeResult.messages,
                    compressionLevel: "standard",
                    count: scrapeResult.count
                });
            });
        });
    }
});