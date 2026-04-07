import { useState, useEffect } from "react";
import { Mail, Plus, Sparkles, CheckCircle2, Circle, AlertTriangle, Clock, Eye, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScopeQuestion {
  id: string;
  question: string;
  workstream: string;
  status: "answered" | "in-progress" | "open" | "new";
  priority: "critical" | "important" | "nice-to-have";
  deadline: string;
  source: string;
  addedDate: string;
  notes?: string;
  depth?: { level: "high" | "medium" | "low"; note: string };
}

const INITIAL_QUESTIONS: ScopeQuestion[] = [
  {
    id: "q1",
    question: "What is the current customer churn rate by cohort and what are the primary drivers?",
    workstream: "Commercial",
    status: "answered",
    priority: "critical",
    deadline: "28 Mar",
    source: "Original scope",
    addedDate: "24 Mar",
    notes: "Answered via data room — 8.2% annual, primarily driven by pricing sensitivity in SMB segment",
    depth: { level: "high", note: "Cross-referenced with VDR data and expert interviews" },
  },
  {
    id: "q2",
    question: "What is the gross margin profile by product line, and how has it trended over the last 3 years?",
    workstream: "Internals",
    status: "answered",
    priority: "critical",
    deadline: "31 Mar",
    source: "Original scope",
    addedDate: "24 Mar",
    notes: "CFO interview confirmed 62% blended, trending up 200bps/yr",
    depth: { level: "medium", note: "Management-supplied data, not independently verified" },
  },
  {
    id: "q3",
    question: "What is the target's market share and how is it trending?",
    workstream: "Market",
    status: "in-progress",
    priority: "important",
    deadline: "4 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
    notes: "Iniital estimate 25% and growing",
    depth: { level: "low", note: "triangulation delayed due to team sickness" },
  },
  {
    id: "q4",
    question: "What are the key regulatory risks and compliance requirements in target expansion markets?",
    workstream: "Market",
    status: "in-progress",
    priority: "important",
    deadline: "4 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
  },
  {
    id: "q5",
    question: "How defensible is the competitive moat — what are the top 3 switching costs for enterprise customers?",
    workstream: "Commercial",
    status: "open",
    priority: "important",
    deadline: "7 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
  },
  {
    id: "q6",
    question: "What is the management team's track record and are there any key-person dependencies?",
    workstream: "Internals",
    status: "open",
    priority: "nice-to-have",
    deadline: "7 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
  },
  {
    id: "q7",
    question: "What is the net revenue retention rate for enterprise vs. SMB segments?",
    workstream: "Commercial",
    status: "in-progress",
    priority: "critical",
    deadline: "2 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
    notes: "Currently estimating 66% based on 3 competitors. Data request sent to CFO — expecting response by Wed",
    depth: { level: "medium", note: "pending — benchmarks only, awaiting management data (requested, not yet received)" },
  },
  {
    id: "q8",
    question: "What capex is required to support the 3-year growth plan and what is the payback period?",
    workstream: "Internals",
    status: "open",
    priority: "nice-to-have",
    deadline: "9 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
  },
];

const NEW_QUESTION_FROM_EMAIL: ScopeQuestion = {
  id: "q9",
  question: "Has FreshCart ever explored or been approached about a side-letter arrangement with any existing investor, and if so what were the terms discussed?",
  workstream: "Internals",
  status: "new",
  priority: "important",
  deadline: "4 Apr",
  source: "Client email — auto-detected",
  addedDate: "Today",
};

const EMAIL_CHAIN = [
  {
    id: "e1",
    from: "James Morton (Client)",
    to: "Sarah Chen",
    time: "Today 8:32 AM",
    subject: "Re: FreshCart DD — additional area",
    body: `Hi Sarah,

One more thing that came up in our IC discussion yesterday — we'd like the DD to also cover whether FreshCart has ever explored or been approached about any side-letter arrangements with existing investors. This came up in the context of the Series B terms and we want to understand the full picture before proceeding.

Can you add this to the scope? Happy to discuss on our call later.

Best,
James`,
  },
  {
    id: "e2",
    from: "Sentinel",
    to: "Sarah Chen",
    time: "Today 8:32 AM",
    subject: "🔔 New scope item detected from client email",
    body: `New scope item detected from James Morton's email:

"Has FreshCart ever explored or been approached about a side-letter arrangement with any existing investor, and if so what were the terms discussed?"

Auto-routed to Legal & Regulatory workstream
Tom Bradley notified
Added to Internal Analysis task list

Priority: High — relates to Series B terms

Action: Review and confirm addition to live scope →`,
    isBot: true,
  },
];

const statusConfig = {
  answered: { icon: CheckCircle2, color: "text-rag-green", bg: "bg-rag-green/10", label: "Answered" },
  "in-progress": { icon: Clock, color: "text-rag-amber", bg: "bg-rag-amber/10", label: "In Progress" },
  open: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: "Open" },
  new: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", label: "New — Auto-detected" },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "text-rag-red", bg: "bg-rag-red/10" },
  important: { label: "Important", color: "text-rag-amber", bg: "bg-rag-amber/10" },
  "nice-to-have": { label: "Nice to Have", color: "text-muted-foreground", bg: "bg-muted" },
};

const workstreamColors: Record<string, string> = {
  Commercial: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Financial: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Market: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "Legal & Regulatory": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Management: "bg-pink-500/10 text-pink-600 border-pink-500/20",
};

export default function LiveScope() {
  const [questions, setQuestions] = useState<ScopeQuestion[]>(INITIAL_QUESTIONS);
  const [showEmailChain, setShowEmailChain] = useState(false);
  const [emailDetected, setEmailDetected] = useState(false);
  const [questionAdded, setQuestionAdded] = useState(false);
  

  const handleSimulateEmail = () => {
    setShowEmailChain(true);
    // After a brief delay, show the "detected" state
    setTimeout(() => {
      setEmailDetected(true);
    }, 1500);
  };

  const handleConfirmAdd = () => {
    setQuestions((prev) => [NEW_QUESTION_FROM_EMAIL, ...prev]);
    setQuestionAdded(true);
  };

  const parseDeadline = (d: string) => {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const parts = d.split(" ");
    if (parts.length === 2) return new Date(2025, months[parts[1]] ?? 0, parseInt(parts[0]));
    return new Date();
  };

  const sortedQuestions = [...questions].sort((a, b) => parseDeadline(a.deadline).getTime() - parseDeadline(b.deadline).getTime());

  const grouped = sortedQuestions.reduce<Record<string, ScopeQuestion[]>>((acc, q) => {
    if (!acc[q.workstream]) acc[q.workstream] = [];
    acc[q.workstream].push(q);
    return acc;
  }, {});

  const counts = {
    total: questions.length,
    answered: questions.filter((q) => q.status === "answered").length,
    inProgress: questions.filter((q) => q.status === "in-progress").length,
    open: questions.filter((q) => q.status === "open" || q.status === "new").length,
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
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
            { label: "Total Questions", value: counts.total, color: "text-foreground" },
            { label: "Answered", value: counts.answered, color: "text-rag-green" },
            { label: "In Progress", value: counts.inProgress, color: "text-rag-amber" },
            { label: "Open", value: counts.open, color: "text-muted-foreground" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Question list - 2 cols */}
          <div className="col-span-2 space-y-6">
            {Object.entries(grouped).map(([workstream, qs]) => (
              <div key={workstream}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${workstreamColors[workstream] || "bg-muted text-muted-foreground"}`}>
                    {workstream}
                  </span>
                  <span className="text-xs text-muted-foreground">{qs.length} questions</span>
                </div>
                <div className="space-y-2">
                  {qs.map((q) => {
                    const sc = statusConfig[q.status];
                    const StatusIcon = sc.icon;
                    
                    const isNew = q.status === "new";

                    return (
                      <div
                        key={q.id}
                        className={`rounded-lg border p-4 transition-all ${
                          isNew ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${sc.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium text-foreground">
                                {q.question}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-[11px] px-1.5 py-0.5 rounded ${sc.bg} ${sc.color} font-medium`}>
                                {sc.label}
                              </span>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${priorityConfig[q.priority].bg} ${priorityConfig[q.priority].color}`}>
                                {priorityConfig[q.priority].label}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {q.deadline}
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
                                q.depth.level === "high"
                                  ? "bg-rag-green/10 text-rag-green"
                                  : q.depth.level === "medium"
                                  ? "bg-rag-amber/10 text-rag-amber"
                                  : "bg-rag-red/10 text-rag-red"
                              }`}>
                                {q.depth.level === "high" ? <ShieldCheck className="w-3 h-3" /> : q.depth.level === "medium" ? <ShieldAlert className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
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

          {/* Email chain panel - 1 col */}
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
                          <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                            {email.body}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Confirm add button */}
                  {emailDetected && !questionAdded && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                      <Button onClick={handleConfirmAdd} className="w-full gap-2" size="sm">
                        <Plus className="w-3.5 h-3.5" />
                        Confirm — Add to Live Scope
                      </Button>
                    </div>
                  )}

                  {questionAdded && (
                    <div className="rounded-lg border border-rag-green/30 bg-rag-green/5 p-3 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-rag-green" />
                        <span className="text-sm font-medium text-foreground">Question added to scope</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added to Legal & Regulatory workstream. Team notified.
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
