window.ContextBridge = window.ContextBridge || {};

window.ContextBridge.extractMessages = function () {
    const messages = [];

    // Strategy 1 — confirmed working selectors (July 2026)
    // testid format: conversation-turn-1 (odd=user), conversation-turn-2 (even=assistant)
    const turnNodes = document.querySelectorAll("[data-testid^='conversation-turn']");

    if (turnNodes.length > 0) {
        turnNodes.forEach((node) => {
            const testid = node.getAttribute("data-testid") || "";
            const turnNumber = parseInt(testid.replace("conversation-turn-", ""));
            const role = turnNumber % 2 === 1 ? "user" : "assistant";

            // confirmed working content selector
            const contentNode = (
                node.querySelector(".whitespace-pre-wrap") ||
                node.querySelector("[class*='prose']") ||
                node.querySelector(".markdown")
            );

            const content = contentNode
                ? contentNode.innerText.trim()
                : node.innerText.trim();

            if (content.length > 10) {
                messages.push({ role, content, timestamp: new Date().toISOString() });
            }
        });

        if (messages.length > 0) return { messages, method: "primary" };
    }

    // Strategy 2 — fallback by class patterns
    const fallbackNodes = document.querySelectorAll("[class*='message'], [class*='conversation-turn']");
    if (fallbackNodes.length > 0) {
        fallbackNodes.forEach((node, index) => {
            const content = node.innerText.trim();
            if (content.length > 10) {
                messages.push({
                    role: index % 2 === 0 ? "user" : "assistant",
                    content,
                    timestamp: new Date().toISOString()
                });
            }
        });
        if (messages.length > 0) return { messages, method: "fallback" };
    }

    // Strategy 3 — last resort
    const allText = document.querySelectorAll("p, pre");
    allText.forEach((node, index) => {
        const content = node.innerText.trim();
        if (content.length > 20) {
            messages.push({
                role: index % 2 === 0 ? "user" : "assistant",
                content,
                timestamp: new Date().toISOString()
            });
        }
    });

    return {
        messages,
        method: messages.length > 0 ? "last_resort" : "failed"
    };
};

window.ContextBridge.extractClaudeMessages = function () {
    const messages = [];

    // confirmed selectors July 2026
    // user messages: class contains "font-user-message"
    // assistant messages: class contains "font-claude-response-body"

    const userNodes = document.querySelectorAll('[class*="font-user-message"]');
    const assistantNodes = document.querySelectorAll('.font-claude-response-body');

    if (userNodes.length > 0 || assistantNodes.length > 0) {
        // build ordered list by DOM position
        const allNodes = [];

        userNodes.forEach(node => {
            allNodes.push({
                role: "user",
                content: node.innerText.trim(),
                top: node.getBoundingClientRect().top + window.scrollY
            });
        });

        assistantNodes.forEach(node => {
            const content = node.innerText.trim();
            if (content.length > 5) {
                allNodes.push({
                    role: "assistant",
                    content,
                    top: node.getBoundingClientRect().top + window.scrollY
                });
            }
        });

        // sort by vertical position so order is correct
        allNodes.sort((a, b) => a.top - b.top);

        // deduplicate consecutive assistant messages (Claude splits responses into multiple divs)
        const deduped = [];
        for (const node of allNodes) {
            const last = deduped[deduped.length - 1];
            if (last && last.role === node.role && node.role === "assistant") {
                // merge into previous assistant message
                last.content += "\n" + node.content;
            } else if (node.content.length > 0) {
                deduped.push({ role: node.role, content: node.content, timestamp: new Date().toISOString() });
            }
        }

        if (deduped.length > 0) return { messages: deduped, method: "primary" };
    }

    // fallback
    const fallbackNodes = document.querySelectorAll('[class*="font-claude"], [class*="font-user"]');
    if (fallbackNodes.length > 0) {
        fallbackNodes.forEach((node, index) => {
            const content = node.innerText.trim();
            if (content.length > 10) {
                messages.push({
                    role: index % 2 === 0 ? "user" : "assistant",
                    content,
                    timestamp: new Date().toISOString()
                });
            }
        });
        if (messages.length > 0) return { messages, method: "fallback" };
    }

    return { messages, method: "failed" };
};