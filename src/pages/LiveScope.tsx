import { useState, useMemo } from "react";
import {
  Mail, Plus, Sparkles, CheckCircle2, Circle,
  AlertTriangle, Clock, ShieldCheck, ShieldAlert, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/context/ProjectContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveQuestion {
  id: string;
  question: string;
  workstream: string;
  workstreamColor: string;
  status: "answered" | "in-progress" | "open" | "new";
  priority: "critical" | "important" | "nice-to-have";
  deadline: string;
  source: string;
  notes?: string;
  depth?: { level: "high" | "medium" | "low"; note: string };
}

// ─── Demo enrichment ──────────────────────────────────────────────────────────
// Maps question id → demo status/notes so a subset look in-flight for the demo

const DEMO_ENRICHMENT: Record<string, Partial<LiveQuestion>> = {
  // ── Market (Priya Sharma off sick — model stalled, at risk) ───────────────
  "market-q1": {
    status: "answered",
    notes: "FreshCart holds ~14% share of UK online grocery, up from 11% in 2023. Strong growth in urban delivery corridors. Cross-referenced Kantar, Mintel and VDR data.",
    depth: { level: "high", note: "Cross-referenced with VDR data and expert interviews" },
  },
  "market-q2": {
    status: "in-progress",
    notes: "Initial analysis points to fulfilment speed and dark store density as primary drivers. Expert call triangulation underway — 2 interviews remain.",
    depth: { level: "medium", note: "Pending 2 remaining expert interviews — at risk due to analyst absence" },
  },
  "market-q3": {
    status: "in-progress",
    notes: "Bottom-up TAM model started — early estimate £8.2bn by 2029. Progress blocked by Priya's absence; model handover to Tom in progress.",
    depth: { level: "medium", note: "Model at risk — Priya off sick, handover to Tom Bradley underway" },
  },
  "market-q4": {
    status: "open",
    notes: "Segment sizing (urban / suburban / rural) not yet started. Dependent on TAM model completion.",
    depth: { level: "low", note: "Blocked until market model is complete" },
  },

  // ── Competitive Landscape (management interview slipped) ──────────────────
  "competitive-q1": {
    status: "answered",
    notes: "Moat is structural — last-mile dark store density and proprietary routing algorithm. Not primarily promotional. Expert interviews confirm 12–18 month replication lag for nearest competitor.",
    depth: { level: "high", note: "Validated via 4 expert interviews and internal market data" },
  },
  "competitive-q2": {
    status: "in-progress",
    notes: "Ocado diverging upmarket into B2B logistics. FreshCart gaining share in mid-market. Trajectory analysis 70% complete — pending final Ocado earnings review.",
    depth: { level: "medium", note: "Pending Ocado Q1 earnings review (published Wed)" },
  },
  "competitive-q3": {
    status: "in-progress",
    notes: "Supermarket online arms (Tesco, Sainsbury's, Morrisons) are investing but constrained by legacy fulfilment. Initial view formed — requires management interview triangulation.",
    depth: { level: "medium", note: "Triangulation pending management interview session 2 (Thu)" },
  },
  "competitive-q4": {
    status: "open",
    notes: "Share movement attribution not yet started. Dependent on completing expert interviews and management session 2.",
    depth: { level: "low", note: "Open — dependent on expert interview completion and management session 2" },
  },

  // ── Customer & Commercial (survey delayed — response rate at 62%) ─────────
  "commercial-q1": {
    status: "answered",
    notes: "Retention is genuine — discount dependency declining year-on-year vs 2022 cohorts. NPS data strong. Independently verified with credit card panel data.",
    depth: { level: "high", note: "Cohort data from VDR, independently verified via credit card panel" },
  },
  "commercial-q2": {
    status: "in-progress",
    notes: "Cohort curve analysis underway. 2021 cohort: 78% 12-month retention vs 71% for 2020. Survey data pending — panel recruitment at 62% response rate vs 80% target.",
    depth: { level: "medium", note: "Survey at risk — response rate 62% vs 80% target; panel vendor chasing" },
  },
  "commercial-q3": {
    status: "in-progress",
    notes: "Unit economics model in early stages. Data room has P&L by channel but dark store-level breakdowns not yet received. LTV/CAC analysis blocked pending survey completion.",
    depth: { level: "medium", note: "Partially at risk — dark store P&L data not yet in data room" },
  },
  "commercial-q4": {
    status: "open",
    notes: "Brand perception and switching behaviour analysis not yet started. Dependent on survey completion.",
    depth: { level: "low", note: "Open — blocked until survey reaches minimum response threshold" },
  },

  // ── Financials (data room access gaps — at risk) ──────────────────────────
  "financials-q1": {
    status: "in-progress",
    notes: "Independent model build underway. Identified 3 key divergences vs management case — revenue growth, margin trajectory, and capex phasing. Data room access partially granted; W1 folder still locked.",
    depth: { level: "medium", note: "Model in progress — data room W1 folder access outstanding" },
  },
  "financials-q2": {
    status: "in-progress",
    notes: "EBITDA margin stress test started. Base case margin of 12% by 2027 appears optimistic — dark store opex assumptions under scrutiny. Awaiting granular cost data from data room.",
    depth: { level: "medium", note: "Stress test at risk — granular cost data not yet received" },
  },
  "financials-q3": {
    status: "open",
    notes: "Revenue stress test not yet started. Dependent on resolving CFO's top-line assumptions vs bottom-up model.",
    depth: { level: "low", note: "Open — dependent on management interview and model completion" },
  },
  "financials-q4": {
    status: "open",
    notes: "Cash flow and profitability path analysis not yet started. Will follow financial model completion.",
    depth: { level: "low", note: "Open — downstream of financial model build" },
  },

  // ── Management (interview session 2 rescheduled to Thu) ───────────────────
  "management-q1": {
    status: "answered",
    notes: "CFO (18-month tenure) has strong operational background from Sainsbury's. Reference checks completed with 2 former colleagues. Track record verified — promoted to CFO role 6 months ahead of schedule.",
    depth: { level: "high", note: "Reference checks completed; LinkedIn and press cross-check done" },
  },
  "management-q2": {
    status: "in-progress",
    notes: "Geographic expansion assumptions under review — management's 40% growth assumption for Scotland rollout appears aggressive vs comparable dark store launches. Requires session 2 deep-dive (Thu).",
    depth: { level: "medium", note: "Pending management interview session 2 (Thu 4 Jun) — slipped from Wed" },
  },
  "management-q3": {
    status: "open",
    notes: "CEO assessment not yet completed. Initial impression from session 1 positive — strong operator, clear on unit economics. Full write-up post session 2.",
    depth: { level: "low", note: "Open — awaiting management interview session 2" },
  },
  "management-q4": {
    status: "open",
    notes: "Management growth plan stress test not started. Dependent on session 2 and financial model.",
    depth: { level: "low", note: "Open — dependent on management session 2 and financial model" },
  },
};

// ─── Email simulation ─────────────────────────────────────────────────────────

const NEW_EMAIL_QUESTION: Omit<LiveQuestion, "workstreamColor"> = {
  id: "email-q1",
  question: "FreshCart's dark store rollout plan — can we stress-test the unit economics per dark store and model break-even timing?",
  workstream: "Customer & Commercial",
  status: "new",
  priority: "important",
  deadline: "Thu 4 Jun",
  source: "Client email — auto-detected",
  notes: undefined,
};

const EMAIL_CHAIN = [
  {
    id: "e1",
    from: "James Whitfield (CVC Capital Partners)",
    to: "OC&C Team",
    time: "Today 9:14 AM",
    subject: "Re: FreshCart CDD — dark store economics",
    body: `Hi team,

One thing we'd like to understand better — FreshCart's dark store rollout is a big part of their growth story. Can you stress-test the unit economics per dark store and model the break-even timing under different volume assumptions?

Would be great to have a view on this for the interim.

Thanks,
James`,
  },
  {
    id: "e2",
    from: "Sentinel",
    to: "OC&C Team",
    time: "Today 9:14 AM",
    subject: "🔔 New scope item detected from client email",
    body: `New scope item detected from James Whitfield's email:

"Stress-test dark store unit economics and model break-even timing"

Auto-routed to: Customer & Commercial workstream
Team notified: Lead consultant assigned
Priority: Important — relates to core investment thesis

Action: Review and confirm addition to live scope →`,
    isBot: true,
  },
];

// ─── Display config ───────────────────────────────────────────────────────────

const statusConfig = {
  answered:    { icon: CheckCircle2, color: "text-green-600",          bg: "bg-green-50",    label: "Answered"         },
  "in-progress": { icon: Clock,      color: "text-amber-600",          bg: "bg-amber-50",    label: "In Progress"      },
  open:        { icon: Circle,       color: "text-muted-foreground",   bg: "bg-muted",       label: "Open"             },
  new:         { icon: Sparkles,     color: "text-primary",            bg: "bg-primary/10",  label: "New — Auto-detected" },
};

const priorityConfig = {
  critical:       { label: "Critical",      color: "text-red-700",            bg: "bg-red-50"    },
  important:      { label: "Important",     color: "text-amber-700",          bg: "bg-amber-50"  },
  "nice-to-have": { label: "Nice to have",  color: "text-muted-foreground",   bg: "bg-muted"     },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LiveScope() {
  const { workstreams } = useProject();

  const [extraQuestions, setExtraQuestions] = useState<LiveQuestion[]>([]);
  const [showEmailChain, setShowEmailChain] = useState(false);
  const [emailDetected, setEmailDetected] = useState(false);
  const [questionAdded, setQuestionAdded] = useState(false);

  // Build live questions from workstream questions in context
  const baseQuestions = useMemo<LiveQuestion[]>(() => {
    return workstreams.flatMap(ws =>
      ws.questions.map((q, idx) => {
        const enrichment = DEMO_ENRICHMENT[`${ws.id}-q${idx + 1}`] ?? {};
        return {
          id: `${ws.id}-q${idx + 1}`,
          question: q.text,
          workstream: ws.name,
          workstreamColor: ws.colorClass,
          status: (enrichment.status ?? "open") as LiveQuestion["status"],
          priority: q.priority,
          deadline: q.dueBy === "interim" ? "Thu 4 Jun" : "Fri 13 Jun",
          source: "Original scope",
          notes: enrichment.notes,
          depth: enrichment.depth,
        };
      })
    );
  }, [workstreams]);

  const allQuestions = useMemo(() => {
    // Colour the email question to match its workstream
    const emailWs = workstreams.find(ws => ws.name === NEW_EMAIL_QUESTION.workstream);
    const emailQ: LiveQuestion = {
      ...NEW_EMAIL_QUESTION,
      workstreamColor: emailWs?.colorClass ?? "text-primary",
    };
    return [...extraQuestions, ...baseQuestions].concat(
      extraQuestions.some(q => q.id === "email-q1") ? [] : []
    );
  }, [baseQuestions, extraQuestions, workstreams]);

  function handleSimulateEmail() {
    setShowEmailChain(true);
    setTimeout(() => setEmailDetected(true), 1500);
  }

  function handleConfirmAdd() {
    const emailWs = workstreams.find(ws => ws.name === NEW_EMAIL_QUESTION.workstream);
    setExtraQuestions(prev => [{
      ...NEW_EMAIL_QUESTION,
      workstreamColor: emailWs?.colorClass ?? "text-primary",
    }, ...prev]);
    setQuestionAdded(true);
  }

  // Group by workstream in fixed display order
  const WS_ORDER = ["Market", "Competitive Landscape", "Customer & Commercial", "Financials", "Management"];

  const grouped = useMemo(() => {
    const map: Record<string, LiveQuestion[]> = {};
    // Base questions first (preserves per-workstream question order)
    baseQuestions.forEach(q => {
      if (!map[q.workstream]) map[q.workstream] = [];
      map[q.workstream].push(q);
    });
    // Email questions prepended to their workstream
    extraQuestions.forEach(q => {
      if (!map[q.workstream]) map[q.workstream] = [];
      map[q.workstream].unshift(q);
    });
    // Return sorted by WS_ORDER
    return Object.fromEntries(
      WS_ORDER.filter(ws => map[ws]).map(ws => [ws, map[ws]])
    );
  }, [baseQuestions, extraQuestions]);

  const counts = {
    total: allQuestions.length + extraQuestions.length,
    answered: [...allQuestions, ...extraQuestions].filter(q => q.status === "answered").length,
    inProgress: [...allQuestions, ...extraQuestions].filter(q => q.status === "in-progress").length,
    open: [...allQuestions, ...extraQuestions].filter(q => q.status === "open" || q.status === "new").length,
  };

  // Fix counts to use grouped
  const allGroupedQuestions = Object.values(grouped).flat();
  const finalCounts = {
    total: allGroupedQuestions.length,
    answered: allGroupedQuestions.filter(q => q.status === "answered").length,
    inProgress: allGroupedQuestions.filter(q => q.status === "in-progress").length,
    open: allGroupedQuestions.filter(q => q.status === "open" || q.status === "new").length,
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Scope</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Key questions tracked in real-time · auto-updated from client communications
            </p>
          </div>
          {!showEmailChain && (
            <Button onClick={handleSimulateEmail} className="gap-2">
              <Mail className="w-4 h-4" />
              Simulate Client Email
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Questions", value: finalCounts.total,      color: "text-foreground"        },
            { label: "Answered",        value: finalCounts.answered,   color: "text-green-600"         },
            { label: "In Progress",     value: finalCounts.inProgress, color: "text-amber-600"         },
            { label: "Open",            value: finalCounts.open,       color: "text-muted-foreground"  },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Question list */}
          <div className="col-span-2 space-y-6">
            {Object.entries(grouped).map(([workstream, qs]) => (
              <div key={workstream}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold ${qs[0]?.workstreamColor ?? "text-foreground"}`}>
                    {workstream}
                  </span>
                  <span className="text-xs text-muted-foreground">· {qs.length} questions</span>
                </div>
                <div className="space-y-2">
                  {qs.map(q => {
                    const sc = statusConfig[q.status];
                    const StatusIcon = sc.icon;
                    const isNew = q.status === "new";

                    return (
                      <div
                        key={q.id}
                        className={`rounded-lg border p-4 transition-all ${
                          isNew
                            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${sc.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{q.question}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${sc.bg} ${sc.color}`}>
                                {sc.label}
                              </span>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${priorityConfig[q.priority].bg} ${priorityConfig[q.priority].color}`}>
                                {priorityConfig[q.priority].label}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="w-3 h-3" />{q.deadline}
                              </span>
                              <span className="text-[11px] text-muted-foreground">{q.source}</span>
                            </div>
                            {isNew && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Auto-routed to {q.workstream} · based on question content
                              </p>
                            )}
                            {q.notes && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground">{q.notes}</p>
                              </div>
                            )}
                            {q.depth && (
                              <div className={`mt-2 inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md font-medium ${
                                q.depth.level === "high"   ? "bg-green-50 text-green-700"
                                : q.depth.level === "medium" ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                              }`}>
                                {q.depth.level === "high"
                                  ? <ShieldCheck className="w-3 h-3" />
                                  : q.depth.level === "medium"
                                  ? <ShieldAlert className="w-3 h-3" />
                                  : <Shield className="w-3 h-3" />}
                                Depth: {q.depth.level} — {q.depth.note.toLowerCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Email panel */}
          <div className="col-span-1">
            <div className="sticky top-20">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Monitor
              </h3>

              {!showEmailChain ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click "Simulate Client Email" to see how new scope items are auto-detected from email chains
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {EMAIL_CHAIN.map((email, i) => (
                    <div
                      key={email.id}
                      className={`rounded-lg border overflow-hidden transition-all ${
                        i === 0
                          ? "border-border bg-card"
                          : emailDetected
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-2"
                          : "opacity-0 h-0 overflow-hidden"
                      }`}
                    >
                      {(i === 0 || emailDetected) && (
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {email.isBot && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                            <span className="text-xs font-semibold text-foreground">{email.from}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mb-0.5">To: {email.to} · {email.time}</p>
                          <p className="text-xs font-medium text-foreground mb-2">{email.subject}</p>
                          <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed max-h-44 overflow-y-auto">
                            {email.body}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {emailDetected && !questionAdded && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                      <Button onClick={handleConfirmAdd} className="w-full gap-2" size="sm">
                        <Plus className="w-3.5 h-3.5" />
                        Confirm — Add to Live Scope
                      </Button>
                    </div>
                  )}

                  {questionAdded && (
                    <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-foreground">Question added to scope</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added to Customer &amp; Commercial workstream. Team notified.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
