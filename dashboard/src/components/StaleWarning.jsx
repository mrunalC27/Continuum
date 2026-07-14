export default function StaleWarning() {
    return (
        <div className="card" style={{ borderColor: "#e0a35c", marginBottom: 16 }}>
            <p style={{ color: "#e0a35c", fontSize: 13 }}>
                ⚠ One or more snapshots are stale — new commits have been pushed since last extraction.
                Re-extract from the extension to update.
            </p>
        </div>
    );
  }