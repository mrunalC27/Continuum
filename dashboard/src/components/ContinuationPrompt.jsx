import { useEffect, useState } from "react";
import { getRestorePrompt } from "../api/client";

const AI_OPTIONS = [
    { key: "generic", label: "Generic" },
    { key: "chatgpt", label: "ChatGPT" },
    { key: "claude", label: "Claude" },
    { key: "gemini", label: "Gemini" }
];

export default function ContinuationPrompt({ snapshotId }) {
    const [prompt, setPrompt] = useState("");
    const [copied, setCopied] = useState(false);
    const [targetAi, setTargetAi] = useState("generic");
    const [loading, setLoading] = useState(false);

    async function loadPrompt(ai) {
        setLoading(true);
        const res = await getRestorePrompt(snapshotId, ai);
        setPrompt(res.data.continuation_prompt);
        setLoading(false);
    }

    useEffect(() => { loadPrompt(targetAi); }, [snapshotId, targetAi]);

    function copy() {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div style={{
            background: "#0c0d14",
            border: "1px solid #1a1b2e",
            borderRadius: 12, padding: "16px 20px"
        }}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 6 }}>
                    {AI_OPTIONS.map(o => (
                        <button
                            key={o.key}
                            onClick={() => setTargetAi(o.key)}
                            style={{
                                padding: "5px 14px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                border: `1px solid ${targetAi === o.key ? "#3b6ef5" : "#1e2545"}`,
                                background: targetAi === o.key ? "#111a3d" : "transparent",
                                color: targetAi === o.key ? "#4f8ef7" : "#6b7280",
                                transition: "all 0.15s"
                            }}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={copy} style={{ padding: "7px 18px" }}>
                    {copied ? "✓ Copied" : "Copy"}
                </button>
            </div>
            <p style={{ fontSize: 11, color: "#374151", marginBottom: 10 }}>
                Paste this into {targetAi === "generic" ? "any AI" : targetAi} to continue the project
            </p>
            {loading ? (
                <p style={{ fontSize: 12, color: "#374151" }}>Generating prompt...</p>
            ) : (
                <pre style={{
                    fontSize: 11, color: "#6b7280", whiteSpace: "pre-wrap",
                    maxHeight: 200, overflowY: "auto", lineHeight: 1.7,
                    background: "#080910", borderRadius: 8, padding: 12,
                    border: "1px solid #111220"
                }}>
                    {prompt}
                </pre>
            )}
        </div>
    );
}