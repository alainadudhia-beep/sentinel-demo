import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectProvider } from "@/context/ProjectContext";
import TopNav from "@/components/TopNav";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "./pages/Home";
import ScopingCall from "./pages/ScopingCall";
import ScopingReview from "./pages/ScopingReview";
import Scope from "./pages/Scope";
import ScopeReview from "./pages/ScopeReview";
import Letter from "./pages/Letter";
import EngagementLetter from "./pages/EngagementLetter";
import Plan from "./pages/Plan";
import Team from "./pages/Team";
import LiveScope from "./pages/LiveScope";
import ProjectProgress from "./pages/ProjectProgress";
import Project from "./pages/Project";
import Milestones from "./pages/Milestones";
import TeamsAlerts from "./pages/TeamsAlerts";
import TeamStatus from "./pages/TeamStatus";
import Intro from "./pages/Intro";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ProjectProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <TopNav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/scoping-call" element={<ScopingCall />} />
          <Route path="/scoping-review" element={<ScopingReview />} />
          <Route path="/scope" element={<Scope />} />
          <Route path="/scope-review" element={<ScopeReview />} />
          <Route path="/letter" element={<Letter />} />
          <Route path="/engagement-letter" element={<EngagementLetter />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/team" element={<Team />} />
          <Route path="/live-scope" element={<LiveScope />} />
          <Route path="/project-progress" element={<ProjectProgress />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/project" element={<Project />} />
          <Route path="/teams-alerts" element={<TeamsAlerts />} />
          <Route path="/team-status" element={<TeamStatus />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ProjectProvider>
  </QueryClientProvider>
);

export default App;
