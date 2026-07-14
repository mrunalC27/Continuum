import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
    headers: { "Content-Type": "application/json" }
});

export default api;

// Projects
export const getProject = (id) => api.get(`/projects/${id}`);
export const getProjects = () => api.get("/projects/");
export const createProject = (data) => api.post("/projects/", data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const updateProject = (id, data) => api.patch(`/projects/${id}`, data);
// Snapshots
export const getSnapshots = (projectId) => api.get(`/snapshots/project/${projectId}`);
export const getSnapshot = (id) => api.get(`/snapshots/${id}`);
export const deleteSnapshot = (id) => api.delete(`/snapshots/${id}`);
export const extractFromText = (data) => api.post("/extract/from-text", data);

// Restore
export const getRestorePrompt = (snapshotId, targetAi = "generic") =>
    api.get(`/restore/${snapshotId}?target_ai=${targetAi}`);

export const getDiff = (projectId, v1, v2) => api.get(`/restore/diff/${projectId}?v1=${v1}&v2=${v2}`);

// GitHub
export const linkRepo = (data) => api.post("/github/link", data);
export const checkStale = (projectId) => api.get(`/github/stale/${projectId}`);
export const verifyClaims = (snapshotId) => api.post(`/github/verify/${snapshotId}`);

// Merge
export const mergeSnapshots = (data) => api.post("/merge/", data);
export const resolveConflicts = (data) => api.post("/merge/resolve", data);
export const getMergeRecords = (projectId) => api.get(`/merge/records/${projectId}`);