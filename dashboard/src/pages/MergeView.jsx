import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSnapshots, mergeSnapshots, resolveConflicts } from "../api/client";
import ConflictResolver from "../components/ConflictResolver";
import Toast from "../components/Toast";
import CustomSelect from "../components/CustomSelect";
export default function MergeView() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [snapshots, setSnapshots] = useState([]);
    const [snapA, setSnapA] = useState("");
    const [snapB, setSnapB] = useState("");
    const [mergeResult, setMergeResult] = useState(null);
    const [resolutions, setResolutions] = useState({});
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        getSnapshots(projectId).then(r => setSnapshots(r.data));
    }, [projectId]);

    // ADD THIS LINE HERE
    const snapshotOptions = snapshots.map(s => ({
        value: s.id,
        label: `v${s.version} — ${new Date(s.created_at).toLocaleDateString()}`
    }));

    async function runMerge() {
        if (!snapA || !snapB) {
            setToast({ message: "Select both snapshots first", type: "error" });
            return;
        }
        if (snapA === snapB) {
            setToast({ message: "Select two different snapshots", type: "error" });
            return;
        }
        setLoading(true);
        try {
            const res = await mergeSnapshots({
                project_id: parseInt(projectId),
                snapshot_a_id: parseInt(snapA),
                snapshot_b_id: parseInt(snapB)
            });
            setMergeResult(res.data);
        } catch (e) {
            setToast({ message: "Merge failed — check backend is running", type: "error" });
        }
        setLoading(false);
    }

    async function handleResolve() {
        const resolutionList = Object.entries(resolutions).map(([field, choice]) => ({
            field, choice
        }));
        setLoading(true);
        try {
            await resolveConflicts({
                merge_record_id: mergeResult.merge_record_id,
                resolutions: resolutionList
            });
            setDone(true);
            setToast({ message: "Merged snapshot saved successfully", type: "success" });
        } catch (e) {
            setToast({ message: "Resolve failed", type: "error" });
        }
        setLoading(false);
    }

    return (
        <div className="page">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <span className="back-btn" onClick={() => navigate(-1)}>← Back</span>
            <div className="header"><h1>Merge Snapshots</h1></div>

            <div className="grid-2">
                <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Snapshot A</p>
                    <CustomSelect
                        value={snapA}
                        onChange={setSnapA}
                        options={snapshotOptions}
                        placeholder="-- select snapshot --"
                    />
                </div>
                <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Snapshot B</p>
                    <CustomSelect
                        value={snapB}
                        onChange={setSnapB}
                        options={snapshotOptions}
                        placeholder="-- select snapshot --"
                    />
                </div>
            </div>

            <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={runMerge}
                disabled={loading}
            >
                {loading ? "Running merge..." : "Run Merge"}
            </button>

            {mergeResult && !done && (
                <>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginTop: 24, marginBottom: 12 }}>
                        {mergeResult.conflict_count === 0
                            ? "✓ No conflicts — ready to save"
                            : `${mergeResult.conflict_count} conflict(s) detected`}
                    </p>

                    {mergeResult.conflicts.map((c, i) => (
                        <ConflictResolver
                            key={i}
                            conflict={c}
                            onResolve={(choice) =>
                                setResolutions(prev => ({ ...prev, [c.field]: choice }))
                            }
                        />
                    ))}

                    <button
                        className="btn btn-primary"
                        style={{ marginTop: 16 }}
                        onClick={handleResolve}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save merged snapshot"}
                    </button>
                </>
            )}

            {done && (
                <div className="card" style={{ marginTop: 24, borderColor: "#4caf82" }}>
                    <p style={{ color: "#4caf82", fontWeight: 600 }}>✓ Merged snapshot saved</p>
                    <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                        Go back to project and click ↻ Refresh to see the merged version in the list.
                    </p>
                    <button
                        className="btn btn-secondary"
                        style={{ marginTop: 12 }}
                        onClick={() => navigate(`/project/${projectId}`)}
                    >
                        Back to project
                    </button>
                </div>
            )}
        </div>
    );
}