import { useState } from "react";
import { AlertTriangle, Sparkles, Clock, Check, X, Edit3, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


// ─── Layout constants (match Team.tsx) ───────────────────────────────────────

const COL_W   = 46;
const LABEL_W = 200;
const ROW_H   = 36;
const WEEKS       = [0, 1, 2, 3] as const;
const WEEK_LABELS = ["Week 0", "Week 1", "Week 2", "Week 3"] as const;
const DAY_LABELS  = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const TODAY_COL      = 11; // Tue W2 — shown as "today" column highlight
const LAST_WORKED_COL = 10; // Mon W2 — last day with recorded hours

const ROLE_HEX: Record<string, string> = {
  "Partner":           "#3a2215",
  "Manager":           "#5c3d28",
  "Consultant":        "#7a5540",
  "Senior Associate":  "#9e7155",
  "Junior Associate":  "#c4956e",
  "AI":                "#7b8ea4",
};

// ─── Name assignments — maps TIER_STAFF ids → real names ─────────────────────

const STAFF_NAMES: Record<string, string> = {
  p1:  "William Park",
  p2:  "James Chen",
  m1:  "Sarah Chen",
  c1:  "James Okafor",
  sa1: "Priya Sharma",
  sa2: "Tom Bradley",
  ja1: "Alex Kim",
  ja2: "Mei Lin",
  // premium extras
  c2:  "Consultant 2",
  ja3: "Junior Associate 3",
  // AI tier
  ai1: "AI Research Agent",
  ai2: "AI Research Agent",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "Partner" | "Manager" | "Consultant" | "Senior Associate" | "Junior Associate";
type FeedbackCategory = "strength" | "development" | "recognition";
type FeedbackStatus = "pending" | "approved" | "dismissed";

interface Member {
  id: string;
  name: string;
  initials: string;
  role: Role;
  avatarColor: string;
  canBeOwner: boolean;
  sick?: boolean;
}

interface MemberData {
  // daily[col] = hours worked that day, null = absent, undefined = future
  daily: (number | null)[];
  happiness: number | null;
  prevHappiness: number | null;
}

interface FeedbackItem {
  id: string;
  memberId: string;
  category: FeedbackCategory;
  generatedText: string;
  status: FeedbackStatus;
  editText: string;
}

// ─── Team members (standard tier) ────────────────────────────────────────────

// All team members (used for Gantt name mapping)
const ALL_MEMBERS: Member[] = [
  { id: "wp", name: "William Park",  initials: "WP", role: "Partner",          avatarColor: "bg-violet-700",  canBeOwner: true  },
  { id: "jc", name: "James Chen",    initials: "JC", role: "Partner",          avatarColor: "bg-violet-500",  canBeOwner: true  },
  { id: "sc", name: "Sarah Chen",    initials: "SC", role: "Manager",          avatarColor: "bg-blue-600",    canBeOwner: true  },
  { id: "jo", name: "James Okafor", initials: "JO", role: "Consultant",       avatarColor: "bg-emerald-600", canBeOwner: true  },
  { id: "ps", name: "Priya Sharma",  initials: "PS", role: "Senior Associate", avatarColor: "bg-amber-500",   canBeOwner: true,  sick: true },
  { id: "ak", name: "Alex Kim",      initials: "AK", role: "Junior Associate", avatarColor: "bg-sky-500",     canBeOwner: false },
  { id: "tb", name: "Tom Bradley",   initials: "TB", role: "Senior Associate", avatarColor: "bg-orange-500",  canBeOwner: true  },
  { id: "ml", name: "Mei Lin",       initials: "ML", role: "Junior Associate", avatarColor: "bg-rose-500",    canBeOwner: false },
];

// Delivery team — partners excluded from ownership/workload/feedback
const MEMBERS = ALL_MEMBERS.filter(m => m.role !== "Partner");

// ─── Org chart nodes ──────────────────────────────────────────────────────────
// colour = Project Progress workstream/input colours

interface OrgNode {
  memberId: string;
  workstreams?: string[];
  inputOwners?: string[];
  children?: OrgNode[];
}

// Workstream hex colours (matching Project Progress / context)
const WS_HEX: Record<string, string> = {
  "Market":                "#3b82f6",  // blue
  "Competitive Landscape": "#8b5cf6",  // violet
  "Customer & Commercial": "#10b981",  // emerald
  "Financials":            "#f97316",  // orange
  "Management":            "#f43f5e",  // rose
};
const INPUT_HEX: Record<string, string> = {
  "Expert Interviews":     "#06b6d4",  // cyan
  "Consumer Survey":       "#0ea5e9",  // sky
  "Data Room":             "#14b8a6",  // teal
  "Management Interviews": "#0f766e",  // dark teal
};

const ORG_TREE: OrgNode = {
  memberId: "wp",
  children: [
    {
      memberId: "jc",
      children: [
        {
          memberId: "sc",
          children: [
            {
              memberId: "jo",
              workstreams: ["Market", "Competitive Landscape", "Customer & Commercial"],
              inputOwner: "Expert Interviews",
              children: [
                {
                  memberId: "ps",
                  inputOwner: "Consumer Survey",
                },
                {
                  memberId: "ak",
                },
              ],
            },
            {
              memberId: "tb",
              workstreams: ["Financials", "Management"],
              inputOwner: "Data Room",
              children: [
                {
                  memberId: "ml",
                  inputOwner: "Management Interviews",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// ─── Daily hours data ─────────────────────────────────────────────────────────
// 20 cols: W0 Mon–Fri (0–4), W1 Mon–Fri (5–9), W2 Mon–Fri (10–14), W3 Mon–Fri (15–19)
// Today = col 11 (W2 Tue). Past = 0–11, future = 12–19 (undefined).
// Absent = null. Future = undefined (rendered grey).

//                 W0                      W1                  W2              W3 (all future)
//              M         T   W   T   F    M   T   W   T   F    M   T   ...
// Staffing from Team & Pricing Gantt (standard tier):
//   sc  (m1):  cols 0–19  (full project)
//   jo  (c1):  cols 0–19  (full project)
//   ps  (sa1): cols 5–19  (joins W1 Mon) — cols 0–4 = undefined (not on project)
//   ak  (ja1): cols 2–19  (joins W0 Wed) — cols 0–1 = undefined
//   tb  (sa2): cols 2–14  (W0 Wed → W2 Fri) — cols 0–1 and 15–19 = undefined
//   ml  (ja2): cols 5–19  (joins W1 Mon) — cols 0–4 = undefined
const INITIAL_MEMBER_DATA: Record<string, MemberData> = {
  //                      W0                        W1                    W2 (today=col11)    W3 (future)
  //               M    T    W    T    F    |  M    T    W    T    F  |  M    T    ...
  //                      W0                         W1                    W2 (Mon=col10 last worked, Tue=col11 today)   W3
  sc: { daily: [   8,   7,   9,   9,   8,     9,   8,  10,  10,   9,    8, undefined, undefined, undefined, undefined,  undefined, undefined, undefined, undefined, undefined], happiness: 3, prevHappiness: 4 },
  jo: { daily: [   9,   8,   9,  10,   8,    10,   9,  11,  11,  10,   10, undefined, undefined, undefined, undefined,  undefined, undefined, undefined, undefined, undefined], happiness: 3, prevHappiness: 4 },
  ps: { daily: [undefined, undefined, undefined, undefined, undefined,   9,  9,  10,  9,   9,  null, null, null, null, null,  null, null, null, null, null], happiness: null, prevHappiness: 4 },
  ak: { daily: [undefined, undefined,  8,   8,   7,     8,   8,   8,   8,   8,    8, undefined, undefined, undefined, undefined,  undefined, undefined, undefined, undefined, undefined], happiness: 4, prevHappiness: 4 },
  tb: { daily: [undefined, undefined, 10,  11,   9,    10,  10,  12,  13,  10,   12, undefined, undefined, undefined, undefined,  undefined, undefined, undefined, undefined, undefined], happiness: 2, prevHappiness: 3 },
  ml: { daily: [undefined, undefined, undefined, undefined, undefined,   8,  8,   9,   8,   8,    8, undefined, undefined, undefined, undefined,  undefined, undefined, undefined, undefined, undefined], happiness: 4, prevHappiness: 4 },
};

// ─── Feedback data ────────────────────────────────────────────────────────────

const INITIAL_FEEDBACK: FeedbackItem[] = [
  { id: "f-sc-1", memberId: "sc", category: "strength",
    generatedText: "Sarah has maintained strong day-to-day delivery discipline throughout W2, keeping the risk register current and communicating proactively with the client. Her early warning to James Whitfield about the interim deck timing was well-judged and prevented a client surprise.",
    status: "pending", editText: "" },
  { id: "f-jo-1", memberId: "jo", category: "strength",
    generatedText: "James has demonstrated strong analytical leadership across three workstreams simultaneously — a challenging brief he has managed with clarity and good prioritisation. His expert interview synthesis on FreshCart's competitive moat was particularly sharp and has anchored the investment thesis.",
    status: "pending", editText: "" },
  { id: "f-jo-2", memberId: "jo", category: "development",
    generatedText: "As the project moves into W3 delivery, James should look to delegate more structured analytical tasks to Alex to protect his own capacity for synthesis and storyboarding — the highest-value work for the final report.",
    status: "pending", editText: "" },
  { id: "f-ps-1", memberId: "ps", category: "recognition",
    generatedText: "Priya produced strong cohort analysis and documented the survey methodology thoroughly before her absence this week. Her preparation was detailed enough to allow work to continue uninterrupted — a mark of good project discipline and team awareness.",
    status: "pending", editText: "" },
  { id: "f-ak-1", memberId: "ak", category: "strength",
    generatedText: "Alex has been a reliable supporting resource across three workstreams, handling desk research and slide preparation to a consistently good standard. He has shown initiative in flagging data gaps before being asked — a positive sign of growing commercial awareness.",
    status: "pending", editText: "" },
  { id: "f-tb-1", memberId: "tb", category: "strength",
    generatedText: "Tom has shown impressive technical rigour in the financial model build, independently identifying three material divergences from management's case. His handling of data room access delays has been proactive and professional throughout.",
    status: "pending", editText: "" },
  { id: "f-tb-2", memberId: "tb", category: "development",
    generatedText: "Tom's hours have exceeded 55 in W2, which is unsustainable heading into final week. He should flag to Sarah if scope additions are driving workload beyond plan, and be supported in reprioritising or delegating non-critical model work to Mei.",
    status: "pending", editText: "" },
  { id: "f-ml-1", memberId: "ml", category: "strength",
    generatedText: "Mei has provided reliable analytical support on the financial model and data room review. Her attention to detail in the data reconciliation process has been a valuable check on Tom's model, and she is developing good technical judgement.",
    status: "pending", editText: "" },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const HAPPINESS_EMOJI = ["", "😫", "😕", "😐", "🙂", "😊"];
const HOURS_ALERT = 55;
const HOURS_WARN  = 48;

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; color: string; bg: string }> = {
  strength:    { label: "Strength",    color: "text-green-700", bg: "bg-green-50 border-green-200"  },
  development: { label: "Development", color: "text-amber-700", bg: "bg-amber-50 border-amber-200"  },
  recognition: { label: "Recognition", color: "text-blue-700",  bg: "bg-blue-50 border-blue-200"    },
};

const ROLE_BADGE: Record<Role, string> = {
  "Partner":          "text-violet-700 bg-violet-50",
  "Manager":          "text-blue-700 bg-blue-50",
  "Consultant":       "text-emerald-700 bg-emerald-50",
  "Senior Associate": "text-amber-700 bg-amber-50",
  "Junior Associate": "text-sky-700 bg-sky-50",
};

function shortRole(r: Role) {
  if (r === "Senior Associate") return "Sr. AC";
  if (r === "Junior Associate") return "Jr. AC";
  return r;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function memberById(id: string) {
  return ALL_MEMBERS.find(m => m.id === id)!;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ member, size = "md" }: { member: Member; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : size === "lg" ? "w-12 h-12 text-sm" : "w-9 h-9 text-xs";
  return (
    <div className={`relative shrink-0 ${sz} rounded-full ${member.avatarColor} flex items-center justify-center text-white font-bold`}>
      {member.initials}
      {member.sick && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-card flex items-center justify-center text-[7px] text-white font-bold">!</span>
      )}
    </div>
  );
}

// ─── Org node card ────────────────────────────────────────────────────────────

function OrgCard({ node }: { node: OrgNode }) {
  const m = memberById(node.memberId);
  const hasTags = (node.workstreams?.length ?? 0) > 0 || (node.inputOwners?.length ?? 0) > 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="rounded-lg border border-border bg-card shadow-sm px-3 py-2 flex flex-col gap-1.5" style={{ minWidth: hasTags ? 220 : 140 }}>
        {/* Name + role row */}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground leading-snug truncate">{m.name}</p>
            <p className="text-[10px] text-muted-foreground">{shortRole(m.role)}</p>
          </div>
        </div>
        {/* Tags: workstreams + inputs in one horizontal row */}
        {hasTags && (
          <div className="flex flex-wrap gap-1">
            {node.workstreams?.map(ws => (
              <span
                key={ws}
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: WS_HEX[ws] ?? "#6b7280" }}
              >
                {ws === "Competitive Landscape" ? "Competitive" : ws === "Customer & Commercial" ? "C&C" : ws}
              </span>
            ))}
            {node.inputOwners?.map(inp => (
              <span
                key={inp}
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white border"
                style={{ color: INPUT_HEX[inp] ?? "#6b7280", borderColor: INPUT_HEX[inp] ?? "#6b7280" }}
              >
                {inp === "Management Interviews" ? "Mgmt Int." : inp}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recursive org tree renderer ──────────────────────────────────────────────

function OrgLevel({ nodes, depth = 0 }: { nodes: OrgNode[]; depth?: number }) {
  const isRoot    = depth === 0;
  const connColor = "bg-border";

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Horizontal row of nodes */}
      <div className={`flex items-start gap-6 ${isRoot ? "" : ""}`}>
        {nodes.map((node, i) => {
          const hasChildren = node.children && node.children.length > 0;
          return (
            <div key={node.memberId} className="flex flex-col items-center">
              {/* Card */}
              <OrgCard node={node} />

              {/* Vertical line down to children */}
              {hasChildren && (
                <div className={`w-px h-5 ${connColor}`} />
              )}

              {/* Children */}
              {hasChildren && (
                <div className="flex flex-col items-center">
                  {/* Horizontal bar spanning children */}
                  {node.children!.length > 1 && (
                    <div className="relative flex items-start justify-center w-full">
                      <ChildrenGroup nodes={node.children!} depth={depth + 1} />
                    </div>
                  )}
                  {node.children!.length === 1 && (
                    <OrgLevel nodes={node.children!} depth={depth + 1} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChildrenGroup({ nodes, depth }: { nodes: OrgNode[]; depth: number }) {
  return (
    <div className="flex flex-col items-center">
      {/* Horizontal connector spanning all children */}
      <div className="flex items-start justify-center gap-6 relative">
        {/* Horizontal line across */}
        <div
          className="absolute top-0 bg-border"
          style={{
            height: 1,
            left: "50px",
            right: "50px",
          }}
        />
        {nodes.map(child => {
          const hasChildren = child.children && child.children.length > 0;
          return (
            <div key={child.memberId} className="flex flex-col items-center">
              {/* Drop line from horizontal bar */}
              <div className="w-px h-5 bg-border" />
              <OrgCard node={child} />
              {hasChildren && <div className="w-px h-5 bg-border" />}
              {hasChildren && child.children!.length === 1 && (
                <OrgLevel nodes={child.children!} depth={depth + 1} />
              )}
              {hasChildren && child.children!.length > 1 && (
                <ChildrenGroup nodes={child.children!} depth={depth + 1} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Staffing spans for the delivery team (standard tier, partners excluded) ──
// Used to draw role-colour bars on future days in the merged Gantt.

const MEMBER_STAFFING: Record<string, { startCol: number; endCol: number; roleHex: string }> = {
  sc: { startCol: 0,  endCol: 19, roleHex: ROLE_HEX["Manager"]          },
  jo: { startCol: 0,  endCol: 19, roleHex: ROLE_HEX["Consultant"]       },
  ps: { startCol: 5,  endCol: 19, roleHex: ROLE_HEX["Senior Associate"] },
  ak: { startCol: 2,  endCol: 19, roleHex: ROLE_HEX["Junior Associate"] },
  tb: { startCol: 2,  endCol: 14, roleHex: ROLE_HEX["Senior Associate"] },
  ml: { startCol: 5,  endCol: 19, roleHex: ROLE_HEX["Junior Associate"] },
};

// ─── Merged Gantt: heatmap for past, staffing bar for future ─────────────────

function WorkloadGantt({ members, memberData }: {
  members: Member[];
  memberData: Record<string, MemberData>;
}) {
  const ROW = ROW_H + 8;

  // Today column left edge relative to the start of the full inner div
  const todayLeft = LABEL_W + TODAY_COL * COL_W;

  return (
    <div className="border border-border rounded-xl overflow-x-auto bg-card">
      <div className="relative" style={{ minWidth: LABEL_W + 20 * COL_W }}>

        {/* ── Today column overlay (spans headers + all rows) ── */}
        <div
          className="absolute inset-y-0 pointer-events-none z-30"
          style={{ left: todayLeft, width: COL_W }}
        >
          {/* Blue box */}
          <div className="absolute inset-0 border-x-2 border-blue-400 rounded-sm" />
          {/* "Today" label pinned to top */}
          <div className="absolute top-1 inset-x-0 flex items-center justify-center">
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">Today</span>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex border-b border-border bg-muted/40">
          <div className="shrink-0 border-r border-border/60 flex items-center px-4" style={{ width: LABEL_W }}>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Team member</span>
          </div>
          <div style={{ width: 20 * COL_W }}>
            <div className="flex border-b border-border/40">
              {WEEKS.map(w => (
                <div key={w} className="flex items-center justify-center border-r border-border/30 last:border-r-0 py-1.5" style={{ width: 5 * COL_W }}>
                  <span className="text-[10px] font-semibold text-muted-foreground">{WEEK_LABELS[w]}</span>
                </div>
              ))}
            </div>
            <div className="flex">
              {WEEKS.map(w => DAY_LABELS.map(d => (
                <div key={`${w}-${d}`} className="flex items-center justify-center py-1 border-r border-border/20 last:border-r-0" style={{ width: COL_W }}>
                  <span className="text-[9px] text-muted-foreground/70">{d}</span>
                </div>
              )))}
            </div>
          </div>
          {/* Avg hours header */}
          <div className="shrink-0 border-l border-border/60 flex items-center justify-center px-3" style={{ width: 72 }}>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-center leading-tight">Avg/day</span>
          </div>
        </div>

        {/* Member rows */}
        {members.map(m => {
          const md = memberData[m.id];
          const staffing = MEMBER_STAFFING[m.id];
          const w2hours = (md?.daily ?? []).slice(10, 15).filter((h): h is number => typeof h === "number").reduce((a, b) => a + b, 0);
          const isOver = !m.sick && w2hours > HOURS_ALERT;
          const isWarn = !m.sick && w2hours > HOURS_WARN && w2hours <= HOURS_ALERT;

          // Average daily hours up to and including last worked day
          const workedDays = (md?.daily ?? []).slice(0, LAST_WORKED_COL + 1).filter((h): h is number => typeof h === "number");
          const avgHrs = workedDays.length ? workedDays.reduce((a, b) => a + b, 0) / workedDays.length : null;

          return (
            <div key={m.id} className="flex border-b border-border/30 last:border-b-0" style={{ height: ROW }}>
              {/* Label */}
              <div className="shrink-0 flex items-center px-3 gap-2 border-r border-border/30" style={{ width: LABEL_W }}>
                <Avatar member={m} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground truncate">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">{shortRole(m.role)}</p>
                </div>
                {isOver && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                {isWarn && !isOver && <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </div>

              {/* Day cells */}
              <div className="relative flex" style={{ width: 20 * COL_W }}>
                {/* Week dividers */}
                {[1, 2, 3].map(w => (
                  <div key={w} className="absolute inset-y-0 pointer-events-none z-10"
                    style={{ left: w * 5 * COL_W - 1, width: 2, backgroundColor: "rgba(0,0,0,0.08)" }} />
                ))}

                {Array.from({ length: 20 }, (_, col) => {
                  const h = md?.daily[col];
                  const isPast   = col <= LAST_WORKED_COL;
                  const isAbsent = h === null;
                  const showAbsent = isAbsent && col <= TODAY_COL;
                  const inStaff  = staffing ? col >= staffing.startCol && col <= staffing.endCol : false;

                  let cellBg = "transparent";
                  let cellText = "";
                  let showHours = false;

                  if (showAbsent) {
                    cellBg = "#d1d5db";
                  } else if (isPast && typeof h === "number") {
                    showHours = true;
                    if (h < 10)      { cellBg = "#bbf7d0"; cellText = "#14532d"; }
                    else if (h < 12) { cellBg = "#fef08a"; cellText = "#713f12"; }
                    else             { cellBg = "#fecaca"; cellText = "#7f1d1d"; }
                  }

                  return (
                    <div
                      key={col}
                      className="relative flex items-center justify-center border-r border-black/5 last:border-r-0"
                      style={{ width: COL_W, height: ROW, backgroundColor: cellBg }}
                    >
                      {!isPast && inStaff && staffing && (
                        <div style={{
                          position: "absolute",
                          left: 4, right: 4,
                          top: "50%", transform: "translateY(-50%)",
                          height: ROW - 14,
                          backgroundColor: staffing.roleHex,
                          borderRadius: 3,
                          opacity: 0.22,
                        }} />
                      )}
                      {showHours && (
                        <span className="text-[10px] font-semibold z-10" style={{ color: cellText }}>{h}h</span>
                      )}
                      {showAbsent && (
                        <span className="text-[10px] font-medium text-gray-400 z-10">—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Avg hours cell */}
              <div className="shrink-0 border-l border-border/30 flex items-center justify-center" style={{ width: 72 }}>
                {m.sick ? (
                  <span className="text-[10px] text-muted-foreground">—</span>
                ) : avgHrs !== null ? (
                  <span className={`text-[12px] font-bold tabular-nums ${
                    avgHrs >= 12 ? "text-red-600" : avgHrs >= 10 ? "text-amber-600" : "text-green-700"
                  }`}>{avgHrs.toFixed(1)}h</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TeamStatus() {
  const [memberData, setMemberData] = useState(INITIAL_MEMBER_DATA);
  const [feedback, setFeedback] = useState(INITIAL_FEEDBACK);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedFeedbackMember, setExpandedFeedbackMember] = useState<string | null>("sc");

  // ── Sentiment handler
  function updateHappiness(memberId: string, val: number) {
    setMemberData(prev => ({ ...prev, [memberId]: { ...prev[memberId], happiness: val } }));
  }

  // ── Feedback handlers
  function approveFeedback(id: string) {
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: "approved" } : f));
    setEditingId(null);
  }
  function dismissFeedback(id: string) {
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: "dismissed" } : f));
    setEditingId(null);
  }
  function saveEdit(id: string, text: string) {
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, editText: text } : f));
    setEditingId(null);
  }
  function simulateGenerate(memberId: string) {
    setGeneratingFor(memberId);
    setTimeout(() => setGeneratingFor(null), 1600);
  }

  // ── Per-member stats
  // Average daily hours across all days with recorded hours (up to LAST_WORKED_COL)
  function avgDailyHours(id: string) {
    const days = (memberData[id]?.daily ?? [])
      .slice(0, LAST_WORKED_COL + 1)
      .filter((h): h is number => typeof h === "number");
    return days.length ? days.reduce((a, b) => a + b, 0) / days.length : null;
  }
  // W2 total hours (cols 10–14 past only) — for alert badges
  function weeklyHours(id: string) {
    return (memberData[id]?.daily ?? [])
      .slice(10, 15)
      .filter((h): h is number => typeof h === "number")
      .reduce((a, b) => a + b, 0);
  }
  const overHours  = MEMBERS.filter(m => !m.sick && weeklyHours(m.id) > HOURS_ALERT);
  const warnHours  = MEMBERS.filter(m => !m.sick && weeklyHours(m.id) > HOURS_WARN && weeklyHours(m.id) <= HOURS_ALERT);
  const happyScores = MEMBERS.filter(m => memberData[m.id]?.happiness !== null).map(m => memberData[m.id]?.happiness!);
  const avgHappiness = happyScores.length ? happyScores.reduce((a, b) => a + b, 0) / happyScores.length : 0;
  const pendingCount = feedback.filter(f => f.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Status</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ownership · workload · sentiment · development
              <span className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Tue 2 Jun · Week 2</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {overHours.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertTriangle className="w-3.5 h-3.5" />{overHours.length} member{overHours.length > 1 ? "s" : ""} over 55h
              </span>
            )}
            {warnHours.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                <Clock className="w-3.5 h-3.5" />{warnHours.length} approaching limit
              </span>
            )}
            {(() => {
              const avgs = MEMBERS.filter(m => !m.sick).map(m => avgDailyHours(m.id)).filter((a): a is number => a !== null);
              const teamAvg = avgs.length ? avgs.reduce((a,b)=>a+b,0)/avgs.length : null;
              return teamAvg !== null ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-card border border-border text-muted-foreground">
                  Avg hours/day
                  <span className={`font-bold tabular-nums ${teamAvg >= 12 ? "text-red-600" : teamAvg >= 10 ? "text-amber-600" : "text-green-700"}`}>
                    {teamAvg.toFixed(1)}h
                  </span>
                </span>
              ) : null;
            })()}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-card border border-border text-muted-foreground">
              Avg sentiment
              <span className={`font-bold tabular-nums ${avgHappiness >= 4 ? "text-green-600" : avgHappiness >= 3 ? "text-yellow-600" : "text-red-600"}`}>
                {avgHappiness.toFixed(1)}/5
              </span>
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Sparkles className="w-3.5 h-3.5" />{pendingCount} feedback awaiting approval
              </span>
            )}
          </div>
        </div>

        {/* ── Section 1: Team Structure & Ownership + per-member summary ── */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-1">Team Structure & Ownership</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Reporting lines · workstream ownership · input accountability
            <span className="ml-3 inline-flex items-center gap-2 flex-wrap">
              {Object.entries(WS_HEX).map(([ws, hex]) => (
                <span key={ws} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: hex }} />
                  {ws === "Competitive Landscape" ? "Competitive" : ws === "Customer & Commercial" ? "C&C" : ws}
                </span>
              ))}
              {Object.entries(INPUT_HEX).map(([inp, hex]) => (
                <span key={inp} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded inline-block" style={{ backgroundColor: hex }} />
                  {inp === "Management Interviews" ? "Mgmt Interviews" : inp}
                </span>
              ))}
            </span>
          </p>

          <div className="flex flex-col items-center overflow-x-auto pb-4">
            <div className="flex items-start gap-6">
              {ALL_MEMBERS.filter(m => m.role === "Partner").map(p => (
                <OrgCard key={p.id} node={{ memberId: p.id }} />
              ))}
            </div>
            <div className="w-px h-5 bg-border" />
            <OrgCard node={{ memberId: "sc" }} />
            <div className="w-px h-5 bg-border" />
            <div className="relative flex items-start gap-16">
              <div className="absolute top-0 left-[80px] right-[80px] h-px bg-border" />
              {/* Left track: Consultant */}
              <div className="flex flex-col items-center">
                <div className="w-px h-5 bg-border" />
                <OrgCard node={{
                  memberId: "jo",
                  workstreams: ["Market", "Competitive Landscape", "Customer & Commercial"],
                  inputOwners: ["Expert Interviews"],
                }} />
                <div className="w-px h-5 bg-border" />
                <div className="relative flex items-start gap-6">
                  <div className="absolute top-0 left-[52px] right-[52px] h-px bg-border" />
                  <div className="flex flex-col items-center">
                    <div className="w-px h-5 bg-border" />
                    <OrgCard node={{ memberId: "ps", inputOwners: ["Consumer Survey"] }} />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-px h-5 bg-border" />
                    <OrgCard node={{ memberId: "ak" }} />
                  </div>
                </div>
              </div>
              {/* Right track: Sr. Associate (financials) */}
              <div className="flex flex-col items-center">
                <div className="w-px h-5 bg-border" />
                <OrgCard node={{
                  memberId: "tb",
                  workstreams: ["Financials", "Management"],
                  inputOwners: ["Data Room", "Management Interviews"],
                }} />
                <div className="w-px h-5 bg-border" />
                <div className="flex flex-col items-center">
                  <div className="w-px h-5 bg-border" />
                  <OrgCard node={{ memberId: "ml" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Team Plan & Workload ── */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-1">Team Plan & Workload</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Staffing plan · daily hours heatmap · future availability
            <span className="ml-3 inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px]"><span className="w-3 h-3 rounded-sm inline-block bg-green-200" /> &lt;10h</span>
              <span className="inline-flex items-center gap-1 text-[11px]"><span className="w-3 h-3 rounded-sm inline-block bg-yellow-200" /> 10–12h</span>
              <span className="inline-flex items-center gap-1 text-[11px]"><span className="w-3 h-3 rounded-sm inline-block bg-red-200" /> 12h+</span>
              <span className="inline-flex items-center gap-1 text-[11px]"><span className="w-3 h-3 rounded-sm inline-block bg-gray-200" /> Future</span>
              <span className="inline-flex items-center gap-1 text-[11px]"><span className="w-3 h-3 rounded-sm inline-block bg-gray-500" /> Absent</span>
            </span>
          </p>
          <WorkloadGantt members={MEMBERS} memberData={memberData} />
        </div>

        {/* ── Section 3: Live Feedback ── */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-1">Live Feedback</h2>
          <p className="text-xs text-muted-foreground mb-4">
            AI-generated based on project performance · approve to add to end-of-project review
          </p>
          <div className="space-y-4">
            {MEMBERS.filter(m => feedback.some(f => f.memberId === m.id)).map(m => {
              const memberFeedback = feedback.filter(f => f.memberId === m.id);
              const pending  = memberFeedback.filter(f => f.status === "pending").length;
              const approved = memberFeedback.filter(f => f.status === "approved").length;
              const isExpanded = expandedFeedbackMember === m.id;

              return (
                <Card key={m.id} className="overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                    onClick={() => setExpandedFeedbackMember(isExpanded ? null : m.id)}
                  >
                    <Avatar member={m} size="sm" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground">{m.name}</span>
                      <span className={`ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${ROLE_BADGE[m.role]}`}>
                        {shortRole(m.role)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {pending > 0 && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{pending} pending</span>}
                      {approved > 0 && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">{approved} approved</span>}
                      <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-primary"
                        onClick={e => { e.stopPropagation(); simulateGenerate(m.id); }}
                        disabled={generatingFor === m.id}>
                        <Sparkles className="w-3 h-3" />
                        {generatingFor === m.id ? "Generating…" : "Generate more"}
                      </Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-border/50">
                      {memberFeedback.filter(f => f.status !== "dismissed").map(item => {
                        const cat = CATEGORY_CONFIG[item.category];
                        const isEditing = editingId === item.id;
                        const displayText = item.editText || item.generatedText;
                        return (
                          <div key={item.id} className={`px-5 py-4 ${item.status === "approved" ? "bg-green-50/40" : ""}`}>
                            <div className="flex items-start gap-3">
                              <span className={`shrink-0 mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded border ${cat.bg} ${cat.color}`}>
                                {cat.label}
                              </span>
                              <div className="flex-1 min-w-0">
                                {isEditing ? (
                                  <EditFeedback initial={displayText}
                                    onSave={text => saveEdit(item.id, text)}
                                    onCancel={() => setEditingId(null)} />
                                ) : (
                                  <>
                                    <p className="text-sm text-foreground leading-relaxed">{displayText}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                      {item.status === "pending" ? (
                                        <>
                                          <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => approveFeedback(item.id)}>
                                            <Check className="w-3 h-3" />Approve & add to review
                                          </Button>
                                          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setEditingId(item.id)}>
                                            <Edit3 className="w-3 h-3" />Edit
                                          </Button>
                                          <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-muted-foreground" onClick={() => dismissFeedback(item.id)}>
                                            <X className="w-3 h-3" />Dismiss
                                          </Button>
                                        </>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700">
                                          <Check className="w-3 h-3" />Added to end-of-project review
                                        </span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {memberFeedback.every(f => f.status === "dismissed") && (
                        <div className="px-5 py-6 text-center">
                          <p className="text-sm text-muted-foreground">All feedback dismissed.</p>
                          <Button variant="ghost" size="sm" className="mt-2 text-primary gap-1" onClick={() => simulateGenerate(m.id)}>
                            <Sparkles className="w-3.5 h-3.5" />Generate new feedback
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Inline edit feedback ─────────────────────────────────────────────────────

function EditFeedback({ initial, onSave, onCancel }: { initial: string; onSave: (t: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(initial);
  return (
    <div className="space-y-2">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
        className="w-full text-sm text-foreground leading-relaxed rounded-md border border-border bg-muted/30 p-2.5 focus:outline-none focus:border-primary resize-none" />
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-7 text-[11px]" onClick={() => onSave(text)}>
          <Check className="w-3 h-3 mr-1" />Save edits
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
