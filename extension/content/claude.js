// Content script for claude.ai
// Same structure as chatgpt.js but with Claude's DOM selectors

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SCRAPE_REQUEST") {
        try {
            const result = window.ContextBridge.extractClaudeMessages();

            if (result.method === "failed" || result.messages.length === 0) {
                sendResponse({
                    success: false,
                    error: "Could not find any messages. Make sure a Claude conversation is open.",
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

        return true;
    }
});