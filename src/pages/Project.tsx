import { useState } from "react";
import { ganttWorkstreams, risks, type Risk } from "@/data/mockData";
import { AlertTriangle, ShieldAlert, X, Send, Pencil, ArrowUpRight, CircleCheck, OctagonX, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  "at-risk": {
    label: "At risk",
    className: "bg-rag-amber/10 text-rag-amber",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  "blocked": {
    label: "Blocked",
    className: "bg-rag-red/10 text-rag-red",
    icon: <OctagonX className="w-3 h-3" />,
  },
};

// Outcome-based risk groupings — each outcome maps to affected tasks and a project-level impact
interface OutcomeGroup {
  id: string;
  outcome: string;
  severity: "high" | "medium";
  cause: string;
  projectImpact: string;
  recommendedAction: string;
  riskId: string;
  affectedTaskIds: string[];
}

const OUTCOME_GROUPS: OutcomeGroup[] = [
  {
    id: "o1",
    outcome: "Survey delayed",
    severity: "high",
    cause: "Panel recruitment delayed 1 day, response rate at 62% of target",
    projectImpact: "Synthesis deck pushed +2 days → partner review compressed to half a day, eliminating buffer",
    recommendedAction: "Send follow-up reminder to panel provider requesting priority boost. Consider extending survey by 1 day with adjusted synthesis timeline.",
    riskId: "r1",
    affectedTaskIds: ["s2", "s3", "s5", "s6", "s7", "s8"],
  },
  {
    id: "o2",
    outcome: "Market model stalled",
    severity: "high",
    cause: "Priya off sick since Wednesday — competitor pricing layer and 5-year projections incomplete",
    projectImpact: "TAM/SAM/SOM section incomplete for partner review, weakens investment thesis",
    recommendedAction: "Reassign the competitor pricing layer to another team member. Consider simplifying the 5-year projection to a sensitivity range.",
    riskId: "r4",
    affectedTaskIds: ["mm2", "mm3"],
  },
  {
    id: "o3",
    outcome: "Management interview slipped",
    severity: "medium",
    cause: "Session 2 rescheduled from Tuesday to Thursday",
    projectImpact: "Expert interview synthesis missing management cross-references, competitive dynamics section weakened",
    recommendedAction: "Ask Tom to draft expert interview section with placeholders for management inputs, to be filled Thursday evening.",
    riskId: "r3",
    affectedTaskIds: ["ia2"],
  },
];

// Build a lookup of all gantt items by ID
function getAllItems() {
  const map: Record<string, { id: string; label: string; workstream: string; owner: string; status: string; notes?: string; dueDate?: string }> = {};
  for (const ws of ganttWorkstreams) {
    for (const item of ws.items) {
      map[item.id] = {
        id: item.id,
        label: item.label,
        workstream: ws.name,
        owner: item.owner,
        status: item.status,
        notes: item.notes,
        dueDate: item.dueDate,
      };
    }
  }
  return map;
}

export default function Project() {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<string>>(new Set(OUTCOME_GROUPS.map(o => o.id)));

  const allItems = getAllItems();

  const toggleOutcome = (id: string) => {
    setExpandedOutcomes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openRisk = (riskId: string) => {
    const risk = risks.find((r) => r.id === riskId);
    if (risk) setSelectedRisk(risk);
  };

  // Count totals
  const totalAtRisk = new Set(
    OUTCOME_GROUPS.flatMap(o => o.affectedTaskIds.filter(id => allItems[id]?.status === "at-risk"))
  ).size;
  const totalBlocked = new Set(
    OUTCOME_GROUPS.flatMap(o => o.affectedTaskIds.filter(id => allItems[id]?.status === "blocked"))
  ).size;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header banner */}
      <div className="mb-8 rounded-xl border border-rag-red/30 bg-gradient-to-r from-rag-red/5 via-rag-amber/5 to-transparent p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-rag-red/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-rag-red" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Risk Review</h2>
                <p className="text-sm text-muted-foreground">
                  Project Falcon · FreshCart DD · Week 2 of 3
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <span className="text-lg font-bold text-rag-red tracking-tight">
            Project at risk: potential for +2 day delay, buffer exhausted
          </span>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-rag-amber/15 text-rag-amber border border-rag-amber/20">
            <AlertTriangle className="w-4 h-4" />
            {totalAtRisk} at risk
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-rag-red/15 text-rag-red border border-rag-red/20">
            <OctagonX className="w-4 h-4" />
            {totalBlocked} blocked
          </span>
        </div>
      </div>

      {/* Outcome-based risk groups */}
      <div className="space-y-4">
        {OUTCOME_GROUPS.map((group) => {
          const isExpanded = expandedOutcomes.has(group.id);
          const isHandled_ = handled.has(group.riskId);
          const severityClass = group.severity === "high"
            ? "border-rag-red/20 bg-rag-red/[0.02]"
            : "border-rag-amber/20 bg-rag-amber/[0.02]";

          return (
            <div
              key={group.id}
              className={`border rounded-lg overflow-hidden transition-all ${severityClass} ${isHandled_ ? "opacity-50" : ""}`}
            >
              {/* Outcome header */}
              <button
                className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-accent/20 transition-colors"
                onClick={() => toggleOutcome(group.id)}
              >
                <div className="flex items-center gap-2 mt-0.5 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        group.severity === "high"
                          ? "bg-rag-red/10 text-rag-red"
                          : "bg-rag-amber/10 text-rag-amber"
                      }`}
                    >
                      {group.severity === "high" ? "High" : "Medium"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {group.affectedTaskIds.length} tasks affected
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{group.outcome}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{group.cause}</p>
                  <p className="text-xs text-foreground mt-1.5">
                    <span className="font-medium text-muted-foreground">Recommended Action: </span>
                    {group.recommendedAction}
                  </p>
                </div>
                <div className="shrink-0 max-w-[340px] text-right">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Project impact</p>
                  <p className="text-xs font-semibold text-foreground leading-snug">{group.projectImpact}</p>
                </div>
              </button>

              {/* Actions bar - always visible */}
              <div className="px-5 py-3 border-t border-border/50 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-7 text-xs"
                  onClick={(e) => { e.stopPropagation(); openRisk(group.riskId); }}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  View AI recommendation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHandled((prev) => new Set(prev).add(group.riskId));
                  }}
                >
                  <CircleCheck className="w-3 h-3" />
                  Handled
                </Button>
              </div>

              {/* Expanded: affected tasks */}
              {isExpanded && (
                <div className="border-t border-border/50">

                  {/* Affected tasks sub-table */}
                  <div className="px-5 py-3 border-t border-border/30">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Affected tasks</p>
                    <div className="space-y-1">
                      {group.affectedTaskIds.map((taskId) => {
                        const task = allItems[taskId];
                        if (!task) return null;
                        const sc = statusConfig[task.status];
                        return (
                          <div
                            key={taskId}
                            className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary/40 text-xs"
                          >
                            <span className="font-medium text-foreground flex-1">{task.label}</span>
                            <span className="text-muted-foreground">{task.owner}</span>
                            <span className="text-muted-foreground">{task.dueDate || "—"}</span>
                            {sc ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sc.className}`}>
                                {sc.icon}
                                {sc.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">{task.status}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overlay panel (Notion-style) */}
      {selectedRisk && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-in fade-in-0 duration-150"
            onClick={() => setSelectedRisk(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 bg-card border-l border-border shadow-2xl animate-in slide-in-from-right-2 duration-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      selectedRisk.severity === "high" ? "bg-rag-red" : "bg-rag-amber"
                    }`}
                  />
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedRisk.severity === "high"
                        ? "bg-rag-red/10 text-rag-red"
                        : "bg-rag-amber/10 text-rag-amber"
                    }`}
                  >
                    {selectedRisk.severity === "high" ? "High severity" : "Medium severity"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRisk(null)}
                  className="p-1 rounded-md hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <h2 className="text-lg font-semibold text-foreground mb-6">{selectedRisk.title}</h2>

              <div className="space-y-5">
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Why it matters</h4>
                  <p className="text-sm text-foreground leading-relaxed">{selectedRisk.whyItMatters}</p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Likely impact</h4>
                  <p className="text-sm text-foreground leading-relaxed">{selectedRisk.likelyImpact}</p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Who should act</h4>
                  <p className="text-sm text-foreground">{selectedRisk.whoShouldAct}</p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recommended Action: </h4>
                  <p className="text-sm text-foreground leading-relaxed">{selectedRisk.suggestedAction}</p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">AI-drafted message</h4>
                  <div className="bg-secondary rounded-lg p-4 text-sm text-foreground leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedRisk.draftMessage}
                  </div>
                </section>
              </div>

              <div className="flex items-center gap-2 pt-6 mt-6 border-t border-border">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  <Pencil className="w-3 h-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => {
                    setHandled((prev) => new Set(prev).add(selectedRisk.id));
                    setSelectedRisk(null);
                  }}
                >
                  <CircleCheck className="w-3 h-3" />
                  Handled
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  <ArrowUpRight className="w-3 h-3" />
                  Escalate
                </Button>
                <Button size="sm" className="gap-1.5 h-8 text-xs">
                  <Send className="w-3 h-3" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
