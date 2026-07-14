export default function ConflictResolver({ conflict, onResolve }) {
    return (
        <div className="card" style={{ borderColor: "#e0a35c" }}>
            <p style={{ color: "#e0a35c", fontWeight: 600, marginBottom: 8 }}>
                Conflict in: {conflict.field}
            </p>
            <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
                {conflict.description}
            </p>
            <div className="grid-2">
                <button className="btn btn-secondary" onClick={() => onResolve("a")}>
                    Use A: {String(conflict.snapshot_a_value).slice(0, 40)}
                </button>
                <button className="btn btn-secondary" onClick={() => onResolve("b")}>
                    Use B: {String(conflict.snapshot_b_value).slice(0, 40)}
                </button>
            </div>
        </div>
    );
  }