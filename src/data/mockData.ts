export const ganttWorkstreams: Workstream[] = [
  {
    id: "ws-survey",
    name: "Commercial",
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
    name: "Market",
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
    name: "Internals",
    owner: "Tom Bradley",
    items: [
      { id: "ia1", label: "Organise management sessions", type: "task", owner: "Tom Bradley", startDay: 1, endDay: 3, status: "complete", dueDate: "19 Mar", dependency: "Client scheduling" },
      { id: "ia2", label: "Conduct sessions", type: "task", owner: "Tom Bradley", startDay: 4, endDay: 8, status: "at-risk", notes: "Session 2 rescheduled to Thursday", dueDate: "26 Mar", dependency: "Management availability" },
    ],
  },
  {
    id: "ws-presentation",
    name: "Client Communication\n",
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
