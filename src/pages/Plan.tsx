import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { generatedPlan } from "@/data/mockData";
import { ArrowRight, Clock, Sparkles } from "lucide-react";

const statusColors: Record<string, string> = {
  "complete": "bg-rag-green/10 text-rag-green",
  "on-track": "bg-rag-green/10 text-rag-green",
  "at-risk": "bg-rag-amber/10 text-rag-amber",
  "not-started": "bg-secondary text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  "complete": "Complete",
  "on-track": "On track",
  "at-risk": "At risk",
  "not-started": "Not started",
};

export default function Plan() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Generated Project Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Commercial DD — Project Falcon · FreshCart Ltd · 3 weeks
          </p>
        </div>
        <Button onClick={() => navigate("/project")} className="gap-2">
          Open live project
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
          <Clock className="w-3 h-3" />
          Generated from scope in 12 seconds
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
          <Sparkles className="w-3 h-3" />
          Found 3 prior retail DDs with similar survey structure
        </span>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Week</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Workstream</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Task</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Owner</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Due</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Dependency</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Notes</th>
            </tr>
          </thead>
          <tbody>
            {generatedPlan.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground">W{m.week}</td>
                <td className="px-4 py-3 text-xs font-medium text-foreground">{m.workstream}</td>
                <td className="px-4 py-3 text-xs text-foreground">{m.task}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{m.owner}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{m.dueDate}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[m.status]}`}>
                    {statusLabels[m.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{m.dependency}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                  {m.critical && <span className="text-rag-red font-medium mr-1">Critical path.</span>}
                  {m.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
