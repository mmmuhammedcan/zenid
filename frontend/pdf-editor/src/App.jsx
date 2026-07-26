import { BrowserRouter, Route, Routes } from "react-router-dom";
import TopNav from "./TopNav";
import Dashboard from "./Dashboard";
import PdfEditor from "./PdfEditor";
import ResumeApp from "./resume/ResumeApp";
import PortfolioApp from "./portfolio/PortfolioApp";
import { WorkspaceProvider } from "./storage/WorkspaceContext";

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
  return (
    <BrowserRouter basename={basename}>
      <WorkspaceProvider>
      <div className="min-h-screen text-stone-100" style={{
        backgroundColor: '#0c0a09',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(180, 83, 9, 0.15), rgb(12, 10, 9))'
      }}>
        <TopNav />
        <div className="pt-16">
          <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor" element={<PdfEditor />} />
          <Route path="/resume" element={<ResumeApp />} />
          <Route path="/portfolio" element={<PortfolioApp />} />
        </Routes>
        </div>
      </div>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
