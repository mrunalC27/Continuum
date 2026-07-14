export default function SnapshotCard({ snapshot, onClick }) {
    const d = snapshot.structured_data;
    return (
        <div className="card" onClick={onClick} style={{ cursor: "pointer", overflow: "visible" }}>
            <div className="flex-between">
                <div className="flex">
                    <span className="badge badge-purple">v{snapshot.version}</span>
                    {snapshot.is_stale && <span className="badge badge-yellow">Stale</span>}
                </div>
                <p style={{ fontSize: 11, color: "#555" }}>
                    {new Date(snapshot.created_at).toLocaleString()}
                </p>
            </div>
            <p style={{ marginTop: 10, fontSize: 13, color: "#bbb" }}>
                {d.project_goal || "No goal captured"}
            </p>
            <div style={{ marginTop: 10 }}>
                {d.tech_stack?.slice(0, 4).map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <div className="flex" style={{ marginTop: 10, fontSize: 11, color: "#555" }}>
                <span>✓ {d.completed_features?.length || 0} done</span>
                <span>○ {d.pending_tasks?.length || 0} pending</span>
                <span>⚠ {d.known_issues?.length || 0} issues</span>
            </div>
        </div>
    );
  }