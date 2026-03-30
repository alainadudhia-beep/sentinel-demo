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
} from "lucide-react";

const interpretedScope = {
  project: "Commercial Due Diligence — Project Falcon",
  client: "Meridian Capital Partners",
  target: "FreshCart Ltd (UK online grocery delivery)",
  duration: "3 weeks (17 Mar – 4 Apr 2025)",
  fee: "£285,000 + VAT",
  workstreams: [
    {
      name: "Consumer Survey",
      owner: "James Okafor",
      tasks: [
        "Design questionnaire",
        "Launch survey (n=1,500)",
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
        "Populate with expert interview inputs",
        "5-year growth projections",
      ],
      estimatedDays: "1–10",
    },
    {
      name: "Internal Analysis",
      owner: "Tom Bradley",
      tasks: [
        "Schedule management interviews",
        "Conduct 3 management sessions",
        "Conduct 8–10 expert interviews",
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
  ],
  milestones: [
    { label: "Weekly status call #1", date: "17 Mar (Mon, Wk 1)", type: "recurring" as const },
    { label: "Weekly status call #2", date: "24 Mar (Mon, Wk 2)", type: "recurring" as const },
    { label: "Survey launch", date: "20 Mar (Thu, Wk 1)", type: "key" as const },
    { label: "Interim findings deck", date: "28 Mar (Fri, Wk 2)", type: "key" as const },
    { label: "Weekly status call #3", date: "31 Mar (Mon, Wk 3)", type: "recurring" as const },
    { label: "Draft final report", date: "2 Apr (Wed, Wk 3)", type: "key" as const },
    { label: "Final presentation to IC", date: "4 Apr (Fri, Wk 3)", type: "deadline" as const },
  ],
  assumptions: [
    "Data room access available by 17 March",
    "Management availability confirmed for Weeks 1–2",
    "Survey panel recruitment: 5-day turnaround",
    "All deliverables subject to Apex quality review",
  ],
};

export default function ScopeReview() {
  const navigate = useNavigate();
  const [approved, setApproved] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleApprove = () => {
    setApproved(true);
    setGenerating(true);
    setTimeout(() => navigate("/plan"), 1500);
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
        <h2 className="text-xl font-semibold text-foreground">
          Scope Review
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          We've extracted the following from the engagement letter. Please review and approve before generating the project plan.
        </p>
      </div>

      {/* Project summary */}
      <Card className="p-5 mb-6 bg-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Project</p>
            <p className="font-medium text-foreground">{interpretedScope.project}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Client</p>
            <p className="font-medium text-foreground">{interpretedScope.client}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Target</p>
            <p className="font-medium text-foreground">{interpretedScope.target}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Duration</p>
            <p className="font-medium text-foreground">{interpretedScope.duration}</p>
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
          {interpretedScope.workstreams.map((ws) => (
            <Card key={ws.name} className="p-4 bg-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-foreground">{ws.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" />
                    {ws.owner}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Days {ws.estimatedDays}
                </Badge>
              </div>
              <ul className="space-y-1 mt-3">
                {ws.tasks.map((task) => (
                  <li key={task} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
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
            {interpretedScope.milestones.map((ms) => (
              <div
                key={ms.label + ms.date}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground">{ms.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{ms.date}</span>
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
            {interpretedScope.assumptions.map((a) => (
              <li key={a} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {a}
              </li>
            ))}
          </ul>
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
