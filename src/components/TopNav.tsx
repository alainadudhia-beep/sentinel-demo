import { useNavigate, useLocation } from "react-router-dom";
import { FileText, CheckCircle2, ListChecks, AlertTriangle } from "lucide-react";

const steps = [
  { label: "Add Scope", path: "/scope", icon: FileText },
  { label: "Scope Review", path: "/scope-review", icon: CheckCircle2 },
  { label: "Project Plan", path: "/plan", icon: ListChecks },
  { label: "Risk Manager", path: "/project", icon: AlertTriangle },
];

const stepOrder = ["/scope", "/scope-review", "/plan", "/project"];

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
          DD Copilot
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isPast
                      ? "text-foreground hover:bg-accent"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {step.label}
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
