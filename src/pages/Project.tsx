import { useState } from "react";
import { ganttWorkstreams, risks, type Risk } from "@/data/mockData";
import { AlertTriangle, ShieldAlert, X, Send, Pencil, ArrowUpRight, CircleCheck, OctagonX } from "lucide-react";
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

// Map flagged task IDs to related risk IDs
const TASK_RISK_MAP: Record<string, string> = {
  s2: "r1",
  s3: "r1",
  s5: "r1",
  mm2: "r4",
  ia2: "r3",
};

// Map tasks to likely project impact
const TASK_IMPACT_MAP: Record<string, string> = {
  s2: "Delays survey data → synthesis deck pushed 2 days",
  s3: "Insufficient data for key segments, deck lacks statistical backing",
  s5: "Analysis blocked → entire survey workstream stalled",
  mm2: "Market model incomplete for partner review, TAM section at risk",
  ia2: "Management perspectives missing from competitive dynamics section",
};

function getFlaggedItems() {
  const items: Array<{
    id: string;
    workstream: string;
    task: string;
    owner: string;
    status: string;
    notes?: string;
    dependency?: string;
    dueDate?: string;
  }> = [];
  for (const ws of ganttWorkstreams) {
    for (const item of ws.items) {
      if (item.status === "at-risk" || item.status === "blocked") {
        items.push({
          id: item.id,
          workstream: ws.name,
          task: item.label,
          owner: item.owner,
          status: item.status,
          notes: item.notes,
          dependency: item.dependency,
          dueDate: item.dueDate,
        });
      }
    }
  }
  return items;
}

export default function Project() {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [handled, setHandled] = useState<Set<string>>(new Set());

  const flaggedItems = getFlaggedItems();
  const atRiskCount = flaggedItems.filter((i) => i.status === "at-risk").length;
  const blockedCount = flaggedItems.filter((i) => i.status === "blocked").length;

  const handleTaskClick = (taskId: string) => {
    const riskId = TASK_RISK_MAP[taskId];
    if (riskId) {
      const risk = risks.find((r) => r.id === riskId);
      if (risk) setSelectedRisk(risk);
    }
  };

  const handleRiskCardClick = (risk: Risk) => {
    setSelectedRisk(risk);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Dramatic header banner */}
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
            {atRiskCount} at risk
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-rag-red/15 text-rag-red border border-rag-red/20">
            <OctagonX className="w-4 h-4" />
            {blockedCount} blocked
          </span>
        </div>
      </div>

      {/* Single unified table */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-3">Flagged Tasks</h3>
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Task</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Owner</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Likely impact on project</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {flaggedItems.map((item) => {
                const sc = statusConfig[item.status];
                const impact = TASK_IMPACT_MAP[item.id];
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${TASK_RISK_MAP[item.id] ? "cursor-pointer" : ""}`}
                    onClick={() => handleTaskClick(item.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div>
                          <p className="text-xs font-medium text-foreground">{item.task}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.workstream}</p>
                        </div>
                        {TASK_RISK_MAP[item.id] && (
                          <ArrowUpRight className="w-3 h-3 text-muted-foreground/50 shrink-0 ml-auto" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{item.owner}</td>
                    <td className="px-3 py-3">
                      {impact && (
                        <p className="text-xs text-foreground leading-snug">{impact}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        {sc && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit ${sc.className}`}>
                            {sc.icon}
                            {sc.label}
                          </span>
                        )}
                        {item.notes && (
                          <p className="text-xs font-medium text-foreground leading-snug">{item.notes}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Overlay panel (Notion-style) */}
      {selectedRisk && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-in fade-in-0 duration-150"
            onClick={() => setSelectedRisk(null)}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 bg-card border-l border-border shadow-2xl animate-in slide-in-from-right-2 duration-200 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
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
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recommended action</h4>
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
