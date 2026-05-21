import { createContext, useContext, useState, ReactNode } from "react";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  text: string;
  priority: "critical" | "important" | "nice-to-have";
  dueBy: "interim" | "final";
}

export type InputRelationship = "critical" | "supporting";

export interface Deliverable {
  id: string;
  name: string;
  inputMap: Record<string, InputRelationship>; // input label → relationship type
}

export interface WorkstreamDef {
  id: string;
  name: string;
  colorClass: string;
  owner: string;
  questions: Question[];
  deliverables: Deliverable[];
  removable?: boolean;
}

export interface RiskFlag {
  id: string;
  severity: "critical" | "amber";
  title: string;
  historical: string;
  detail: string;
  recommendation: string;
  clause: string;
}

export interface CalendarMilestone {
  id: string;
  week: 0 | 1 | 2 | 3;
  dayCol: 0 | 1 | 2 | 3 | 4; // Mon=0 … Fri=4
  label: string;
  rag: "red" | "amber" | "green";
  critical?: boolean;
  blocks: string;
  feedsWorkstreams?: string[];
}

// ─── Input pipeline + client cadence types ────────────────────────────────────

export interface PipelinePhase {
  id: string;
  label: string;
  week: 0 | 1 | 2 | 3;
  day: 0 | 1 | 2 | 3 | 4; // Mon=0 … Fri=4
}

export interface InputPipelineRow {
  inputId: string;
  inputLabel: string;
  phases: PipelinePhase[];
}

export interface ClientTouchpoint {
  id: string;
  label: string;
  week: 0 | 1 | 2 | 3;
  day: 0 | 1 | 2 | 3 | 4;
  agenda: string;
  type?: "client" | "internal" | "partner";
}

// ─── Static data (shared, immutable) ──────────────────────────────────────────

export const RISK_FLAGS: RiskFlag[] = [
  {
    id: "rf1",
    severity: "critical",
    title: "Data room access — high probability of delay",
    historical: "3 of 5 recent CVC deals",
    detail:
      "Data room access was delayed on 3 of the last 5 engagements with the client. This blocks the analytical start on Day 1 and compresses the entire delivery timeline — directly threatening the interim findings date.",
    recommendation:
      "Require confirmed data room access as a condition of the engagement letter. If access is not in place by Day 1, project will likely need an extension. Make this a named Week 0 deliverable with a named CVC contact responsible.",
    clause: "Data room access — condition precedent to project start",
  },
  {
    id: "rf2",
    severity: "amber",
    title: "Unscoped additions — CVC pattern of mid-project changes",
    historical: "Occurred on 4 of last 4 CVC engagements",
    detail:
      "CVC consistently adds 1–2 questions via email mid-project. On previous engagements this resulted in unscoped work absorbed by OC&C with no fee adjustment. With a 3-week timeline there is no slack to absorb additions without impacting delivery.",
    recommendation:
      "Include a change control clause defining what triggers a scope change, the process for agreeing it, and the fee and timeline implications. Agree that requests will be prioritised against existing questions and reprioritised with client approval as needed to ensure timely delivery. If reprioritisation is not approved, project extensions will be at the cost of the client.",
    clause: "Change control — scope additions require written agreement",
  },
  {
    id: "rf3",
    severity: "amber",
    title: "Dependency chain compression — tight IC deadline",
    historical: "IC in 4 weeks, 3-week delivery window",
    detail:
      "The IC deadline leaves a 3-week delivery window after ramp. Interim findings are required mid-week 2. Any slip on inputs to the interim findings date, with no buffer for additional scope before the final deck deadline.",
    recommendation:
      "Agree to regularly update the client outside of formal meetings to prevent misaligned expectations. If scope materially changes after Interim presentation, OC&C is not liable for delays to IC materials or project extensions to cover additional questions.",
    clause: "Named input dates — delays shift delivery timeline proportionally",
  },
];

export const CI_CHIPS = [
  { label: "Data room delays",        flagId: "rf1", severity: "critical" as const },
  { label: "Mid-project scope creep", flagId: "rf2", severity: "amber"    as const },
  { label: "Tight IC deadline",       flagId: "rf3", severity: "amber"    as const },
];

export const ADDABLE_WORKSTREAMS: WorkstreamDef[] = [
  { id: "legal", name: "Legal & Regulatory", colorClass: "text-slate-600", owner: "", questions: [], deliverables: [], removable: true },
  { id: "tech",  name: "Tech & Product",     colorClass: "text-cyan-600",  owner: "", questions: [], deliverables: [], removable: true },
];

// Global input columns for the analytical work map (step 3)
export const INITIAL_INPUT_COLUMNS = ["Data room", "Consumer survey", "Expert interviews", "Management interviews"];

const INITIAL_WORKSTREAMS: WorkstreamDef[] = [
  {
    id: "market",
    name: "Market",
    colorClass: "text-blue-600",
    owner: "Priya Sharma",
    questions: [
      { id: "m1", text: "What is FreshCart's current market share and how is it trending?", priority: "critical", dueBy: "interim" },
      { id: "m2", text: "What are the key drivers of market share movement — pricing, product, or structural?", priority: "critical", dueBy: "interim" },
      { id: "m3", text: "What is the TAM for UK online grocery delivery and the 5-year growth outlook?", priority: "important", dueBy: "final" },
      { id: "m4", text: "Bottom-up market sizing across urban, suburban, and rural customer segments", priority: "important", dueBy: "final" },
    ],
    deliverables: [
      { id: "d-m1", name: "Market sizing model",   inputMap: { "Consumer survey": "critical", "Expert interviews": "critical" } },
      { id: "d-m2", name: "Market drivers",         inputMap: { "Expert interviews": "critical", "Management interviews": "supporting", "Consumer survey": "supporting" } },
    ],
  },
  {
    id: "competitive",
    name: "Competitive Landscape",
    colorClass: "text-violet-600",
    owner: "James Okafor",
    questions: [
      { id: "c1", text: "Does FreshCart have a genuine competitive moat or is it riding a structural tailwind?", priority: "critical", dueBy: "interim" },
      { id: "c2", text: "How is Ocado positioned vs FreshCart and what is the competitive trajectory?", priority: "important", dueBy: "final" },
      { id: "c3", text: "How are major supermarkets (Tesco, Sainsbury's, Morrisons) expanding into online grocery?", priority: "important", dueBy: "final" },
      { id: "c4", text: "Who is gaining share and what are the key drivers of competitive advantage?", priority: "important", dueBy: "final" },
    ],
    deliverables: [
      { id: "d-c1", name: "Competitive positioning framework", inputMap: { "Expert interviews": "critical", "Management interviews": "supporting", "Consumer survey": "supporting" } },
      { id: "d-c2", name: "Share movement analysis",           inputMap: { "Expert interviews": "critical", "Consumer survey": "supporting" } },
    ],
  },
  {
    id: "commercial",
    name: "Customer & Commercial",
    colorClass: "text-emerald-600",
    owner: "James Okafor",
    questions: [
      { id: "cc1", text: "Is customer retention genuine or driven by discounts and promotional spend?", priority: "critical", dueBy: "interim" },
      { id: "cc2", text: "What do cohort curves show about retention quality across acquisition vintages?", priority: "critical", dueBy: "interim" },
      { id: "cc3", text: "What are the unit economics at scale — basket size, contribution margin, LTV/CAC?", priority: "critical", dueBy: "interim" },
      { id: "cc4", text: "What is brand perception and switching behaviour among FreshCart customers?", priority: "important", dueBy: "final" },
    ],
    deliverables: [
      { id: "d-cc1", name: "Customer survey analysis", inputMap: { "Consumer survey": "critical" } },
      { id: "d-cc2", name: "Cohort & retention model", inputMap: { "Data room": "critical", "Consumer survey": "supporting", "Management interviews": "supporting" } },
      { id: "d-cc3", name: "Unit economics model",     inputMap: { "Data room": "critical", "Management interviews": "supporting" } },
    ],
  },
  {
    id: "financials",
    name: "Financials",
    colorClass: "text-orange-500",
    owner: "Tom Bradley",
    questions: [
      { id: "f1", text: "Build independent financial model — do not rely on management's version", priority: "critical", dueBy: "interim" },
      { id: "f2", text: "Are unit economics viable at scale? Validate EBITDA margin assumptions at target revenue.", priority: "critical", dueBy: "interim" },
      { id: "f3", text: "How credible is the revenue growth trajectory? Stress test top-line assumptions.", priority: "important", dueBy: "final" },
      { id: "f4", text: "Cash flow profile through investment horizon and realistic path to profitability", priority: "important", dueBy: "final" },
    ],
    deliverables: [
      { id: "d-f1", name: "Independent financial model", inputMap: { "Data room": "critical", "Management interviews": "supporting" } },
      { id: "d-f2", name: "EBITDA margin stress test",   inputMap: { "Data room": "critical", "Management interviews": "supporting" } },
    ],
  },
  {
    id: "management",
    name: "Management",
    colorClass: "text-rose-600",
    owner: "Tom Bradley",
    questions: [
      { id: "mg1", text: "How credible is the CFO given limited tenure? Assess track record and capability.", priority: "critical", dueBy: "interim" },
      { id: "mg2", text: "Are new geography expansion assumptions realistic and independently stress-tested?", priority: "critical", dueBy: "interim" },
      { id: "mg3", text: "How strong is the CEO and what is the leadership team's delivery track record?", priority: "important", dueBy: "final" },
      { id: "mg4", text: "What is the management growth plan and how robust are the underlying assumptions?", priority: "important", dueBy: "final" },
    ],
    deliverables: [
      { id: "d-mg1", name: "Management interview synthesis", inputMap: { "Management interviews": "critical", "Data room": "supporting" } },
      { id: "d-mg2", name: "CFO credibility assessment",     inputMap: { "Management interviews": "critical", "Data room": "supporting" } },
    ],
  },
];

const INITIAL_INPUT_PIPELINE: InputPipelineRow[] = [
  {
    inputId: "data-room",
    inputLabel: "Data room",
    phases: [
      { id: "dr-1", label: "Access requested",    week: 0, day: 0 }, // W0 Mon — ramp
      { id: "dr-2", label: "Access confirmed",     week: 0, day: 4 }, // W0 Fri
      { id: "dr-3", label: "Analysis window open", week: 1, day: 0 }, // W1 Mon
    ],
  },
  {
    inputId: "survey",
    inputLabel: "Consumer survey",
    phases: [
      { id: "sv-1", label: "Draft to client",  week: 0, day: 4 }, // W0 Fri — ramp
      { id: "sv-2", label: "Final sign-off",   week: 1, day: 1 }, // W1 Tue
      { id: "sv-3", label: "Survey launched",  week: 1, day: 4 }, // W1 Fri
      { id: "sv-4", label: "Fieldwork closes", week: 2, day: 4 }, // W2 Fri
    ],
  },
  {
    inputId: "expert",
    inputLabel: "Expert interviews",
    phases: [
      { id: "ex-2", label: "Network contacted", week: 0, day: 2 }, // W0 Wed — ramp
      { id: "ex-4", label: "All complete",      week: 2, day: 4 }, // W2 Fri
    ],
  },
  {
    inputId: "mgmt",
    inputLabel: "Management interviews",
    phases: [
      { id: "mg-1", label: "Schedule to CVC",  week: 0, day: 1 }, // W0 Tue — ramp
      { id: "mg-2", label: "Schedule confirmed", week: 0, day: 3 }, // W0 Thu
      { id: "mg-3", label: "First interview",    week: 1, day: 1 }, // W1 Tue
      { id: "mg-4", label: "All complete",       week: 1, day: 3 }, // W1 Thu
    ],
  },
];

const INITIAL_CLIENT_TOUCHPOINTS: ClientTouchpoint[] = [
  // ── Client touchpoints ──────────────────────────────────────────────────────
  { id: "tp-1",   label: "Kickoff call",            week: 0, day: 0, type: "client",   agenda: "Align on scope, workstreams & key questions. Confirm data room access and interview schedule." },
  { id: "tp-2",   label: "Week 0 check-in",         week: 0, day: 4, type: "client",   agenda: "Data room access confirmed. Expert interview screener sign-off. Surface any data gaps early." },
  { id: "tp-w1",  label: "Week 1 check-in",          week: 1, day: 3, type: "client",   agenda: "Progress update. Surface any data room gaps or early interview findings. Align on interim findings structure." },
  { id: "tp-3",   label: "Interim findings",        week: 2, day: 3, type: "client",   agenda: "Share draft market & customer findings. Validate hypotheses. Align on IC narrative before final push." },
  { id: "tp-4",   label: "Pre-IC briefing",         week: 3, day: 1, type: "client",   agenda: "Walk through final deck structure. Align on IC narrative and key messages." },
  { id: "tp-5",   label: "Final deck delivery",     week: 3, day: 4, type: "client",   agenda: "Deliver final CDD report and IC-ready recommendation." },
  // ── Internal holds ──────────────────────────────────────────────────────────
  { id: "tp-i1",  label: "Team kickoff",            week: 0, day: 0, type: "internal", agenda: "Internal team alignment on workstreams, approach and owner assignments." },
  { id: "tp-i2",  label: "Team sync",               week: 0, day: 1, type: "internal", agenda: "Progress check · blockers · priorities." },
  { id: "tp-i3",  label: "Team sync",               week: 0, day: 3, type: "internal", agenda: "Progress check · blockers · priorities." },
  { id: "tp-i4",  label: "Team standup",            week: 1, day: 0, type: "internal", agenda: "Weekly kick-off · priorities for the week." },
  { id: "tp-i5",  label: "Team sync",               week: 1, day: 1, type: "internal", agenda: "Progress check · blockers · priorities." },
  { id: "tp-i6",  label: "Team sync",               week: 1, day: 3, type: "internal", agenda: "Progress check · blockers · priorities." },
  { id: "tp-i7",  label: "Team standup",            week: 2, day: 0, type: "internal", agenda: "Weekly kick-off · priorities for the week." },
  { id: "tp-i8",  label: "Team sync",               week: 2, day: 1, type: "internal", agenda: "Progress check ahead of interim findings." },
  { id: "tp-i9",  label: "Team sync",               week: 2, day: 4, type: "internal", agenda: "End-of-week wrap · final push priorities." },
  { id: "tp-i10", label: "Team standup",            week: 3, day: 0, type: "internal", agenda: "Final sprint kick-off · priorities." },
  { id: "tp-i11", label: "Team sync",               week: 3, day: 2, type: "internal", agenda: "Final sprint sync before delivery." },
  // ── Partner review holds ────────────────────────────────────────────────────
  { id: "tp-p1",  label: "Partner check-in",        week: 1, day: 2, type: "partner",  agenda: "Early partner view on analytical direction and emerging hypotheses." },
  { id: "tp-p2",  label: "Partner review",          week: 2, day: 0, type: "partner",  agenda: "Partner review of workstream progress ahead of interim." },
  { id: "tp-p3",  label: "Partner review — interim",week: 2, day: 2, type: "partner",  agenda: "Partner review of interim deck structure and key messages." },
  { id: "tp-p4",  label: "Partner sign-off",        week: 3, day: 3, type: "partner",  agenda: "Final partner sign-off on deck before delivery." },
];

const INITIAL_MILESTONES: CalendarMilestone[] = [
  { id: "cm1", week: 0, dayCol: 4, label: "Data room access",           rag: "red",   critical: true,  blocks: "Financial model & all data analysis", feedsWorkstreams: ["financials", "management"] },
  { id: "cm2", week: 0, dayCol: 1, label: "Mgmt interview schedule",    rag: "amber", critical: false, blocks: "Management credibility assessment",   feedsWorkstreams: ["management"] },
  { id: "cm3", week: 1, dayCol: 1, label: "Consumer survey launched",   rag: "amber", critical: false, blocks: "Customer retention analysis",         feedsWorkstreams: ["market", "competitive", "commercial"] },
  { id: "cm4", week: 1, dayCol: 4, label: "Expert interviews complete", rag: "green", critical: false, blocks: "Competitive positioning section",     feedsWorkstreams: ["market", "competitive"] },
  { id: "cm5", week: 2, dayCol: 3, label: "Interim findings to client", rag: "amber", critical: false, blocks: "Final deck structure & narrative",    feedsWorkstreams: [] },
  { id: "cm6", week: 3, dayCol: 4, label: "Final deck delivered",       rag: "green", critical: false, blocks: "IC presentation",                    feedsWorkstreams: [] },
];

// ─── Scoping step definitions (shared with TopNav + pages) ───────────────────

export const SCOPING_STEPS = [
  { path: "/scoping-call",   label: "Transcript" },
  { path: "/scoping-review", label: "Questions"  },
  { path: "/scope-review",   label: "Work Map"   },
  { path: "/plan",           label: "Planning"   },
  { path: "/team",           label: "Team"       },
  { path: "/letter",              label: "Summary"    },
  { path: "/engagement-letter",  label: "Letter"     },
] as const;

export type ScopingStepPath = (typeof SCOPING_STEPS)[number]["path"];

// ─── Context ──────────────────────────────────────────────────────────────────

interface ProjectContextValue {
  milestones: CalendarMilestone[];
  setMilestones: React.Dispatch<React.SetStateAction<CalendarMilestone[]>>;

  workstreams: WorkstreamDef[];
  setWorkstreams: React.Dispatch<React.SetStateAction<WorkstreamDef[]>>;

  approvedFlags: Set<string>;
  approveFlag: (id: string) => void;

  // Partner / manager / client approvals (shared across Summary and Letter pages)
  approvals: Record<string, boolean>;
  setApproval: (key: string, value: boolean) => void;

  // Scoping wizard progress — index of the furthest step the user has reached
  furthestScopingStep: number;
  advanceScopingStep: (toIndex: number) => void;

  // Global input columns for the analytical work map (step 3)
  inputColumns: string[];
  setInputColumns: React.Dispatch<React.SetStateAction<string[]>>;

  // Persisted transcript from step 1
  transcript: string;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;

  // Selected pricing tier from Engagement page ("A" | "B" | "C")
  selectedTier: string;
  setSelectedTier: React.Dispatch<React.SetStateAction<string>>;

  // Input dependency pipeline (editable in Plan, feeds Letter §3)
  inputPipeline: InputPipelineRow[];
  setInputPipeline: React.Dispatch<React.SetStateAction<InputPipelineRow[]>>;

  // Client meeting cadence (editable in Plan, feeds Letter §3)
  clientTouchpoints: ClientTouchpoint[];
  setClientTouchpoints: React.Dispatch<React.SetStateAction<ClientTouchpoint[]>>;
}

const ProjectContext = createContext<ProjectContextValue>(null!);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [milestones, setMilestones] = useState<CalendarMilestone[]>(INITIAL_MILESTONES);
  const [workstreams, setWorkstreams] = useState<WorkstreamDef[]>(
    INITIAL_WORKSTREAMS.map((ws) => ({ ...ws, questions: [...ws.questions] }))
  );
  const [approvedFlags, setApprovedFlags] = useState<Set<string>>(new Set());
  const [approvals, setApprovalsState] = useState<Record<string, boolean>>({
    partner1: false, partner2: false, manager: false, client: false,
  });
  const [furthestScopingStep, setFurthestScopingStep] = useState(SCOPING_STEPS.length - 1);
  const [transcript, setTranscript] = useState("");
  const [inputColumns, setInputColumns] = useState<string[]>(INITIAL_INPUT_COLUMNS);
  const [selectedTier, setSelectedTier] = useState("B");
  const [inputPipeline, setInputPipeline] = useState<InputPipelineRow[]>(INITIAL_INPUT_PIPELINE);
  const [clientTouchpoints, setClientTouchpoints] = useState<ClientTouchpoint[]>(INITIAL_CLIENT_TOUCHPOINTS);

  const approveFlag = (id: string) =>
    setApprovedFlags((prev) => new Set([...prev, id]));

  const setApproval = (key: string, value: boolean) =>
    setApprovalsState(prev => ({ ...prev, [key]: value }));

  const advanceScopingStep = (toIndex: number) =>
    setFurthestScopingStep((prev) => Math.max(prev, toIndex));

  return (
    <ProjectContext.Provider value={{
      milestones, setMilestones,
      workstreams, setWorkstreams,
      approvedFlags, approveFlag,
      approvals, setApproval,
      furthestScopingStep, advanceScopingStep,
      inputColumns, setInputColumns,
      transcript, setTranscript,
      selectedTier, setSelectedTier,
      inputPipeline, setInputPipeline,
      clientTouchpoints, setClientTouchpoints,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
