import { useState, useEffect } from "react";
import { Mail, Plus, Sparkles, ChevronDown, ChevronRight, CheckCircle2, Circle, AlertTriangle, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScopeQuestion {
  id: string;
  question: string;
  workstream: string;
  status: "answered" | "in-progress" | "open" | "new";
  priority: "critical" | "high" | "medium" | "low";
  deadline: string;
  source: string;
  addedDate: string;
  notes?: string;
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
  },
  {
    id: "q2",
    question: "What is the gross margin profile by product line, and how has it trended over the last 3 years?",
    workstream: "Financial",
    status: "answered",
    priority: "critical",
    deadline: "31 Mar",
    source: "Original scope",
    addedDate: "24 Mar",
    notes: "CFO interview confirmed 62% blended, trending up 200bps/yr",
  },
  {
    id: "q3",
    question: "What does the technology architecture look like and what is the estimated technical debt?",
    workstream: "Tech & Product",
    status: "in-progress",
    priority: "high",
    deadline: "4 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
    notes: "CTO interview scheduled Thu — architecture diagram received",
  },
  {
    id: "q4",
    question: "What are the key regulatory risks and compliance requirements in target expansion markets?",
    workstream: "Legal & Regulatory",
    status: "in-progress",
    priority: "high",
    deadline: "4 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
  },
  {
    id: "q5",
    question: "How defensible is the competitive moat — what are the top 3 switching costs for enterprise customers?",
    workstream: "Commercial",
    status: "open",
    priority: "high",
    deadline: "7 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
  },
  {
    id: "q6",
    question: "What is the management team's track record and are there any key-person dependencies?",
    workstream: "Management",
    status: "open",
    priority: "medium",
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
    notes: "Data request sent to CFO — expecting response by Wed",
  },
  {
    id: "q8",
    question: "What capex is required to support the 3-year growth plan and what is the payback period?",
    workstream: "Financial",
    status: "open",
    priority: "medium",
    deadline: "9 Apr",
    source: "Original scope",
    addedDate: "24 Mar",
  },
];

const NEW_QUESTION_FROM_EMAIL: ScopeQuestion = {
  id: "q9",
  question: "Has FreshCart ever explored or been approached about a side-letter arrangement with any existing investor, and if so what were the terms discussed?",
  workstream: "Legal & Regulatory",
  status: "new",
  priority: "high",
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
    from: "DD Copilot",
    to: "Sarah Chen",
    time: "Today 8:32 AM",
    subject: "🔔 New scope item detected from client email",
    body: `Detected a new question from James Morton's email:

"Has FreshCart ever explored or been approached about a side-letter arrangement with any existing investor, and if so what were the terms discussed?"

Suggested workstream: Legal & Regulatory
Suggested priority: High — relates to Series B terms

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

const workstreamColors: Record<string, string> = {
  Commercial: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Financial: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Tech & Product": "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "Legal & Regulatory": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Management: "bg-pink-500/10 text-pink-600 border-pink-500/20",
};

export default function LiveScope() {
  const [questions, setQuestions] = useState<ScopeQuestion[]>(INITIAL_QUESTIONS);
  const [showEmailChain, setShowEmailChain] = useState(false);
  const [emailDetected, setEmailDetected] = useState(false);
  const [questionAdded, setQuestionAdded] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

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

  const grouped = questions.reduce<Record<string, ScopeQuestion[]>>((acc, q) => {
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
                    const isExpanded = expandedQ === q.id;
                    const isNew = q.status === "new";

                    return (
                      <div
                        key={q.id}
                        className={`rounded-lg border p-4 transition-all cursor-pointer hover:border-primary/30 ${
                          isNew ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card"
                        }`}
                        onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                      >
                        <div className="flex items-start gap-3">
                          <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${sc.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <p className={`text-sm font-medium ${isNew ? "text-foreground" : "text-foreground"}`}>
                                {q.question}
                              </p>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`text-[11px] px-1.5 py-0.5 rounded ${sc.bg} ${sc.color} font-medium`}>
                                {sc.label}
                              </span>
                              <span className="text-[11px] text-muted-foreground">{q.source}</span>
                              <span className="text-[11px] text-muted-foreground">Added {q.addedDate}</span>
                            </div>
                            {isExpanded && q.notes && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground">{q.notes}</p>
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
