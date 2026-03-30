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

// Flatten gantt items that are at-risk or blocked
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

// Map flagged task IDs to related risk IDs based on content overlap
const TASK_RISK_MAP: Record<string, string> = {
  s2: "r1", // Launch survey → Survey response volume
  s3: "r1", // Collect responses → Survey response volume
  s5: "r1", // Run analysis blocked → Survey response volume
  mm2: "r4", // Build model structure (Priya sick) → Priya off sick
  ia2: "r3", // Conduct sessions rescheduled → Management interview timing
};

export default function Project() {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());

  const flaggedItems = getFlaggedItems();
  const atRiskCount = flaggedItems.filter((i) => i.status === "at-risk").length;
  const blockedCount = flaggedItems.filter((i) => i.status === "blocked").length;

  const toggleRiskExpand = (id: string) => {
    setExpandedRisks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTaskClick = (taskId: string) => {
    const riskId = TASK_RISK_MAP[taskId];
    if (riskId) {
      setExpandedRisks((prev) => new Set(prev).add(riskId));
      // Scroll the risk into view
      setTimeout(() => {
        document.getElementById(`risk-${riskId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rag-amber" />
            Risk Review
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Project Falcon · FreshCart DD · Week 2 of 3
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rag-amber/10 text-rag-amber">
            <AlertTriangle className="w-3 h-3" />
            {atRiskCount} at risk
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rag-red/10 text-rag-red">
            <OctagonX className="w-3 h-3" />
            {blockedCount} blocked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flagged tasks */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Flagged Tasks</h3>
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Task</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Workstream</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Owner</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Due</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {flaggedItems.map((item) => {
                  const sc = statusConfig[item.status];
                  return (
                     <tr
                       key={item.id}
                       className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${TASK_RISK_MAP[item.id] ? "cursor-pointer" : ""}`}
                       onClick={() => handleTaskClick(item.id)}
                     >
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-foreground">{item.task}</p>
                        {item.notes && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.notes}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{item.workstream}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{item.owner}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{item.dueDate || "—"}</td>
                      <td className="px-3 py-3">
                        {sc && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sc.className}`}>
                            {sc.icon}
                            {sc.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Risk Detections */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            AI Early Warnings
            <span className="text-xs font-normal text-muted-foreground ml-1">· {risks.length} detected</span>
          </h3>
          <div className="space-y-3">
            {risks.map((risk) => {
              const isExpanded = expandedRisks.has(risk.id);
              const isHandled = handled.has(risk.id);
              return (
                <div
                  key={risk.id}
                  className={`border border-border rounded-lg bg-card overflow-hidden transition-opacity ${isHandled ? "opacity-50" : ""}`}
                >
                  {/* Risk header */}
                  <button
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-accent/30 transition-colors"
                    onClick={() => toggleRiskExpand(risk.id)}
                  >
                    <div className="flex items-center gap-2 mt-0.5 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      )}
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          risk.severity === "high" ? "bg-rag-red" : "bg-rag-amber"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            risk.severity === "high"
                              ? "bg-rag-red/10 text-rag-red"
                              : "bg-rag-amber/10 text-rag-amber"
                          }`}
                        >
                          {risk.severity === "high" ? "High" : "Medium"}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground leading-snug">{risk.title}</p>
                      {!isExpanded && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{risk.likelyImpact}</p>
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
                      <section>
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why it matters</h4>
                        <p className="text-xs text-foreground leading-relaxed">{risk.whyItMatters}</p>
                      </section>
                      <section>
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Likely impact</h4>
                        <p className="text-xs text-foreground leading-relaxed">{risk.likelyImpact}</p>
                      </section>
                      <section>
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Who should act</h4>
                        <p className="text-xs text-foreground">{risk.whoShouldAct}</p>
                      </section>
                      <section>
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recommended action</h4>
                        <p className="text-xs text-foreground leading-relaxed">{risk.suggestedAction}</p>
                      </section>
                      <section>
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">AI-drafted message</h4>
                        <div className="bg-secondary rounded-md p-3 text-xs text-foreground leading-relaxed font-mono whitespace-pre-wrap">
                          {risk.draftMessage}
                        </div>
                      </section>
                      <div className="flex items-center gap-2 pt-1">
                        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                          <Pencil className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-7 text-xs"
                          onClick={() => {
                            setHandled((prev) => new Set(prev).add(risk.id));
                            setExpandedRisks((prev) => { const n = new Set(prev); n.delete(risk.id); return n; });
                          }}
                        >
                          <CircleCheck className="w-3 h-3" />
                          Handled
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                          <ArrowUpRight className="w-3 h-3" />
                          Escalate
                        </Button>
                        <Button size="sm" className="gap-1.5 h-7 text-xs">
                          <Send className="w-3 h-3" />
                          Send
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
