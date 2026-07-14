// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getProjects, createProject } from "../api/client";

// export default function Home() {
//     const [projects, setProjects] = useState([]);
//     const [filtered, setFiltered] = useState([]);
//     const [search, setSearch] = useState("");
//     const [name, setName] = useState("");
//     const [repo, setRepo] = useState("");
//     const [showForm, setShowForm] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     async function load() {
//         const res = await getProjects();
//         setProjects(res.data);
//         setFiltered(res.data);
//     }

//     useEffect(() => { load(); }, []);

//     useEffect(() => {
//         if (!search.trim()) {
//             setFiltered(projects);
//             return;
//         }
//         const q = search.toLowerCase();
//         setFiltered(projects.filter(p =>
//             p.name.toLowerCase().includes(q) ||
//             p.github_repo?.toLowerCase().includes(q) ||
//             p.tags?.toLowerCase().includes(q)
//         ));
//     }, [search, projects]);

//     async function handleCreate() {
//         if (!name.trim()) return;
//         setLoading(true);
//         await createProject({ name, github_repo: repo || null });
//         setName(""); setRepo(""); setShowForm(false);
//         await load();
//         setLoading(false);
//     }
//     {/* stats row */ }
//     {
//         projects.length > 0 && (
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
//                 <div className="stat-card">
//                     <p className="stat-number">{projects.length}</p>
//                     <p className="stat-label">Projects</p>
//                 </div>
//                 <div className="stat-card">
//                     <p className="stat-number">{projects.reduce((a, p) => a + (p.snapshot_count || 0), 0)}</p>
//                     <p className="stat-label">Snapshots</p>
//                 </div>
//                 <div className="stat-card">
//                     <p className="stat-number">{projects.filter(p => p.last_activity).length}</p>
//                     <p className="stat-label">Active</p>
//                 </div>
//             </div>
//         )
//     }
//     return (
//         <div className="page">
//             <div className="header">
//                 <div>
//                     <h1>Projects</h1>
//                     <p>Your AI project memory system</p>
//                 </div>
//                 <div className="flex">
//                     <button className="btn btn-secondary" onClick={() => navigate("/import")}>
//                         ↑ Import
//                     </button>
//                     <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
//                         + New Project
//                     </button>
//                 </div>
//             </div>

//             {showForm && (
//                 <div className="card" style={{ marginBottom: 24 }}>
//                     <p className="section-title">New Project</p>
//                     <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//                         <input
//                             placeholder="Project name"
//                             value={name}
//                             onChange={e => setName(e.target.value)}
//                             onKeyDown={e => e.key === "Enter" && handleCreate()}
//                         />
//                         <input
//                             placeholder="GitHub repo — owner/repo (optional)"
//                             value={repo}
//                             onChange={e => setRepo(e.target.value)}
//                         />
//                         <div className="flex">
//                             <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
//                                 {loading ? "Creating..." : "Create"}
//                             </button>
//                             <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
//                                 Cancel
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* search bar */}
//             <div style={{ marginBottom: 16 }}>
//                 <input
//                     placeholder="Search projects..."
//                     value={search}
//                     onChange={e => setSearch(e.target.value)}
//                     style={{ fontSize: 13 }}
//                 />
//             </div>
//             {projects.length === 0 && !showForm && (
//                 <div className="card" style={{ borderColor: "#7c6af7", marginBottom: 24 }}>
//                     <p style={{ color: "#7c6af7", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
//                         Welcome to ContextBridge
//                     </p>
//                     <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//                         {[
//                             { step: "1", text: "Open any ChatGPT conversation in Chrome" },
//                             { step: "2", text: "Click the ContextBridge extension icon" },
//                             { step: "3", text: "Create a project and click Extract" },
//                             { step: "4", text: "Come back here to view your snapshot" },
//                             { step: "5", text: "Copy the continuation prompt to switch AI platforms" }
//                         ].map(s => (
//                             <div key={s.step} className="flex">
//                                 <span className="badge badge-purple" style={{ minWidth: 24, justifyContent: "center" }}>
//                                     {s.step}
//                                 </span>
//                                 <p style={{ fontSize: 13, color: "#bbb" }}>{s.text}</p>
//                             </div>
//                         ))}
//                     </div>
//                     <button
//                         className="btn btn-primary"
//                         style={{ marginTop: 16 }}
//                         onClick={() => setShowForm(true)}
//                     >
//                         Create your first project →
//                     </button>
//                 </div>
//             )}
        

//             <p className="section-title">
//                 Your Projects ({filtered.length}{search ? ` of ${projects.length}` : ""})
//             </p>

//             {filtered.length === 0 && !search && (
//                 <div className="empty">No projects yet — create one above</div>
//             )}

//             {filtered.length === 0 && search && (
//                 <div className="empty">No projects match "{search}"</div>
//             )}

//             {filtered.map(p => (
//                 <div
//                     className="card"
//                     key={p.id}
//                     onClick={() => navigate(`/project/${p.id}`)}
//                     style={{ cursor: "pointer" }}
//                 >
//                     <div className="flex-between">
//                         <div>
//                             <p style={{ fontWeight: 600, marginBottom: 6 }}>{p.name}</p>
//                             {p.github_repo && (
//                                 <span className="tag">⑂ {p.github_repo}</span>
//                             )}
//                             {p.tags && p.tags.split(",").map(t => (
//                                 <span key={t} className="tag" style={{ color: "#7c6af7", borderColor: "#7c6af7" }}>
//                                     {t.trim()}
//                                 </span>
//                             ))}
//                         </div>
//                         <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
//                             <span className="badge badge-purple">→</span>
//                             <span style={{ fontSize: 11, color: "#7c6af7" }}>
//                                 {p.snapshot_count} snapshot{p.snapshot_count !== 1 ? "s" : ""}
//                             </span>
//                         </div>
//                     </div>
//                     <p style={{ fontSize: 11, color: "#555", marginTop: 10 }}>
//                         {p.last_activity
//                             ? `Last active ${new Date(p.last_activity + "Z").toLocaleDateString()}`
//                             : `Created ${new Date(p.created_at + "Z").toLocaleDateString()}`
//                         }
//                     </p>
//                 </div>
//             ))}
//         </div>
//     );
// }



import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, createProject } from "../api/client";
import Logo from "../components/Logo";

export default function Home() {
    const [projects, setProjects] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [name, setName] = useState("");
    const [repo, setRepo] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const navigate = useNavigate();

    async function load() {
        const res = await getProjects();
        setProjects(res.data);
        setFiltered(res.data);
        setLoaded(true);
    }

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (!search.trim()) { setFiltered(projects); return; }
        const q = search.toLowerCase();
        setFiltered(projects.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.tags?.toLowerCase().includes(q)
        ));
    }, [search, projects]);

    async function handleCreate() {
        if (!name.trim()) return;
        setLoading(true);
        await createProject({ name, github_repo: repo || null });
        setName(""); setRepo(""); setShowForm(false);
        await load();
        setLoading(false);
    }

    // ── Onboarding screen (zero projects) ─────────────────────────────
    if (loaded && projects.length === 0 && !showForm) {
        return (
            <div style={{
                height: "100vh",
                background: "radial-gradient(ellipse at 50% 0%, #0d1535 0%, #08090d 60%)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "24px 60px 16px", textAlign: "center", position: "relative",
                overflow: "hidden",
                width: "100%",
                boxSizing: "border-box"
            }}>
                {/* background stars */}
                {[...Array(60)].map((_, i) => (
                    <div key={i} style={{
                        position: "absolute",
                        width: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
                        height: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
                        background: i % 4 === 0 ? "#ffffff" : i % 3 === 0 ? "#a8c8ff" : "#4f8ef7",
                        borderRadius: "50%",
                        opacity: 0.15,
                        top: `${(i * 37 + 11) % 100}%`,
                        left: `${(i * 53 + 7) % 100}%`,
                        animation: `${i % 2 === 0 ? "twinkle" : "drift"} ${3 + (i % 4)}s ease-in-out infinite`,
                        animationDelay: `${(i * 0.3) % 3}s`
                    }} />
                ))}

                {/* glow rings behind logo */}
                <div style={{
                    position: "relative", marginBottom: 12
                }}>
                    <div style={{
                        position: "absolute", inset: -40,
                        background: "radial-gradient(circle, rgba(59,110,245,0.12) 0%, transparent 70%)",
                        borderRadius: "50%"
                    }} />
                    <Logo size={80} />
                </div>

                {/* heading */}
                <h1 style={{
                    fontSize: 32, fontWeight: 800, letterSpacing: -1,
                    marginBottom: 12, lineHeight: 1.2, color: "#f1f5f9"
                }}>
                    No more {" "}
                    <span style={{
                        background: "linear-gradient(135deg, #4f8ef7, #a8c8ff)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                    }}>
                        starting over.
                    </span>
                </h1>
                <p style={{
                    color: "#6b7280", fontSize: 16, maxWidth: 480,
                    lineHeight: 1.7, marginBottom: 20
                }}>
                    Your AI workspace memory. Capture, organize and continue your
                    conversations across every AI model, without losing context.
                </p>

                {/* CTA */}
                <button
                    className="btn btn-primary"
                    style={{ padding: "12px 32px", fontSize: 15, borderRadius: 10, marginBottom: 12 }}
                    onClick={() => setShowForm(true)}
                >
                    + Create Your First Project
                </button>
                <p
                    style={{ color: "#3b6ef5", fontSize: 13, cursor: "pointer", marginBottom: 28 }}
                    onClick={() => navigate("/import")}
                >
                    ⊙ Or import an existing conversation
                </p>

                {/* 4 steps with arrows */}
                <p style={{ color: "#4b5563", fontSize: 11, marginBottom: 14, letterSpacing: 1 }}>
                    GET STARTED IN 4 SIMPLE STEPS
                </p>
                <div style={{
                    display: "flex", alignItems: "center",
                    width: "100%", marginBottom: 16, gap: 0
                }}>
                    {[
                        {
                            num: 1,
                            title: "Open your AI chat",
                            desc: "Start a conversation in ChatGPT, Claude, Gemini or any supported AI.",
                            icon: (
                                <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                                    <path d="M18 4C10.268 4 4 10.268 4 18c0 2.4.6 4.66 1.64 6.64L4 32l7.36-1.64A13.94 13.94 0 0018 32c7.732 0 14-6.268 14-14S25.732 4 18 4z"
                                        stroke="#4f8ef7" strokeWidth="1.5" fill="none" />
                                    <circle cx="12" cy="18" r="1.5" fill="#4f8ef7" />
                                    <circle cx="18" cy="18" r="1.5" fill="#4f8ef7" />
                                    <circle cx="24" cy="18" r="1.5" fill="#4f8ef7" />
                                </svg>
                            )
                        },
                        {
                            num: 2,
                            title: "Click the extension",
                            desc: "Use the Continuum extension to capture the entire conversation.",
                            icon: (
                                <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                                    <path d="M18 4v20M10 16l8 8 8-8" stroke="#4f8ef7" strokeWidth="1.8"
                                        strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 28h24" stroke="#4f8ef7" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            )
                        },
                        {
                            num: 3,
                            title: "Save to a project",
                            desc: "Organize your snapshot in a project to keep everything structured.",
                            icon: (
                                <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                                    <path d="M4 10a2 2 0 012-2h8l3 4h13a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V10z"
                                        stroke="#f59e0b" strokeWidth="1.5" fill="rgba(245,158,11,0.08)" />
                                </svg>
                            )
                        },
                        {
                            num: 4,
                            title: "Continue anywhere",
                            desc: "Get AI-optimized continuation prompts and resume in any AI.",
                            icon: (
                                <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                                    <path d="M18 6l1.5 4.5h4.5l-3.75 2.75 1.5 4.5L18 15.5l-3.75 2.25 1.5-4.5L12 11l4.5-.5L18 6z"
                                        stroke="#4f8ef7" strokeWidth="1.2" fill="rgba(79,142,247,0.15)" />
                                    <path d="M27 18l1 3h3l-2.5 1.8 1 3L27 24.2l-2.5 1.6 1-3L23 21h3l1-3z"
                                        stroke="#a8c8ff" strokeWidth="1" fill="rgba(168,200,255,0.1)" />
                                    <path d="M11 20l.8 2.4h2.4l-2 1.4.8 2.4-2-1.4-2 1.4.8-2.4-2-1.4h2.4L11 20z"
                                        stroke="#6ba3f5" strokeWidth="1" fill="rgba(107,163,245,0.1)" />
                                </svg>
                            )
                        },
                    ].map((step, i, arr) => (
                        <>
                            <div key={i} style={{
                                flex: 1,
                                background: "#0c0d14",
                                border: "1px solid #1a1b2e",
                                borderRadius: 12, padding: "20px 16px",
                                position: "relative", textAlign: "center",
                                transition: "border-color 0.2s, box-shadow 0.2s"
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "#c0c8e0";
                                    e.currentTarget.style.boxShadow = "0 0 18px rgba(180,200,240,0.08)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "#1a1b2e";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <div style={{
                                    position: "absolute", top: 10, left: 10,
                                    background: "#111a3d", color: "#4f8ef7",
                                    fontSize: 10, fontWeight: 700,
                                    padding: "2px 7px", borderRadius: 12,
                                    border: "1px solid #1e2d6e"
                                }}>
                                    {step.num}
                                </div>
                                <div style={{ marginBottom: 12, marginTop: 8, display: "flex", justifyContent: "center" }}>
                                    {step.icon}
                                </div>
                                <p style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", marginBottom: 6 }}>
                                    {step.title}
                                </p>
                                <p style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.6 }}>{step.desc}</p>
                            </div>

                            {/* arrow between cards */}
                            {i < arr.length - 1 && (
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: 36, flexShrink: 0
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: "50%",
                                        border: "1px solid #1e2d6e",
                                        background: "#0d1120",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6h8M7 3l3 3-3 3" stroke="#4f8ef7" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </>
                    ))}
                </div>
                {/* feature strip */}
                <div style={{
                    background: "#0c0d14",
                    border: "1px solid #1a1b2e",
                    borderRadius: 12, padding: "20px 32px",
                    width: "100%"
                }}>
                    <p style={{ color: "#4b5563", fontSize: 11, marginBottom: 18, letterSpacing: 1 }}>
                        EVERYTHING YOU NEED TO WORK BETTER WITH AI
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
                        {[
                            {
                                label: "Cross-AI Memory",
                                sub: "ChatGPT, Claude & more",
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#4f8ef7" strokeWidth="1.5" strokeLinejoin="round" />
                                        <path d="M2 17l10 5 10-5" stroke="#4f8ef7" strokeWidth="1.5" strokeLinejoin="round" />
                                        <path d="M2 12l10 5 10-5" stroke="#4f8ef7" strokeWidth="1.5" strokeLinejoin="round" />
                                    </svg>
                                )
                            },
                            {
                                label: "Version History",
                                sub: "Track every change like Git",
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="9" stroke="#4f8ef7" strokeWidth="1.5" />
                                        <path d="M12 7v5l3 3" stroke="#4f8ef7" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                )
                            },
                            {
                                label: "Smart Search",
                                sub: "Find anything, instantly",
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <circle cx="11" cy="11" r="7" stroke="#4f8ef7" strokeWidth="1.5" />
                                        <path d="M16.5 16.5l3.5 3.5" stroke="#4f8ef7" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                )
                            },
                            {
                                label: "Beautiful Diffs",
                                sub: "See changes in a glance",
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3" stroke="#4f8ef7" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3" stroke="#4f8ef7" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M12 8v8M9 11l3-3 3 3" stroke="#4f8ef7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )
                            },
                            {
                                label: "Export Anywhere",
                                sub: "Markdown, JSON & more",
                                icon: (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 4v12M8 12l4 4 4-4" stroke="#4f8ef7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M4 18h16" stroke="#4f8ef7" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                )
                            },
                        ].map((f, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <div style={{
                                    background: "#111a3d", borderRadius: 8, padding: 8,
                                    border: "1px solid #1e2d6e", flexShrink: 0
                                }}>
                                    {f.icon}
                                </div>
                                <div>
                                    <p style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600, marginBottom: 3 }}>
                                        {f.label}
                                    </p>
                                    <p style={{ fontSize: 11, color: "#4b5563" }}>{f.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>);
    }

    // ── New project form (shown over onboarding) ───────────────────────
    if (showForm) {
        return (
            <div className="page">
                <span className="back-btn" onClick={() => setShowForm(false)}>← Back</span>
                <div className="header">
                    <div>
                        <h1>New Project</h1>
                        <p>Create a project to start saving snapshots</p>
                    </div>
                </div>
                <div className="card" style={{ maxWidth: 500 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <input
                            placeholder="Project name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreate()}
                            autoFocus
                        />
                        <input
                            placeholder="GitHub repo — owner/repo (optional)"
                            value={repo}
                            onChange={e => setRepo(e.target.value)}
                        />
                        <div className="flex" style={{ marginTop: 4 }}>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                                {loading ? "Creating..." : "Create Project"}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Projects list ──────────────────────────────────────────────────
    return (
        <div className="page">
            <div className="header">
                <div>
                    <h1>Projects</h1>
                    <p>Your AI project memory system</p>
                </div>
                <div className="flex">
                    <button className="btn btn-secondary" onClick={() => navigate("/import")}>
                        ↑ Import
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        + New Project
                    </button>
                </div>
            </div>

            {/* stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
                <div className="stat-card">
                    <p className="stat-number">{projects.length}</p>
                    <p className="stat-label">Projects</p>
                </div>
                <div className="stat-card">
                    <p className="stat-number">{projects.reduce((a, p) => a + (p.snapshot_count || 0), 0)}</p>
                    <p className="stat-label">Snapshots</p>
                </div>
                <div className="stat-card">
                    <p className="stat-number">{projects.filter(p => p.last_activity).length}</p>
                    <p className="stat-label">Active</p>
                </div>
            </div>

            {/* search */}
            <div style={{ marginBottom: 20 }}>
                <input
                    placeholder="Search projects..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 12, marginTop: 24 }}>
                Your Projects ({filtered.length}{search ? ` of ${projects.length}` : ""})
            </p>

            {filtered.length === 0 && search && (
                <div className="empty">No projects match "{search}"</div>
            )}

            {filtered.map(p => (
                <div
                    key={p.id}
                    onClick={() => navigate(`/project/${p.id}`)}
                    style={{
                        background: "#0c0d14",
                        border: "1px solid #1a1b2e",
                        borderRadius: 12, padding: "18px 20px",
                        marginBottom: 12, cursor: "pointer",
                        transition: "border-color 0.2s, box-shadow 0.2s"
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "#c0c8e0";
                        e.currentTarget.style.boxShadow = "0 0 20px rgba(180,200,240,0.07)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "#1a1b2e";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                    <div className="flex-between">
                        <div>
                            <p style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: 6 }}>
                                {p.name}
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {p.tags && p.tags.split(",").map(t => (
                                    <span key={t} className="tag" style={{ color: "#4f8ef7", borderColor: "#1e2d6e" }}>
                                        {t.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 13, color: "#4f8ef7", fontWeight: 600 }}>
                                {p.snapshot_count} snapshot{p.snapshot_count !== 1 ? "s" : ""}
                            </p>
                            <p style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>
                                {p.last_activity
                                    ? `Active ${new Date(p.last_activity + "Z").toLocaleDateString()}`
                                    : `Created ${new Date(p.created_at + "Z").toLocaleDateString()}`}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}