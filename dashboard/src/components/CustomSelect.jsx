import { useState, useRef, useEffect } from "react";

export default function CustomSelect({ value, onChange, options, placeholder = "-- select --" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const selected = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
            {/* trigger */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    background: "#111118",
                    border: `1px solid ${open ? "#7c6af7" : "#333"}`,
                    borderRadius: 8,
                    padding: "8px 36px 8px 12px",
                    fontSize: 13,
                    color: selected ? "#e0e0e0" : "#555",
                    cursor: "pointer",
                    position: "relative",
                    transition: "border-color 0.15s"
                }}
            >
                {selected ? selected.label : placeholder}
                <span style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: `translateY(-50%) rotate(${open ? "180deg" : "0deg"})`,
                    transition: "transform 0.2s",
                    color: "#888", fontSize: 10
                }}>▼</span>
            </div>

            {/* dropdown list */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "#111118",
                    border: "1px solid #7c6af7",
                    borderRadius: 8,
                    zIndex: 100,
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                }}>
                    {options.map(o => (
                        <div
                            key={o.value}
                            onClick={() => { onChange(String(o.value)); setOpen(false); }}
                            style={{
                                padding: "10px 14px",
                                fontSize: 13,
                                color: String(o.value) === String(value) ? "#7c6af7" : "#e0e0e0",
                                background: String(o.value) === String(value) ? "#1a1a2e" : "transparent",
                                cursor: "pointer",
                                transition: "background 0.1s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#1e1e2e"}
                            onMouseLeave={e => e.currentTarget.style.background =
                                String(o.value) === String(value) ? "#1a1a2e" : "transparent"}
                        >
                            {o.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}