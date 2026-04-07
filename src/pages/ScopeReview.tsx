import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Users,
  Flag,
  ListChecks,
  Loader2,
  Plus,
  X,
} from "lucide-react";

interface WorkstreamData {
  name: string;
  owner: string;
  tasks: string[];
  estimatedDays: string;
}

interface MilestoneData {
  label: string;
  date: string;
  type: "recurring" | "key" | "deadline";
}

const initialScope = {
  project: "Commercial Due Diligence — Project Falcon",
  client: "Meridian Capital Partners",
  target: "FreshCart Ltd (UK online grocery delivery)",
  duration: "3 weeks (17 Mar – 4 Apr 2025)",
  fee: "£285,000 + VAT",
  workstreams: [
    {
      name: "Commercial (Survey)",
      owner: "James Okafor",
      tasks: [
        "Design questionnaire",
        "Launch survey (n=100)",
        "Collect & close responses",
        "Run analysis (initial + final)",
        "Slide up findings",
      ],
      estimatedDays: "1–14",
    },
    {
      name: "Market Model",
      owner: "Priya Sharma",
      tasks: [
        "Collect market data from data room",
        "Build bottom-up sizing model (TAM/SAM/SOM)",
        "Conduct 8–10 expert interviews for inputs",
        "5-year growth projections",
      ],
      estimatedDays: "1–10",
    },
    {
      name: "Internals (Analysis, Mgmt Interviews)",
      owner: "Tom Bradley",
      tasks: [
        "Schedule management interviews",
        "Conduct 3 management sessions",
        "Collect and itemise internal data",
        "Synthesise interview findings",
      ],
      estimatedDays: "1–10",
    },
    {
      name: "Presentation",
      owner: "Emma Wilson",
      tasks: [
        "Synthesise findings into 40–50 slide deck",
        "Partner review",
        "Final presentation to IC",
      ],
      estimatedDays: "11–15",
    },
  ] as WorkstreamData[],
  milestones: [
    { label: "Weekly status call #1", date: "17 Mar (Mon, Wk 1)", type: "recurring" as const },
    { label: "Weekly status call #2", date: "24 Mar (Mon, Wk 2)", type: "recurring" as const },
    { label: "Survey launch", date: "20 Mar (Thu, Wk 1)", type: "key" as const },
    { label: "Interim findings deck", date: "28 Mar (Fri, Wk 2)", type: "key" as const },
    { label: "Weekly status call #3", date: "31 Mar (Mon, Wk 3)", type: "recurring" as const },
    { label: "Draft final report", date: "2 Apr (Wed, Wk 3)", type: "key" as const },
    { label: "Final presentation to IC", date: "4 Apr (Fri, Wk 3)", type: "deadline" as const },
  ] as MilestoneData[],
  assumptions: [
    "Data room access available by 17 March",
    "Management availability confirmed for Weeks 1–2",
    "Survey panel recruitment: 5-day turnaround",
    "All deliverables subject to Apex quality review",
  ],
};

const workstreamNameColors: Record<string, string> = {
  "Commercial (Survey)": "text-blue-600",
  "Market Model": "text-violet-600",
  "Internals (Analysis, Mgmt Interviews)": "text-emerald-600",
  "Presentation": "text-pink-600",
};

function EditableText({
  value,
  onChange,
  className = "",
  inputClassName = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={value}
        className={`bg-transparent border-b border-primary outline-none w-full ${inputClassName}`}
        onBlur={(e) => {
          onChange(e.target.value);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange((e.target as HTMLInputElement).value);
            setEditing(false);
          } else if (e.key === "Escape") {
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span
      className={`cursor-text hover:bg-accent/50 rounded px-0.5 -mx-0.5 transition-colors ${className}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

export default function ScopeReview() {
  const navigate = useNavigate();
  const [approved, setApproved] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [project, setProject] = useState(initialScope.project);
  const [client, setClient] = useState(initialScope.client);
  const [target, setTarget] = useState(initialScope.target);
  const [duration, setDuration] = useState(initialScope.duration);
  const [workstreams, setWorkstreams] = useState<WorkstreamData[]>(initialScope.workstreams);
  const [milestones, setMilestones] = useState<MilestoneData[]>(initialScope.milestones);
  const [assumptions, setAssumptions] = useState<string[]>(initialScope.assumptions);

  const handleApprove = () => {
    setApproved(true);
    setGenerating(true);
    setTimeout(() => navigate("/plan"), 1500);
  };

  const updateWorkstream = (idx: number, field: keyof WorkstreamData, value: string) => {
    setWorkstreams((prev) => prev.map((ws, i) => (i === idx ? { ...ws, [field]: value } : ws)));
  };

  const updateTask = (wsIdx: number, taskIdx: number, value: string) => {
    setWorkstreams((prev) =>
      prev.map((ws, i) =>
        i === wsIdx ? { ...ws, tasks: ws.tasks.map((t, j) => (j === taskIdx ? value : t)) } : ws
      )
    );
  };

  const removeTask = (wsIdx: number, taskIdx: number) => {
    setWorkstreams((prev) =>
      prev.map((ws, i) =>
        i === wsIdx ? { ...ws, tasks: ws.tasks.filter((_, j) => j !== taskIdx) } : ws
      )
    );
  };

  const addTask = (wsIdx: number) => {
    setWorkstreams((prev) =>
      prev.map((ws, i) =>
        i === wsIdx ? { ...ws, tasks: [...ws.tasks, "New task"] } : ws
      )
    );
  };

  const updateMilestone = (idx: number, field: keyof MilestoneData, value: string) => {
    setMilestones((prev) => prev.map((ms, i) => (i === idx ? { ...ms, [field]: value } : ms)));
  };

  const removeMilestone = (idx: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAssumption = (idx: number, value: string) => {
    setAssumptions((prev) => prev.map((a, i) => (i === idx ? value : a)));
  };

  const removeAssumption = (idx: number) => {
    setAssumptions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs font-normal">
            AI Interpretation
          </Badge>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Scope Review</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We've extracted the following from the engagement letter. Click any text to edit. Approve when ready.
        </p>
      </div>

      {/* Project summary */}
      <Card className="p-5 mb-6 bg-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Project</p>
            <p className="font-medium text-foreground">
              <EditableText value={project} onChange={setProject} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Client</p>
            <p className="font-medium text-foreground">
              <EditableText value={client} onChange={setClient} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Target</p>
            <p className="font-medium text-foreground">
              <EditableText value={target} onChange={setTarget} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Duration</p>
            <p className="font-medium text-foreground">
              <EditableText value={duration} onChange={setDuration} />
            </p>
          </div>
        </div>
      </Card>

      {/* Workstreams */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4 text-primary" />
          Workstreams & Key Tasks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workstreams.map((ws, wsIdx) => (
            <Card key={wsIdx} className="p-4 bg-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className={`font-medium text-sm ${workstreamNameColors[ws.name] || "text-foreground"}`}>
                    <EditableText value={ws.name} onChange={(v) => updateWorkstream(wsIdx, "name", v)} />
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" />
                    <EditableText
                      value={ws.owner}
                      onChange={(v) => updateWorkstream(wsIdx, "owner", v)}
                      className="text-muted-foreground"
                      inputClassName="text-xs"
                    />
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Days{" "}
                  <EditableText
                    value={ws.estimatedDays}
                    onChange={(v) => updateWorkstream(wsIdx, "estimatedDays", v)}
                    inputClassName="text-[10px] w-12"
                  />
                </Badge>
              </div>
              <ul className="space-y-1 mt-3">
                {ws.tasks.map((task, taskIdx) => (
                  <li key={taskIdx} className="text-xs text-muted-foreground flex items-start gap-1.5 group/task">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                    <EditableText
                      value={task}
                      onChange={(v) => updateTask(wsIdx, taskIdx, v)}
                      className="flex-1 text-muted-foreground"
                      inputClassName="text-xs"
                    />
                    <button
                      onClick={() => removeTask(wsIdx, taskIdx)}
                      className="opacity-0 group-hover/task:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 shrink-0"
                    >
                      <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => addTask(wsIdx)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-2 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add task
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <Flag className="w-4 h-4 text-primary" />
          Key Milestones
        </h3>
        <Card className="p-4 bg-card">
          <div className="space-y-2">
            {milestones.map((ms, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0 group/ms"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <EditableText
                    value={ms.label}
                    onChange={(v) => updateMilestone(idx, "label", v)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <EditableText
                    value={ms.date}
                    onChange={(v) => updateMilestone(idx, "date", v)}
                    className="text-xs text-muted-foreground"
                    inputClassName="text-xs"
                  />
                  <Badge
                    variant={ms.type === "deadline" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {ms.type === "deadline"
                      ? "Hard Deadline"
                      : ms.type === "key"
                      ? "Key Date"
                      : "Recurring"}
                  </Badge>
                  <button
                    onClick={() => removeMilestone(idx)}
                    className="opacity-0 group-hover/ms:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Assumptions */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-3">Key Assumptions</h3>
        <Card className="p-4 bg-card">
          <ul className="space-y-1.5">
            {assumptions.map((a, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2 group/assum">
                <span className="text-primary mt-0.5">•</span>
                <EditableText
                  value={a}
                  onChange={(v) => updateAssumption(idx, v)}
                  className="flex-1 text-muted-foreground"
                  inputClassName="text-xs"
                />
                <button
                  onClick={() => removeAssumption(idx)}
                  className="opacity-0 group-hover/assum:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 shrink-0"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setAssumptions((prev) => [...prev, "New assumption"])}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-2 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add assumption
          </button>
        </Card>
      </div>

      {/* Approve CTA */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={() => navigate("/scope")}>
          Edit scope
        </Button>
        <Button
          onClick={handleApprove}
          disabled={approved}
          className="gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating plan…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Approve & generate plan
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
