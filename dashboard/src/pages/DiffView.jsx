import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSnapshots, getDiff } from "../api/client";
import CustomSelect from "../components/CustomSelect";

export default function DiffView() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [snapshots, setSnapshots] = useState([]);
    const [v1, setV1] = useState("");
    const [v2, setV2] = useState("");
    const [diff, setDiff] = useState(null);

    useEffect(() => {
        getSnapshots(projectId).then(r => setSnapshots(r.data));
    }, [projectId]);

    const versionOptions = snapshots.map(s => ({
        value: s.version,
        label: `v${s.version} (${new Date(s.created_at + "Z").toLocaleDateString()})`
    }));

    async function runDiff() {
        if (!v1 || !v2) return;
        const res = await getDiff(projectId, v1, v2);
        setDiff(res.data);
    }

    return (
        <div className="page">
            <span className="back-btn" onClick={() => navigate(-1)}>← Back</span>
            <div className="header"><h1>Compare Versions</h1></div>

            <div className="grid-2">
                <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Version A</p>
                    <CustomSelect value={v1} onChange={setV1}
                        options={versionOptions} placeholder="-- select --" />
                </div>
                <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Version B</p>
                    <CustomSelect value={v2} onChange={setV2}
                        options={versionOptions} placeholder="-- select --" />
                </div>
            </div>

            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={runDiff}>
                Compare
            </button>

            {diff && (
                <>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginTop: 24, marginBottom: 12 }}>
                        {diff.has_changes
                            ? `${Object.keys(diff.changes).length} field(s) changed`
                            : "No changes between these versions"}
                    </p>

                    {!diff.has_changes && (
                        <div className="card">
                            <p style={{ color: "#555", fontSize: 13 }}>
                                Both snapshots contain identical structured data.
                            </p>
                        </div>
                    )}

                    {Object.entries(diff.changes).map(([field, change]) => (
                        <div key={field} style={{
                            background: "#0c0d14",
                            border: "1px solid #1a1b2e",
                            borderRadius: 12, padding: 0,
                            overflow: "hidden", marginBottom: 12,
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
                            <div style={{
                                background: "#0d1120", padding: "10px 16px",
                                borderBottom: "1px solid #1a1b2e"
                            }}>
                                <p style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 13 }}>
                                    {field.replace(/_/g, " ")}
                                </p>
                            </div>

                            <div style={{ padding: 16 }}>
                                {change.added?.length > 0 && change.added.map((item, i) => (
                                    <div key={i} style={{
                                        background: "#0d2b1a",
                                        border: "1px solid #1a4a2e",
                                        borderRadius: 6, padding: "6px 12px",
                                        marginBottom: 6, fontSize: 12, color: "#4caf82",
                                        display: "flex", gap: 8, alignItems: "center"
                                    }}>
                                        <span style={{ fontWeight: 700, fontSize: 14 }}>+</span>
                                        {item}
                                    </div>
                                ))}

                                {change.removed?.length > 0 && change.removed.map((item, i) => (
                                    <div key={i} style={{
                                        background: "#2b0d0d",
                                        border: "1px solid #4a1a1a",
                                        borderRadius: 6, padding: "6px 12px",
                                        marginBottom: 6, fontSize: 12, color: "#e05c5c",
                                        display: "flex", gap: 8, alignItems: "center"
                                    }}>
                                        <span style={{ fontWeight: 700, fontSize: 14 }}>−</span>
                                        {item}
                                    </div>
                                ))}

                                {change.before && (
                                    <div style={{
                                        background: "#2b0d0d", border: "1px solid #4a1a1a",
                                        borderRadius: 6, padding: "6px 12px",
                                        marginBottom: 6, fontSize: 12, color: "#e05c5c"
                                    }}>
                                        <span style={{ fontWeight: 700 }}>Before: </span>
                                        {change.before}
                                    </div>
                                )}
                                {change.after && (
                                    <div style={{
                                        background: "#0d2b1a", border: "1px solid #1a4a2e",
                                        borderRadius: 6, padding: "6px 12px",
                                        fontSize: 12, color: "#4caf82"
                                    }}>
                                        <span style={{ fontWeight: 700 }}>After: </span>
                                        {change.after}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}