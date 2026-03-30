import { useState } from "react";
import { liveWorkstreams, risks, type Risk } from "@/data/mockData";
import { AlertTriangle, CheckCircle2, Clock, X, Send, Pencil, ArrowUpRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  "complete": {
    label: "Complete",
    className: "bg-rag-green/10 text-rag-green",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  "on-track": {
    label: "On track",
    className: "bg-rag-green/10 text-rag-green",
    icon: <Clock className="w-3 h-3" />,
  },
  "at-risk": {
    label: "At risk",
    className: "bg-rag-amber/10 text-rag-amber",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
};

export default function Project() {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [handled, setHandled] = useState<Set<string>>(new Set());

  const atRiskCount = liveWorkstreams.filter((w) => w.status === "at-risk").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Project Falcon — FreshCart DD</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Meridian Capital Partners · 17 Mar – 4 Apr 2025 · Week 2 of 3
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rag-amber/10 text-rag-amber">
            <AlertTriangle className="w-3 h-3" />
            {atRiskCount} workstreams at risk
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rag-green/10 text-rag-green">
            <CheckCircle2 className="w-3 h-3" />
            Overall: On Track
          </span>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Workstreams table */}
        <div className="flex-1 min-w-0">
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Workstream</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Owner</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Due</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Dependency</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Notes</th>
                </tr>
              </thead>
              <tbody>
                {liveWorkstreams.map((w) => {
                  const sc = statusConfig[w.status];
                  return (
                    <tr key={w.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{w.workstream}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{w.owner}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{w.dueDate}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sc.className}`}>
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{w.dependency}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px]">{w.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk panel */}
        <div className="w-80 flex-shrink-0">
          <div className="border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rag-amber" />
                AI Early Warnings
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{risks.length} risks detected</p>
            </div>
            <div className="divide-y divide-border">
              {risks.map((risk) => (
                <button
                  key={risk.id}
                  onClick={() => setSelectedRisk(risk)}
                  className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors ${
                    handled.has(risk.id) ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        risk.severity === "high" ? "bg-rag-red" : "bg-rag-amber"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground leading-snug">{risk.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{risk.likelyImpact}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk detail slide-over */}
      {selectedRisk && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm" onClick={() => setSelectedRisk(null)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border shadow-xl overflow-y-auto">
            <div className="px-6 py-5 border-b border-border flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      selectedRisk.severity === "high"
                        ? "bg-rag-red/10 text-rag-red"
                        : "bg-rag-amber/10 text-rag-amber"
                    }`}
                  >
                    {selectedRisk.severity === "high" ? "High" : "Medium"} severity
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{selectedRisk.title}</h3>
              </div>
              <button onClick={() => setSelectedRisk(null)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Why it matters</h4>
                <p className="text-sm text-foreground leading-relaxed">{selectedRisk.whyItMatters}</p>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Likely impact</h4>
                <p className="text-sm text-foreground leading-relaxed">{selectedRisk.likelyImpact}</p>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Who should act</h4>
                <p className="text-sm text-foreground">{selectedRisk.whoShouldAct}</p>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommended action</h4>
                <p className="text-sm text-foreground leading-relaxed">{selectedRisk.suggestedAction}</p>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI-drafted message</h4>
                <div className="bg-secondary rounded-lg p-4 text-sm text-foreground leading-relaxed font-mono whitespace-pre-wrap">
                  {selectedRisk.draftMessage}
                </div>
              </section>

              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Pencil className="w-3 h-3" />
                  Edit draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setHandled((prev) => new Set(prev).add(selectedRisk.id));
                    setSelectedRisk(null);
                  }}
                >
                  <CircleCheck className="w-3 h-3" />
                  Mark handled
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpRight className="w-3 h-3" />
                  Escalate
                </Button>
                <Button size="sm" className="gap-1.5">
                  <Send className="w-3 h-3" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
