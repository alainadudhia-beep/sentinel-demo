import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, OctagonX } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { INITIAL_GANTT_SECTIONS } from "@/pages/Plan";

// ─── Risk flags (mirrored from Risk Manager) ──────────────────────────────────

interface ActiveRisk {
  id: string;
  severity: "critical" | "high" | "medium";
  outcome: string;
  cause: string;
  affects: string[]; // span/phase keys affected
}

const ACTIVE_RISKS: ActiveRisk[] = [
  {
    id: "r1",
    severity: "critical",
    outcome: "Survey delayed",
    cause: "Panel recruitment delayed — response rate at 62% of target",
    affects: ["sv-r3", "d-cc1", "d-cc2", "d-cc3"],
  },
  {
    id: "r4",
    severity: "high",
    outcome: "Market model stalled",
    cause: "Priya off sick — competitor pricing layer and 5-year projections incomplete",
    affects: ["d-m1", "d-m2"],
  },
  {
    id: "r3",
    severity: "medium",
    outcome: "Management interview slipped",
    cause: "Session 2 rescheduled from Tuesday to Thursday",
    affects: ["mg-r3", "ex-r3", "ex-r4", "d-c1", "d-c2", "d-mg1", "d-mg2"],
  },
];

// Map from span/phase key → risk for tooltip lookup
const RISK_BY_TRACK: Record<string, ActiveRisk> = {};
ACTIVE_RISKS.forEach(r => r.affects.forEach(a => { RISK_BY_TRACK[a] = r; }));

// ─── Layout ───────────────────────────────────────────────────────────────────

const COL_W   = 46;
const LABEL_W = 168;
const ROW_H   = 32;

const WEEKS       = [0, 1, 2, 3] as const;
const WEEK_LABELS = ["Week 0 · Ramp", "Week 1", "Week 2", "Week 3"] as const;
const DAY_LABELS  = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

// Today = Tuesday Week 2 → column 11
const TODAY_COL = 11;

// ─── Status types ─────────────────────────────────────────────────────────────

type ProgressStatus = "complete" | "on-track" | "at-risk" | "blocked" | "not-started";

const STATUS_HEX: Record<ProgressStatus, string> = {
  "complete":    "#166534",  // forest green
  "on-track":    "#84cc16",  // lime green
  "at-risk":     "#eab308",  // yellow
  "blocked":     "#ef4444",  // red
  "not-started": "#d1d5db",  // grey
};

const STATUS_LABEL: Record<ProgressStatus, string> = {
  "complete":    "Complete",
  "on-track":    "On track",
  "at-risk":     "At risk",
  "blocked":     "Blocked",
  "not-started": "Not started",
};

// ─── Status overrides — aligned with Risk Manager ─────────────────────────────
//
// Risk Manager active issues (Tue W2):
//   CRITICAL  — Survey delayed: panel at 62%, fieldwork blocked
//   HIGH      — Market model stalled: Priya off sick, pricing layer + projections incomplete
//   MEDIUM    — Market model slides missing: no draft available
//   MEDIUM    — Management interview slipped to Thursday: cascades to expert synthesis & competitive

const SPAN_OVERRIDES: Record<string, ProgressStatus> = {
  "sv-r3": "blocked",   // Consumer survey fieldwork — critical risk, panel recruitment delayed
  "mg-r3": "at-risk",   // Management interviews conducting — slipped from Tue to Thu
  "ex-r3": "at-risk",   // Expert interviews conducting — missing management cross-references
  "ex-r4": "at-risk",   // Expert synthesis — dependent on management interview completion
};

// Workstream deliverable phase overrides: "delivId:phase" → status
const PHASE_OVERRIDES: Record<string, ProgressStatus> = {
  "d-m1:analysis":  "blocked",  // Market sizing — Priya off sick, TAM/SAM/SOM incomplete
  "d-m2:analysis":  "blocked",  // Market model slides — not started, no draft available
  "d-c1:analysis":  "at-risk",  // Competitive positioning — management interview dependency
  "d-c2:analysis":  "at-risk",  // Competitive landscape — management cross-references missing
  "d-f1:analysis":  "at-risk",  // Financial model — data room gaps
  "d-f2:analysis":  "at-risk",  // Revenue model — management data pending
  "d-mg1:analysis": "at-risk",  // Management credibility — interviews slipped to Thursday
  "d-mg2:analysis": "at-risk",  // Growth plan assessment — interviews slipped to Thursday
};

// ─── Colour maps (matching Plan.tsx) ─────────────────────────────────────────

const INPUT_HEX: Record<string, string> = {
  "data-room": "#14b8a6", "survey": "#0f766e", "expert": "#06b6d4", "mgmt": "#0ea5e9",
};
const WS_HEX: Record<string, string> = {
  market: "#3b82f6", competitive: "#8b5cf6", commercial: "#10b981", financials: "#f97316", management: "#f43f5e",
};

// Deliverable phase column data (copied from Plan.tsx)
const DELIVERABLE_PHASES: Record<string, { prep: [number,number]; analysis: [number,number]; iteration: [number,number] }> = {
  "d-m1":  { prep: [5,9],   analysis: [10,14], iteration: [15,17] },
  "d-m2":  { prep: [9,11],  analysis: [12,17], iteration: [17,19] },
  "d-c1":  { prep: [5,9],   analysis: [10,14], iteration: [15,19] },
  "d-c2":  { prep: [10,13], analysis: [14,16], iteration: [17,19] },
  "d-cc1": { prep: [9,10],  analysis: [11,15], iteration: [16,19] },
  "d-cc2": { prep: [5,6],   analysis: [7,9],   iteration: [10,14] },
  "d-cc3": { prep: [5,6],   analysis: [7,9],   iteration: [10,14] },
  "d-f1":  { prep: [5,6],   analysis: [7,9],   iteration: [10,14] },
  "d-f2":  { prep: [5,6],   analysis: [7,9],   iteration: [10,14] },
  "d-mg1": { prep: [5,7],   analysis: [8,11],  iteration: [12,14] },
  "d-mg2": { prep: [5,7],   analysis: [8,11],  iteration: [12,17] },
};

// ─── Status logic ─────────────────────────────────────────────────────────────

function autoStatus(startCol: number, endCol: number): ProgressStatus {
  if (endCol < TODAY_COL) return "complete";
  if (startCol > TODAY_COL) return "not-started";
  return "on-track";
}

// Severity ranking — higher = worse
const SEVERITY: Record<ProgressStatus, number> = {
  "complete": 0, "on-track": 1, "not-started": 2, "at-risk": 3, "blocked": 4,
};

/** If a previous step in the same track is at-risk or blocked, downstream steps can't be on-track/not-started */
function propagate(prevWorst: ProgressStatus, current: ProgressStatus): ProgressStatus {
  if (SEVERITY[prevWorst] >= SEVERITY["at-risk"]) {
    if (current === "not-started" || current === "on-track") return "at-risk";
  }
  return current;
}

function spanStatus(rowId: string, startCol: number, endCol: number): ProgressStatus {
  return SPAN_OVERRIDES[rowId] ?? autoStatus(startCol, endCol);
}

/** Compute all three phases for a deliverable with forward propagation */
function deliverableStatuses(delivId: string): Record<"prep" | "analysis" | "iteration", ProgressStatus> {
  const phases = DELIVERABLE_PHASES[delivId];
  if (!phases) return { prep: "not-started", analysis: "not-started", iteration: "not-started" };

  let worst: ProgressStatus = "complete";
  const result = {} as Record<"prep" | "analysis" | "iteration", ProgressStatus>;

  for (const phase of ["prep", "analysis", "iteration"] as const) {
    const [sc, ec] = phases[phase];
    const base = PHASE_OVERRIDES[`${delivId}:${phase}`] ?? autoStatus(sc, ec);
    const status = propagate(worst, base);
    result[phase] = status;
    if (SEVERITY[status] > SEVERITY[worst]) worst = status;
  }
  return result;
}

/** Compute statuses for all sub-rows in an input section with forward propagation */
function inputRowStatuses(section: typeof INITIAL_GANTT_SECTIONS[number]): ProgressStatus[] {
  let worst: ProgressStatus = "complete";
  return section.subRows.map(row => {
    const span = row.spans[0];
    if (!span) return "not-started";
    const startCol = colIdx(span.startWeek, span.startDay);
    const endCol   = colIdx(span.endWeek,   span.endDay);
    const base     = spanStatus(row.id, startCol, endCol);
    const status   = propagate(worst, base);
    if (SEVERITY[status] > SEVERITY[worst]) worst = status;
    return status;
  });
}

function colIdx(week: number, day: number) { return week * 5 + day; }

// ─── Ownership — input section and workstream owners ─────────────────────────

const INPUT_OWNER: Record<string, { initials: string; name: string; bg: string }> = {
  "expert":    { initials: "JO", name: "James",  bg: "#059669" },
  "survey":    { initials: "PS", name: "Priya",  bg: "#f59e0b" },
  "data-room": { initials: "TB", name: "Tom",    bg: "#f97316" },
  "mgmt":      { initials: "TB", name: "Tom",    bg: "#f97316" },
};

const WS_OWNER: Record<string, { initials: string; name: string; bg: string }> = {
  "market":      { initials: "JO", name: "James", bg: "#059669" },
  "competitive": { initials: "JO", name: "James", bg: "#059669" },
  "commercial":  { initials: "JO", name: "James", bg: "#059669" },
  "financials":  { initials: "TB", name: "Tom",   bg: "#f97316" },
  "management":  { initials: "TB", name: "Tom",   bg: "#f97316" },
};

// ─── Grid background ──────────────────────────────────────────────────────────

function GridBg() {
  return (
    <>
      <div className="absolute inset-y-0 pointer-events-none" style={{ left: 0, width: 5 * COL_W, backgroundColor: "rgba(0,0,0,0.018)" }} />
      {[1, 2, 3].map(w => (
        <div key={w} className="absolute inset-y-0 pointer-events-none" style={{ left: w * 5 * COL_W - 1, width: 2, backgroundColor: "rgba(0,0,0,0.13)" }} />
      ))}
      {Array.from({ length: 19 }, (_, i) => i + 1).filter(i => i % 5 !== 0).map(i => (
        <div key={i} className="absolute inset-y-0 w-px pointer-events-none" style={{ left: i * COL_W, backgroundColor: "rgba(0,0,0,0.04)" }} />
      ))}
    </>
  );
}

// ─── Status bar ──────────────────────────────────────────────────────────────

function StatusBar({
  startCol, endCol, status, label, trackKey, onRiskClick,
}: {
  startCol: number; endCol: number; status: ProgressStatus; label?: string;
  trackKey?: string; onRiskClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const left    = startCol * COL_W + 2;
  const width   = Math.max((endCol - startCol + 1) * COL_W - 4, 4);
  const hex     = STATUS_HEX[status];
  const risk    = trackKey ? RISK_BY_TRACK[trackKey] : undefined;
  const isIssue = status === "at-risk" || status === "blocked";

  return (
    <div
      style={{ position: "absolute", left, width, top: 4, height: ROW_H - 8, backgroundColor: hex, borderRadius: 4, opacity: 0.85, cursor: isIssue ? "pointer" : "default", zIndex: hovered ? 20 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isIssue && onRiskClick ? onRiskClick : undefined}
    >
      {width > 32 && label && (
        <div className="flex items-center h-full px-1.5 overflow-hidden">
          <span className="text-[8px] font-semibold text-white truncate leading-none select-none">{label}</span>
        </div>
      )}

      {hovered && (
        <div className="absolute z-50 bottom-full mb-1.5 left-0 min-w-[190px] max-w-[260px] bg-popover border border-border rounded-lg shadow-lg p-2.5 pointer-events-none">
          <p className="text-[11px] font-semibold text-foreground mb-0.5">{label} — {STATUS_LABEL[status]}</p>
          {isIssue && risk ? (
            <>
              <p className="text-[11px] text-muted-foreground leading-snug mt-1">{risk.cause}</p>
              <p className="text-[11px] text-primary font-medium mt-1.5">Click to view in Risk Manager →</p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground">No active issues</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section header row ───────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex border-b border-border/60" style={{ minHeight: 28 }}>
      <div className="shrink-0 flex items-center px-3" style={{ width: LABEL_W }}>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      <div className="flex-1 relative" style={{ width: 20 * COL_W, backgroundColor: "rgba(0,0,0,0.015)" }} />
    </div>
  );
}

// ─── Single data row ──────────────────────────────────────────────────────────

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex border-b border-border/40 hover:bg-muted/20 transition-colors" style={{ height: ROW_H }}>
      <div className="shrink-0 flex items-center px-3" style={{ width: LABEL_W }}>
        <span className="text-[10px] text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 relative" style={{ width: 20 * COL_W }}>
        <GridBg />
        {children}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProjectProgress() {
  const { workstreams } = useProject();
  const navigate = useNavigate();
  const ganttSections = INITIAL_GANTT_SECTIONS;

  const goToRisk = () => navigate("/project");

  const criticalCount = ACTIVE_RISKS.filter(r => r.severity === "critical").length;
  const highCount     = ACTIVE_RISKS.filter(r => r.severity === "high").length;
  const mediumCount   = ACTIVE_RISKS.filter(r => r.severity === "medium").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Project Progress</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Input pipeline and workstream delivery status
              <span className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Tue 2 Jun · Week 2</span>
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {(Object.keys(STATUS_LABEL) as ProgressStatus[]).map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: STATUS_HEX[s] }} />
                <span className="text-[11px] text-muted-foreground">{STATUS_LABEL[s]}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
              <div className="w-0.5 h-3 bg-blue-500 rounded" />
              <span className="text-[11px] text-muted-foreground">Today</span>
            </div>
          </div>
        </div>

        {/* Risk summary banner */}
        <button
          onClick={goToRisk}
          className="w-full text-left rounded-xl border border-red-200 bg-red-50/60 px-5 py-4 hover:bg-red-50 transition-colors group"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Active risks affecting delivery</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click to view actions in Risk Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                  <OctagonX className="w-3 h-3" />{criticalCount} Critical
                </span>
              )}
              {highCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  <AlertTriangle className="w-3 h-3" />{highCount} High
                </span>
              )}
              {mediumCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />{mediumCount} Medium
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {ACTIVE_RISKS.map(r => (
              <div key={r.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className={`shrink-0 font-semibold ${r.severity === "critical" ? "text-red-600" : r.severity === "high" ? "text-orange-600" : "text-amber-600"}`}>
                  {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}:
                </span>
                <span>{r.outcome} — {r.cause}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-primary font-medium mt-3 group-hover:underline">Open Risk Manager →</p>
        </button>

        {/* Gantt */}
        <div className="overflow-x-auto">
          <div className="relative" style={{ minWidth: LABEL_W + 20 * COL_W, paddingTop: '1.25rem' }}>

          {/* "Today" label sits above the card */}
          <div
            className="absolute top-0 flex justify-center pointer-events-none z-30"
            style={{ left: LABEL_W + TODAY_COL * COL_W, width: COL_W }}
          >
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">Today</span>
          </div>

          <div className="border border-border rounded-xl bg-card">
          <div className="relative">

          {/* Today column border overlay */}
          <div
            className="absolute inset-y-0 pointer-events-none z-30"
            style={{ left: LABEL_W + TODAY_COL * COL_W, width: COL_W }}
          >
            <div className="absolute inset-0 border-x-2 border-blue-400 rounded-sm" />
          </div>

          {/* Column headers */}
          <div className="flex border-b border-border bg-muted/40">
            <div className="shrink-0 border-r border-border/60 flex items-center px-3" style={{ width: LABEL_W }}>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Track</span>
            </div>
            <div style={{ width: 20 * COL_W }}>
              {/* Week labels */}
              <div className="flex border-b border-border/40">
                {WEEKS.map(w => (
                  <div key={w} className="flex items-center justify-center border-r border-border/30 last:border-r-0 py-1.5"
                    style={{ width: 5 * COL_W }}>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {WEEK_LABELS[w]}
                    </span>
                  </div>
                ))}
              </div>
              {/* Day labels */}
              <div className="flex">
                {WEEKS.map(w =>
                  DAY_LABELS.map((d, di) => (
                    <div key={`${w}-${di}`} className="flex items-center justify-center py-1 border-r border-border/20 last:border-r-0" style={{ width: COL_W }}>
                      <span className="text-[9px] text-muted-foreground/60">{d}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Input pipeline ── */}
          <SectionHeader label="Input Pipeline" color="#0f766e" />
          {ganttSections.map(section => (
            <div key={section.inputId}>
              {/* Input section label */}
              <div className="flex border-b border-border/30 bg-muted/10" style={{ minHeight: 22 }}>
                <div className="shrink-0 flex items-center justify-between px-3" style={{ width: LABEL_W }}>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: INPUT_HEX[section.inputId] }}>
                    {section.inputLabel}
                  </span>
                  {INPUT_OWNER[section.inputId] && (
                    <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-white border border-gray-300 text-gray-600 shrink-0">
                      {INPUT_OWNER[section.inputId].name}
                    </span>
                  )}
                </div>
                <div className="flex-1" style={{ width: 20 * COL_W }} />
              </div>
              {(() => {
                const statuses = inputRowStatuses(section);
                return section.subRows.map((row, ri) => {
                  const span = row.spans[0];
                  if (!span) return null;
                  const startCol = colIdx(span.startWeek, span.startDay);
                  const endCol   = colIdx(span.endWeek,   span.endDay);
                  return (
                    <DataRow key={row.id} label={row.rowLabel}>
                      <StatusBar startCol={startCol} endCol={endCol} status={statuses[ri]} label={span.label} trackKey={row.id} onRiskClick={goToRisk} />
                    </DataRow>
                  );
                });
              })()}
            </div>
          ))}

          {/* ── Workstream deliverables ── */}
          <SectionHeader label="Workstream Deliverables" color="#6366f1" />
          {workstreams.map(ws => (
            <div key={ws.id}>
              {/* Workstream label row */}
              <div className="flex border-b border-border/30 bg-muted/10" style={{ minHeight: 22 }}>
                <div className="shrink-0 flex items-center justify-between px-3" style={{ width: LABEL_W }}>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: WS_HEX[ws.id] ?? "#6366f1" }}>
                    {ws.name}
                  </span>
                  {WS_OWNER[ws.id] && (
                    <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-white border border-gray-300 text-gray-600 shrink-0">
                      {WS_OWNER[ws.id].name}
                    </span>
                  )}
                </div>
                <div className="flex-1" style={{ width: 20 * COL_W }} />
              </div>
              {ws.deliverables.map(d => {
                const phases = DELIVERABLE_PHASES[d.id];
                if (!phases) return null;
                const statuses = deliverableStatuses(d.id);
                return (
                  <DataRow key={d.id} label={d.name}>
                    {(["prep", "analysis", "iteration"] as const).map(phase => {
                      const [sc, ec] = phases[phase];
                      if (sc > ec) return null;
                      return (
                        <StatusBar key={phase} startCol={sc} endCol={ec} status={statuses[phase]} label={phase.charAt(0).toUpperCase() + phase.slice(1)} trackKey={d.id} onRiskClick={goToRisk} />
                      );
                    })}
                  </DataRow>
                );
              })}
            </div>
          ))}

          </div>{/* end relative inner */}
          </div>{/* end card */}
          </div>{/* end minWidth wrapper */}
        </div>{/* end overflow-x-auto */}
      </div>
    </div>
  );
}
