import { useState } from "react";
import { ganttWorkstreams } from "@/data/mockData";
import { AlertTriangle, ShieldAlert, CircleCheck, OctagonX, ChevronDown, ChevronRight, Check, ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutcomeGroup {
  id: string;
  outcome: string;
  severity: "critical" | "high" | "medium";
  cause: string;
  projectImpact: string;
  riskId: string;
  actionBy: "now" | "today" | "this week";
}

const OUTCOME_GROUPS: OutcomeGroup[] = [
  {
    id: "o1",
    outcome: "Survey delayed",
    severity: "critical",
    cause: "Panel recruitment delayed 1 day, response rate at 62% of target",
    projectImpact: "Survey critical path blocked, synthesis deck pushed +2 days, removes partner review buffer",
    riskId: "r1",
    actionBy: "now",
  },
  {
    id: "o2",
    outcome: "Market model stalled",
    severity: "high",
    cause: "Priya off sick since Wednesday — competitor pricing layer and 5-year projections incomplete",
    projectImpact: "TAM/SAM/SOM section incomplete for partner review, weakens investment thesis",
    riskId: "r4",
    actionBy: "today",
  },
  {
    id: "o3",
    outcome: "Market model initial slides missing",
    severity: "medium",
    cause: "Priya off sick — market model slides not started, no draft available for partner review",
    projectImpact: "Partner review deck incomplete, risks credibility of market sizing narrative",
    riskId: "r5",
    actionBy: "today",
  },
  {
    id: "o4",
    outcome: "Management interview slipped",
    severity: "medium",
    cause: "Session 2 rescheduled from Tuesday to Thursday",
    projectImpact: "Expert interview synthesis missing management cross-references, competitive dynamics section weakened",
    riskId: "r3",
    actionBy: "this week",
  },
];

interface RecommendationOption {
  id: string;
  title: string;
  recommended?: boolean;
  steps: string[];
  rationale: string;
  risk: string;
}

const RISK_OPTIONS: Record<string, RecommendationOption[]> = {
  r1: [
    {
      id: "r1-opt1",
      title: "Recover survey timeline with priority boost request",
      recommended: true,
      steps: [
        "Contact panel provider for priority escalation",
        "Request expedited recruitment for remaining 38% of target",
      ],
      rationale: "Fastest fix, minimal disruption",
      risk: "Dependent on provider",
    },
    {
      id: "r1-opt2",
      title: "Extend survey timeline",
      steps: [
        "Push survey close by 1 day",
        "Compress synthesis timeline by 1 day",
      ],
      rationale: "Allows more responses, improves data quality",
      risk: "Synthesis timeline tighter, partner review buffer reduced further",
    },
    {
      id: "r1-opt3",
      title: "Proceed with partial data",
      steps: [
        "Close survey on schedule with 62% response rate",
        "Flag reduced confidence in synthesis deck",
      ],
      rationale: "Keeps all downstream dates intact",
      risk: "Lower statistical confidence, partner may challenge findings",
    },
  ],
  r4: [
    {
      id: "r4-opt1",
      title: "Reassign work",
      recommended: true,
      steps: [
        "Move pricing layer to James",
        "Ask Priya to share data and wish her better",
      ],
      rationale: "Keeps model on track, uses James' capacity given survey delays",
      risk: "Increases later survey load",
    },
    {
      id: "r4-opt2",
      title: "Simplify model scope",
      steps: ["Reduce 5-year projection detail"],
      rationale: "Maintains timeline",
      risk: "Lowers precision, client may be unhappy with reduced scope",
    },
    {
      id: "r4-opt3",
      title: "Recruit new resource",
      steps: ["Currently have 2 available Associates in the pool"],
      rationale: "Keeps model on track",
      risk: "Requires onboarding, may delay partner review",
    },
  ],
  r5: [
    {
      id: "r5-opt1",
      title: "AI-generate slides for review",
      recommended: true,
      steps: [
        "Use AI to draft market model slides from existing data inputs",
        "Route to partner for rapid review and markup",
      ],
      rationale: "Fastest path to a reviewable draft, keeps timeline intact",
      risk: "AI output may need significant manual refinement",
    },
    {
      id: "r5-opt2",
      title: "Reuse previous project slides",
      steps: [
        "Pull market model template from last comparable engagement",
        "Update with FreshCart-specific data points",
      ],
      rationale: "Proven structure, reduces design effort",
      risk: "May not reflect current market dynamics, requires careful updating",
    },
    {
      id: "r5-opt3",
      title: "Create placeholders for interim meeting",
      steps: [
        "Build slide shells with section headers and data callouts",
        "Flag as draft/placeholder for partner awareness",
      ],
      rationale: "Sets expectations, keeps meeting productive",
      risk: "Partner may push back on incomplete content",
    },
  ],
  r3: [
    {
      id: "r3-opt1",
      title: "Draft with placeholders",
      recommended: true,
      steps: [
        "Ask Tom to draft expert interview section now",
        "Add placeholders for management inputs to fill Thursday evening",
      ],
      rationale: "Keeps synthesis moving, minimises idle time",
      risk: "Placeholder sections may need significant rework after Thursday",
    },
    {
      id: "r3-opt2",
      title: "Reorder deliverable sections",
      steps: [
        "Move competitive dynamics to end of deck",
        "Prioritise sections not dependent on management interview",
      ],
      rationale: "No content compromises, uses time efficiently",
      risk: "Deck flow may feel disjointed if not restructured later",
    },
    {
      id: "r3-opt3",
      title: "Request earlier interview slot",
      steps: [
        "Ask management team if Wednesday afternoon is possible",
        "Offer flexible format (30 min call vs full session)",
      ],
      rationale: "Recovers lost day, keeps original plan intact",
      risk: "Management may decline, wasting coordination effort",
    },
  ],
};

export default function Project() {
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<string>>(new Set(OUTCOME_GROUPS.map(o => o.id)));
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const group of OUTCOME_GROUPS) {
      const opts = RISK_OPTIONS[group.riskId];
      if (opts?.length) {
        const rec = opts.find(o => o.recommended);
        defaults[group.riskId] = rec ? rec.id : opts[0].id;
      }
    }
    return defaults;
  });

  const toggleOutcome = (id: string) => {
    setExpandedOutcomes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
                <h2 className="text-xl font-bold text-foreground">Project at Risk</h2>
                <p className="text-sm text-muted-foreground">
                  Project Falcon · FreshCart DD · Week 2 of 3
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <span className="text-lg font-bold text-rag-red tracking-tight">
            +2 day delay → partner review at risk → likely overrun
          </span>
        </div>
        <div className="flex items-center gap-3 mt-3">
           <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-rag-critical/15 text-rag-critical border border-rag-critical/20">
             <AlertTriangle className="w-4 h-4" />
             1 Critical Risk
           </span>
           <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-rag-red/15 text-rag-red border border-rag-red/20">
             <AlertTriangle className="w-4 h-4" />
             1 High Risk
           </span>
           <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-rag-amber/15 text-rag-amber border border-rag-amber/20">
             <AlertTriangle className="w-4 h-4" />
             1 Medium Risk
           </span>
        </div>
      </div>

      {/* Outcome-based risk groups */}
      <div className="space-y-4">
        {OUTCOME_GROUPS.map((group) => {
          const isExpanded = expandedOutcomes.has(group.id);
          const isHandled_ = handled.has(group.riskId);
          const options = RISK_OPTIONS[group.riskId] || [];
          const currentSelection = selectedOptions[group.riskId];
          const severityClass = group.severity === "critical"
            ? "border-rag-critical/20 bg-rag-critical/[0.04]"
            : group.severity === "high"
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
                        group.severity === "critical"
                          ? "bg-rag-critical/20 text-rag-critical"
                          : group.severity === "high"
                          ? "bg-rag-red/10 text-rag-red"
                          : "bg-rag-amber/10 text-rag-amber"
                      }`}
                    >
                      {group.severity === "critical" ? "Critical" : group.severity === "high" ? "High" : "Medium"}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">{group.outcome}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        group.actionBy === "now"
                          ? "bg-rag-critical/15 text-rag-critical"
                          : group.actionBy === "today"
                          ? "bg-rag-amber/15 text-rag-amber"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      Act {group.actionBy}
                    </span>
                   </div>
                  <p className="text-xs text-muted-foreground mt-1">{group.cause}</p>
                </div>
                <div className="shrink-0 max-w-[340px] text-right">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Project impact</p>
                  <p className="text-xs font-semibold text-foreground leading-snug">{group.projectImpact}</p>
                </div>
              </button>

              {/* Expanded: choose an action */}
              {isExpanded && options.length > 0 && (
                <div className="border-t border-border/50 px-5 py-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Choose an action</p>
                  <div className="grid gap-2">
                    {options.map((opt, idx) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [group.riskId]: opt.id }))}
                        className={`w-full text-left rounded-lg border p-3.5 transition-all ${
                          currentSelection === opt.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:border-muted-foreground/30 hover:bg-accent/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            currentSelection === opt.id
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40"
                          }`}>
                            {currentSelection === opt.id && (
                              <Check className="w-2.5 h-2.5 text-primary-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-foreground">
                                {idx + 1}. {opt.title}
                              </span>
                              {opt.recommended && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <div className="space-y-0.5 mb-1.5">
                              {opt.steps.map((step, i) => (
                                <p key={i} className="text-xs text-muted-foreground">→ {step}</p>
                              ))}
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-xs text-foreground">
                                <span className="font-medium text-muted-foreground">Rationale: </span>
                                {opt.rationale}
                              </p>
                            </div>
                            <p className="text-xs text-foreground mt-0.5">
                              <span className="font-medium text-rag-amber">Risk: </span>
                              {opt.risk}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() => {
                        setHandled((prev) => new Set(prev).add(group.riskId));
                      }}
                    >
                      <Check className="w-3 h-3" />
                      Action selected plan
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                      <ArrowUpRight className="w-3 h-3" />
                      Escalate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() => {
                        setHandled((prev) => new Set(prev).add(group.riskId));
                      }}
                    >
                      <CircleCheck className="w-3 h-3" />
                      Handled
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
