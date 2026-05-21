import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, X, ArrowRight, Pencil, Check, ChevronLeft, ExternalLink } from "lucide-react";
import {
  useProject,
  ADDABLE_WORKSTREAMS,
  type WorkstreamDef,
  type Question,
} from "@/context/ProjectContext";
import { PAST_ENGAGEMENTS } from "@/pages/Engagement";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Question["priority"] }) {
  if (priority === "critical")
    return (
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
        Critical
      </span>
    );
  if (priority === "important")
    return (
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
        Important
      </span>
    );
  return (
    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
      Nice to have
    </span>
  );
}

// ─── Demo project scopes ──────────────────────────────────────────────────────

const DEMO_SCOPES: Record<string, { workstreams: { name: string; questions: string[] }[] }> = {
  "Consumer Retail CDD": {
    workstreams: [
      {
        name: "Market & Competitive",
        questions: [
          "What is the total addressable market size and growth rate for online grocery delivery in the UK?",
          "Who are the top 3 competitors and what are their market share trends?",
          "What are the structural barriers to entry and how defensible is the target's position?",
          "How does the target's NPS compare to the sector benchmark?",
        ],
      },
      {
        name: "Commercial & Customer",
        questions: [
          "What is the customer cohort churn profile over 36 months?",
          "What is the average basket size and order frequency by customer segment?",
          "How concentrated is revenue across the top 20% of customers?",
          "What is the CAC by acquisition channel and how has it trended?",
        ],
      },
      {
        name: "Financial",
        questions: [
          "What is the gross margin by product category and how has it trended over 3 years?",
          "What is the unit economics profile at contribution margin level?",
          "What is the working capital cycle and cash conversion profile?",
          "How does EBITDA bridge from reported to normalised?",
        ],
      },
      {
        name: "Operations",
        questions: [
          "What is the fulfilment cost per order and how does it scale with volume?",
          "What is the supplier concentration risk — top 5 suppliers as % of COGS?",
          "What is the technology infrastructure dependency and any single points of failure?",
        ],
      },
    ],
  },
  "B2B SaaS CDD": {
    workstreams: [
      {
        name: "Market",
        questions: [
          "What is the ICP definition and how large is the addressable market?",
          "What is the competitive win/loss rate and primary loss reasons?",
          "How does the product roadmap compare to competitor feature sets?",
        ],
      },
      {
        name: "Commercial",
        questions: [
          "What is the net revenue retention (NRR) and gross revenue retention (GRR)?",
          "What is the CAC payback period including PS allocation?",
          "What is the mix of ARR by contract length and renewal profile?",
          "How concentrated is ARR — top 10 customers as % of total?",
        ],
      },
      {
        name: "Financial",
        questions: [
          "What is the Rule of 40 score and how has it trended?",
          "What is the integration partner concentration risk?",
          "What are the key assumptions in the management case?",
        ],
      },
    ],
  },
};

// ─── Project scope modal ──────────────────────────────────────────────────────

function PriorScopeModal({ onClose }: { onClose: () => void }) {
  const [selectedProject, setSelectedProject] = useState<typeof PAST_ENGAGEMENTS[number] | null>(null);
  const comparable = PAST_ENGAGEMENTS.filter(e => e.project.toLowerCase().includes("consumer retail") || e.project.toLowerCase().includes("b2b saas"));

  const scope = selectedProject ? DEMO_SCOPES[selectedProject.project] ?? DEMO_SCOPES["Consumer Retail CDD"] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {selectedProject && (
              <button onClick={() => setSelectedProject(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {selectedProject ? selectedProject.project : "Comparable project scopes"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedProject
                  ? `${selectedProject.client} · ${selectedProject.weeks}w · ${selectedProject.team}`
                  : `${comparable.length} similar engagements on record`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {!selectedProject ? (
            /* Project list */
            <div className="divide-y divide-border">
              {comparable.map((e, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedProject(e)}
                  className="w-full text-left px-5 py-3.5 hover:bg-accent/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{e.project}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border border-border text-muted-foreground">{e.client}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                        e.overrun === 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                      }`}>{e.overrun === 0 ? "On time" : `+${e.overrun}w overrun`}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.target} · {e.weeks}w · {e.team}</p>
                    {e.additions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {e.additions.map(a => (
                          <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">£{Math.round(e.fee / 1000)}k</p>
                    <ExternalLink className="w-3 h-3 text-muted-foreground mt-1 ml-auto" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Scope detail */
            <div>
              {scope && scope.workstreams.map((ws, wi) => (
                <div key={wi} className="border-b border-border/50 last:border-0">
                  <div className="px-5 py-2.5 bg-muted/20">
                    <p className="text-xs font-semibold text-foreground">{ws.name}</p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {ws.questions.map((q, qi) => (
                      <div key={qi} className="px-5 py-2.5">
                        <p className="text-sm text-muted-foreground leading-snug">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="px-5 py-4 bg-muted/10 border-t border-border">
                <p className="text-xs font-semibold text-foreground mb-1">Key learning</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedProject.keyLearning}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScopingReview() {
  const navigate = useNavigate();
  const { workstreams, setWorkstreams, advanceScopingStep } = useProject();

  const [showAddMenu, setShowAddMenu]     = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editText, setEditText]           = useState("");
  const [addingToWs, setAddingToWs]       = useState<string | null>(null);
  const [addText, setAddText]             = useState("");
  const [addPriority, setAddPriority]     = useState<Question["priority"]>("important");
  const [addingDelivToWs, setAddingDelivToWs] = useState<string | null>(null);
  const [addDelivText, setAddDelivText]       = useState("");
  const [showScopeModal, setShowScopeModal]   = useState(false);

  const comparableCount = PAST_ENGAGEMENTS.filter(
    e => e.project.toLowerCase().includes("consumer retail") || e.project.toLowerCase().includes("b2b saas")
  ).length;

  // ── Workstream handlers ──
  const addedIds = workstreams.map((ws) => ws.id);
  const addable  = ADDABLE_WORKSTREAMS.filter((ws) => !addedIds.includes(ws.id));

  const addWorkstream = (ws: WorkstreamDef) => {
    setWorkstreams((prev) => [...prev, { ...ws, questions: [] }]);
    setShowAddMenu(false);
  };

  const removeWorkstream = (id: string) =>
    setWorkstreams((prev) => prev.filter((ws) => ws.id !== id));

  const removeQuestion = (wsId: string, qId: string) =>
    setWorkstreams((prev) =>
      prev.map((ws) =>
        ws.id === wsId ? { ...ws, questions: ws.questions.filter((q) => q.id !== qId) } : ws
      )
    );

  const startEdit = (q: Question) => { setEditingId(q.id); setEditText(q.text); };

  const commitEdit = (wsId: string, qId: string) => {
    const trimmed = editText.trim();
    if (trimmed)
      setWorkstreams((prev) =>
        prev.map((ws) =>
          ws.id === wsId
            ? { ...ws, questions: ws.questions.map((q) => q.id === qId ? { ...q, text: trimmed } : q) }
            : ws
        )
      );
    setEditingId(null);
  };

  const commitAddDeliverable = (wsId: string) => {
    const trimmed = addDelivText.trim();
    if (trimmed)
      setWorkstreams((prev) =>
        prev.map((ws) =>
          ws.id === wsId
            ? { ...ws, deliverables: [...ws.deliverables, { id: `d-${Date.now()}`, name: trimmed, inputMap: {} }] }
            : ws
        )
      );
    setAddingDelivToWs(null);
    setAddDelivText("");
  };

  const commitAdd = (wsId: string) => {
    const trimmed = addText.trim();
    if (trimmed)
      setWorkstreams((prev) =>
        prev.map((ws) =>
          ws.id === wsId
            ? { ...ws, questions: [...ws.questions, { id: `q-${Date.now()}`, text: trimmed, priority: addPriority, dueBy: "final" }] }
            : ws
        )
      );
    setAddingToWs(null);
    setAddText("");
    setAddPriority("important");
  };

  const totalQuestions = workstreams.reduce((s, ws) => s + ws.questions.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Scope Questions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-extracted from your scoping call. Edit, reprioritise, or remove anything before approving.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowScopeModal(true)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Supported by {comparableCount} comparable project scopes
            <ExternalLink className="w-3 h-3" />
          </button>

          <span className="text-xs text-muted-foreground">
            {totalQuestions} questions · {workstreams.length} workstreams
          </span>
        </div>
      </div>

      {/* ── Workstream cards ── */}
      <div className="space-y-3">
        {workstreams.map((ws) => (
          <div key={ws.id} className="bg-card border border-border rounded-lg overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5">
                <span className={`text-sm font-semibold ${ws.colorClass}`}>{ws.name}</span>
                <span className="text-xs text-muted-foreground">{ws.questions.length} questions</span>
              </div>
              {ws.removable && (
                <button onClick={() => removeWorkstream(ws.id)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Deliverables */}
            <div className="flex items-center gap-1.5 flex-wrap px-4 py-2 border-b border-border/50 bg-muted/10">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/50 shrink-0">Deliverables</span>
              {ws.deliverables.map((d) => (
                <span key={d.id} className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                  {d.name}
                </span>
              ))}
              {addingDelivToWs === ws.id ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={addDelivText}
                    onChange={(e) => setAddDelivText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitAddDeliverable(ws.id);
                      if (e.key === "Escape") { setAddingDelivToWs(null); setAddDelivText(""); }
                    }}
                    onBlur={() => { if (!addDelivText.trim()) { setAddingDelivToWs(null); setAddDelivText(""); } }}
                    placeholder="Deliverable name…"
                    className="text-[10px] bg-background border border-primary/40 rounded-full px-2 py-0.5 w-32 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <button onClick={() => commitAddDeliverable(ws.id)} disabled={!addDelivText.trim()} className="text-primary disabled:text-muted-foreground">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => { setAddingDelivToWs(null); setAddDelivText(""); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingDelivToWs(ws.id); setAddDelivText(""); }}
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  Add
                </button>
              )}
            </div>

            {/* Questions */}
            <div className="divide-y divide-border">
              {ws.questions.map((q) => (
                <div key={q.id} className="flex items-start gap-3 px-4 py-2.5 group">

                  {/* Priority — hover to change */}
                  <div className="shrink-0 relative group/pri">
                    <PriorityBadge priority={q.priority} />
                    <div className="absolute top-full left-0 mt-1 hidden group-hover/pri:flex flex-col bg-card border border-border rounded-md shadow-lg py-1 z-20 min-w-[120px]">
                      {(["critical", "important", "nice-to-have"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setWorkstreams((prev) => prev.map((w) =>
                            w.id === ws.id
                              ? { ...w, questions: w.questions.map((qq) => qq.id === q.id ? { ...qq, priority: p } : qq) }
                              : w
                          ))}
                          className={`text-left px-3 py-1.5 text-xs transition-colors hover:bg-accent ${q.priority === p ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                        >
                          {p === "critical" ? "Critical" : p === "important" ? "Important" : "Nice to have"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text — click to edit */}
                  {editingId === q.id ? (
                    <div className="flex-1 flex flex-col gap-1.5">
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => commitEdit(ws.id, q.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(ws.id, q.id); }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full text-sm text-foreground bg-background border border-primary/40 rounded-md px-2 py-1 resize-none leading-snug focus:outline-none focus:ring-1 focus:ring-primary/50"
                        rows={2}
                      />
                      <p className="text-[10px] text-muted-foreground">Enter to save · Esc to cancel</p>
                    </div>
                  ) : (
                    <p
                      onClick={() => startEdit(q)}
                      className="text-sm text-foreground flex-1 leading-snug cursor-text hover:bg-accent/50 rounded px-1 -mx-1 transition-colors"
                    >
                      {q.text}
                    </p>
                  )}

                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <button onClick={() => startEdit(q)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeQuestion(ws.id, q.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {ws.questions.length === 0 && addingToWs !== ws.id && (
                <p className="px-4 py-3 text-sm text-muted-foreground italic">No questions added yet</p>
              )}

              {/* Add question */}
              {addingToWs === ws.id ? (
                <div className="px-4 py-3 space-y-2 bg-muted/20">
                  <textarea
                    autoFocus
                    value={addText}
                    onChange={(e) => setAddText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitAdd(ws.id); }
                      if (e.key === "Escape") { setAddingToWs(null); setAddText(""); }
                    }}
                    placeholder="Type question text…"
                    className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 resize-none leading-snug focus:outline-none focus:ring-1 focus:ring-primary/50"
                    rows={2}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(["critical", "important", "nice-to-have"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setAddPriority(p)}
                          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded border transition-colors ${
                            addPriority === p
                              ? p === "critical" ? "bg-red-50 text-red-700 border-red-200"
                                : p === "important" ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-muted text-muted-foreground border-border"
                              : "bg-transparent text-muted-foreground border-transparent hover:border-border"
                          }`}
                        >
                          {p === "nice-to-have" ? "Nice to have" : p === "critical" ? "Critical" : "Important"}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setAddingToWs(null); setAddText(""); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Cancel
                      </button>
                      <Button size="sm" onClick={() => commitAdd(ws.id)} disabled={!addText.trim()} className="h-7 gap-1.5 text-xs px-2.5">
                        <Check className="w-3 h-3" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingToWs(ws.id); setAddText(""); setAddPriority("important"); }}
                  className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
                >
                  <Plus className="w-3 h-3" />
                  Add question
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add workstream */}
      {addable.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowAddMenu((o) => !o)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add workstream
          </button>
          {showAddMenu && (
            <div className="absolute top-full left-0 mt-1.5 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[200px]">
              {addable.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => addWorkstream(ws)}
                  className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {totalQuestions} questions across {workstreams.length} workstreams
        </p>
        <Button
          onClick={() => { advanceScopingStep(2); navigate("/scope-review"); }}
          className="gap-2"
        >
          Approve
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {showScopeModal && <PriorScopeModal onClose={() => setShowScopeModal(false)} />}

    </div>
  );
}
