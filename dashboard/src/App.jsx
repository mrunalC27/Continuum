import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";
import SnapshotView from "./pages/SnapshotView";
import DiffView from "./pages/DiffView";
import MergeView from "./pages/MergeView";
import ImportView from "./pages/ImportView";
import SearchView from "./pages/SearchView";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/snapshot/:id" element={<SnapshotView />} />
          <Route path="/diff/:projectId" element={<DiffView />} />
          <Route path="/merge/:projectId" element={<MergeView />} />
          <Route path="/import" element={<ImportView />} />
          <Route path="/search" element={<SearchView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}