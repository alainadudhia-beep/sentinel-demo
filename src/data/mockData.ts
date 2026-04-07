export const sampleEngagementLetter = `ENGAGEMENT LETTER — CONFIDENTIAL

Project: Commercial Due Diligence — Project Falcon
Client: Meridian Capital Partners
Target: FreshCart Ltd (UK online grocery delivery)
Date: 14 March 2025
Prepared by: Apex Strategy Consulting

1. OBJECTIVE
Apex Strategy Consulting ("Apex") has been engaged by Meridian Capital Partners ("the Client") to conduct a commercial due diligence assessment of FreshCart Ltd ("the Target"), a UK-based online grocery delivery platform. The objective is to evaluate market positioning, competitive dynamics, customer retention economics, and growth sustainability to support the Client's investment decision.

2. TIMELINE & FEES
The engagement will run for 3 weeks:
  • Week 1 (17–21 Mar): Scoping, survey design, initial data room review, management interview scheduling
  • Week 2 (24–28 Mar): Survey launch, expert interviews, market model build, consumer insights analysis
  • Week 3 (31 Mar–4 Apr): Synthesis, draft deck, partner review, final presentation

Total fees: £285,000 + VAT
Payment terms: 50% on engagement, 50% on delivery of final report.

3. WORKSTREAMS
  a) Consumer Survey — Design, launch, and analyse a 1,500-respondent survey on grocery delivery preferences, brand perception, and switching behaviour.
  b) Expert Interviews — Conduct 8–10 interviews with industry experts, former employees, and adjacent market participants.
  c) Market Model — Build a bottom-up market sizing model for UK online grocery, including TAM/SAM/SOM analysis and 5-year growth projections.
  d) Management Interviews — 3 sessions with FreshCart leadership covering strategy, operations, and technology roadmap.
  e) Synthesis & Deliverables — Compile findings into a 40–50 slide deck with executive summary, key findings, risk factors, and investment recommendations.

4. DELIVERABLES
  • Weekly status calls with the Client (Mondays at 10am)
  • Interim findings deck (end of Week 2)
  • Draft final report (Wednesday, Week 3)
  • Final presentation to Investment Committee (Friday, Week 3)
  • Survey raw data and model files delivered alongside final report

5. TEAM
  • Sarah Chen — Project Lead
  • James Okafor — Survey & Consumer Insights
  • Priya Sharma — Market Modelling
  • Tom Bradley — Expert Interviews
  • Emma Wilson — Synthesis & Deck

6. ASSUMPTIONS
  • Client will provide data room access by 17 March
  • Management availability confirmed for Weeks 1–2
  • Survey panel recruitment via established provider (5-day turnaround)
  • All deliverables subject to Apex quality review process`;

export type ItemType = "task" | "milestone";

export interface GanttItem {
  id: string;
  label: string;
  type: ItemType;
  owner: string;
  startDay: number; // 1-15 (3 weeks × 5 days)
  endDay: number;   // same as startDay for milestones
  status: "on-track" | "at-risk" | "complete" | "not-started" | "blocked";
  notes?: string;
  dependency?: string;
  dueDate?: string;
  critical?: boolean;
}

export interface Workstream {
  id: string;
  name: string;
  owner: string;
  items: GanttItem[];
}

export const ganttWorkstreams: Workstream[] = [
  {
    id: "ws-survey",
    name: "Survey",
    owner: "James Okafor",
    items: [
      { id: "s1", label: "Design questionnaire", type: "task", owner: "James Okafor", startDay: 1, endDay: 3, status: "complete", dueDate: "19 Mar", dependency: "Data room access" },
      { id: "s2", label: "Launch survey", type: "milestone", owner: "James Okafor", startDay: 4, endDay: 4, status: "at-risk", notes: "Panel recruitment delayed 1 day", dueDate: "20 Mar", dependency: "Survey design", critical: true },
      { id: "s3", label: "Collect responses", type: "task", owner: "James Okafor", startDay: 5, endDay: 9, status: "at-risk", notes: "62% of target responses", dueDate: "28 Mar", dependency: "Survey launch" },
      { id: "s4", label: "Set up analysis framework", type: "task", owner: "James Okafor", startDay: 7, endDay: 8, status: "not-started", dueDate: "27 Mar" },
      { id: "s5", label: "Run analysis (initial data)", type: "task", owner: "James Okafor", startDay: 9, endDay: 11, status: "blocked", notes: "Blocked — waiting on survey responses", dueDate: "31 Mar", dependency: "Survey responses", critical: true },
      { id: "s6", label: "Slide up analysis", type: "task", owner: "James Okafor", startDay: 11, endDay: 12, status: "blocked", dueDate: "1 Apr", dependency: "Initial analysis", notes: "Blocked — waiting on initial analysis" },
      { id: "s7", label: "Run analysis (final data)", type: "task", owner: "James Okafor", startDay: 12, endDay: 13, status: "blocked", dueDate: "2 Apr", dependency: "Full survey data", critical: true, notes: "Blocked — waiting on full survey data" },
      { id: "s8", label: "Update slides", type: "task", owner: "James Okafor", startDay: 13, endDay: 14, status: "blocked", dueDate: "3 Apr", dependency: "Final analysis", notes: "Blocked — waiting on final analysis" },
    ],
  },
  {
    id: "ws-market",
    name: "Market Model",
    owner: "Priya Sharma",
    items: [
      { id: "mm1", label: "Collect data", type: "task", owner: "Priya Sharma", startDay: 1, endDay: 4, status: "complete", dueDate: "20 Mar", dependency: "Data room" },
      { id: "mm2", label: "Build model structure", type: "task", owner: "Priya Sharma", startDay: 3, endDay: 7, status: "at-risk", notes: "Priya off sick since Wednesday", dueDate: "25 Mar" },
      { id: "mm3", label: "Update with inputs", type: "task", owner: "Priya Sharma", startDay: 8, endDay: 10, status: "not-started", dueDate: "28 Mar", dependency: "Model structure" },
      { id: "mm4", label: "Schedule expert interviews", type: "task", owner: "Tom Bradley", startDay: 1, endDay: 3, status: "complete", dueDate: "19 Mar" },
      { id: "mm5", label: "Complete expert interviews", type: "milestone", owner: "Tom Bradley", startDay: 10, endDay: 10, status: "on-track", notes: "6 of 10 completed", dueDate: "28 Mar" },
    ],
  },
  {
    id: "ws-internal",
    name: "Internal Analysis",
    owner: "Tom Bradley",
    items: [
      { id: "ia1", label: "Organise management sessions", type: "task", owner: "Tom Bradley", startDay: 1, endDay: 3, status: "complete", dueDate: "19 Mar", dependency: "Client scheduling" },
      { id: "ia2", label: "Conduct sessions", type: "task", owner: "Tom Bradley", startDay: 4, endDay: 8, status: "at-risk", notes: "Session 2 rescheduled to Thursday", dueDate: "26 Mar", dependency: "Management availability" },
    ],
  },
  {
    id: "ws-presentation",
    name: "Client Communication",
    owner: "Emma Wilson",
    items: [
      { id: "p1", label: "Synthesise deck", type: "task", owner: "Emma Wilson", startDay: 11, endDay: 13, status: "not-started", dueDate: "2 Apr", dependency: "All workstream inputs", critical: true },
      { id: "p2", label: "Partner review", type: "task", owner: "Sarah Chen", startDay: 13, endDay: 14, status: "not-started", dueDate: "3 Apr", dependency: "Draft deck", critical: true },
      { id: "p3", label: "Final presentation", type: "milestone", owner: "Sarah Chen", startDay: 15, endDay: 15, status: "not-started", notes: "Hard deadline — IC meeting", dueDate: "4 Apr", dependency: "Partner sign-off", critical: true },
      { id: "p4", label: "Weekly status call", type: "milestone", owner: "Sarah Chen", startDay: 1, endDay: 1, status: "complete", dueDate: "17 Mar" },
      { id: "p5", label: "Weekly status call", type: "milestone", owner: "Sarah Chen", startDay: 6, endDay: 6, status: "on-track", dueDate: "24 Mar" },
      { id: "p6", label: "Weekly status call", type: "milestone", owner: "Sarah Chen", startDay: 11, endDay: 11, status: "not-started", dueDate: "31 Mar" },
    ],
  },
];

// Keep backward compat for Project page
export interface Milestone {
  id: string;
  workstream: string;
  task: string;
  owner: string;
  dueDate: string;
  week: number;
  dependency: string;
  status: "on-track" | "at-risk" | "complete" | "not-started";
  notes: string;
  critical: boolean;
}

export const generatedPlan: Milestone[] = [
  { id: "m1", workstream: "Survey", task: "Design questionnaire", owner: "James Okafor", dueDate: "19 Mar", week: 1, dependency: "Data room access", status: "complete", notes: "", critical: false },
  { id: "m2", workstream: "Survey", task: "Launch survey (n=1,500)", owner: "James Okafor", dueDate: "20 Mar", week: 1, dependency: "Survey design", status: "at-risk", notes: "Panel recruitment delayed", critical: true },
  { id: "m3", workstream: "Market Model", task: "Build market sizing model", owner: "Priya Sharma", dueDate: "28 Mar", week: 2, dependency: "Data room", status: "at-risk", notes: "Missing competitor pricing", critical: true },
  { id: "m4", workstream: "Internal Analysis", task: "Conduct management sessions", owner: "Tom Bradley", dueDate: "26 Mar", week: 2, dependency: "Client scheduling", status: "at-risk", notes: "Session 2 rescheduled", critical: false },
  { id: "m5", workstream: "Presentation", task: "Synthesise deck", owner: "Emma Wilson", dueDate: "2 Apr", week: 3, dependency: "All inputs", status: "not-started", notes: "Critical path", critical: true },
  { id: "m6", workstream: "Presentation", task: "Partner review", owner: "Sarah Chen", dueDate: "3 Apr", week: 3, dependency: "Draft deck", status: "not-started", notes: "", critical: true },
  { id: "m7", workstream: "Presentation", task: "Final presentation to IC", owner: "Sarah Chen", dueDate: "4 Apr", week: 3, dependency: "Partner sign-off", status: "not-started", notes: "Hard deadline", critical: true },
];
export interface WorkstreamRow {
  id: string;
  workstream: string;
  owner: string;
  dueDate: string;
  status: "on-track" | "at-risk" | "complete";
  dependency: string;
  notes: string;
}

export const liveWorkstreams: WorkstreamRow[] = [
  {
    id: "w1",
    workstream: "Survey Design",
    owner: "James Okafor",
    dueDate: "19 Mar",
    status: "complete",
    dependency: "Data room access",
    notes: "Signed off by Sarah",
  },
  {
    id: "w2",
    workstream: "Survey Launch & Collection",
    owner: "James Okafor",
    dueDate: "28 Mar",
    status: "at-risk",
    dependency: "Survey design",
    notes: "Response rate at 62% — target is 80%",
  },
  {
    id: "w3",
    workstream: "Expert Interviews",
    owner: "Tom Bradley",
    dueDate: "28 Mar",
    status: "on-track",
    dependency: "None",
    notes: "6 of 10 completed",
  },
  {
    id: "w4",
    workstream: "Market Model",
    owner: "Priya Sharma",
    dueDate: "28 Mar",
    status: "at-risk",
    dependency: "Data room",
    notes: "Missing competitor pricing inputs",
  },
  {
    id: "w5",
    workstream: "Management Interviews",
    owner: "Tom Bradley",
    dueDate: "26 Mar",
    status: "at-risk",
    dependency: "Client availability",
    notes: "Session 2 slipped to Thursday",
  },
  {
    id: "w6",
    workstream: "Consumer Insights Analysis",
    owner: "James Okafor",
    dueDate: "1 Apr",
    status: "on-track",
    dependency: "Survey close",
    notes: "Pending survey completion",
  },
  {
    id: "w7",
    workstream: "Synthesis Deck",
    owner: "Emma Wilson",
    dueDate: "2 Apr",
    status: "on-track",
    dependency: "All workstream inputs",
    notes: "Template ready, awaiting content",
  },
  {
    id: "w8",
    workstream: "Partner Review",
    owner: "Sarah Chen",
    dueDate: "3 Apr",
    status: "on-track",
    dependency: "Draft deck",
    notes: "Slot confirmed with partner",
  },
];

export interface Risk {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium";
  whyItMatters: string;
  likelyImpact: string;
  whoShouldAct: string;
  suggestedAction: string;
  draftMessage: string;
}

export const risks: Risk[] = [
  {
    id: "r1",
    title: "Survey response volume below threshold",
    severity: "critical",
    whyItMatters:
      "The consumer survey is at 62% of target (930 of 1,500 responses). If volume doesn't increase by Friday, the insights pack will lack statistical significance for key segments.",
    likelyImpact:
      "Synthesis deck delayed by 2 days. May push partner review into final presentation day, eliminating buffer.",
    whoShouldAct: "James Okafor (survey lead), Sarah Chen (project lead)",
    suggestedAction:
      "Send a follow-up reminder to panel provider requesting priority boost. Consider extending survey by 1 day with adjusted synthesis timeline.",
    draftMessage:
      "Hi James — survey responses are currently at 930/1,500 (62%). We need to hit 1,200 minimum by Friday to keep synthesis on track for Wednesday. Can you contact the panel provider today to request a priority boost? If we can't reach threshold by EOD Thursday, let's discuss extending by one day and adjusting Emma's synthesis timeline. Thanks — Sarah",
  },
  {
    id: "r2",
    title: "Consumer insights inputs missing for slides 11–14",
    severity: "high",
    whyItMatters:
      "Emma's synthesis deck requires consumer insights inputs for the brand perception and switching behaviour sections (slides 11–14). These haven't been delivered yet.",
    likelyImpact:
      "Draft deck will be incomplete for partner review. Could require a second review cycle, risking the Friday IC deadline.",
    whoShouldAct: "James Okafor, Emma Wilson",
    suggestedAction:
      "Confirm delivery timing with James. If inputs won't be ready by Monday, restructure deck to move these slides to an appendix for now.",
    draftMessage:
      "Hi James — we're at risk of delaying synthesis because inputs for slides 11–14 (brand perception & switching behaviour) are still missing. Could you confirm timing by 3pm today? If we can't have them by Monday morning, we may need to move these to an appendix and flag as preliminary in the partner review. Let me know — Emma",
  },
  {
    id: "r3",
    title: "Management interview timing slipped",
    severity: "medium",
    whyItMatters:
      "The second management interview was rescheduled from Tuesday to Thursday. This compresses the time Tom has to incorporate management perspectives into the expert interview synthesis.",
    likelyImpact:
      "Tom's expert interview summary may not include management cross-references. Could weaken the competitive dynamics section of the final deck.",
    whoShouldAct: "Tom Bradley, Sarah Chen",
    suggestedAction:
      "Ask Tom to draft the expert interview section with placeholders for management inputs, to be filled Thursday evening.",
    draftMessage:
      "Hi Tom — since the second management interview moved to Thursday, can you draft the expert interview synthesis with placeholder sections for management cross-references? That way Emma can start building the relevant slides and you can drop in the final inputs Thursday evening. Flag if this creates any issues with your Friday commitments. Thanks — Sarah",
  },
  {
    id: "r4",
    title: "Priya off sick — market model delayed",
    severity: "high",
    whyItMatters:
      "Priya Sharma has been off sick since Wednesday. The market model is partially complete but missing the competitor pricing layer and 5-year projections.",
    likelyImpact:
      "Market model won't be ready for Week 3 synthesis. The TAM/SAM/SOM section of the deck will be incomplete for partner review.",
    whoShouldAct: "Sarah Chen (project lead)",
    suggestedAction:
      "Reassign the competitor pricing layer to another team member - suggest James given the survey delays. Consider simplifying the 5-year projection to a sensitivity range.",
    draftMessage:
      "Hi Priya — hope you're feeling better. Wanted to check in on the market model. The competitor pricing layer and 5-year projections are the two outstanding pieces. Could you share your working files so we can have someone else pick up the pricing layer? No pressure — your health comes first. Let me know what works. — Sarah",
  },
];
