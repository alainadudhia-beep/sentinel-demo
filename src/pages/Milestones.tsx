import { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { AlertTriangle, CheckCircle2, Clock, CalendarCheck, Send, X, Flag, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const days = [
  { day: "Mon", done: true },
  { day: "Tue", done: true },
  { day: "Wed", today: true },
  { day: "Thu", future: true },
  { day: "Fri", future: true },
];

interface Milestone {
  date: string;
  title: string;
  status: "done" | "today" | "pending" | "at-risk" | "auto-booked";
  deliverables?: string[];
  autoBookedNote?: string;
  /** Two milestones on same day */
  extra?: { title: string; status: "done" | "today" | "pending" | "at-risk" | "auto-booked"; autoBookedNote?: string };
}

interface Week {
  week: number;
  range: string;
  phase: string;
  badge: "Complete" | "Current" | "Upcoming";
  milestones: Milestone[];
}

const weeks: Week[] = [
  {
    week: 1,
    range: "24–28 Mar",
    phase: "Ramp up",
    badge: "Complete",
    milestones: [
      { date: "Mon 24", title: "Kick-off & scope alignment", status: "done", deliverables: ["Scope doc v1", "Team RACI"] },
      { date: "Tue 25", title: "Market model structure agreed", status: "done", deliverables: ["Model skeleton", "Assumption log"] },
      { date: "Fri 28", title: "Expert survey launched · Market model inputs in Excel", status: "done", deliverables: ["Survey live", "Excel template", "Respondent list"] },
    ],
  },
  {
    week: 2,
    range: "31 Mar–4 Apr",
    phase: "Field work",
    badge: "Current",
    milestones: [
      { date: "Mon 31", title: "Interim commercial findings — verbal update", status: "done" },
      { date: "Wed 2 Apr", title: "Management interview: CFO + CPO", status: "today", deliverables: ["Interview guides", "Transcript"] },
      {
        date: "Thu 3 Apr",
        title: "CPO interview 2pm",
        status: "pending",
        extra: { title: "Partner review hold 11am", status: "auto-booked", autoBookedNote: "Auto-booked · ahead of Mon 7 client presentation" },
      },
      {
        date: "Fri 4 Apr",
        title: "Expert interviews target N=15",
        status: "at-risk",
        extra: { title: "Partner review hold 4pm", status: "auto-booked", autoBookedNote: "Auto-booked" },
      },
    ],
  },
  {
    week: 3,
    range: "7–11 Apr",
    phase: "Synthesis",
    badge: "Upcoming",
    milestones: [
      {
        date: "Mon 7",
        title: "Interim findings presentation to PE fund",
        status: "pending",
        deliverables: ["10–15 slide deck", "Open questions list"],
        extra: { title: "Partner review hold 5pm", status: "auto-booked", autoBookedNote: "Auto-booked" },
      },
      { date: "Thu 10", title: "Market model v1 — full draft", status: "pending" },
    ],
  },
  {
    week: 4,
    range: "14–18 Apr",
    phase: "Final delivery",
    badge: "Upcoming",
    milestones: [
      { date: "Wed 16", title: "Partner review — report draft", status: "pending", deliverables: ["Hard cutoff enforced"] },
      { date: "Fri 18", title: "Final report delivered to PE fund", status: "pending", deliverables: ["Final report", "Market model", "Exec summary"] },
    ],
  },
];

const earlyWarningDraft = `Hi Marcus,

Quick flag ahead of Monday's interim presentation — our survey completion is behind schedule due to limited respondent availability, at only 62% of target currently.

We are doing everything we can to increase the incidence, but regards to the Interim we have two options:
1. Proceed on Monday with the survey respondents we have — I'll caveat the findings appropriately
2. Push the interim to Tuesday to allow one more day of fieldwork

Happy to discuss on today's check-in. Let me know your preference.

Best,
J. Okafor`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "done":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--rag-green))]">
          <CheckCircle2 className="w-3 h-3" /> Done
        </span>
      );
    case "today":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--rag-blue))]/10 text-[hsl(var(--rag-blue))]">
          Today
        </span>
      );
    case "pending":
      return <span className="text-[11px] font-medium text-muted-foreground">Pending</span>;
    case "at-risk":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--rag-amber))]">
          <AlertTriangle className="w-3 h-3" /> At risk
        </span>
      );
    default:
      return null;
  }
}

function WeekBadge({ badge }: { badge: string }) {
  const styles: Record<string, string> = {
    Complete: "bg-[hsl(var(--rag-green))]/10 text-[hsl(var(--rag-green))]",
    Current: "bg-[hsl(var(--rag-blue))]/10 text-[hsl(var(--rag-blue))]",
    Upcoming: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles[badge] || ""}`}>
      {badge}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Milestones() {
  const [showDraft, setShowDraft] = useState(false);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());

  const toggleWeek = useCallback((weekNum: number) => {
    setCollapsedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Milestones</h1>
          <p className="text-sm text-muted-foreground mt-1">Client meeting cadence and key delivery dates</p>
        </div>

        {/* Section 4 — Risk alert (at top) */}
        <Alert className="border-[hsl(var(--rag-amber))]/40 bg-[hsl(var(--rag-amber))]/5">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--rag-amber))]" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">
              W3 interim presentation at risk if survey slips — PE fund needs to know before Monday, not on the day
            </span>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-[hsl(var(--rag-amber))]/30 text-[hsl(var(--rag-amber))] hover:bg-[hsl(var(--rag-amber))]/10"
              onClick={() => setShowDraft(true)}
            >
              <Send className="w-3 h-3 mr-1" />
              Draft early warning to PE fund
            </Button>
          </AlertDescription>
        </Alert>

        {/* Section 1 — Daily check-in strip */}
        <Card className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-muted-foreground" />
                Daily check-in · 15 min · J. Okafor + Marcus Rowe (PE fund)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {days.map((d) => (
                <span
                  key={d.day}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors ${
                    d.done
                      ? "bg-muted text-muted-foreground border-transparent"
                      : d.today
                      ? "bg-[hsl(var(--rag-blue))] text-white border-transparent"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {d.day}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Cadence reviewed start of W3 — relaxed if delivery is strong
          </p>
        </Card>

        {/* Section 2 — Suggested content for today's check-in */}
        <Card className="p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Suggested content for today's check-in
          </p>

          <div className="space-y-2.5">
            {/* Flag */}
            <div className="flex items-start gap-2.5 text-sm">
              <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--rag-red))]/10 text-[hsl(var(--rag-red))]">
                <Flag className="w-3 h-3" /> Flag
              </span>
              <span className="text-foreground leading-relaxed">
                Expert interviews at 6/15 — on pace for 12 by Friday, 3 below target N. Recommend flagging to client before Monday's interim presentation.
              </span>
            </div>

            {/* Update */}
            <div className="flex items-start gap-2.5 text-sm">
              <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--rag-amber))]/10 text-[hsl(var(--rag-amber))]">
                <Info className="w-3 h-3" /> Update
              </span>
              <span className="text-foreground leading-relaxed">
                CFO interview confirmed 2pm today — Q13 (side-letter arrangements) added to guide. CPO rescheduled to Thursday.
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-start gap-2.5 text-sm">
              <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--rag-green))]/10 text-[hsl(var(--rag-green))]">
                <TrendingUp className="w-3 h-3" /> Progress
              </span>
              <span className="text-foreground leading-relaxed">
                Commercial and financial workstreams on track. Tech & product still unassigned — needs resolution today.
              </span>
            </div>
          </div>
        </Card>

        {/* Section 3 — Milestone list */}
        <div className="space-y-6">
          {weeks.map((w) => (
            <Card key={w.week} className="overflow-hidden">
              {/* Week header */}
              <div
                className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/40 cursor-pointer select-none hover:bg-muted/60 transition-colors"
                onClick={() => toggleWeek(w.week)}
              >
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${collapsedWeeks.has(w.week) ? "-rotate-90" : ""}`} />
                <span className="text-sm font-bold text-foreground">Week {w.week}</span>
                <span className="text-xs text-muted-foreground">{w.range}</span>
                <span className="text-xs text-muted-foreground">· {w.phase}</span>
                <WeekBadge badge={w.badge} />
              </div>

              {/* Milestones */}
              <div className="divide-y divide-border">
                {w.milestones.map((m, idx) => (
                  <div key={idx}>
                    {/* Auto-booked row (extra) rendered first if it exists */}
                    {m.extra && (
                      <div className="flex items-center gap-4 px-5 py-2.5 bg-[hsl(264,67%,50%)]/5 border border-dashed border-[hsl(264,67%,50%)]/30 mx-3 my-2 rounded-md">
                        <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">{m.date}</span>
                        <span className="text-sm text-[hsl(264,67%,50%)] font-medium">{m.extra.title}</span>
                        {m.extra.autoBookedNote && (
                          <span className="ml-auto text-[10px] font-medium text-[hsl(264,67%,50%)]/70 bg-[hsl(264,67%,50%)]/10 px-2 py-0.5 rounded-full">
                            {m.extra.autoBookedNote}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Main milestone row */}
                    <div className="flex items-center gap-4 px-5 py-3">
                      <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">{m.date}</span>
                      <span className={`text-sm font-medium flex-1 ${m.status === "done" ? "text-muted-foreground" : "text-foreground"}`}>
                        {m.title}
                      </span>
                      {m.status !== "auto-booked" && <StatusBadge status={m.status} />}
                      {m.deliverables && m.deliverables.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {m.deliverables.map((d) => (
                            <span key={d} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Early warning draft modal */}
        <Dialog open={showDraft} onOpenChange={setShowDraft}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base">Draft early warning — Marcus Rowe</DialogTitle>
            </DialogHeader>
            <div className="bg-muted/50 border border-border rounded-md p-5 text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground">
              {earlyWarningDraft}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowDraft(false)}>
                <X className="w-3 h-3 mr-1" /> Close
              </Button>
              <Button size="sm" onClick={() => setShowDraft(false)}>
                <Send className="w-3 h-3 mr-1" /> Send via Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
