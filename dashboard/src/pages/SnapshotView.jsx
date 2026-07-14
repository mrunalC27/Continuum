import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSnapshot } from "../api/client";
import ContinuationPrompt from "../components/ContinuationPrompt";

// Feature 13 — copy individual fields
function CopyBtn({ text }) {
    const [copied, setCopied] = useState(false);
    return (
        <span
            onClick={() => {
                navigator.clipboard.writeText(
                    Array.isArray(text) ? text.join("\n") : text
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
            style={{
                fontSize: 10, color: copied ? "#4caf82" : "#555",
                cursor: "pointer", marginLeft: 8,
                border: `1px solid ${copied ? "#4caf82" : "#333"}`,
                borderRadius: 4, padding: "2px 6px"
            }}
        >
            {copied ? "✓" : "copy"}
        </span>
    );
}

export default function SnapshotView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [snapshot, setSnapshot] = useState(null);

    useEffect(() => {
        getSnapshot(id).then(r => setSnapshot(r.data));
    }, [id]);

    if (!snapshot) return <div className="page"><p>Loading...</p></div>;

    const d = snapshot.structured_data;

    // Feature 5 — export functions
    function exportJSON() {
        const blob = new Blob([JSON.stringify(snapshot.structured_data, null, 2)],
            { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snapshot_v${snapshot.version}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportMarkdown() {
        const lines = [
            `# ${d.project_goal || "Project Snapshot"}`,
            `> Snapshot v${snapshot.version} — exported from ContextBridge`,
            "",
            "## Tech Stack",
            ...(d.tech_stack?.map(t => `- ${t}`) || []),
            "",
            "## Completed Features",
            ...(d.completed_features?.map(f => `- ✓ ${f}`) || []),
            "",
            "## Pending Tasks",
            ...(d.pending_tasks?.map(t => `- [ ] ${t}`) || []),
            "",
            "## Known Issues",
            ...(d.known_issues?.map(i => `- ⚠ ${i}`) || []),
            "",
            "## Constraints",
            ...(d.constraints?.map(c => `- ${c}`) || []),
        ];
        const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snapshot_v${snapshot.version}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="page">
            <span className="back-btn" onClick={() => navigate(-1)}>← Back</span>

            <div className="header">
                <div>
                    <h1>Snapshot v{snapshot.version}</h1>
                    <p>{new Date(snapshot.created_at + "Z").toLocaleString()}</p>
                </div>
                {/* Feature 5 — export buttons added here */}
                <div className="flex">
                    <span className="badge badge-purple">{snapshot.compression_level}</span>
                    {snapshot.is_stale && <span className="badge badge-yellow">Stale</span>}
                    <button className="btn btn-secondary"
                        style={{ fontSize: 12, padding: "6px 12px" }}
                        onClick={exportJSON}>
                        ↓ JSON
                    </button>
                    <button className="btn btn-secondary"
                        style={{ fontSize: 12, padding: "6px 12px" }}
                        onClick={exportMarkdown}>
                        ↓ MD
                    </button>
                </div>
            </div>

            {d.project_goal && (
                <>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 12, marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
                        Project Goal <CopyBtn text={d.project_goal} />
                    </p>
                    <div className="card"><p>{d.project_goal}</p></div>
                </>
            )}

            {d.tech_stack?.length > 0 && (
                <>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 12, marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
                        Tech Stack <CopyBtn text={d.tech_stack} />
                    </p>
                    <div>{d.tech_stack.map(t => <span key={t} className="tag">{t}</span>)}</div>
                </>
            )}

            <div className="grid-2" style={{ marginTop: 16 }}>
                {d.completed_features?.length > 0 && (
                    <div>
                        <p className="section-title">
                            Completed <CopyBtn text={d.completed_features} />
                        </p>
                        {d.completed_features.map(f => (
                            <div className="card" key={f}>
                                <span className="badge badge-green">✓</span>
                                <span style={{ marginLeft: 8, fontSize: 13 }}>{f}</span>
                            </div>
                        ))}
                    </div>
                )}

                {d.pending_tasks?.length > 0 && (
                    <div>
                        <p className="section-title">
                            Pending <CopyBtn text={d.pending_tasks} />
                        </p>
                        {d.pending_tasks.map(t => (
                            <div className="card" key={t}>
                                <span className="badge badge-yellow">○</span>
                                <span style={{ marginLeft: 8, fontSize: 13 }}>{t}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {d.known_issues?.length > 0 && (
                <>
                    <p className="section-title">
                        Known Issues <CopyBtn text={d.known_issues} />
                    </p>
                    {d.known_issues.map(i => (
                        <div className="card" key={i}>
                            <span className="badge badge-red">⚠</span>
                            <span style={{ marginLeft: 8, fontSize: 13 }}>{i}</span>
                        </div>
                    ))}
                </>
            )}

            {d.architecture_decisions?.length > 0 && (
                <>
                    <p className="section-title">Architecture Decisions</p>
                    {d.architecture_decisions.map((dec, i) => (
                        <div className="card" key={i}>
                            <p style={{ fontWeight: 600, fontSize: 13 }}>{dec.decision}</p>
                            {dec.reasoning && (
                                <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>{dec.reasoning}</p>
                            )}
                        </div>
                    ))}
                </>
            )}

            {d.constraints?.length > 0 && (
                <>
                    <p className="section-title">
                        Constraints <CopyBtn text={d.constraints} />
                    </p>
                    {d.constraints.map(c => (
                        <div className="card" key={c}>
                            <p style={{ fontSize: 13 }}>{c}</p>
                        </div>
                    ))}
                </>
            )}

            <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 12, marginTop: 24 }}>
                Continuation Prompt
            </p>            
            <ContinuationPrompt snapshotId={id} />
        </div>
    );
}