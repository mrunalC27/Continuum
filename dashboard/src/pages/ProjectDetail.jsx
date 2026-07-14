import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StaleWarning from "../components/StaleWarning";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import { getSnapshots, getMergeRecords, deleteSnapshot, getProject, deleteProject, updateProject } from "../api/client";
export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [snapshots, setSnapshots] = useState([]);
    const [mergeRecords, setMergeRecords] = useState([]);
    const [modal, setModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [editingTags, setEditingTags] = useState(false);
    const [tagsInput, setTagsInput] = useState("");

    function showToast(message, type = "success") {
        setToast({ message, type });
    }

    function showConfirm(message, onConfirm) {
        setModal({ message, onConfirm });
    }

    async function load() {
        const p = await getProject(id);
        setProject(p.data);
        const m = await getMergeRecords(id);
        setMergeRecords(m.data);
        const s = await getSnapshots(id);
        setSnapshots(s.data);
    }

    useEffect(() => { load(); }, [id]);

    async function handleDeleteProject() {
        showConfirm(
            `Delete project "${project?.name}" and all its snapshots? This cannot be undone.`,
            async () => {
                setModal(null);
                await deleteProject(id);
                navigate("/");
            }
        );
    }

    async function handleDeleteSnapshot(snapshotId, versionLabel) {
        showConfirm(
            `Delete snapshot ${versionLabel}? This cannot be undone.`,
            async () => {
                setModal(null);
                await deleteSnapshot(snapshotId);
                showToast(`Snapshot ${versionLabel} deleted`);
                load();
            }
        );
    }

    return (
        <div className="page">

            {modal && (
                <ConfirmModal
                    message={modal.message}
                    onConfirm={modal.onConfirm}
                    onCancel={() => setModal(null)}
                />
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <span className="back-btn" onClick={() => navigate("/")}>← Back</span>

            <div className="header">
                <div>
                    <h1>{project?.name || `Project #${id}`}</h1>
                    <p>{snapshots.length} snapshot(s) saved</p>
                </div>
                <div className="flex">
                    <button className="btn btn-secondary" onClick={load}>
                        ↻ Refresh
                    </button>
                    <button className="btn btn-secondary"
                        onClick={() => navigate(`/diff/${id}`)}>
                        Compare versions
                    </button>
                    <button className="btn btn-primary"
                        onClick={() => navigate(`/merge/${id}`)}>
                        Merge snapshots
                    </button>
                    <button
                        className="btn btn-danger"
                        style={{ padding: "8px 14px", fontSize: 12 }}
                        onClick={handleDeleteProject}
                    >
                        Delete project
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                {!editingTags ? (
                    <div className="flex" style={{ flexWrap: "wrap", gap: 6 }}>
                        {project?.tags
                            ? project.tags.split(",").map(t => (
                                <span key={t} className="tag" style={{ color: "#7c6af7", borderColor: "#7c6af7" }}>
                                    {t.trim()}
                                </span>
                            ))
                            : <span style={{ fontSize: 11, color: "#444" }}>No tags</span>
                        }
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: "3px 10px", marginLeft: 4 }}
                            onClick={() => { setTagsInput(project?.tags || ""); setEditingTags(true); }}
                        >
                            ✎ Edit tags
                        </button>
                    </div>
                ) : (
                    <div className="flex">
                        <input
                            value={tagsInput}
                            onChange={e => setTagsInput(e.target.value)}
                            placeholder="work, hackathon, research"
                            style={{ fontSize: 12 }}
                            autoFocus
                        />
                        <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}
                            onClick={async () => {
                                await updateProject(id, { tags: tagsInput });
                                setEditingTags(false);
                                load();
                            }}>
                            Save
                        </button>
                        <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}
                            onClick={() => setEditingTags(false)}>
                            Cancel
                        </button>
                    </div>
                )}
            </div>
            
            {snapshots.some(s => s.is_stale) && <StaleWarning />}

            <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", textTransform: "none", letterSpacing: 0, marginBottom: 12, marginTop: 24 }}>Snapshots</p>
            {snapshots.length === 0 && (
                <div className="empty">
                    No snapshots yet — extract a conversation from the extension
                </div>
            )}
            {snapshots.map(s => (
                <div key={s.id} style={{ position: "relative", marginBottom: 16 }}>
                    <div
                        className="card"
                        onClick={() => navigate(`/snapshot/${s.id}`)}
                        style={{ cursor: "pointer", paddingRight: 90 }}
                    >
                        <div className="flex-between">
                            <div className="flex">
                                <span className="badge badge-purple">v{s.version}</span>
                                {s.is_stale && <span className="badge badge-yellow">Stale</span>}
                            </div>
                            {/* <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                <div style={{ width: 60 }}></div>
                                <p style={{ fontSize: 11, color: "#555" }}>
                                    {new Date(s.created_at + "Z").toLocaleDateString()}
                                </p>
                            </div> */}
                        </div>
                        <p style={{ marginTop: 10, fontSize: 13, color: "#bbb" }}>
                            {s.structured_data.project_goal || "No goal captured"}
                        </p>
                        <div style={{ marginTop: 10 }}>
                            {s.structured_data.tech_stack?.slice(0, 4).map(t => (
                                <span key={t} className="tag">{t}</span>
                            ))}
                        </div>
                        <div className="flex" style={{ marginTop: 10, fontSize: 11, color: "#555" }}>
                            <span>✓ {s.structured_data.completed_features?.length || 0} done</span>
                            <span>○ {s.structured_data.pending_tasks?.length || 0} pending</span>
                            <span>⚠ {s.structured_data.known_issues?.length || 0} issues</span>
                        </div>
                    </div>
                    {/* <button
                        className="btn btn-danger"
                        style={{
                            position: "absolute", top: 12, right: 12,
                            padding: "4px 10px", fontSize: 11, zIndex: 2
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSnapshot(s.id, `v${s.version}`);
                        }}
                    >
                        Delete
                    </button> */}
                    <div
                        style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                            zIndex: 2
                        }}
                    >
                        <button
                            className="btn btn-danger"
                            style={{
                                padding: "4px 10px",
                                fontSize: 11
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSnapshot(s.id, `v${s.version}`);
                            }}
                        >
                            Delete
                        </button>

                        <p style={{ fontSize: 11, color: "#555", margin: 0 }}>
                            {new Date(s.created_at + "Z").toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))}

            {mergeRecords.length > 0 && (
                <>
                    <p className="section-title">Merge History</p>
                    {mergeRecords.map(r => {
                        const snapA = snapshots.find(s => s.id === r.snapshot_a_id);
                        const snapB = snapshots.find(s => s.id === r.snapshot_b_id);
                        const snapMerged = snapshots.find(s => s.id === r.merged_snapshot_id);

                        const labelA = snapA ? `v${snapA.version}` : `snapshot #${r.snapshot_a_id} (deleted)`;
                        const labelB = snapB ? `v${snapB.version}` : `snapshot #${r.snapshot_b_id} (deleted)`;
                        const labelMerged = snapMerged ? `v${snapMerged.version}` : r.merged_snapshot_id ? `snapshot #${r.merged_snapshot_id} (deleted)` : "pending";

                        return (
                            <div
                                className="card"
                                key={r.id}
                                onClick={() => r.merged_snapshot_id && navigate(`/snapshot/${r.merged_snapshot_id}`)}
                                style={{ cursor: r.merged_snapshot_id ? "pointer" : "default" }}
                            >
                                <div className="flex-between">
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600 }}>
                                            {labelA} + {labelB} → {r.merged_snapshot_id ? labelMerged : "pending"}
                                        </p>
                                        {r.merged_snapshot_id && (
                                            <p style={{ fontSize: 11, color: "#7c6af7", marginTop: 3 }}>
                                                Merged result is {labelMerged} · click to view
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                        <span className={`badge ${r.resolved ? "badge-green" : "badge-yellow"}`}>
                                            {r.resolved ? "Resolved" : "Pending"}
                                        </span>
                                        <span style={{ fontSize: 11, color: "#555" }}>
                                            {r.conflict_count} conflict(s)
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-between" style={{ marginTop: 8 }}>
                                    <p style={{ fontSize: 11, color: "#555" }}>
                                        {new Date(r.created_at + "Z").toLocaleDateString()}
                                    </p>
                                    {r.merged_snapshot_id && (
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: "3px 10px", fontSize: 11 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSnapshot(r.merged_snapshot_id, labelMerged);
                                            }}
                                        >
                                            Delete merged
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}
