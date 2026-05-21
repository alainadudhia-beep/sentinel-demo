import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useProject } from "@/context/ProjectContext";

// ─── Layout constants ─────────────────────────────────────────────────────────

const COL_W   = 46;
const LABEL_W = 200;
const ROW_H   = 36;

const WEEKS       = [0, 1, 2, 3] as const;
const DAYS        = [0, 1, 2, 3, 4] as const;
const WEEK_LABELS = ["Week 0", "Week 1", "Week 2", "Week 3"] as const;
const DAY_LABELS  = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

// ─── Role colours — earthy browns + grey for AI ───────────────────────────────

type RoleKey = "Partner" | "Manager" | "Consultant" | "Senior Associate" | "Junior Associate" | "AI";

const ROLE_HEX: Record<RoleKey, string> = {
  "Partner":           "#3a2215",  // very dark brown
  "Manager":           "#5c3d28",  // dark brown
  "Consultant":        "#7a5540",  // medium-dark brown
  "Senior Associate":  "#9e7155",  // medium brown
  "Junior Associate":  "#c4956e",  // light tan
  "AI":                "#7b8ea4",  // slate-blue (clearly distinct)
};

const ROLE_LIGHT_BG = "#faf6f2"; // single warm off-white for all role group headers

// ─── Staffing data ────────────────────────────────────────────────────────────
// Columns: W0=0-4, W1=5-9, W2=10-14, W3=15-19  (Mon=+0 … Fri=+4)

interface StaffMember {
  id: string;
  role: RoleKey;
  name: string;
  startCol: number;
  endCol: number;
  isNew?: boolean;
  isAI?: boolean;
}

export type TierId = "ai" | "standard" | "premium";

export const TIER_STAFF: Record<TierId, StaffMember[]> = {
  standard: [
    { id: "p1",  role: "Partner",          name: "Partner 1",         startCol: 0, endCol: 19 },
    { id: "p2",  role: "Partner",          name: "Partner 2",         startCol: 0, endCol: 19 },
    { id: "m1",  role: "Manager",          name: "Manager",           startCol: 0, endCol: 19 },
    { id: "c1",  role: "Consultant",       name: "Consultant",        startCol: 0, endCol: 19 },
    { id: "sa1", role: "Senior Associate", name: "Senior Associate",  startCol: 5, endCol: 19 },
    { id: "sa2", role: "Senior Associate", name: "Senior Associate",  startCol: 2, endCol: 14 },
    { id: "ja1", role: "Junior Associate", name: "Junior Associate",  startCol: 2, endCol: 19 },
    { id: "ja2", role: "Junior Associate", name: "Junior Associate",  startCol: 5, endCol: 19 },
  ],
  ai: [
    { id: "p1",  role: "Partner",          name: "Partner 1",         startCol: 0, endCol: 19 },
    { id: "p2",  role: "Partner",          name: "Partner 2",         startCol: 0, endCol: 19 },
    { id: "m1",  role: "Manager",          name: "Manager",           startCol: 0, endCol: 19 },
    { id: "c1",  role: "Consultant",       name: "Consultant",        startCol: 0, endCol: 19 },
    { id: "sa1", role: "Senior Associate", name: "Senior Associate",  startCol: 5, endCol: 19 },
    { id: "sa2", role: "Senior Associate", name: "Senior Associate",  startCol: 2, endCol: 14 },
    { id: "ai1", role: "AI",              name: "AI Research Agent", startCol: 0, endCol: 19, isAI: true },
    { id: "ai2", role: "AI",              name: "AI Research Agent", startCol: 0, endCol: 19, isAI: true },
  ],
  premium: [
    { id: "p1",  role: "Partner",          name: "Partner 1",         startCol: 0,  endCol: 19 },
    { id: "p2",  role: "Partner",          name: "Partner 2",         startCol: 0,  endCol: 19 },
    { id: "m1",  role: "Manager",          name: "Manager",           startCol: 0,  endCol: 19 },
    { id: "c1",  role: "Consultant",       name: "Consultant 1",      startCol: 0,  endCol: 19 },
    { id: "c2",  role: "Consultant",       name: "Consultant 2",      startCol: 0,  endCol: 19, isNew: true },
    { id: "sa1", role: "Senior Associate", name: "Senior Associate",  startCol: 5,  endCol: 19 },
    { id: "sa2", role: "Senior Associate", name: "Senior Associate",  startCol: 2,  endCol: 14 },
    { id: "ja1", role: "Junior Associate", name: "Junior Associate",  startCol: 2,  endCol: 19 },
    { id: "ja2", role: "Junior Associate", name: "Junior Associate",  startCol: 5,  endCol: 19 },
    { id: "ja3", role: "Junior Associate", name: "Junior Associate",  startCol: 0,  endCol: 19, isNew: true },
  ],
};

// ─── Intel warnings ───────────────────────────────────────────────────────────

interface IntelWarning {
  forRole: RoleKey;
  condition: (startCol: number, endCol: number) => boolean;
  title: string;
  message: string;
}

const INTEL_WARNINGS: IntelWarning[] = [
  {
    forRole: "Junior Associate",
    condition: (_s, endCol) => endCol <= 9,   // removed before end of W1
    title: "Junior capacity risk — management interviews",
    message:
      "Management interviews often overrun into Week 2. Based on CVC engagement history, we recommend keeping at least one Junior Associate available through end of Week 2 to support interview synthesis and data processing. Reducing junior capacity at Week 1 creates a real bottleneck risk going into the interim findings push.",
  },
  {
    forRole: "Senior Associate",
    condition: (_s, endCol) => endCol <= 9,   // removed before end of W1
    title: "Senior Associate capacity risk",
    message:
      "Removing Senior Associates before Week 2 significantly constrains workstream depth during the analysis phase. At least one Senior Associate through Week 2 is recommended to maintain quality on the interim findings.",
  },
];

function getWarning(member: StaffMember): IntelWarning | null {
  return INTEL_WARNINGS.find(w => w.forRole === member.role && w.condition(member.startCol, member.endCol)) ?? null;
}

// ─── Pricing tiers ────────────────────────────────────────────────────────────

const AVAILABILITY: Record<TierId, string> = {
  ai:       "w/c 11 May",
  standard: "w/c 18 May",
  premium:  "w/c 25 May",
};

interface PricingTier {
  id: TierId;
  label: string;
  tagline: string;
  fee: number;
  feeDelta: string;
  recommended: boolean;
  highlights: string[];
  note: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "ai",
    label: "AI-Optimised",
    tagline: "Leaner team, AI-augmented research",
    fee: 235000,
    feeDelta: "−£50k vs standard",
    recommended: false,
    highlights: [
      "Junior Associates replaced by AI research agents",
      "Same senior coverage — Partners, Manager, Consultant",
      "AI handles data synthesis & first-pass analysis",
      "Faster turnaround on routine research tasks",
    ],
    note: "Best for data-heavy engagements with well-scoped inputs",
  },
  {
    id: "standard",
    label: "Standard",
    tagline: "Recommended based on client history",
    fee: 285000,
    feeDelta: "Recommended",
    recommended: true,
    highlights: [
      "Full team across all seniority levels",
      "Two Senior Associates for workstream depth",
      "Two Junior Associates for data & fieldwork",
      "Proven team composition for CVC engagements",
    ],
    note: "Matches team structure from 9 of 12 previous CVC CDDs",
  },
  {
    id: "premium",
    label: "Premium",
    tagline: "Expanded capacity for complex scope",
    fee: 335000,
    feeDelta: "+£50k vs standard",
    recommended: false,
    highlights: [
      "+1 Consultant for additional workstream coverage",
      "+1 Junior Associate for increased data capacity",
      "Higher throughput on parallel workstreams",
      "Recommended if scope additions are expected",
    ],
    note: "Consider if data room access is delayed or scope is at risk of expansion",
  },
];

const DAY_RATE = 2000;

/** Returns drag-only delta vs the tier's base spans (ignores AI members). */
function computeDragDelta(
  tierId: TierId,
  tierOverrides: Record<string, { startCol: number; endCol: number }>,
): number {
  return TIER_STAFF[tierId]
    .filter(m => !m.isAI)
    .reduce((sum, base) => {
      const ov = tierOverrides[base.id];
      if (!ov) return sum;
      const baseDays = base.endCol - base.startCol + 1;
      const ovDays   = ov.endCol  - ov.startCol  + 1;
      return sum + (ovDays - baseDays) * DAY_RATE;
    }, 0);
}

function formatFee(n: number) {
  return `£${Math.round(n / 1000)}k`;
}

// ─── Drag state ───────────────────────────────────────────────────────────────

interface DragState {
  mode: "move" | "left" | "right";
  staffId: string;
  startMouseCol: number;
  origStartCol: number;
  origEndCol: number;
}

// ─── Client Intel Badge ───────────────────────────────────────────────────────

function IntelBadge({ warning, onClick }: { warning: IntelWarning; onClick: () => void }) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="shrink-0 cursor-pointer"
      onMouseEnter={() => {
        if (ref.current) {
          const r = ref.current.getBoundingClientRect();
          setTooltipPos({ x: r.left + r.width / 2, y: r.top });
        }
      }}
      onMouseLeave={() => setTooltipPos(null)}
      onClick={e => { e.stopPropagation(); setTooltipPos(null); onClick(); }}
    >
      <div className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center hover:bg-amber-200 transition-colors">
        <span className="text-[8px] font-black text-amber-600 leading-none">!</span>
      </div>
      {tooltipPos && createPortal(
        <div
          style={{ position: "fixed", left: tooltipPos.x, top: tooltipPos.y - 8, transform: "translate(-50%, -100%)", zIndex: 9999, width: 220, pointerEvents: "none" }}
          className="bg-card border border-amber-300 rounded-lg shadow-xl p-2.5"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center shrink-0">
              <span className="text-[7px] font-black text-amber-600 leading-none">!</span>
            </div>
            <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">Staffing risk · click to expand</p>
          </div>
          <p className="text-[10px] text-foreground leading-snug">{warning.title}</p>
        </div>,
        document.body
      )}
    </div>
  );
}

function IntelModal({ warning, onClose }: { warning: IntelWarning; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-black text-amber-600">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">Staffing risk</p>
            <h3 className="text-sm font-semibold text-foreground leading-snug">{warning.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none shrink-0">×</button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{warning.message}</p>
        <div className="pt-2 border-t border-border flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>Dismiss</Button>
        </div>
      </div>
    </div>
  );
}

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

// ─── Staffing Gantt ───────────────────────────────────────────────────────────

function StaffingGantt({
  staff, onStaffChange, onWarningClick,
}: {
  staff: StaffMember[];
  onStaffChange: (id: string, startCol: number, endCol: number) => void;
  onWarningClick: (warning: IntelWarning) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef      = useRef<DragState | null>(null);
  const lastColRef   = useRef(-1);
  const [dragging, setDragging]   = useState(false);
  const cbRef = useRef(onStaffChange);
  useLayoutEffect(() => { cbRef.current = onStaffChange; });

  function getCol(clientX: number): number {
    if (!containerRef.current) return 0;
    const rect   = containerRef.current.getBoundingClientRect();
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
      const { mode, origStartCol, origEndCol, startMouseCol } = d;
      const dur = origEndCol - origStartCol;
      if (mode === "move") {
        const ns = Math.max(0, Math.min(19 - dur, origStartCol + col - startMouseCol));
        cbRef.current(d.staffId, ns, ns + dur);
      } else if (mode === "left") {
        const ns = Math.max(0, Math.min(origEndCol - 1, col));
        cbRef.current(d.staffId, ns, origEndCol);
      } else {
        const ne = Math.max(origStartCol + 1, Math.min(19, col));
        cbRef.current(d.staffId, origStartCol, ne);
      }
    };
    const onUp = () => { dragRef.current = null; lastColRef.current = -1; setDragging(false); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startDrag(e: React.MouseEvent, mode: DragState["mode"], member: StaffMember) {
    e.preventDefault(); e.stopPropagation();
    const col = getCol(e.clientX);
    dragRef.current = { mode, staffId: member.id, startMouseCol: col, origStartCol: member.startCol, origEndCol: member.endCol };
    lastColRef.current = col;
    setDragging(true);
  }

  // Group by role in display order
  const ROLE_ORDER: RoleKey[] = ["Partner", "Manager", "Consultant", "Senior Associate", "Junior Associate", "AI"];
  const grouped = ROLE_ORDER
    .map(role => ({ role, members: staff.filter(m => m.role === role) }))
    .filter(g => g.members.length > 0);

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

        {/* Grouped rows */}
        {grouped.map(({ role, members }) => (
          <div key={role}>
            {/* Role group header */}
            <div className="flex border-b border-border/30" style={{ height: 24 }}>
              <div className="sticky left-0 z-10 border-r border-border/40 flex items-center shrink-0"
                style={{ width: LABEL_W, minWidth: LABEL_W, backgroundColor: ROLE_LIGHT_BG }}>
                <div style={{ width: 3, height: "65%", minHeight: 14, backgroundColor: ROLE_HEX[role], borderRadius: 2, marginLeft: 8, marginRight: 6, flexShrink: 0 }} />
                <span className="text-[10px] font-semibold truncate" style={{ color: ROLE_HEX[role] }}>{role}</span>
              </div>
              <div className="shrink-0" style={{ width: 20 * COL_W, backgroundColor: ROLE_LIGHT_BG + "88" }} />
            </div>

            {/* Member rows */}
            {members.map(member => {
              const hex     = ROLE_HEX[member.role];
              const left    = member.startCol * COL_W + 2;
              const right   = (member.endCol + 1) * COL_W - 2;
              const width   = Math.max(right - left, 8);
              const warning = getWarning(member);

              return (
                <div key={member.id} className="flex border-b border-border/30" style={{ height: ROW_H }}>
                  {/* Label */}
                  <div className="sticky left-0 z-10 border-r border-border/40 flex items-center shrink-0 bg-card"
                    style={{ width: LABEL_W, minWidth: LABEL_W }}>
                    <div style={{ width: 2.5, height: "50%", minHeight: 14, backgroundColor: hex, borderRadius: 2, marginLeft: 22, marginRight: 7, flexShrink: 0 }} />
                    <div className="min-w-0 flex-1 flex items-center gap-1.5 pr-2">
                      <span className="text-[10px] text-foreground/60 truncate flex-1">{member.name}</span>
                      {member.isNew && (
                        <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">+new</span>
                      )}
                      {member.isAI && (
                        <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">AI</span>
                      )}
                      {warning && (
                        <IntelBadge warning={warning} onClick={() => onWarningClick(warning)} />
                      )}
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="relative shrink-0" style={{ width: 20 * COL_W, height: ROW_H }}>
                    <GridBg />
                    <div
                      style={{ position: "absolute", left, width, top: 5, height: ROW_H - 10, backgroundColor: hex, opacity: member.isAI ? 0.50 : 0.72, borderRadius: 4, cursor: "grab", userSelect: "none" }}
                      onMouseDown={e => startDrag(e, "move", member)}
                    >
                      {/* Left resize handle */}
                      {width > 18 && (
                        <div style={{ position: "absolute", left: 0, top: 0, width: 7, height: "100%", cursor: "w-resize", zIndex: 2, borderRadius: "4px 0 0 4px" }}
                          onMouseDown={e => startDrag(e, "left", member)} />
                      )}
                      {/* Label */}
                      {width > 36 && (
                        <div className="flex items-center h-full px-2 overflow-hidden" style={{ paddingLeft: 10, paddingRight: 8 }}>
                          <span className="text-[8px] font-medium text-white truncate select-none">{member.role}</span>
                        </div>
                      )}
                      {/* Right resize handle */}
                      {width > 18 && (
                        <div style={{ position: "absolute", right: 0, top: 0, width: 7, height: "100%", cursor: "e-resize", zIndex: 2, borderRadius: "0 4px 4px 0" }}
                          onMouseDown={e => startDrag(e, "right", member)} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PricingCard({ tier, selected, onSelect, liveFee }: { tier: PricingTier; selected: boolean; onSelect: () => void; liveFee?: number }) {
  const displayFee = liveFee ?? tier.fee;
  return (
    <button
      onClick={onSelect}
      className={`relative text-left rounded-xl border p-4 transition-all w-full h-full flex flex-col ${
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {tier.recommended && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
          Recommended
        </span>
      )}
      {/* Label row: name + price top-right */}
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">{tier.label}</span>
          {selected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
        </div>
        <span className="text-lg font-bold text-foreground shrink-0">{formatFee(displayFee)}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{tier.tagline}</p>
      <ul className="space-y-1 mb-3 flex-1">
        {tier.highlights.map(h => (
          <li key={h} className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />{h}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground/60 italic border-t border-border/40 pt-2 mt-auto">{tier.note}</p>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Team() {
  const navigate = useNavigate();
  const { advanceScopingStep, selectedTier, setSelectedTier } = useProject();

  // Map context tier (A/B/C) ↔ local tier id
  const ctxToTier: Record<string, TierId> = { A: "ai", B: "standard", C: "premium" };
  const tierToCtx: Record<TierId, string> = { ai: "A", standard: "B", premium: "C" };
  const activeTierId: TierId = ctxToTier[selectedTier] ?? "standard";

  // Per-tier position overrides: { tierId: { staffId: {startCol, endCol} } }
  const [overrides, setOverrides] = useState<Record<TierId, Record<string, { startCol: number; endCol: number }>>>({
    ai: {}, standard: {}, premium: {},
  });

  // Active modal warning
  const [activeWarning, setActiveWarning] = useState<IntelWarning | null>(null);

  // Resolve current staff with overrides applied
  const staff = useMemo<StaffMember[]>(() => {
    const tierOverrides = overrides[activeTierId];
    return TIER_STAFF[activeTierId].map(m => ({
      ...m,
      startCol: tierOverrides[m.id]?.startCol ?? m.startCol,
      endCol:   tierOverrides[m.id]?.endCol   ?? m.endCol,
    }));
  }, [activeTierId, overrides]);

  const handleStaffChange = useCallback((id: string, startCol: number, endCol: number) => {
    setOverrides(prev => ({
      ...prev,
      [activeTierId]: { ...prev[activeTierId], [id]: { startCol, endCol } },
    }));
  }, [activeTierId]);

  function switchTier(tierId: TierId) {
    setSelectedTier(tierToCtx[tierId]);
    // keep per-tier overrides intact — no reset
  }

  const activePricing = PRICING_TIERS.find(t => t.id === activeTierId)!;
  const totalPeople   = staff.filter(m => !m.isAI).length;
  const aiCount       = staff.filter(m => m.isAI).length;
  // Live fee = tier base + drag-only delta (so clicking a tile never changes the price)
  const liveFee = activePricing.fee + computeDragDelta(activeTierId, overrides[activeTierId]);

  return (
    <div className="max-w-5xl xl:max-w-[1700px] mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Team and Pricing</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalPeople} people{aiCount > 0 ? ` · ${aiCount} AI agents` : ""} · {activePricing.label}
          </p>
        </div>
      </div>

      {/* Main layout: pricing column (xl) + Gantt */}
      <div className="flex flex-col xl:flex-row xl:gap-6 xl:items-stretch mb-8">

        {/* Pricing cards — vertical column on xl, hidden below (shown after Gantt on mobile) */}
        <div className="hidden xl:flex xl:flex-col xl:gap-3 xl:w-[380px] xl:shrink-0">
          <div className="shrink-0">
            <h3 className="text-sm font-semibold text-foreground">Pricing options</h3>
          </div>
          <div className="flex flex-col flex-1 gap-3">
            {PRICING_TIERS.map(tier => (
              <PricingCard
                key={tier.id}
                tier={tier}
                selected={tier.id === activeTierId}
                onSelect={() => switchTier(tier.id)}
                liveFee={tier.id === activeTierId ? liveFee : undefined}
              />
            ))}
          </div>
        </div>

        {/* Gantt */}
        <div className="xl:flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-700">
                Team currently available for {AVAILABILITY[activeTierId]} onwards
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/50">drag bars to adjust · drag edges to resize</span>
          </div>
          <StaffingGantt
            staff={staff}
            onStaffChange={handleStaffChange}
            onWarningClick={w => setActiveWarning(w)}
          />
        </div>

      </div>

      {/* Pricing options — below Gantt on smaller screens */}
      <div className="xl:hidden space-y-3 mb-8">
        <h3 className="text-sm font-semibold text-foreground">Pricing options</h3>
        <p className="text-xs text-muted-foreground">
          Select a team structure — the staffing chart above updates to reflect your choice.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {PRICING_TIERS.map(tier => (
            <PricingCard
              key={tier.id}
              tier={tier}
              selected={tier.id === activeTierId}
              onSelect={() => switchTier(tier.id)}
              liveFee={tier.id === activeTierId ? liveFee : undefined}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-6 border-t border-border">
        <Button onClick={() => { advanceScopingStep(5); navigate("/letter"); }} className="gap-2">
          Approve Team and Pricing <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Warning modal */}
      {activeWarning && (
        <IntelModal warning={activeWarning} onClose={() => setActiveWarning(null)} />
      )}

    </div>
  );
}
