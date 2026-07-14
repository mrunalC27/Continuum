import { create } from "zustand";

const useProjectStore = create((set) => ({
    projects: [],
    selectedProject: null,
    snapshots: [],
    loading: false,
    error: null,

    setProjects: (projects) => set({ projects }),
    setSelectedProject: (project) => set({ selectedProject: project }),
    setSnapshots: (snapshots) => set({ snapshots }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
}));

export default useProjectStore;