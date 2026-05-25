import { useRef, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  CalendarCheck,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  Check,
  BarChart2,
  Users,
} from "lucide-react";
import { useProject, SCOPING_STEPS } from "@/context/ProjectContext";

// ─── Delivery dropdown (unchanged pattern) ───────────────────────────────────

const deliverySteps = [
  { label: "Live Scope",        path: "/live-scope",          icon: Eye           },
  { label: "Project Progress",  path: "/project-progress",    icon: BarChart2     },
  { label: "Milestone Tracker", path: "/milestones",          icon: CalendarCheck },
  { label: "Risk Manager",      path: "/project",             icon: AlertTriangle },
  { label: "Team Status",       path: "/team-status",         icon: Users         },
];

const scopingPaths  = new Set(SCOPING_STEPS.map((s) => s.path));
const deliveryPaths = new Set([...deliverySteps.map((s) => s.path), "/teams-alerts"]);

function DeliveryDropdown({
  current,
  navigate,
}: {
  current: string;
  navigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeStep = deliverySteps.find((s) => s.path === current);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          activeStep
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        <span>Delivery</span>
        {activeStep && (
          <span className="text-xs font-normal opacity-75 hidden sm:inline">
            · {activeStep.label}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-52 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
          {deliverySteps.map((step) => {
            const isActive = step.path === current;
            const Icon = step.icon;
            return (
              <button
                key={step.path}
                onClick={() => { navigate(step.path); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                  isActive
                    ? "text-foreground font-medium bg-accent"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{step.label}</span>
                {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Scoping dropdown (shown on delivery pages) ───────────────────────────────

function ScopingDropdown({
  furthest,
  navigate,
}: {
  furthest: number;
  navigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Scoping
        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-52 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
          {SCOPING_STEPS.map((step, i) => {
            const isUnlocked = i <= furthest;
            return (
              <button
                key={step.path}
                disabled={!isUnlocked}
                onClick={() => { if (isUnlocked) { navigate(step.path); setOpen(false); } }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                  isUnlocked
                    ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                    : "text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                  isUnlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/40"
                }`}>{i + 1}</span>
                <span className="flex-1">{step.label}</span>
                {!isUnlocked && <span className="text-[10px] text-muted-foreground/40">Locked</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Scoping stepper ──────────────────────────────────────────────────────────

function ScopingProgress({
  currentPath,
  furthest,
  navigate,
}: {
  currentPath: string;
  furthest: number;
  navigate: (path: string) => void;
}) {
  const currentIdx = SCOPING_STEPS.findIndex((s) => s.path === currentPath);

  return (
    <div className="flex items-center">
      {SCOPING_STEPS.map((step, i) => {
        const isCurrent   = i === currentIdx;
        const isCompleted = i < currentIdx;           // behind where we are now
        const isUnlocked  = i <= furthest;            // has been reached before
        const isClickable = isUnlocked && !isCurrent; // can navigate to it

        return (
          <div key={step.path} className="flex items-center">
            {/* Connector line */}
            {i > 0 && (
              <div
                className="w-6 h-px transition-colors"
                style={{ backgroundColor: i <= furthest ? "hsl(var(--primary))" : "hsl(var(--border))" }}
              />
            )}

            {/* Step node */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => isClickable && navigate(step.path)}
                disabled={!isClickable}
                title={step.label}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                  ${isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1"
                    : isCompleted && isUnlocked
                    ? "bg-primary text-primary-foreground hover:opacity-80 cursor-pointer"
                    : isUnlocked
                    ? "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                    : "bg-muted text-muted-foreground/50 cursor-not-allowed"
                  }`}
              >
                {isCompleted && isUnlocked
                  ? <Check className="w-3 h-3" />
                  : <span>{i + 1}</span>
                }
              </button>

              {/* Step label — visible on md+ */}
              <span
                className={`hidden md:block text-[9px] font-medium tracking-wide whitespace-nowrap transition-colors ${
                  isCurrent
                    ? "text-foreground"
                    : isUnlocked
                    ? "text-muted-foreground"
                    : "text-muted-foreground/40"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── TopNav ───────────────────────────────────────────────────────────────────

export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { furthestScopingStep } = useProject();

  if (pathname === "/" || pathname === "/intro") return null;

  const isScoping  = scopingPaths.has(pathname);
  const isDelivery = deliveryPaths.has(pathname);

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-4">

        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="text-sm font-semibold tracking-tight text-foreground hover:opacity-70 transition-opacity shrink-0"
        >
          Sentinel
        </button>

        {/* Left: scoping stepper (scoping routes) or back link (delivery routes) */}
        <nav className="flex items-center gap-3 flex-1 min-w-0">
          {isScoping && (
            <ScopingProgress
              currentPath={pathname}
              furthest={furthestScopingStep}
              navigate={navigate}
            />
          )}

          {isDelivery && (
            <ScopingDropdown furthest={furthestScopingStep} navigate={navigate} />
          )}
        </nav>

        {/* Demo callout */}
        {isDelivery && (
          <span className="hidden sm:inline text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            Demo · Tue W2
          </span>
        )}

        {/* Right of centre: delivery dropdown always visible */}
        <DeliveryDropdown current={pathname} navigate={navigate} />

        {/* Teams button */}
        <div className="shrink-0">
          <button
            onClick={() => navigate("/teams-alerts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              pathname === "/teams-alerts"
                ? "bg-[hsl(264,67%,50%)] text-white"
                : "bg-[hsl(264,67%,50%)]/10 text-[hsl(264,67%,50%)] hover:bg-[hsl(264,67%,50%)]/20"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Teams
          </button>
        </div>

      </div>
    </header>
  );
}
