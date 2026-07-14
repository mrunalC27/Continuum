export default function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)"
        }}>
            <div style={{
                background: "#0c0d14",
                border: "1px solid #1e2545",
                borderRadius: 14,
                padding: "28px 32px",
                width: 400,
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
            }}>
                <p style={{ fontSize: 14, color: "#e2e8f0", marginBottom: 24, lineHeight: 1.6 }}>
                    {message}
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-danger" onClick={onConfirm}
                        style={{ padding: "8px 20px" }}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}