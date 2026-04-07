import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import TopNav from "@/components/TopNav";
import Home from "./pages/Home";
import Scope from "./pages/Scope";
import ScopeReview from "./pages/ScopeReview";
import Plan from "./pages/Plan";
import LiveScope from "./pages/LiveScope";
import Project from "./pages/Project";
import TeamsAlerts from "./pages/TeamsAlerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TopNav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scope" element={<Scope />} />
          <Route path="/scope-review" element={<ScopeReview />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/live-scope" element={<LiveScope />} />
          <Route path="/project" element={<Project />} />
          <Route path="/teams-alerts" element={<TeamsAlerts />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
