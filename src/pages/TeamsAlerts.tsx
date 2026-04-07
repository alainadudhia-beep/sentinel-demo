import { useState } from "react";
import { AlertTriangle, CircleCheck, ArrowUpRight, Check, MessageSquare, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeamsAlerts() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Teams Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preview how risk notifications appear in Microsoft Teams
          </p>
        </div>

        <div className="max-w-2xl">
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
      </div>
    </div>
  );
}
