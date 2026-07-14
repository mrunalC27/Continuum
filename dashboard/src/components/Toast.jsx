import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, []);

    const colors = {
        success: { bg: "#071a0f", border: "#14532d", text: "#22c55e" },
        error: { bg: "#1a0707", border: "#3d1515", text: "#ef4444" },
        info: { bg: "#0d1120", border: "#1e2d6e", text: "#4f8ef7" }
    };
    const c = colors[type] || colors.info;

    return (
        <div style={{
            position: "fixed", bottom: 28, right: 28,
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 10, padding: "12px 20px",
            color: c.text, fontSize: 13, fontWeight: 600,
            zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            animation: "slideIn 0.2s ease",
            maxWidth: 320
        }}>
            {message}
        </div>
    );
}