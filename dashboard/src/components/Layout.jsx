import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";

const NAV_ITEMS = [
    { label: "Home", path: "/", icon: "⌂" },
    { label: "Import Chat", path: "/import", icon: "↑" },
    { label: "Search", path: "/search", icon: "⌕" },
];

export default function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#08090d" }}>

            {/* sidebar */}
            <div style={{
                width: 220,
                background: "#0c0d14",
                borderRight: "1px solid #1a1b2e",
                display: "flex",
                flexDirection: "column",
                position: "fixed",
                top: 0, left: 0, bottom: 0,
                zIndex: 100
            }}>
                {/* logo */}
                <div style={{
                    padding: "20px 20px 16px",
                    borderBottom: "1px solid #1a1b2e",
                    display: "flex", alignItems: "center", gap: 10
                }}>
                    <Logo size={30} />
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "#e8eaf6", letterSpacing: 0.3 }}>
                            Continuum
                        </p>
                        <p style={{ fontSize: 10, color: "#4f8ef7", marginTop: 1 }}>
                            One Memory for Every AI
                        </p>
                    </div>
                </div>

                {/* nav */}
                <nav style={{ padding: "12px 10px", flex: 1 }}>
                    {NAV_ITEMS.map(item => {
                        const active = location.pathname === item.path;
                        return (
                            <div
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "9px 12px", borderRadius: 8,
                                    cursor: "pointer", marginBottom: 2,
                                    background: active ? "#131629" : "transparent",
                                    color: active ? "#4f8ef7" : "#6b7280",
                                    fontSize: 13, fontWeight: active ? 600 : 400,
                                    transition: "all 0.15s",
                                    border: active ? "1px solid #1e2545" : "1px solid transparent"
                                }}
                                onMouseEnter={e => {
                                    if (!active) e.currentTarget.style.background = "#111220";
                                }}
                                onMouseLeave={e => {
                                    if (!active) e.currentTarget.style.background = "transparent";
                                }}
                            >
                                <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </div>
                        );
                    })}
                </nav>

                {/* bottom */}
                <div style={{
                    padding: "14px 16px",
                    borderTop: "1px solid #1a1b2e",
                    fontSize: 11, color: "#374151"
                }}>
                    v0.1.0 · Local · Offline AI
                </div>
            </div>

            {/* main content */}
            <div style={{ marginLeft: 220, flex: 1, minHeight: "100vh" }}>
                {children}
            </div>
        </div>
    );
}