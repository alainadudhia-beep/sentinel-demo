import { useNavigate, useLocation } from "react-router-dom";
import { FileText, CheckCircle2, ListChecks, AlertTriangle, MessageSquare, Eye, Presentation, CalendarCheck } from "lucide-react";

const steps = [
  { label: "Add\nScope", path: "/scope", icon: FileText },
  { label: "Workstream\nPlanner", path: "/scope-review", icon: CheckCircle2 },
  { label: "Live\nScope", path: "/live-scope", icon: Eye },
  // { label: "Project\nPlan", path: "/plan", icon: ListChecks },
  { label: "Milestone\nTracker", path: "/milestones", icon: CalendarCheck },
  { label: "Slide\nReview", path: "/slide-review", icon: Presentation },
  { label: "Risk\nManager", path: "/project", icon: AlertTriangle },
];

const stepOrder = ["/scope", "/scope-review", "/live-scope", "/plan", "/milestones", "/slide-review", "/project"];

function getStepIndex(pathname: string) {
  const exactIdx = stepOrder.indexOf(pathname);
  if (exactIdx >= 0) return exactIdx;
  const idx = stepOrder.findIndex((p) => pathname.startsWith(p));
  return idx >= 0 ? idx : -1;
}

export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = getStepIndex(pathname);

  if (pathname === "/") return null;

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-1">
        <button
          onClick={() => navigate("/")}
          className="text-sm font-semibold tracking-tight mr-6 text-foreground hover:opacity-70 transition-opacity"
        >
          Sentinel
        </button>

        <nav className="flex items-center gap-1">
          {steps.map((step, i) => {
            const isActive = i === current;
            const isPast = i < current;
            const Icon = step.icon;

            return (
              <div key={step.label} className="flex items-center">
                {i > 0 && (
                  <div className={`w-6 h-px mx-1 ${isPast || isActive ? "bg-foreground/30" : "bg-border"}`} />
                )}
                <button
                  onClick={() => {
                    navigate(step.path);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left w-[120px] leading-tight ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isPast
                      ? "text-foreground hover:bg-accent"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-pre-line">{step.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="ml-auto">
          <button
            onClick={() => navigate("/teams-alerts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              pathname === "/teams-alerts"
                ? "bg-[hsl(264,67%,50%)] text-white"
                : "bg-[hsl(264,67%,50%)]/10 text-[hsl(264,67%,50%)] hover:bg-[hsl(264,67%,50%)]/20"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Teams Interface
          </button>
        </div>
      </div>
    </header>
  );
}
