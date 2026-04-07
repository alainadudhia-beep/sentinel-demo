import { useState } from "react";
import { ganttWorkstreams } from "@/data/mockData";
import { AlertTriangle, ShieldAlert, CircleCheck, OctagonX, ChevronDown, ChevronRight, Check, ArrowUpRight, Clock, MessageSquare, Bot, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
      <Tabs defaultValue="risk-manager" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="risk-manager" className="gap-2">
            <ShieldAlert className="w-4 h-4" />
            Risk Manager
          </TabsTrigger>
          <TabsTrigger value="teams-alerts" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Teams Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risk-manager">
          {/* Header banner */}
          <div className="mb-8 rounded-xl border border-rag-red/30 bg-gradient-to-r from-rag-red/5 via-rag-amber/5 to-transparent p-6">
            <div className="flex items-start justify-between gap-6">
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
                <div className="mt-4">
                  <span className="text-lg font-bold text-rag-red tracking-tight">
                    Potential +2 day delay → partner review at risk → likely overrun
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
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
                  2 Medium Risks
                </span>
              </div>
            </div>
          </div>

          {/* Outcome-based risk groups */}
          <div className="space-y-4">
            {OUTCOME_GROUPS.map((group) => {
              const isExpanded = expandedOutcomes.has(group.id);
              const options = RISK_OPTIONS[group.riskId] || [];
              const isHandled = handled.has(group.riskId);
              const severityColors = {
                critical: { bg: "bg-rag-critical/10", text: "text-rag-critical", border: "border-rag-critical/20", badge: "bg-rag-critical/15 text-rag-critical border-rag-critical/20" },
                high: { bg: "bg-rag-red/10", text: "text-rag-red", border: "border-rag-red/20", badge: "bg-rag-red/15 text-rag-red border-rag-red/20" },
                medium: { bg: "bg-rag-amber/10", text: "text-rag-amber", border: "border-rag-amber/20", badge: "bg-rag-amber/15 text-rag-amber border-rag-amber/20" },
              };
              const colors = severityColors[group.severity];
              const actionByColors = {
                now: "bg-rag-critical/15 text-rag-critical border-rag-critical/25",
                today: "bg-rag-red/15 text-rag-red border-rag-red/25",
                "this week": "bg-rag-amber/15 text-rag-amber border-rag-amber/25",
              };

              return (
                <div
                  key={group.id}
                  className={`rounded-lg border ${colors.border} ${isHandled ? "opacity-60" : ""}`}
                >
                  <button
                    onClick={() => toggleOutcome(group.id)}
                    className={`w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors rounded-lg`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <div className={`w-8 h-8 rounded-md ${colors.bg} flex items-center justify-center shrink-0`}>
                      {group.severity === "critical" ? (
                        <OctagonX className={`w-4 h-4 ${colors.text}`} />
                      ) : (
                        <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{group.outcome}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${colors.badge}`}>
                          {group.severity}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${actionByColors[group.actionBy]} flex items-center gap-1`}>
                          <Clock className="w-3 h-3" />
                          {group.actionBy === "now" ? "Action now" : group.actionBy === "today" ? "Action today" : "Action this week"}
                        </span>
                        {isHandled && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-rag-green/15 text-rag-green border border-rag-green/20 flex items-center gap-1">
                            <CircleCheck className="w-3 h-3" /> Handled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{group.cause}</p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 ml-[3.25rem]">
                      <div className="mb-3 p-3 rounded-md bg-muted/40 border border-border/50">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project Impact</span>
                        <p className="text-sm text-foreground mt-1">{group.projectImpact}</p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Response Options</span>
                        {options.map((opt) => {
                          const isSelected = selectedOptions[group.riskId] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() =>
                                setSelectedOptions((prev) => ({ ...prev, [group.riskId]: opt.id }))
                              }
                              className={`w-full text-left rounded-md border p-3 transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                                </div>
                                <span className="text-sm font-medium text-foreground">{opt.title}</span>
                                {opt.recommended && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <div className="ml-6 space-y-1">
                                {opt.steps.map((s, i) => (
                                  <p key={i} className="text-xs text-muted-foreground">
                                    {i + 1}. {s}
                                  </p>
                                ))}
                                <div className="flex gap-4 mt-1.5">
                                  <span className="text-[11px] text-muted-foreground">
                                    <strong className="text-foreground">Rationale:</strong> {opt.rationale}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    <strong className="text-foreground">Risk:</strong> {opt.risk}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

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
        </TabsContent>

        <TabsContent value="teams-alerts">
          <TeamsAlertsMockup />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Teams Alerts Mockup ─── */
function TeamsAlertsMockup() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Teams window chrome */}
      <div className="rounded-xl border border-border overflow-hidden shadow-lg bg-background">
        {/* Teams header bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[hsl(258,60%,45%)] text-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-xs font-bold">T</div>
            <span className="text-sm font-semibold">Microsoft Teams</span>
          </div>
          <span className="text-xs opacity-70 ml-auto">Chat · Project Falcon Alerts</span>
        </div>

        {/* Chat area */}
        <div className="p-4 space-y-4 bg-muted/20 min-h-[400px]">
          {/* Bot message - alert */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rag-red/15 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-rag-red" />
            </div>
            <div className="flex-1 max-w-[480px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">Risk Manager Bot</span>
                <span className="text-[11px] text-muted-foreground">Today 9:14 AM</span>
              </div>
              {/* Adaptive card style */}
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="h-1 bg-rag-red" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rag-red" />
                    <span className="font-bold text-foreground">🚨 Critical Risk Alert</span>
                  </div>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</span>
                      <p className="text-foreground">Project Falcon · FreshCart DD</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk</span>
                      <p className="text-foreground font-medium">Survey Delayed</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cause</span>
                      <p className="text-muted-foreground">Panel recruitment delayed 1 day, response rate at 62% of target</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Impact</span>
                      <p className="text-muted-foreground">Potential +2 day delay → partner review at risk → likely overrun</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Recommended Actions</span>
                    <div className="space-y-2">
                      {[
                        { id: "a1", label: "✅ Recover timeline — priority boost request", recommended: true },
                        { id: "a2", label: "📅 Extend survey timeline (+1 day)" },
                        { id: "a3", label: "📊 Proceed with partial data (62%)" },
                      ].map((action) => (
                        <button
                          key={action.id}
                          onClick={() => setSelectedAction(action.id)}
                          className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                            selectedAction === action.id
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{action.label}</span>
                            {action.recommended && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                                Recommended
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="gap-1.5 h-8 text-xs flex-1" disabled={!selectedAction}>
                      <Check className="w-3 h-3" />
                      Approve Action
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                      <ArrowUpRight className="w-3 h-3" />
                      Escalate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manager response */}
          {selectedAction && (
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-[400px]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-[11px] text-muted-foreground">Today 9:16 AM</span>
                  <span className="text-sm font-semibold text-foreground">Sarah Chen</span>
                </div>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm text-foreground">
                  {selectedAction === "a1" && "Approved: Recover timeline with priority boost. Please escalate to panel provider immediately."}
                  {selectedAction === "a2" && "Approved: Extend survey by 1 day. Compress synthesis accordingly."}
                  {selectedAction === "a3" && "Approved: Proceed with partial data. Flag confidence level in deck."}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
            </div>
          )}

          {/* Bot confirmation */}
          {selectedAction && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rag-green/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-rag-green" />
              </div>
              <div className="max-w-[480px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">Risk Manager Bot</span>
                  <span className="text-[11px] text-muted-foreground">Today 9:16 AM</span>
                </div>
                <div className="rounded-lg border border-rag-green/30 bg-rag-green/5 p-3 text-sm text-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    <CircleCheck className="w-4 h-4 text-rag-green" />
                    <span className="font-medium">Action confirmed</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Risk response logged. Team notified. Project timeline updated.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Teams input bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-background">
          <div className="flex-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground bg-muted/30">
            Type a message...
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground mb-2">How Teams Alerts Work</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• Risk Manager Bot sends adaptive cards when risks are detected</li>
          <li>• Managers can review context, select an action, and approve directly in Teams</li>
          <li>• Responses are logged and the project timeline updates automatically</li>
          <li>• Escalation routes alerts to senior leadership channels</li>
        </ul>
      </div>
    </div>
  );
}
