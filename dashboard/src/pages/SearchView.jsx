import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, getSnapshots } from "../api/client";

export default function SearchView() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    async function handleSearch() {
        if (!query.trim()) return;
        setSearching(true);

        const projectsRes = await getProjects();
        const projects = projectsRes.data;

        const allResults = [];
        const q = query.toLowerCase();

        for (const project of projects) {
            const snapshotsRes = await getSnapshots(project.id);
            const snapshots = snapshotsRes.data;

            for (const snap of snapshots) {
                const sd = snap.structured_data;
                const searchable = [
                    sd.project_goal,
                    ...(sd.tech_stack || []),
                    ...(sd.completed_features || []),
                    ...(sd.pending_tasks || []),
                    ...(sd.known_issues || []),
                    project.name
                ].join(" ").toLowerCase();

                if (searchable.includes(q)) {
                    // find which field matched
                    let matchedIn = "";
                    if (sd.project_goal?.toLowerCase().includes(q)) matchedIn = sd.project_goal;
                    else if (sd.completed_features?.some(f => f.toLowerCase().includes(q)))
                        matchedIn = sd.completed_features.find(f => f.toLowerCase().includes(q));
                    else if (sd.pending_tasks?.some(t => t.toLowerCase().includes(q)))
                        matchedIn = sd.pending_tasks.find(t => t.toLowerCase().includes(q));
                    else if (sd.tech_stack?.some(t => t.toLowerCase().includes(q)))
                        matchedIn = sd.tech_stack.find(t => t.toLowerCase().includes(q));

                    allResults.push({
                        project,
                        snapshot: snap,
                        matchedIn
                    });
                }
            }
        }

        setResults(allResults);
        setSearching(false);
    }

    return (
        <div className="page">
            <div className="header">
                <div>
                    <h1>Search</h1>
                    <p>Search across all projects and snapshots</p>
                </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                <input
                    placeholder="Search goals, tech stack, features, tasks..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    autoFocus
                    style={{ fontSize: 14 }}
                />
                <button className="btn btn-primary" onClick={handleSearch}
                    style={{ whiteSpace: "nowrap", padding: "8px 20px" }}
                    disabled={searching}>
                    {searching ? "Searching..." : "Search"}
                </button>
            </div>

            {results.length > 0 && (
                <p className="section-title">{results.length} result(s) for "{query}"</p>
            )}

            {results.map((r, i) => (
                <div
                    className="card"
                    key={i}
                    onClick={() => navigate(`/snapshot/${r.snapshot.id}`)}
                    style={{ cursor: "pointer", marginBottom: 12 }}
                >
                    <div className="flex-between">
                        <div>
                            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                                {r.project.name}
                                <span className="badge badge-purple" style={{ marginLeft: 8 }}>
                                    v{r.snapshot.version}
                                </span>
                            </p>
                            <p style={{ fontSize: 12, color: "#4f8ef7" }}>
                                {r.matchedIn}
                            </p>
                        </div>
                        <p style={{ fontSize: 11, color: "#555" }}>
                            {new Date(r.snapshot.created_at + "Z").toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))}

            {results.length === 0 && query && !searching && (
                <div className="empty">No results for "{query}"</div>
            )}
        </div>
    );
}