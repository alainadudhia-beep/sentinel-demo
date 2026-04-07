import { useState } from "react";
import { AlertTriangle, CircleCheck, ArrowUpRight, Check, MessageSquare, Bot, User, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertCard {
  id: string;
  time: string;
  severity: "critical" | "high" | "medium" | "info";
  title: string;
  emoji: string;
  shortTitle: string;
  preview: string;
  fields: { label: string; value: string }[];
  actions: { id: string; label: string; recommended?: boolean }[];
  managerResponses: Record<string, string>;
  isPersonMessage?: boolean;
  personAvatar?: { initials: string; bg: string };
}

const ALERTS: AlertCard[] = [
  {
    id: "slide-review",
    time: "8:31 AM",
    severity: "info",
    title: "Slides marked for partner review",
    emoji: "📋",
    shortTitle: "Slides for Review",
    preview: "J. Okafor marked 2 slides for partner review",
    isPersonMessage: true,
    personAvatar: { initials: "JO", bg: "bg-red-500" },
    fields: [
      { label: "From", value: "J. Okafor · Commercial workstream" },
      { label: "Slides", value: "Management plan stress test + Commercial risk summary" },
      { label: "Section", value: "Commercial · 6 done, 2 awaiting review, 2 not started" },
      { label: "Deadline", value: "Partner sign-off needed before Mon 7 Apr client presentation" },
      { label: "Note", value: "Can you check my 2 slides please? Flagged for partner review — pipeline coverage ratios not yet independently validated." },
    ],
    actions: [
      { id: "sr1", label: "✅ Open slides and review now", recommended: true },
      { id: "sr2", label: "📧 Acknowledge — will review by Fri 4pm" },
      { id: "sr3", label: "↩️ Request changes before reviewing" },
    ],
    managerResponses: {
      sr1: "Opening slide review. Will approve or flag changes within the hour.",
      sr2: "Acknowledged. Scheduled for review during the Fri 4pm hold.",
      sr3: "Please re-check pipeline coverage data against VDR before I review. Flagging back to you.",
    },
  },
  {
    id: "survey",
    time: "9:14 AM",
    severity: "critical",
    title: "Critical Risk Alert",
    emoji: "🚨",
    shortTitle: "Survey Delayed",
    preview: "Panel recruitment delayed — response rate at 62%",
    fields: [
      { label: "Project", value: "Project Falcon · FreshCart DD" },
      { label: "Risk", value: "Survey Delayed" },
      { label: "Cause", value: "Panel recruitment delayed 1 day, response rate at 62% of target" },
      { label: "Impact", value: "Potential +2 day delay → partner review at risk → likely overrun" },
    ],
    actions: [
      { id: "a1", label: "✅ Recover timeline — priority boost request", recommended: true },
      { id: "a2", label: "📅 Extend survey timeline (+1 day)" },
      { id: "a3", label: "📊 Proceed with partial data (62%)" },
    ],
    managerResponses: {
      a1: "Approved: Recover timeline with priority boost. Please escalate to panel provider immediately.",
      a2: "Approved: Extend survey by 1 day. Compress synthesis accordingly.",
      a3: "Approved: Proceed with partial data. Flag confidence level in deck.",
    },
  },
  {
    id: "partner-review",
    time: "10:42 AM",
    severity: "high",
    title: "Partner declined slide review hold",
    emoji: "⚠️",
    shortTitle: "Slide Review Declined",
    preview: "Thu 11am removed — commercial slides awaiting review",
    fields: [
      { label: "Event", value: "Thu 3 Apr 11am removed · commercial slides still awaiting review" },
      { label: "What happened", value: "[Partner] declined the Thu 11am hold. 2 commercial slides need sign-off before the Mon 7 client presentation. Fri 4pm hold is the last remaining window." },
      { label: "Risk if Fri also drops", value: "Slides go to client unreviewed — partner must formally accept this." },
    ],
    actions: [
      { id: "b1", label: "📞 Chase EA for time", recommended: true },
      { id: "b2", label: "📧 Send slides for async review" },
    ],
    managerResponses: {
      b1: "Approved: Chase EA now. Escalate to me if no slot by 2pm today.",
      b2: "Approved: Send slides with tracked changes. Flag we need sign-off by EOD Friday.",
    },
  },
  {
    id: "market-model",
    time: "11:05 AM",
    severity: "medium",
    title: "Market model slides incomplete",
    emoji: "📊",
    shortTitle: "Market Model Slides",
    preview: "Priya off sick — slides not started for partner review",
    fields: [
      { label: "Project", value: "Project Falcon · FreshCart DD" },
      { label: "Cause", value: "Priya off sick since Wednesday — competitor pricing layer and 5-year projections not started" },
      { label: "Impact", value: "TAM/SAM/SOM section missing for Mon 7 partner review, weakens investment thesis" },
    ],
    actions: [
      { id: "c1", label: "🤖 AI-generate draft slides for review", recommended: true },
      { id: "c2", label: "📁 Pull slides from previous project (Project Echo)" },
      { id: "c3", label: "📝 Create placeholder slides for interim meeting" },
    ],
    managerResponses: {
      c1: "Approved: Generate AI draft. Priya to review when back. Flag as draft in deck.",
      c2: "Approved: Use Echo slides as baseline. Update figures for FreshCart context.",
      c3: "Approved: Placeholders with methodology note. Full slides by Wed.",
    },
  },
  {
    id: "meridian-checkin",
    time: "7:45 AM",
    severity: "medium",
    title: "Daily check-in brief",
    emoji: "📋",
    shortTitle: "Daily Check-in",
    preview: "3 items before your 9am — expert interviews at 6/15",
    fields: [
      { label: "Project", value: "Project Meridian · Daily check-in brief" },
      { label: "Date", value: "Wed 2 Apr · 3 items before your 9am" },
      { label: "Flag", value: "Expert interviews at 6 of 15 — on pace for 12 by Friday, 3 below target. Client needs advance notice before Monday's interim presentation." },
      { label: "Today", value: "CFO interview confirmed 2pm. Q13 (side-letter) added to guide. CPO rescheduled to Thu 2pm." },
      { label: "Action needed", value: "Tech & product workstream unassigned — 9 days to deadline. Needs an owner or partner sign-off to descope by end of today." },
    ],
    actions: [
      { id: "d1", label: "📧 Draft expert outreach", recommended: true },
      { id: "d2", label: "⚠️ Warn client re: Mon" },
      { id: "d3", label: "🔺 Escalate to partner" },
    ],
    managerResponses: {
      d1: "Approved: Draft outreach for remaining 9 experts. Prioritise industry practitioners over academics.",
      d2: "Approved: Send client a heads-up that interim deck may have gaps in expert section. Frame as draft.",
      d3: "Approved: Escalating workstream ownership to partner. Set up 15-min call for today.",
    },
  },
];

const severityColor: Record<string, string> = {
  critical: "bg-rag-red",
  high: "bg-rag-amber",
  medium: "bg-primary",
  info: "bg-[hsl(258,60%,45%)]",
};

const severityDot: Record<string, string> = {
  critical: "bg-rag-red",
  high: "bg-rag-amber",
  medium: "bg-primary",
  info: "bg-[hsl(258,60%,45%)]",
};

const severityBotColor: Record<string, string> = {
  critical: "bg-rag-red/15 text-rag-red",
  high: "bg-rag-amber/15 text-rag-amber",
  medium: "bg-primary/15 text-primary",
  info: "bg-[hsl(258,60%,50%)]/15 text-[hsl(258,60%,45%)]",
};

export default function TeamsAlerts() {
  const [selectedActions, setSelectedActions] = useState<Record<string, string | null>>({});
  const [activeChat, setActiveChat] = useState(ALERTS[0].id);

  const selectAction = (alertId: string, actionId: string) => {
    setSelectedActions((prev) => ({ ...prev, [alertId]: actionId }));
  };

  const activeAlert = ALERTS.find((a) => a.id === activeChat)!;
  const selected = selectedActions[activeAlert.id] || null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Teams Interface</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preview how risk notifications appear in Microsoft Teams
          </p>
        </div>

        {/* Teams window */}
        <div className="rounded-xl border border-border overflow-hidden shadow-lg bg-background">
          {/* Teams header bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[hsl(258,60%,45%)] text-white">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-xs font-bold">T</div>
              <span className="text-sm font-semibold">Microsoft Teams</span>
            </div>
            <span className="text-xs opacity-70 ml-auto">Chat · Project Alerts</span>
          </div>

          <div className="flex" style={{ height: "560px" }}>
            {/* Chat list sidebar */}
            <div className="w-64 border-r border-border bg-card overflow-y-auto shrink-0">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent</p>
              </div>
              {ALERTS.map((alert) => {
                const isActive = alert.id === activeChat;
                const hasAction = !!selectedActions[alert.id];
                return (
                  <button
                    key={alert.id}
                    onClick={() => setActiveChat(alert.id)}
                    className={`w-full text-left px-3 py-3 border-b border-border/50 transition-colors ${
                      isActive ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${severityDot[alert.severity]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-semibold truncate ${isActive ? "text-foreground" : "text-foreground"}`}>
                            {alert.shortTitle}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{alert.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{alert.preview}</p>
                        {hasAction && (
                          <div className="flex items-center gap-1 mt-1">
                            <CircleCheck className="w-3 h-3 text-rag-green" />
                            <span className="text-[10px] text-rag-green font-medium">Actioned</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Chat content */}
            <div className="flex-1 flex flex-col">
              {/* Chat header */}
              <div className="px-4 py-2.5 border-b border-border bg-card flex items-center gap-2">
                <Bot className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Risk Manager Bot</span>
                <span className="text-xs text-muted-foreground">· {activeAlert.shortTitle}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                {/* Bot alert card */}
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${severityBotColor[activeAlert.severity]}`}>
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 max-w-[480px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">Risk Manager Bot</span>
                      <span className="text-[11px] text-muted-foreground">Today {activeAlert.time}</span>
                    </div>
                    <div className="rounded-lg border border-border bg-background overflow-hidden">
                      <div className={`h-1 ${severityColor[activeAlert.severity]}`} />
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-5 h-5 ${activeAlert.severity === "critical" ? "text-rag-red" : activeAlert.severity === "high" ? "text-rag-amber" : "text-primary"}`} />
                          <span className="font-bold text-foreground">{activeAlert.emoji} {activeAlert.title}</span>
                        </div>
                        <div className="text-sm space-y-2">
                          {activeAlert.fields.map((f) => (
                            <div key={f.label}>
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{f.label}</span>
                              <p className={f.label === "Risk" || f.label === "Event" ? "text-foreground font-medium" : "text-muted-foreground"}>{f.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-border pt-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Recommended Actions</span>
                          <div className="space-y-2">
                            {activeAlert.actions.map((action) => (
                              <button
                                key={action.id}
                                onClick={() => selectAction(activeAlert.id, action.id)}
                                className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                                  selected === action.id
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
                          <Button size="sm" className="gap-1.5 h-8 text-xs flex-1" disabled={!selected}>
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
                {selected && (
                  <div className="flex items-start gap-3 justify-end">
                    <div className="max-w-[400px]">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-[11px] text-muted-foreground">Today {activeAlert.time}</span>
                        <span className="text-sm font-semibold text-foreground">Sarah Chen</span>
                      </div>
                      <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm text-foreground">
                        {activeAlert.managerResponses[selected]}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}

                {/* Bot confirmation */}
                {selected && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-rag-green/15 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-rag-green" />
                    </div>
                    <div className="max-w-[480px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">Risk Manager Bot</span>
                        <span className="text-[11px] text-muted-foreground">Today {activeAlert.time}</span>
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
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30 max-w-2xl">
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
  );
}
