import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, AlertTriangle, X } from "lucide-react";
import {
  useProject,
  type InputPipelineRow,
  type WorkstreamDef,
  type ClientTouchpoint,
} from "@/context/ProjectContext";
import {
  CLIENT_HISTORY,
  SIMILAR_DEALS,
  clientStats,
  similarStats,
  formatFee,
  HistoryModal,
} from "@/pages/Engagement";
import { RISK_FLAGS } from "@/context/ProjectContext";

// ─── Layout constants ─────────────────────────────────────────────────────────

const COL_W   = 46;
const LABEL_W = 168;
const ROW_H   = 36;

const WEEKS       = [0, 1, 2, 3] as const;
const DAYS        = [0, 1, 2, 3, 4] as const;
const WEEK_LABELS = ["Week 0", "Week 1", "Week 2", "Week 3"] as const;
const DAY_LABELS  = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

// ─── Color maps ───────────────────────────────────────────────────────────────

const INPUT_HEX: Record<string, string> = {
  "data-room": "#14b8a6", "survey": "#0f766e", "expert": "#06b6d4", "mgmt": "#0ea5e9",
};
const INPUT_LIGHT_BG: Record<string, string> = {
  "data-room": "#f0fdfa", "survey": "#ccfbf1", "expert": "#ecfeff", "mgmt": "#f0f9ff",
};
const WS_HEX: Record<string, string> = {
  market: "#3b82f6", competitive: "#8b5cf6", commercial: "#10b981", financials: "#f97316", management: "#f43f5e",
};
const WS_LIGHT_BG: Record<string, string> = {
  market: "#eff6ff", competitive: "#f5f3ff", commercial: "#f0fdf4", financials: "#fff7ed", management: "#fff1f2",
};
const WS_COLORS: Record<string, { dot: string }> = {
  market:      { dot: "bg-blue-500"    },
  competitive: { dot: "bg-violet-500"  },
  commercial:  { dot: "bg-emerald-500" },
  financials:  { dot: "bg-orange-400"  },
  management:  { dot: "bg-rose-500"    },
};
const MEETING_HEX: Record<string, string> = { client: "#a855f7", internal: "#94a3b8", partner: "#475569" };

// Abbreviations for input names
const INPUT_SHORT: Record<string, string> = {
  "Data room": "Data room",
  "Consumer survey": "Survey",
  "Expert interviews": "Expert interviews",
  "Management interviews": "Mgmt interviews",
};

// Milestone colours
const MILESTONE_CLIENT_HEX   = "#a855f7"; // purple  — Client Owned
const MILESTONE_INTERNAL_HEX = "#f97316"; // orange  — OC&C Owned
const MILESTONE_TARGET_HEX   = "#94a3b8"; // grey    — Target Owned
const MILESTONE_EXTERNAL_HEX = MILESTONE_CLIENT_HEX; // alias kept for legacy refs

function milestoneHex(ownership?: "client" | "internal" | "target") {
  if (ownership === "internal") return MILESTONE_INTERNAL_HEX;
  if (ownership === "target")   return MILESTONE_TARGET_HEX;
  return MILESTONE_CLIENT_HEX;
}
function milestoneLabel(ownership?: "client" | "internal" | "target") {
  if (ownership === "internal") return "Milestone — OC&C Owned";
  if (ownership === "target")   return "Milestone — Target Owned";
  return "Milestone — Client Owned";
}
function milestoneTextClass(ownership?: "client" | "internal" | "target") {
  if (ownership === "internal") return "text-orange-500";
  if (ownership === "target")   return "text-slate-500";
  return "text-purple-600";
}

// Phase opacity levels
const PHASE_OPACITY = { prep: 0.28, analysis: 0.62, iteration: 0.90 } as const;

// ─── Deliverable phase data ───────────────────────────────────────────────────
// Columns: W0=0-4, W1=5-9, W2=10-14, W3=15-19  (Mon=+0 … Fri=+4)

interface DeliverablePhases {
  prep:      { startCol: number; endCol: number };
  analysis:  { startCol: number; endCol: number };
  iteration: { startCol: number; endCol: number };
}

const DELIVERABLE_PHASES: Record<string, DeliverablePhases> = {
  // Market
  "d-m1":  { prep: { startCol: 5,  endCol: 9  }, analysis: { startCol: 10, endCol: 14 }, iteration: { startCol: 15, endCol: 17 } },
  "d-m2":  { prep: { startCol: 9,  endCol: 11 }, analysis: { startCol: 12, endCol: 17 }, iteration: { startCol: 17, endCol: 19 } },
  // Competitive
  "d-c1":  { prep: { startCol: 5,  endCol: 9  }, analysis: { startCol: 10, endCol: 14 }, iteration: { startCol: 15, endCol: 19 } },
  "d-c2":  { prep: { startCol: 10, endCol: 13 }, analysis: { startCol: 14, endCol: 16 }, iteration: { startCol: 17, endCol: 19 } },
  // Commercial
  "d-cc1": { prep: { startCol: 9,  endCol: 10 }, analysis: { startCol: 11, endCol: 15 }, iteration: { startCol: 16, endCol: 19 } },
  "d-cc2": { prep: { startCol: 5,  endCol: 6  }, analysis: { startCol: 7,  endCol: 9  }, iteration: { startCol: 10, endCol: 14 } },
  "d-cc3": { prep: { startCol: 5,  endCol: 6  }, analysis: { startCol: 7,  endCol: 9  }, iteration: { startCol: 10, endCol: 14 } },
  // Financials
  "d-f1":  { prep: { startCol: 5,  endCol: 6  }, analysis: { startCol: 7,  endCol: 9  }, iteration: { startCol: 10, endCol: 14 } },
  "d-f2":  { prep: { startCol: 5,  endCol: 6  }, analysis: { startCol: 7,  endCol: 9  }, iteration: { startCol: 10, endCol: 14 } },
  // Management
  "d-mg1": { prep: { startCol: 5,  endCol: 7  }, analysis: { startCol: 8,  endCol: 11 }, iteration: { startCol: 12, endCol: 14 } },
  "d-mg2": { prep: { startCol: 5,  endCol: 7  }, analysis: { startCol: 8,  endCol: 11 }, iteration: { startCol: 12, endCol: 17 } },
};

// ─── Coverage helper ─────────────────────────────────────────────────────────

interface CoverageItem { name: string; wsId: string; suffix: string }

function getWorkstreamCoverage(workstreams: WorkstreamDef[], meetingCol: number): CoverageItem[] {
  const result: CoverageItem[] = [];
  for (const ws of workstreams) {
    for (const d of ws.deliverables) {
      const phases = DELIVERABLE_PHASES[d.id];
      if (!phases) continue;
      if (phases.analysis.startCol > meetingCol) continue;          // analysis not started → exclude
      let suffix = "";
      if (phases.iteration.endCol > meetingCol) suffix = " — Preliminary";
      else suffix = " — Final";
      result.push({ name: d.name, wsId: ws.id, suffix });
    }
  }
  return result;
}

// ─── Gantt data types ─────────────────────────────────────────────────────────

interface GanttSpan {
  id: string; label: string;
  startWeek: 0|1|2|3; startDay: 0|1|2|3|4;
  endWeek:   0|1|2|3; endDay:   0|1|2|3|4;
}
interface GanttMilestone {
  id: string; label: string;
  week: 0|1|2|3; day: 0|1|2|3|4;
  ownership?: "client" | "internal" | "target"; // default = "client"
  subRowIdx?: number;
}
interface GanttSubRow {
  id: string; rowLabel: string; spans: GanttSpan[];
  clientIntel?: string;
}
export interface GanttInputSection {
  inputId: string; inputLabel: string;
  subRows: GanttSubRow[];
  milestones?: GanttMilestone[];
}
interface DragState {
  mode: "move"|"left"|"right";
  startCol: number; origStartCol: number; origEndCol: number;
  sectionId?: string; subRowId?: string; spanId?: string;
  meetingId?: string;
}

// ─── Static Gantt data ────────────────────────────────────────────────────────

export const INITIAL_GANTT_SECTIONS: GanttInputSection[] = [
  {
    inputId: "data-room", inputLabel: "Data Room",
    milestones: [
      { id: "m-dr-1", label: "Access requested", week: 0, day: 0, ownership: "internal", subRowIdx: 0 },
      { id: "m-dr-2", label: "Access granted",   week: 0, day: 4, ownership: "target",   subRowIdx: 0 },
    ],
    subRows: [
      { id: "dr-r1", rowLabel: "Preparation & Access", spans: [{ id: "dr-s1", label: "Preparation & Access", startWeek: 0, startDay: 0, endWeek: 0, endDay: 4 }] },
      { id: "dr-r2", rowLabel: "Analysis window",       spans: [{ id: "dr-s2", label: "Analysis window open", startWeek: 1, startDay: 0, endWeek: 3, endDay: 4 }] },
    ],
  },
  {
    inputId: "survey", inputLabel: "Consumer Survey",
    milestones: [
      { id: "m-sv-draft", label: "Survey draft to client",      week: 0, day: 3, ownership: "internal", subRowIdx: 0 },
      { id: "m-sv-1",     label: "Survey signed off by client", week: 1, day: 1, ownership: "client",   subRowIdx: 1 },
      { id: "m-sv-2",     label: "Fieldwork complete",          week: 2, day: 4, ownership: "target",   subRowIdx: 2 },
    ],
    subRows: [
      { id: "sv-r1", rowLabel: "Drafting",        spans: [{ id: "sv-s1", label: "Draft",                startWeek: 0, startDay: 0, endWeek: 0, endDay: 3 }] },
      { id: "sv-r2", rowLabel: "Draft Iteration", spans: [{ id: "sv-s2", label: "Iteration & sign-off", startWeek: 0, startDay: 3, endWeek: 1, endDay: 1 }],
        clientIntel: "3 days for client review — estimated based on 12 previous engagements with client" },
      { id: "sv-r3", rowLabel: "Fieldwork",       spans: [{ id: "sv-s3", label: "Fieldwork",            startWeek: 1, startDay: 4, endWeek: 2, endDay: 4 }] },
    ],
  },
  {
    inputId: "expert", inputLabel: "Expert Interviews",
    milestones: [],
    subRows: [
      { id: "ex-r1", rowLabel: "Outreach",               spans: [{ id: "ex-s1", label: "Outreach",               startWeek: 0, startDay: 2, endWeek: 0, endDay: 3 }] },
      { id: "ex-r2", rowLabel: "Screening & Scheduling", spans: [{ id: "ex-s2", label: "Screening & Scheduling", startWeek: 0, startDay: 4, endWeek: 2, endDay: 0 }] },
      { id: "ex-r3", rowLabel: "Conducting",             spans: [{ id: "ex-s3", label: "Conducting",             startWeek: 1, startDay: 1, endWeek: 2, endDay: 4 }] },
      { id: "ex-r4", rowLabel: "Synthesis",              spans: [{ id: "ex-s4", label: "Synthesis",              startWeek: 2, startDay: 4, endWeek: 3, endDay: 1 }] },
    ],
  },
  {
    inputId: "mgmt", inputLabel: "Management Interviews",
    milestones: [
      { id: "m-mg-1", label: "CVC confirms interview plan", week: 0, day: 3, ownership: "client", subRowIdx: 0 },
      { id: "m-mg-2", label: "Interviews complete",          week: 1, day: 4, ownership: "target", subRowIdx: 2 },
    ],
    subRows: [
      { id: "mg-r1", rowLabel: "Plan to CVC", spans: [{ id: "mg-s1", label: "Plan to CVC", startWeek: 0, startDay: 1, endWeek: 0, endDay: 3 }] },
      { id: "mg-r2", rowLabel: "Scheduling",  spans: [{ id: "mg-s2", label: "Scheduling",  startWeek: 0, startDay: 3, endWeek: 1, endDay: 0 }] },
      { id: "mg-r3", rowLabel: "Conducting",  spans: [{ id: "mg-s3", label: "Conducting",  startWeek: 1, startDay: 2, endWeek: 1, endDay: 4 }],
        clientIntel: "Best case scenario — target early completion to allow for delay into W2" },
      { id: "mg-r4", rowLabel: "Synthesis",   spans: [{ id: "mg-s4", label: "Synthesis",   startWeek: 2, startDay: 0, endWeek: 2, endDay: 2 }] },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function colIdx(week: number, day: number) { return week * 5 + day; }
function colToWD(col: number): { week: 0|1|2|3; day: 0|1|2|3|4 } {
  const c = Math.max(0, Math.min(19, col));
  return { week: Math.floor(c / 5) as 0|1|2|3, day: (c % 5) as 0|1|2|3|4 };
}
function colToSpanStart(col: number): Pick<GanttSpan, "startWeek"|"startDay"> {
  const { week: startWeek, day: startDay } = colToWD(col);
  return { startWeek, startDay };
}
function colToSpanEnd(col: number): Pick<GanttSpan, "endWeek"|"endDay"> {
  const { week: endWeek, day: endDay } = colToWD(col);
  return { endWeek, endDay };
}
function computeInputAvailWeeks(pipeline: InputPipelineRow[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of pipeline) {
    if (!row.phases.length) continue;
    const last = row.phases.reduce((a, p) => p.week > a.week || (p.week === a.week && p.day > a.day) ? p : a);
    map[row.inputLabel] = last.week;
  }
  return map;
}
function critInputLabels(d: WorkstreamDef["deliverables"][number]): string[] {
  return Object.entries(d.inputMap).filter(([, r]) => r === "critical").map(([l]) => INPUT_SHORT[l] ?? l);
}
function phaseToSpan(id: string, label: string, startCol: number, endCol: number): GanttSpan {
  return { id, label, ...colToSpanStart(startCol), ...colToSpanEnd(endCol) };
}

// ─── Primitives ───────────────────────────────────────────────────────────────

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

/** Single span bar with optional label and drag handles */
function SpanBar({ span, colorHex, opacity = 0.78, showLabel = true, onMoveStart, onResizeStart }: {
  span: GanttSpan; colorHex: string; opacity?: number; showLabel?: boolean;
  onMoveStart?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, edge: "left"|"right") => void;
}) {
  const left  = colIdx(span.startWeek, span.startDay) * COL_W + 2;
  const right = (colIdx(span.endWeek, span.endDay) + 1) * COL_W - 2;
  const width = Math.max(right - left, 6);
  return (
    <div style={{ position: "absolute", left, width, top: 5, height: ROW_H - 10, backgroundColor: colorHex, opacity, borderRadius: 4, cursor: onMoveStart ? "grab" : "default", userSelect: "none" }}
      onMouseDown={onMoveStart ? e => { e.preventDefault(); e.stopPropagation(); onMoveStart(e); } : undefined}>
      {onResizeStart && width > 18 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 7, height: "100%", cursor: "w-resize", zIndex: 2, borderRadius: "4px 0 0 4px" }}
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onResizeStart(e, "left"); }} />
      )}
      {showLabel && width > 28 && (
        <div className="flex items-center h-full overflow-hidden" style={{ paddingLeft: 6, paddingRight: 6 }}>
          <span className="text-[8px] font-semibold text-white truncate leading-none select-none">{span.label}</span>
        </div>
      )}
      {onResizeStart && width > 18 && (
        <div style={{ position: "absolute", right: 0, top: 0, width: 7, height: "100%", cursor: "e-resize", zIndex: 2, borderRadius: "0 4px 4px 0" }}
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onResizeStart(e, "right"); }} />
      )}
    </div>
  );
}

/** Three-phase bar for workstream deliverables: prep / analysis / iteration */
function PhaseBar({ delivId, colorHex }: { delivId: string; colorHex: string }) {
  const phases = DELIVERABLE_PHASES[delivId];
  if (!phases) return null;
  return (
    <>
      <SpanBar
        span={phaseToSpan(`${delivId}-prep`, "Prep", phases.prep.startCol, phases.prep.endCol)}
        colorHex={colorHex} opacity={PHASE_OPACITY.prep} showLabel
      />
      <SpanBar
        span={phaseToSpan(`${delivId}-analysis`, "Analysis", phases.analysis.startCol, phases.analysis.endCol)}
        colorHex={colorHex} opacity={PHASE_OPACITY.analysis} showLabel
      />
      <SpanBar
        span={phaseToSpan(`${delivId}-iteration`, "Iteration", phases.iteration.startCol, phases.iteration.endCol)}
        colorHex={colorHex} opacity={PHASE_OPACITY.iteration} showLabel
      />
    </>
  );
}

/** Diamond milestone marker — fixed-position tooltip */
function MilestoneMark({ m }: { m: GanttMilestone }) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const color = milestoneHex(m.ownership);
  const cx = colIdx(m.week, m.day) * COL_W + Math.floor(COL_W / 2);
  const cy = Math.floor(ROW_H / 2);

  return (
    <div
      ref={markerRef}
      style={{ position: "absolute", left: cx - 7, top: cy - 7, zIndex: 6, width: 14, height: 14 }}
      onMouseEnter={() => {
        if (markerRef.current) {
          const r = markerRef.current.getBoundingClientRect();
          setTooltipPos({ x: r.left + r.width / 2, y: r.top });
        }
      }}
      onMouseLeave={() => setTooltipPos(null)}
    >
      <div style={{ width: 14, height: 14, backgroundColor: color, border: "2.5px solid white", transform: "rotate(45deg)", borderRadius: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.22)", cursor: "default" }} />
      {tooltipPos && createPortal(
        <div style={{ position: "fixed", left: tooltipPos.x, top: tooltipPos.y - 8, transform: "translate(-50%, -100%)", zIndex: 9999, width: 200, pointerEvents: "none" }}
          className="bg-card border border-border rounded-lg shadow-xl p-2">
          <p className={`text-[9px] font-bold uppercase tracking-wide mb-1 ${milestoneTextClass(m.ownership)}`}>
            {milestoneLabel(m.ownership)}
          </p>
          <p className="text-[10px] text-foreground leading-snug">{m.label}</p>
        </div>,
        document.body
      )}
    </div>
  );
}

/** Client Intel badge — hover tooltip, click to open modal */
function ClientIntelBadge({ text, onOpenModal }: { text: string; onOpenModal: () => void }) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="shrink-0 ml-1 cursor-pointer"
      onMouseEnter={() => {
        if (ref.current) {
          const r = ref.current.getBoundingClientRect();
          setTooltipPos({ x: r.left + r.width / 2, y: r.top });
        }
      }}
      onMouseLeave={() => setTooltipPos(null)}
      onClick={e => { e.stopPropagation(); setTooltipPos(null); onOpenModal(); }}
    >
      <div className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center hover:bg-amber-200 transition-colors">
        <span className="text-[8px] font-black text-amber-600 leading-none">!</span>
      </div>
      {tooltipPos && createPortal(
        <div style={{ position: "fixed", left: tooltipPos.x, top: tooltipPos.y - 8, transform: "translate(-50%, -100%)", zIndex: 9999, width: 220, pointerEvents: "none" }}
          className="bg-card border border-amber-300 rounded-lg shadow-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center shrink-0">
              <span className="text-[7px] font-black text-amber-600 leading-none">!</span>
            </div>
            <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">Client intel · click to expand</p>
          </div>
          <p className="text-[10px] text-foreground leading-snug">{text}</p>
        </div>,
        document.body
      )}
    </div>
  );
}

/** Meeting pill — coloured box, hover tooltip with workstream coverage */
function MeetingPill({ tp, colorHex, coverage, onMoveStart, onDelete }: {
  tp: ClientTouchpoint; colorHex: string;
  coverage?: CoverageItem[];
  onMoveStart?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const left  = colIdx(tp.week, tp.day) * COL_W + 3;
  const width = COL_W - 6;
  const hasCoverage = coverage && coverage.length > 0;
  const tooltipWidth = hasCoverage ? 220 : 200;
  return (
    <div
      style={{ position: "absolute", left, width, top: 5, height: ROW_H - 10, cursor: onMoveStart ? "grab" : "default" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onMouseDown={onMoveStart ? e => { e.preventDefault(); e.stopPropagation(); onMoveStart(e); } : undefined}
      onClick={e => e.stopPropagation()}
      className="relative"
    >
      <div style={{ height: "100%", backgroundColor: colorHex + "30", border: `1.5px solid ${colorHex}88`, borderRadius: 4 }} />
      {hover && onDelete && (
        <button className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 hover:border-red-300 text-muted-foreground hover:text-red-500 z-20"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(); }}>
          <span className="text-[9px] font-bold leading-none">×</span>
        </button>
      )}
      {hover && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-xl p-2.5 pointer-events-none" style={{ width: tooltipWidth, minWidth: 160 }}>
          <p className="text-[10px] font-semibold text-foreground mb-1 leading-snug">{tp.label}</p>
          <p className="text-[9px] text-muted-foreground leading-relaxed mb-1.5">{tp.agenda}</p>
          {hasCoverage && (
            <>
              <div className="border-t border-border/40 pt-1.5 mt-1">
                <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Expected coverage</p>
                <ul className="space-y-0.5">
                  {coverage!.map((c, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className={`w-1 h-1 rounded-full mt-[3px] shrink-0 ${WS_COLORS[c.wsId]?.dot ?? "bg-muted-foreground/40"}`} />
                      <span className="text-[9px] text-foreground/70 leading-snug">
                        {c.name}{c.suffix && <span className="text-muted-foreground/60">{c.suffix}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Standard Gantt data row — sticky label + relative grid */
function GanttDataRow({ label, sublabel, colorHex, indent = false, isGroupHeader = false, clientIntel, onClientIntelClick, onGridClick, children }: {
  label: string; sublabel?: string; colorHex?: string;
  indent?: boolean; isGroupHeader?: boolean;
  clientIntel?: string; onClientIntelClick?: () => void;
  onGridClick?: (col: number) => void; children?: React.ReactNode;
}) {
  const rowH = sublabel ? 46 : ROW_H;
  return (
    <div className="flex border-b border-border/30" style={{ height: rowH }}>
      <div className="sticky left-0 z-10 border-r border-border/40 flex items-center shrink-0"
        style={{ width: LABEL_W, minWidth: LABEL_W, backgroundColor: isGroupHeader && colorHex ? colorHex + "0e" : "var(--card)" }}>
        {colorHex && (
          <div style={{ width: isGroupHeader ? 3 : 2.5, minHeight: 14, height: isGroupHeader ? "62%" : "50%", backgroundColor: colorHex, borderRadius: 2, marginLeft: indent ? 22 : 10, marginRight: 6, flexShrink: 0 }} />
        )}
        <div className="min-w-0 flex-1 pr-1 flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <span className={`block truncate ${isGroupHeader ? "text-[10px] font-semibold" : "text-[10px] text-foreground/60"}`}
              style={{ color: isGroupHeader && colorHex ? colorHex : undefined }}>{label}</span>
            {sublabel && <span className="block truncate text-[9px] text-foreground/35 leading-tight mt-0.5">{sublabel}</span>}
          </div>
          {clientIntel && onClientIntelClick && <ClientIntelBadge text={clientIntel} onOpenModal={onClientIntelClick} />}
        </div>
      </div>
      <div className="relative shrink-0" style={{ width: 20 * COL_W, height: rowH, cursor: onGridClick ? "crosshair" : undefined }}
        onClick={onGridClick ? e => {
          const rect = e.currentTarget.getBoundingClientRect();
          onGridClick(Math.max(0, Math.min(19, Math.floor((e.clientX - rect.left) / COL_W))));
        } : undefined}>
        <GridBg />
        {children}
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex border-b border-border/40" style={{ height: 26 }}>
      <div className="sticky left-0 z-10 bg-muted/30 border-r border-border/40 flex items-center shrink-0" style={{ width: LABEL_W, minWidth: LABEL_W }}>
        <span className="text-[9px] font-bold text-muted-foreground/55 uppercase tracking-widest px-3">{label}</span>
      </div>
      <div className="flex-1 bg-muted/10 flex items-center"><div className="w-full h-px bg-border/25" /></div>
    </div>
  );
}

function GroupHeader({ label, sublabel, hex, lightBg }: { label: string; sublabel?: string; hex: string; lightBg: string }) {
  const h = sublabel ? 32 : 24;
  return (
    <div className="flex border-b border-border/30" style={{ height: h }}>
      <div className="sticky left-0 z-10 border-r border-border/40 flex items-center shrink-0"
        style={{ width: LABEL_W, minWidth: LABEL_W, backgroundColor: lightBg }}>
        <div style={{ width: 3, minHeight: 14, height: "65%", backgroundColor: hex, borderRadius: 2, marginLeft: 8, marginRight: 6, flexShrink: 0 }} />
        <div className="min-w-0">
          <span className="text-[10px] font-semibold block truncate" style={{ color: hex }}>{label}</span>
          {sublabel && <span className="text-[9px] block truncate leading-tight" style={{ color: hex + "90" }}>{sublabel}</span>}
        </div>
      </div>
      <div className="shrink-0" style={{ width: 20 * COL_W, backgroundColor: lightBg + "55" }} />
    </div>
  );
}

// ─── Gantt chart ──────────────────────────────────────────────────────────────

function GanttChart({
  ganttSections, workstreams, clientTouchpoints, availMap,
  onInputSpanChange, onMeetingMove, onMeetingAdd, onMeetingDelete, onClientIntelClick,
}: {
  ganttSections: GanttInputSection[];
  workstreams: WorkstreamDef[];
  clientTouchpoints: ClientTouchpoint[];
  availMap: Record<string, number>;
  onInputSpanChange: (sId: string, rId: string, spId: string, s: number, e: number) => void;
  onMeetingMove: (meetingId: string, col: number) => void;
  onMeetingAdd: (type: "client"|"internal"|"partner", col: number) => void;
  onMeetingDelete: (meetingId: string) => void;
  onClientIntelClick: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef      = useRef<DragState | null>(null);
  const lastColRef   = useRef(-1);
  const [dragging, setDragging] = useState(false);
  const cbRef = useRef({ onInputSpanChange, onMeetingMove });
  useLayoutEffect(() => { cbRef.current = { onInputSpanChange, onMeetingMove }; });

  function getCol(clientX: number): number {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const scroll = containerRef.current.scrollLeft;
    return Math.max(0, Math.min(19, Math.floor((clientX - rect.left + scroll - LABEL_W) / COL_W)));
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      e.preventDefault();
      const col = getCol(e.clientX);
      if (col === lastColRef.current) return;
      lastColRef.current = col;
      const { mode, origStartCol, origEndCol, startCol } = d;
      const dur = origEndCol - origStartCol;
      const { onInputSpanChange, onMeetingMove } = cbRef.current;
      if (d.meetingId) {
        onMeetingMove(d.meetingId, col);
      } else if (mode === "move") {
        const ns = Math.max(0, Math.min(19 - dur, origStartCol + col - startCol));
        onInputSpanChange(d.sectionId!, d.subRowId!, d.spanId!, ns, ns + dur);
      } else if (mode === "left") {
        onInputSpanChange(d.sectionId!, d.subRowId!, d.spanId!, Math.max(0, Math.min(origEndCol - 1, col)), origEndCol);
      } else {
        onInputSpanChange(d.sectionId!, d.subRowId!, d.spanId!, origStartCol, Math.max(origStartCol + 1, Math.min(19, col)));
      }
    };
    const onUp = () => { if (!dragRef.current) return; dragRef.current = null; lastColRef.current = -1; setDragging(false); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startInputDrag(e: React.MouseEvent, mode: "move"|"left"|"right", span: GanttSpan, sectionId: string, subRowId: string) {
    const sc = getCol(e.clientX);
    dragRef.current = { mode, startCol: sc, origStartCol: colIdx(span.startWeek, span.startDay), origEndCol: colIdx(span.endWeek, span.endDay), sectionId, subRowId, spanId: span.id };
    lastColRef.current = sc; setDragging(true);
  }
  function startMeetingDrag(e: React.MouseEvent, tp: ClientTouchpoint) {
    const col = getCol(e.clientX);
    dragRef.current = { mode: "move", startCol: col, origStartCol: colIdx(tp.week, tp.day), origEndCol: colIdx(tp.week, tp.day), meetingId: tp.id };
    lastColRef.current = col; setDragging(true);
  }

  return (
    <div ref={containerRef} className="overflow-x-auto border border-border rounded-xl bg-card shadow-sm select-none"
      style={{ cursor: dragging ? "grabbing" : undefined }}>
      <div style={{ width: LABEL_W + 20 * COL_W }}>

        {/* Header */}
        <div className="flex border-b-2 border-border" style={{ height: 44 }}>
          <div className="sticky left-0 z-30 bg-muted/20 border-r-2 border-border shrink-0" style={{ width: LABEL_W, minWidth: LABEL_W }} />
          <div className="flex shrink-0" style={{ width: 20 * COL_W }}>
            {WEEKS.map(week => (
              <div key={week} style={{ width: 5 * COL_W }} className={`flex flex-col ${week > 0 ? "border-l-2 border-border" : ""}`}>
                <div className="flex items-center justify-center border-b border-border/30 bg-muted/15" style={{ height: 24 }}>
                  <span className="text-[9.5px] font-semibold text-muted-foreground">{WEEK_LABELS[week]}</span>
                  {week === 0 && <span className="text-[8px] text-muted-foreground/40 ml-1">· Ramp</span>}
                </div>
                <div className="flex" style={{ height: 20 }}>
                  {DAYS.map(day => (
                    <div key={day} style={{ width: COL_W }} className={`flex items-center justify-center ${day > 0 ? "border-l border-border/20" : ""}`}>
                      <span className="text-[8px] text-muted-foreground/45">{DAY_LABELS[day]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend bar */}
        <div className="flex items-center gap-4 px-3 py-1.5 border-b border-border/20 bg-muted/5">
          {([["client", MILESTONE_CLIENT_HEX, "Client Owned"], ["internal", MILESTONE_INTERNAL_HEX, "OC&C Owned"], ["target", MILESTONE_TARGET_HEX, "Target Owned"]] as const).map(([, hex, lbl]) => (
            <div key={lbl} className="flex items-center gap-1.5">
              <div style={{ width: 9, height: 9, backgroundColor: hex, transform: "rotate(45deg)", borderRadius: 1, border: "1.5px solid white", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
              <span className="text-[9px] text-muted-foreground/70">Milestone — {lbl}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center">
              <span className="text-[7px] font-black text-amber-600 leading-none">!</span>
            </div>
            <span className="text-[9px] text-muted-foreground/70">Client intel</span>
          </div>
          <div className="ml-2 flex items-center gap-3 border-l border-border/30 pl-3">
            {(["prep","analysis","iteration"] as const).map((p, i) => (
              <div key={p} className="flex items-center gap-1">
                <div style={{ width: 16, height: 8, backgroundColor: "#6b7280", opacity: [PHASE_OPACITY.prep, PHASE_OPACITY.analysis, PHASE_OPACITY.iteration][i], borderRadius: 2 }} />
                <span className="text-[9px] text-muted-foreground/70 capitalize">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* INPUTS */}
        <SectionDivider label="Inputs" />
        {ganttSections.map(section => (
          <div key={section.inputId}>
            <GroupHeader label={section.inputLabel} hex={INPUT_HEX[section.inputId] ?? "#94a3b8"} lightBg={INPUT_LIGHT_BG[section.inputId] ?? "#f8fafc"} />
            {section.subRows.map((subRow, rIdx) => (
              <GanttDataRow key={subRow.id} label={subRow.rowLabel} colorHex={INPUT_HEX[section.inputId]} indent
                clientIntel={subRow.clientIntel} onClientIntelClick={subRow.clientIntel ? onClientIntelClick : undefined}>
                {subRow.spans.map(span => (
                  <SpanBar key={span.id} span={span} colorHex={INPUT_HEX[section.inputId] ?? "#94a3b8"}
                    opacity={0.75} showLabel={false}
                    onMoveStart={e => startInputDrag(e, "move", span, section.inputId, subRow.id)}
                    onResizeStart={(e, edge) => startInputDrag(e, edge === "left" ? "left" : "right", span, section.inputId, subRow.id)}
                  />
                ))}
                {section.milestones?.filter(m => (m.subRowIdx ?? 0) === rIdx).map(m => (
                  <MilestoneMark key={m.id} m={m} />
                ))}
              </GanttDataRow>
            ))}
          </div>
        ))}

        {/* WORKSTREAMS */}
        <SectionDivider label="Workstreams" />
        {workstreams.map(ws => {
          const hex     = WS_HEX[ws.id] ?? "#94a3b8";
          const lightBg = WS_LIGHT_BG[ws.id] ?? "#f8fafc";
          const wsInputs = [...new Set(ws.deliverables.flatMap(d => critInputLabels(d)))];
          return (
            <div key={ws.id}>
              <GroupHeader label={ws.name} hex={hex} lightBg={lightBg}
                sublabel={wsInputs.length ? `Requires: ${wsInputs.join(" · ")}` : undefined} />
              {ws.deliverables.map(d => {
                const blockingInputs = critInputLabels(d);
                return (
                  <GanttDataRow key={d.id} label={d.name}
                    sublabel={blockingInputs.length ? `↳ ${blockingInputs.join(", ")}` : undefined}
                    colorHex={hex} indent>
                    <PhaseBar delivId={d.id} colorHex={hex} />
                  </GanttDataRow>
                );
              })}
            </div>
          );
        })}

        {/* SCHEDULE */}
        <SectionDivider label="Schedule" />
        {(["client", "internal", "partner"] as const).map(type => {
          const meetings = clientTouchpoints.filter(tp => (tp.type ?? "client") === type);
          const hex      = MEETING_HEX[type];
          const rowLabel = type === "client" ? "Client meetings" : type === "internal" ? "Internal holds" : "Partner reviews";
          return (
            <GanttDataRow key={type} label={rowLabel} colorHex={hex} onGridClick={col => onMeetingAdd(type, col)}>
              {meetings.map(tp => {
                const meetingCol = colIdx(tp.week, tp.day);
                const coverage   = type === "client" ? getWorkstreamCoverage(workstreams, meetingCol) : undefined;
                return (
                  <MeetingPill key={tp.id} tp={tp} colorHex={hex} coverage={coverage}
                    onMoveStart={e => startMeetingDrag(e, tp)}
                    onDelete={() => onMeetingDelete(tp.id)}
                  />
                );
              })}
            </GanttDataRow>
          );
        })}

      </div>
    </div>
  );
}

// ─── Sequencing summary ───────────────────────────────────────────────────────

function dayLabel(week: number, day: number): string {
  return `W${week} ${DAY_LABELS[day]}`;
}

interface TimelineEvent {
  week: number; day: number;
  type: "milestone-external" | "milestone-internal" | "client-meeting";
  label: string;
  subLabel?: string;
  coverage?: CoverageItem[];
  ownership?: "client" | "internal" | "target";
}

export function SequencingSummary({ workstreams, clientTouchpoints, ganttSections }: {
  workstreams: WorkstreamDef[];
  clientTouchpoints: ClientTouchpoint[];
  ganttSections: GanttInputSection[];
}) {
  const events: TimelineEvent[] = [];

  for (const section of ganttSections) {
    for (const m of section.milestones ?? []) {
      events.push({ week: m.week, day: m.day, type: "milestone-external", label: `${section.inputLabel} — ${m.label}`, ownership: m.ownership });
    }
  }

  const clientMeetings = clientTouchpoints.filter(tp => (tp.type ?? "client") === "client");
  for (const tp of clientMeetings) {
    const meetingCol = colIdx(tp.week, tp.day);
    events.push({ week: tp.week, day: tp.day, type: "client-meeting", label: tp.label, subLabel: tp.agenda, coverage: getWorkstreamCoverage(workstreams, meetingCol) });
  }

  events.sort((a, b) => a.week !== b.week ? a.week - b.week : a.day - b.day);

  const grouped: Map<string, TimelineEvent[]> = new Map();
  for (const ev of events) {
    const key = `${ev.week}-${ev.day}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ev);
  }

  const keys = Array.from(grouped.keys());

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border/40 bg-muted/10">
          {([["client", MILESTONE_CLIENT_HEX, "Client Owned"], ["internal", MILESTONE_INTERNAL_HEX, "OC&C Owned"], ["target", MILESTONE_TARGET_HEX, "Target Owned"]] as const).map(([, hex, lbl]) => (
            <div key={lbl} className="flex items-center gap-1">
              <div style={{ width: 7, height: 7, backgroundColor: hex, transform: "rotate(45deg)", borderRadius: 1 }} />
              <span className="text-[8px] text-muted-foreground/60">{lbl}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
            <span className="text-[8px] text-muted-foreground/60">Client meeting</span>
          </div>
        </div>

        <div className="divide-y divide-border/30">
          {keys.map(key => {
            const [wStr, dStr] = key.split("-");
            const week = parseInt(wStr);
            const day  = parseInt(dStr);
            const dayEvents = grouped.get(key)!;
            return (
              <div key={key} className="flex items-start">
                <div className="shrink-0 px-3 py-2.5 w-16">
                  <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">{dayLabel(week, day)}</span>
                </div>
                <div className="flex-1 border-l border-border/30 px-3 py-2 space-y-1.5">
                  {dayEvents.map((ev, i) => {
                    if (ev.type === "milestone-external" || ev.type === "milestone-internal") {
                      const hex = milestoneHex(ev.ownership);
                      return (
                        <div key={i} className="flex items-start gap-1.5">
                          <div className="shrink-0 mt-[3px]" style={{ width: 8, height: 8, backgroundColor: hex, transform: "rotate(45deg)", borderRadius: 1 }} />
                          <div>
                            <span className="text-[10px] font-medium text-foreground/80 leading-tight block">{ev.label}</span>
                          </div>
                        </div>
                      );
                    }
                    if (ev.type === "client-meeting") {
                      return (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-[3px]" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-medium text-foreground/80 leading-tight block">{ev.label}</span>
                            {ev.coverage && ev.coverage.length > 0 ? (
                              <ul className="mt-0.5 space-y-0.5">
                                {ev.coverage.map((c, ci) => (
                                  <li key={ci} className="flex items-start gap-1">
                                    <span className={`w-1 h-1 rounded-full mt-[3px] shrink-0 ${WS_COLORS[c.wsId]?.dot ?? "bg-muted-foreground/40"}`} />
                                    <span className="text-[9px] text-foreground/60 leading-snug">
                                      {c.name}{c.suffix && <span className="text-muted-foreground/50 italic">{c.suffix}</span>}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-[9px] text-muted-foreground/50 leading-snug block mt-0.5">Scope &amp; input alignment</span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Plan() {
  const navigate = useNavigate();
  const { workstreams, inputPipeline, clientTouchpoints, setClientTouchpoints, advanceScopingStep, approvedFlags, approveFlag } = useProject();

  const [ganttSections, setGanttSections] = useState<GanttInputSection[]>(INITIAL_GANTT_SECTIONS);
  const [showClientIntelModal, setShowClientIntelModal] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [activeFlagId, setActiveFlagId] = useState<string | null>(null);

  const availMap          = computeInputAvailWeeks(inputPipeline);
  const totalDeliverables = workstreams.reduce((s, ws) => s + ws.deliverables.length, 0);
  const totalQuestions    = workstreams.reduce((s, ws) => s + ws.questions.length, 0);

  const handleInputSpanChange = useCallback((sectionId: string, subRowId: string, spanId: string, startCol: number, endCol: number) => {
    setGanttSections(prev => prev.map(sec =>
      sec.inputId !== sectionId ? sec : {
        ...sec,
        subRows: sec.subRows.map(row =>
          row.id !== subRowId ? row : { ...row, spans: row.spans.map(sp => sp.id !== spanId ? sp : { ...sp, ...colToSpanStart(startCol), ...colToSpanEnd(endCol) }) }
        ),
      }
    ));
  }, []);

  const handleMeetingMove = useCallback((meetingId: string, col: number) => {
    const { week, day } = colToWD(col);
    setClientTouchpoints(prev => prev.map(tp =>
      tp.id !== meetingId ? tp : { ...tp, week: week as ClientTouchpoint["week"], day: day as ClientTouchpoint["day"] }
    ));
  }, [setClientTouchpoints]);

  const handleMeetingAdd = useCallback((type: "client"|"internal"|"partner", col: number) => {
    const { week, day } = colToWD(col);
    setClientTouchpoints(prev => [...prev, {
      id: `tp-${Date.now()}`, label: "New meeting",
      week: week as ClientTouchpoint["week"], day: day as ClientTouchpoint["day"],
      type, agenda: "Add agenda here",
    }]);
  }, [setClientTouchpoints]);

  const handleMeetingDelete = useCallback((meetingId: string) => {
    setClientTouchpoints(prev => prev.filter(tp => tp.id !== meetingId));
  }, [setClientTouchpoints]);

  return (
    <div className="max-w-5xl xl:max-w-[1700px] mx-auto px-6 py-10">

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Planning</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {workstreams.length} workstreams · {totalDeliverables} deliverables · {totalQuestions} questions
            <span className="ml-2 text-muted-foreground/40">· drag input bars to move · drag edges to resize · click schedule rows to add meetings</span>
          </p>
        </div>
      </div>

      {/* ── Project Intel and Risk Flags ── */}
      <h3 className="text-base font-semibold text-foreground mb-3">Project Intel and Risk Flags</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* Client history */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
            <p className="text-xs font-semibold text-foreground">CVC — client history</p>
            <button onClick={() => setShowClientIntelModal(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
              See all <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border">
            {[
              { label: "Engagements",      value: clientStats.count },
              { label: "% on time",        value: `${clientStats.onTimePct}%` },
              { label: "Avg weekly fee",   value: formatFee(clientStats.avgWeeklyFee) },
              { label: "Average Team Satisfaction", value: `${clientStats.avgSat} / 5` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-4 py-2.5">
                <p className="text-lg font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparable deals */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
            <p className="text-xs font-semibold text-foreground">Consumer Retail CDDs — comparable deals</p>
            <button onClick={() => setShowSimilarModal(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
              See all <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border">
            {[
              { label: "Comparable deals", value: similarStats.count },
              { label: "% on time",        value: `${similarStats.onTimePct}%` },
              { label: "Avg weekly fee",   value: formatFee(similarStats.avgWeeklyFee) },
              { label: "Average Team Satisfaction", value: `${similarStats.avgSat} / 5` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-4 py-2.5">
                <p className="text-lg font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Risk flag pills ── */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {RISK_FLAGS.map((flag) => {
            const approved = approvedFlags.has(flag.id);
            const isCritical = flag.severity === "critical";
            return (
              <button
                key={flag.id}
                onClick={() => setActiveFlagId(flag.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors hover:shadow-sm ${
                  approved
                    ? "border-green-200 bg-green-50 text-green-700"
                    : isCritical
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {flag.title}
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ml-0.5 ${
                  approved ? "bg-green-100 text-green-700 border-green-200"
                  : isCritical ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-amber-100 text-amber-700 border-amber-200"
                }`}>
                  {approved ? "Noted" : isCritical ? "Critical" : "Amber"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Risk flag detail modal ── */}
      {activeFlagId && (() => {
        const flag = RISK_FLAGS.find(f => f.id === activeFlagId)!;
        const approved = approvedFlags.has(flag.id);
        const isCritical = flag.severity === "critical";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setActiveFlagId(null)} />
            <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isCritical ? "bg-red-100 border border-red-200" : "bg-amber-100 border border-amber-200"}`}>
                  <AlertTriangle className={`w-4 h-4 ${isCritical ? "text-red-600" : "text-amber-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${isCritical ? "text-red-700" : "text-amber-700"}`}>{isCritical ? "Critical risk" : "Amber risk"}</span>
                  <h3 className="text-sm font-semibold text-foreground leading-snug">{flag.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{flag.historical}</p>
                </div>
                <button onClick={() => setActiveFlagId(null)} className="text-muted-foreground hover:text-foreground shrink-0 text-lg leading-none">×</button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{flag.detail}</p>
              <div className="rounded-md bg-muted/30 border border-border px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Recommendation for letter</p>
                <p className="text-sm text-foreground leading-relaxed">{flag.recommendation}</p>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between">
                {approved ? (
                  <p className="text-xs font-medium text-green-700">✓ Noted — protection included in letter</p>
                ) : (
                  <p className="text-xs text-muted-foreground">This will appear in the Conditions section of the engagement letter.</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setActiveFlagId(null)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded border border-border transition-colors">Dismiss</button>
                  {!approved && (
                    <button
                      onClick={() => { approveFlag(flag.id); setActiveFlagId(null); }}
                      className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors"
                    >
                      Add to letter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Project Plan ── */}
      <h3 className="text-base font-semibold text-foreground mb-4">Project Plan</h3>

      <div className="flex flex-col xl:flex-row xl:gap-8 xl:items-start">

        <div className="hidden xl:flex xl:flex-col xl:w-[400px] xl:shrink-0 xl:sticky xl:top-16 xl:self-start xl:gap-3">
          <h4 className="text-sm font-semibold text-foreground">Milestone Summary</h4>
          <SequencingSummary workstreams={workstreams} clientTouchpoints={clientTouchpoints} ganttSections={ganttSections} />
        </div>

        <div className="xl:flex-1 min-w-0 flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-foreground">Visual Timeline</h4>
          <GanttChart
            ganttSections={ganttSections}
            workstreams={workstreams}
            clientTouchpoints={clientTouchpoints}
            availMap={availMap}
            onInputSpanChange={handleInputSpanChange}
            onMeetingMove={handleMeetingMove}
            onMeetingAdd={handleMeetingAdd}
            onMeetingDelete={handleMeetingDelete}
            onClientIntelClick={() => setShowClientIntelModal(true)}
          />
        </div>

      </div>

      <div className="xl:hidden mt-8 flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-foreground">Milestone Summary</h4>
        <SequencingSummary workstreams={workstreams} clientTouchpoints={clientTouchpoints} ganttSections={ganttSections} />
      </div>

      <div className="flex items-center justify-between pt-6 mt-8 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {totalDeliverables} deliverables · {workstreams.length} workstreams · 3 delivery weeks + Week 0 ramp
        </p>
        <Button onClick={() => { advanceScopingStep(4); navigate("/team"); }} className="gap-2">
          Approve plan <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {showClientIntelModal && (
        <HistoryModal
          title="CVC Capital Partners — client history"
          subtitle={`${clientStats.count} engagements on record · basis for timeline estimates`}
          stats={[
            { label: "Engagements",      value: clientStats.count },
            { label: "On time",          value: `${clientStats.onTimePct}%` },
            { label: "Avg weekly fee",   value: formatFee(clientStats.avgWeeklyFee) },
            { label: "Average Team Satisfaction", value: `${clientStats.avgSat} / 5` },
          ]}
          sections={[{ heading: "All CVC engagements", engagements: CLIENT_HISTORY, showClient: false }]}
          onClose={() => setShowClientIntelModal(false)}
        />
      )}

      {showSimilarModal && (
        <HistoryModal
          title="Consumer Retail CDDs — comparable deals"
          subtitle={`${similarStats.count} comparable engagements from other PE clients`}
          stats={[
            { label: "Deals",            value: similarStats.count },
            { label: "On time",          value: `${similarStats.onTimePct}%` },
            { label: "Avg weekly fee",   value: formatFee(similarStats.avgWeeklyFee) },
            { label: "Average Team Satisfaction", value: `${similarStats.avgSat} / 5` },
          ]}
          sections={[{ heading: "Comparable consumer retail deals", engagements: SIMILAR_DEALS, showClient: true }]}
          onClose={() => setShowSimilarModal(false)}
        />
      )}

    </div>
  );
}
