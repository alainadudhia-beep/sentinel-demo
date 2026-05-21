import { useState } from "react";
import { AlertTriangle, CircleCheck, ArrowUpRight, Check, MessageSquare, Bot, User, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Risk Alerts data ──

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
      { label: "From", value: "J. Okafor · Customer & Commercial workstream" },
      { label: "Slides", value: "Customer retention cohort analysis + Unit economics model" },
      { label: "Section", value: "Customer & Commercial · 4 done, 2 awaiting review, 3 not started" },
      { label: "Deadline", value: "Partner sign-off needed before Thu 4 Jun interim presentation" },
      { label: "Note", value: "Can you check my 2 slides please? Flagged for partner review — retention figures not yet cross-checked against credit card panel data." },
    ],
    actions: [
      { id: "sr1", label: "✅ Open slides and review now", recommended: true },
      { id: "sr2", label: "📧 Acknowledge — will review by Wed 4pm" },
      { id: "sr3", label: "↩️ Remind me in 1 hour" },
    ],
    managerResponses: {
      sr1: "Opening slide review. Will approve or flag changes within the hour.",
      sr2: "Acknowledged. Scheduled for review during the Wed 4pm hold.",
      sr3: "Acknowledged. I'll remind you to review these slides in 1 hour.",
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
      { label: "Impact", value: "Potential +2 day delay → Thu 4 Jun interim deck at risk → survey-dependent slides incomplete" },
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
    preview: "Wed 3 Jun 11am removed — interim deck awaiting review",
    fields: [
      { label: "Event", value: "Wed 3 Jun 11am hold removed · Customer & Commercial slides still awaiting sign-off" },
      { label: "What happened", value: "James Whitfield's team moved the Wed preview slot. 2 interim slides need partner sign-off before Thu 4 Jun client presentation. Thu 8am is the last remaining window." },
      { label: "Risk if Thu slot also drops", value: "Slides go to client unreviewed — partner must formally accept this risk." },
    ],
    actions: [
      { id: "b1", label: "📞 Chase EA for Thu 8am slot", recommended: true },
      { id: "b2", label: "📧 Send slides for async review" },
    ],
    managerResponses: {
      b1: "Approved: Chase EA now. Escalate to me if no slot confirmed by 2pm today.",
      b2: "Approved: Send slides with tracked changes. Flag we need sign-off by EOD Wednesday.",
    },
  },
  {
    id: "market-model",
    time: "11:05 AM",
    severity: "medium",
    title: "Market model slides incomplete",
    emoji: "📊",
    shortTitle: "Market Model Slides",
    preview: "Priya off sick — TAM/SAM/SOM not started for interim",
    fields: [
      { label: "Project", value: "Project Falcon · FreshCart DD" },
      { label: "Cause", value: "Priya off sick since Monday — competitor pricing layer and 5-year market projections not started" },
      { label: "Impact", value: "TAM/SAM/SOM section missing for Thu 4 Jun interim presentation, weakens investment thesis" },
    ],
    actions: [
      { id: "c1", label: "🤖 AI-generate draft slides for review", recommended: true },
      { id: "c2", label: "📁 Pull slides from previous project (Project Echo)" },
      { id: "c3", label: "📝 Create placeholder slides with methodology note" },
    ],
    managerResponses: {
      c1: "Approved: Generate AI draft. Priya to review when back. Flag as draft in interim deck.",
      c2: "Approved: Use Echo slides as baseline. Update figures for FreshCart context.",
      c3: "Approved: Placeholders with methodology note. Full slides by Thu morning.",
    },
  },
  {
    id: "meridian-checkin",
    time: "7:45 AM",
    severity: "medium",
    title: "Daily check-in brief",
    emoji: "📋",
    shortTitle: "Daily Check-in",
    preview: "3 items before your 9am — interim deck at risk",
    fields: [
      { label: "Project", value: "Project Falcon · Daily check-in brief" },
      { label: "Date", value: "Tue 2 Jun · Week 2 · 3 items before your 9am check-in with James Whitfield" },
      { label: "Flag", value: "Interim findings deck (Thu 4 Jun) at risk — expert interviews only wrapped Mon, survey at 62% response rate. Client needs a heads-up today." },
      { label: "Today", value: "CFO deep-dive interview confirmed 2pm (Tom Bradley). Management session 2 rescheduled to Thu 9am. Dark store unit economics added to Customer & Commercial scope." },
      { label: "Action needed", value: "Market model owner absent — TAM/SAM/SOM section unassigned. Needs handover to Tom Bradley or partner sign-off to descope before interim." },
    ],
    actions: [
      { id: "d1", label: "📧 Draft early warning to James Whitfield", recommended: true },
      { id: "d2", label: "🔁 Reassign market model to Tom Bradley" },
      { id: "d3", label: "🔺 Escalate to partner" },
    ],
    managerResponses: {
      d1: "Approved: Send early warning to James Whitfield now. Frame interim as near-final with two sections marked provisional.",
      d2: "Approved: Reassigning market model to Tom. Ask him to prioritise TAM/SAM/SOM for Thu morning.",
      d3: "Approved: Escalating to partner. Set up 15-min call for 8am today before check-in.",
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

const SCOPE_CHAT_ID = "scope-detection";

export default function TeamsAlerts() {
  const [selectedActions, setSelectedActions] = useState<Record<string, string | null>>({});
  const [activeChat, setActiveChat] = useState(ALERTS[0].id);
  const [scopeStep, setScopeStep] = useState(0);

  const selectAction = (alertId: string, actionId: string) => {
    setSelectedActions((prev) => ({ ...prev, [alertId]: actionId }));
  };

  const handleScopeAction = (action: string) => {
    if (action === "confirm") setScopeStep(3);
  };

  const handleScopeStart = () => {
    setScopeStep(1);
    setTimeout(() => setScopeStep(2), 1500);
  };

  const isScopeChat = activeChat === SCOPE_CHAT_ID;
  const activeAlert = !isScopeChat ? ALERTS.find((a) => a.id === activeChat)! : null;
  const selected = activeAlert ? selectedActions[activeAlert.id] || null : null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Teams Interface</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preview how notifications appear in Microsoft Teams
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
            <span className="text-xs opacity-70 ml-auto">
              Chat · {isScopeChat ? "Scope Monitor" : "Project Alerts"}
            </span>
          </div>

          <div className="flex" style={{ height: "560px" }}>
            {/* Chat list sidebar */}
            <div className="w-64 border-r border-border bg-card overflow-y-auto shrink-0">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent</p>
              </div>

              {/* Scope Detection chat item */}
              <button
                onClick={() => setActiveChat(SCOPE_CHAT_ID)}
                className={`w-full text-left px-3 py-3 border-b border-border/50 transition-colors ${
                  isScopeChat ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold truncate text-foreground">New Scope Item</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">8:32 AM</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">Client email — pricing elasticity</p>
                    {scopeStep >= 3 && (
                      <div className="flex items-center gap-1 mt-1">
                        <CircleCheck className="w-3 h-3 text-rag-green" />
                        <span className="text-[10px] text-rag-green font-medium">Added to scope</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Risk alert chat items */}
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
                        {alert.isPersonMessage && alert.personAvatar ? (
                          <div className={`w-8 h-8 rounded-full ${alert.personAvatar.bg} flex items-center justify-center text-white text-[10px] font-bold`}>
                            {alert.personAvatar.initials}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${severityDot[alert.severity]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold truncate text-foreground">
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
              {isScopeChat ? (
                <ScopeChatContent
                  scopeStep={scopeStep}
                  onStart={handleScopeStart}
                  onAction={handleScopeAction}
                />
              ) : activeAlert ? (
                <AlertChatContent
                  alert={activeAlert}
                  selected={selected}
                  onSelectAction={(actionId) => selectAction(activeAlert.id, actionId)}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30 max-w-2xl">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {isScopeChat ? "How Scope Detection Works" : "How Teams Alerts Work"}
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            {isScopeChat ? (
              <>
                <li>• Scope Monitor Bot watches incoming client emails for new questions or requests</li>
                <li>• New scope items are auto-classified by workstream, priority, and deadline</li>
                <li>• Managers can confirm, edit, or dismiss directly in Teams</li>
                <li>• Approved items are added to the live scope and the team is notified automatically</li>
              </>
            ) : (
              <>
                <li>• Risk Manager Bot sends adaptive cards when risks are detected</li>
                <li>• Managers can review context, select an action, and approve directly in Teams</li>
                <li>• Responses are logged and the project timeline updates automatically</li>
                <li>• Escalation routes alerts to senior leadership channels</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Alert Chat Content ──

function AlertChatContent({
  alert,
  selected,
  onSelectAction,
}: {
  alert: AlertCard;
  selected: string | null;
  onSelectAction: (actionId: string) => void;
}) {
  return (
    <>
      {/* Chat header */}
      <div className="px-4 py-2.5 border-b border-border bg-card flex items-center gap-2">
        {alert.isPersonMessage && alert.personAvatar ? (
          <div className={`w-5 h-5 rounded-full ${alert.personAvatar.bg} flex items-center justify-center text-white text-[8px] font-bold`}>
            {alert.personAvatar.initials}
          </div>
        ) : (
          <Bot className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="text-sm font-semibold text-foreground">
          {alert.isPersonMessage ? "J. Okafor" : "Risk Manager Bot"}
        </span>
        <span className="text-xs text-muted-foreground">· {alert.shortTitle}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        {/* Alert card */}
        <div className="flex items-start gap-3">
          {alert.isPersonMessage && alert.personAvatar ? (
            <div className={`w-8 h-8 rounded-full ${alert.personAvatar.bg} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
              {alert.personAvatar.initials}
            </div>
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${severityBotColor[alert.severity]}`}>
              <Bot className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 max-w-[480px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {alert.isPersonMessage ? "J. Okafor" : "Risk Manager Bot"}
              </span>
              <span className="text-[11px] text-muted-foreground">Today {alert.time}</span>
            </div>
            <div className="rounded-lg border border-border bg-background overflow-hidden">
              <div className={`h-1 ${severityColor[alert.severity]}`} />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${alert.severity === "critical" ? "text-rag-red" : alert.severity === "high" ? "text-rag-amber" : "text-primary"}`} />
                  <span className="font-bold text-foreground">{alert.emoji} {alert.title}</span>
                </div>
                <div className="text-sm space-y-2">
                  {alert.fields.map((f) => (
                    <div key={f.label}>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{f.label}</span>
                      <p className={f.label === "Risk" || f.label === "Event" ? "text-foreground font-medium" : "text-muted-foreground"}>{f.value}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Recommended Actions</span>
                  <div className="space-y-2">
                    {alert.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => onSelectAction(action.id)}
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
                <span className="text-[11px] text-muted-foreground">Today {alert.time}</span>
                <span className="text-sm font-semibold text-foreground">Sarah Chen</span>
              </div>
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm text-foreground">
                {alert.managerResponses[selected]}
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
                <span className="text-[11px] text-muted-foreground">Today {alert.time}</span>
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
    </>
  );
}

// ── Scope Chat Content ──

function ScopeChatContent({
  scopeStep,
  onStart,
  onAction,
}: {
  scopeStep: number;
  onStart: () => void;
  onAction: (action: string) => void;
}) {
  return (
    <>
      {/* Chat header */}
      <div className="px-4 py-2.5 border-b border-border bg-card flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Scope Monitor Bot</span>
        <span className="text-xs text-muted-foreground">· New Scope Item</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        {scopeStep === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <Mail className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Click below to simulate a client email arriving and see how a new scope item is auto-detected and surfaced in Teams
            </p>
            <Button onClick={onStart} className="gap-2">
              <Mail className="w-4 h-4" />
              Simulate Client Email
            </Button>
          </div>
        )}

        {scopeStep >= 1 && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 max-w-[480px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">Scope Monitor Bot</span>
                <span className="text-[11px] text-muted-foreground">Today 8:32 AM</span>
              </div>
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="h-1 bg-primary" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="font-bold text-foreground">📧 New client email detected</span>
                  </div>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</span>
                      <p className="text-foreground font-medium">James Whitfield (CVC Capital Partners)</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</span>
                      <p className="text-muted-foreground">Re: FreshCart DD — pricing elasticity</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message</span>
                      <div className="text-muted-foreground text-xs whitespace-pre-line leading-relaxed bg-muted/30 rounded p-2.5 mt-1">{`Hi Sarah,

Interesting that churn is 8%, that seems low vs competitors. Can you look at elasticity and see where we can move our pricing to drive revenue growth balanced against churn?

Would be great to get this into the Customer & Commercial workstream.

Best,
James`}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {scopeStep >= 2 && (
          <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 max-w-[480px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">Scope Monitor Bot</span>
                <span className="text-[11px] text-muted-foreground">Today 8:32 AM</span>
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/5 overflow-hidden ring-1 ring-primary/20">
                <div className="h-1 bg-primary" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-bold text-foreground">🔔 New scope item detected</span>
                  </div>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Detected Question</span>
                      <p className="text-foreground font-medium">
                        "Churn is 8% which seems low vs competitors — can we look at price elasticity and model where we can move pricing to drive revenue growth balanced against churn?"
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Workstream</span>
                        <p className="text-muted-foreground">Customer & Commercial</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</span>
                        <p className="text-rag-amber font-medium">High</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</span>
                        <p className="text-muted-foreground">Client email — auto-detected</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deadline</span>
                        <p className="text-muted-foreground">Thu 4 Jun</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Actions</span>
                    <div className="space-y-2">
                      <button
                        onClick={() => onAction("confirm")}
                        disabled={scopeStep >= 3}
                        className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                          scopeStep >= 3
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:border-primary/40 text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>✅ Confirm — add to live scope</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Recommended</span>
                        </div>
                      </button>
                      <button
                        disabled={scopeStep >= 3}
                        className="w-full text-left text-sm px-3 py-2 rounded-md border border-border hover:border-primary/40 text-foreground transition-colors disabled:opacity-50"
                      >
                        📝 Edit question before adding
                      </button>
                      <button
                        disabled={scopeStep >= 3}
                        className="w-full text-left text-sm px-3 py-2 rounded-md border border-border hover:border-primary/40 text-foreground transition-colors disabled:opacity-50"
                      >
                        ❌ Dismiss — not in scope
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="gap-1.5 h-8 text-xs flex-1"
                      disabled={scopeStep < 2 || scopeStep >= 3}
                      onClick={() => onAction("confirm")}
                    >
                      <Check className="w-3 h-3" />
                      Approve
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
        )}

        {/* Manager response */}
        {scopeStep >= 3 && (
          <div className="flex items-start gap-3 justify-end animate-in fade-in slide-in-from-bottom-2">
            <div className="max-w-[400px]">
              <div className="flex items-center gap-2 mb-1 justify-end">
                <span className="text-[11px] text-muted-foreground">Today 8:33 AM</span>
                <span className="text-sm font-semibold text-foreground">Sarah Chen</span>
              </div>
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm text-foreground">
                Confirmed — add pricing elasticity question to Customer & Commercial workstream. Flag for J. Okafor to pick up.
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
          </div>
        )}

        {/* Bot confirmation */}
        {scopeStep >= 3 && (
          <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-full bg-rag-green/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-rag-green" />
            </div>
            <div className="max-w-[480px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">Scope Monitor Bot</span>
                <span className="text-[11px] text-muted-foreground">Today 8:33 AM</span>
              </div>
              <div className="rounded-lg border border-rag-green/30 bg-rag-green/5 p-3 text-sm text-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <CircleCheck className="w-4 h-4 text-rag-green" />
                  <span className="font-medium">Scope item added</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Question added to Customer & Commercial workstream · Live scope updated · J. Okafor notified · Deadline set: Thu 4 Jun
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
    </>
  );
}
