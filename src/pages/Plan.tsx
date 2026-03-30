import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ganttWorkstreams, GanttItem } from "@/data/mockData";
import { ArrowRight, Clock, Sparkles, ChevronRight, ChevronDown, Diamond } from "lucide-react";

const TOTAL_DAYS = 15;
const WEEKS = [
  { label: "Week 1 · 17–21 Mar", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { label: "Week 2 · 24–28 Mar", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { label: "Week 3 · 31 Mar–4 Apr", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
];

const statusColors: Record<string, string> = {
  complete: "bg-rag-green",
  "on-track": "bg-rag-green",
  "at-risk": "bg-rag-amber",
  "not-started": "bg-muted-foreground/30",
};

const milestoneColors: Record<string, string> = {
  complete: "text-rag-green",
  "on-track": "text-rag-green",
  "at-risk": "text-rag-amber",
  "not-started": "text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  complete: "Complete",
  "on-track": "On track",
  "at-risk": "At risk",
  "not-started": "Not started",
};

function GanttBar({ item }: { item: GanttItem }) {
  if (item.type === "milestone") {
    const left = ((item.startDay - 1) / TOTAL_DAYS) * 100;
    return (
      <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${left}%` }}>
        <Diamond className={`w-3.5 h-3.5 fill-current ${milestoneColors[item.status]}`} />
      </div>
    );
  }

  const left = ((item.startDay - 1) / TOTAL_DAYS) * 100;
  const width = ((item.endDay - item.startDay + 1) / TOTAL_DAYS) * 100;

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-sm ${statusColors[item.status]} ${item.critical ? "ring-1 ring-rag-red/40" : ""}`}
      style={{ left: `${left}%`, width: `${width}%`, minWidth: "6px" }}
      title={`${item.label}${item.notes ? ` — ${item.notes}` : ""}`}
    />
  );
}

export default function Plan() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(ganttWorkstreams.map((ws) => [ws.id, true]))
  );

  const toggleWorkstream = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
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
          Found 3 prior retail DDs with similar structure
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded-sm bg-rag-green inline-block" /> On track / Complete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded-sm bg-rag-amber inline-block" /> At risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded-sm bg-muted-foreground/30 inline-block" /> Not started
        </span>
        <span className="flex items-center gap-1.5">
          <Diamond className="w-3 h-3 fill-current text-muted-foreground" /> Milestone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm bg-rag-amber ring-1 ring-rag-red/40 inline-block" /> Critical path
        </span>
      </div>

      {/* Gantt Chart */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Timeline header */}
        <div className="flex border-b border-border bg-secondary/50">
          <div className="w-64 min-w-[256px] shrink-0 px-4 py-2" />
          <div className="flex-1 flex">
            {WEEKS.map((week, wi) => (
              <div key={wi} className="flex-1 border-l border-border">
                <div className="text-[10px] font-medium text-muted-foreground px-2 py-1 border-b border-border/50">
                  {week.label}
                </div>
                <div className="flex">
                  {week.days.map((d, di) => (
                    <div key={di} className="flex-1 text-center text-[10px] text-muted-foreground/60 py-1 border-r border-border/30 last:border-0">
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workstream rows */}
        {ganttWorkstreams.map((ws) => (
          <div key={ws.id}>
            {/* Workstream header row */}
            <div
              className="flex border-b border-border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => toggleWorkstream(ws.id)}
            >
              <div className="w-64 min-w-[256px] shrink-0 px-4 py-2.5 flex items-center gap-2">
                {expanded[ws.id] ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold text-foreground">{ws.name}</span>
                <span className="text-[10px] text-muted-foreground ml-1">{ws.owner}</span>
              </div>
              <div className="flex-1 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex-1 border-l border-border" />
                  ))}
                </div>
                {/* Summary bars - show all items collapsed into one row */}
                {!expanded[ws.id] &&
                  ws.items.map((item) => (
                    <GanttBar key={item.id} item={item} />
                  ))}
              </div>
            </div>

            {/* Sub-items */}
            {expanded[ws.id] &&
              ws.items.map((item) => (
                <div
                  key={item.id}
                  className="flex border-b border-border/50 hover:bg-accent/30 transition-colors group"
                >
                  <div className="w-64 min-w-[256px] shrink-0 px-4 py-2 pl-10 flex items-center gap-2">
                    {item.type === "milestone" ? (
                      <Diamond className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                    ) : (
                      <span className="w-2.5 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    )}
                    <span className="text-xs text-foreground truncate">{item.label}</span>
                    {item.status !== "not-started" && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          item.status === "complete"
                            ? "bg-rag-green/10 text-rag-green"
                            : item.status === "at-risk"
                            ? "bg-rag-amber/10 text-rag-amber"
                            : "bg-rag-green/10 text-rag-green"
                        }`}
                      >
                        {statusLabels[item.status]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 relative py-1">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex-1 border-l border-border/50" />
                      ))}
                    </div>
                    <div className="relative h-6">
                      <GanttBar item={item} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Today marker note */}
      <p className="text-[10px] text-muted-foreground mt-3">
        Today is Wednesday Week 2 (26 Mar). Tasks to the left of midpoint should be complete.
      </p>
    </div>
  );
}
