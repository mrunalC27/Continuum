// Content script — runs on chatgpt.com
// Listens for scrape request from popup, runs extractor, sends result back

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SCRAPE_REQUEST") {
        try {
            const result = window.ContextBridge.extractMessages();

            if (result.method === "failed" || result.messages.length === 0) {
                sendResponse({
                    success: false,
                    error: "Could not find any messages on this page. Make sure a ChatGPT conversation is open.",
                    messages: []
                });
                return;
            }

            sendResponse({
                success: true,
                messages: result.messages,
                method: result.method,
                count: result.messages.length
            });

        } catch (err) {
            sendResponse({
                success: false,
                error: err.message,
                messages: []
            });
        }

        return true; // keep channel open
    }
});