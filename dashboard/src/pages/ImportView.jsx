import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, extractFromText } from "../api/client";
import { useEffect } from "react";
import CustomSelect from "../components/CustomSelect";
import Toast from "../components/Toast";

export default function ImportView() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [rawText, setRawText] = useState("");
    const [compressionLevel, setCompressionLevel] = useState("standard");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        getProjects().then(r => setProjects(r.data));
    }, []);

    const projectOptions = projects.map(p => ({
        value: p.id,
        label: p.name
    }));

    const compressionOptions = [
        { value: "minimal", label: "Minimal — faster, less context" },
        { value: "standard", label: "Standard — recommended" },
        { value: "verbose", label: "Verbose — most context" }
    ];

    async function handleExtract() {
        if (!projectId) {
            setToast({ message: "Select a project first", type: "error" });
            return;
        }
        if (!rawText.trim()) {
            setToast({ message: "Paste your conversation first", type: "error" });
            return;
        }
        if (rawText.trim().length < 50) {
            setToast({ message: "Conversation is too short", type: "error" });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await extractFromText({
                project_id: parseInt(projectId),
                raw_text: rawText,
                compression_level: compressionLevel
            });
            setResult(res.data);
            setToast({ message: `Snapshot v${res.data.version} created from ${res.data.message_count} messages`, type: "success" });
        } catch (e) {
            setToast({ message: "Extraction failed — check backend is running", type: "error" });
        }

        setLoading(false);
    }

    return (
        <div className="page">
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <span className="back-btn" onClick={() => navigate("/")}>← Back</span>

            <div className="header">
                <div>
                    <h1>Import Conversation</h1>
                    <p style={{ color: "#f1f5f9", fontSize: 13, marginTop: 3 }}>
                        Paste from ChatGPT app, Gemini, or any AI platform
                    </p>                
                </div>
            </div>

            {/* instructions */}
            <div style={{
                background: "#0c0d14",
                border: "1px solid #1a1b2e",
                borderRadius: 12, padding: "18px 20px",
                marginBottom: 24,
                transition: "border-color 0.2s, box-shadow 0.2s"
            }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#c0c8e0";
                    e.currentTarget.style.boxShadow = "0 0 18px rgba(180,200,240,0.07)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#1a1b2e";
                    e.currentTarget.style.boxShadow = "none";
                }}
            >
                <p style={{ color: "#4f8ef7", fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
                    How to copy your conversation
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                        "ChatGPT app — tap and hold a message → Select All → Copy",
                        "Gemini — use Share → Copy to clipboard",
                        "Any AI — manually select all messages and copy",
                        "Paste the copied text in the box below"
                    ].map((tip, i) => (
                        <div key={i} className="flex">
                            <span className="badge badge-purple" style={{ minWidth: 22 }}>{i + 1}</span>
                            <p style={{ fontSize: 12, color: "#bbb" }}>{tip}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* project selector */}
            <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, marginTop: 20 }}>Project</p>
            <CustomSelect
                value={projectId}
                onChange={setProjectId}
                options={projectOptions}
                placeholder="-- select project --"
            />

            {/* compression */}
            <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, marginTop: 16 }}>Snapshot Depth</p>
            <CustomSelect
                value={compressionLevel}
                onChange={setCompressionLevel}
                options={compressionOptions}
                placeholder="-- select --"
            />

            {/* paste area */}
            <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, marginTop: 16 }}>
                Paste Conversation
                {rawText && <span style={{ color: "#374151", fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{rawText.length} characters</span>}
            </p>
            <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={`Paste your conversation here...

Example format:
You
How do I build a FastAPI app?

ChatGPT
FastAPI is a modern Python web framework...

You
Add authentication too

ChatGPT
For authentication, use JWT tokens...`}
                style={{
                    width: "100%",
                    height: 300,
                    background: "#111118",
                    border: "1px solid #333",
                    borderRadius: 8,
                    color: "#e0e0e0",
                    padding: 12,
                    fontSize: 12,
                    fontFamily: "monospace",
                    lineHeight: 1.6,
                    resize: "vertical",
                    outline: "none"
                }}
                onFocus={e => e.target.style.borderColor = "#7c6af7"}
                onBlur={e => e.target.style.borderColor = "#333"}
            />

            <div className="flex" style={{ marginTop: 16, gap: 10 }}>
                <button
                    className="btn btn-primary"
                    onClick={handleExtract}
                    disabled={loading}
                    style={{ padding: "10px 24px" }}
                >
                    {loading ? "Extracting via Ollama..." : "Extract Snapshot"}
                </button>
                {rawText && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => setRawText("")}
                    >
                        Clear
                    </button>
                )}
            </div>

            {loading && (
                <div className="card" style={{ marginTop: 16, borderColor: "#7c6af7" }}>
                    <p style={{ color: "#7c6af7", fontSize: 13 }}>
                        Ollama is processing your conversation — this takes 1-2 minutes...
                    </p>
                </div>
            )}

            {result && (
                <div className="card" style={{ marginTop: 24, borderColor: "#4caf82" }}>
                    <p style={{ color: "#4caf82", fontWeight: 600, marginBottom: 12 }}>
                        ✓ Snapshot v{result.version} created from {result.message_count} messages
                    </p>
                    <div style={{ fontSize: 12, color: "#bbb", lineHeight: 1.8 }}>
                        <p>Goal: {result.structured_data.project_goal}</p>
                        <p>Stack: {result.structured_data.tech_stack?.join(", ")}</p>
                        <p>Completed: {result.structured_data.completed_features?.length} features</p>
                        <p>Pending: {result.structured_data.pending_tasks?.length} tasks</p>
                    </div>
                    <div className="flex" style={{ marginTop: 12, gap: 10 }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/snapshot/${result.snapshot_id}`)}
                        >
                            View snapshot
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate(`/project/${result.project_id}`)}
                        >
                            Go to project
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}