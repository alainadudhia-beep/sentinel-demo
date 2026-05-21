import { useState, useCallback } from "react";
import { ChevronDown, CheckCircle2, AlertTriangle, Clock, CalendarCheck, Send, X, Flag, TrendingUp, Info, FileText, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProject } from "@/context/ProjectContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type MilestoneStatus = "done" | "today" | "upcoming" | "at-risk";
type DocStatus = "complete" | "on-track" | "at-risk" | "not-started";

interface MeetingRow {
  id: string;
  label: string;
  date: string;          // "Mon 18 May"
  week: number;
  day: number;
  status: MilestoneStatus;
  agenda: string;
  docStatus?: DocStatus;  // only for upcoming/at-risk
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Today = Tuesday Week 2 = 2 Jun 2026
const WEEK_STARTS = ["18 May", "25 May", "1 Jun", "9 Jun"];
const DAY_NAMES   = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_DATES: Record<number, string[]> = {
  0: ["18 May", "19 May", "20 May", "21 May", "22 May"],
  1: ["25 May", "26 May", "27 May", "28 May", "29 May"],
  2: ["1 Jun",  "2 Jun",  "3 Jun",  "4 Jun",  "5 Jun" ],
  3: ["9 Jun",  "10 Jun", "11 Jun", "12 Jun", "13 Jun"],
};

// W2 Tue = day index 1 in week 2 → "today"
function derivedStatus(week: number, day: number): MilestoneStatus {
  if (week < 2) return "done";
  if (week === 2 && day < 1) return "done";
  if (week === 2 && day === 1) return "today";
  return "upcoming";
}

// Document statuses for future meetings
const DOC_OVERRIDES: Record<string, DocStatus> = {
  "tp-3": "at-risk",   // Interim findings — deck in progress, tight
  "tp-4": "not-started",
  "tp-5": "not-started",
};

const docStatusConfig: Record<DocStatus, { label: string; color: string; bg: string }> = {
  complete:    { label: "Complete",     color: "text-green-700",         bg: "bg-green-50 border-green-200"   },
  "on-track":  { label: "On track",    color: "text-lime-700",          bg: "bg-lime-50 border-lime-200"     },
  "at-risk":   { label: "At risk",     color: "text-amber-700",         bg: "bg-amber-50 border-amber-200"   },
  "not-started": { label: "Not started", color: "text-muted-foreground", bg: "bg-muted border-border"        },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const WEEK_META = [
  { week: 0, phase: "Ramp up",       badge: "Complete" as const },
  { week: 1, phase: "Field work",    badge: "Complete" as const },
  { week: 2, phase: "Analysis",      badge: "Current"  as const },
  { week: 3, phase: "Delivery",      badge: "Upcoming" as const },
];

const CHECK_IN_DAYS = [
  { day: "Mon", done: true  },
  { day: "Tue", today: true },
  { day: "Wed", future: true },
  { day: "Thu", future: true },
  { day: "Fri", future: true },
];

const earlyWarningDraft = `Hi James,

Quick flag ahead of Thursday's interim presentation — the interim findings deck is still being finalised and we are under time pressure given the expert interview programme only wrapped yesterday.

We will share a near-final version by Wednesday evening for your review. The deck will cover all five workstreams, with the competitive and customer sections marked as provisional where expert triangulation is still pending.

Happy to discuss on today's check-in. Let me know if you'd like to move the interim to Friday instead.

Best,
OC&C Team`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: MilestoneStatus }) {
  if (status === "done")
    return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />;
  if (status === "today")
    return <div className="w-4 h-4 rounded-full bg-blue-500 shrink-0" />;
  if (status === "at-risk")
    return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
  return <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />;
}

function WeekBadge({ badge }: { badge: "Complete" | "Current" | "Upcoming" }) {
  const styles = {
    Complete: "bg-green-50 text-green-700",
    Current:  "bg-blue-50 text-blue-700",
    Upcoming: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles[badge]}`}>
      {badge}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Milestones() {
  const { clientTouchpoints } = useProject();
  const [showDraft, setShowDraft] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set([0, 1]));

  const toggleWeek = useCallback((w: number) => {
    setCollapsedWeeks(prev => {
      const next = new Set(prev);
      next.has(w) ? next.delete(w) : next.add(w);
      return next;
    });
  }, []);

  // Build meeting rows from client touchpoints only
  const clientMeetings: MeetingRow[] = clientTouchpoints
    .filter(tp => tp.type === "client")
    .sort((a, b) => a.week * 5 + a.day - (b.week * 5 + b.day))
    .map(tp => {
      const st = derivedStatus(tp.week, tp.day);
      const atRisk = tp.id === "tp-3"; // interim is tight
      return {
        id: tp.id,
        label: tp.label,
        date: `${DAY_NAMES[tp.day]} ${DAY_DATES[tp.week][tp.day]}`,
        week: tp.week,
        day: tp.day,
        status: atRisk && st === "upcoming" ? "at-risk" : st,
        agenda: tp.agenda ?? tp.label,
        docStatus: DOC_OVERRIDES[tp.id],
      };
    });

  const byWeek = WEEK_META.map(wm => ({
    ...wm,
    meetings: clientMeetings.filter(m => m.week === wm.week),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Milestone Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Client meeting cadence · document status · key delivery dates
            <span className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Tue 2 Jun · Week 2</span>
          </p>
        </div>

        {/* Risk alert */}
        <Alert className="border-amber-200 bg-amber-50/60">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">
              Interim findings deck (Thu 4 Jun) at risk — expert interviews only completed yesterday. Deck in progress.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setShowDraft(true)}
            >
              <Send className="w-3 h-3 mr-1" />
              Draft early warning
            </Button>
          </AlertDescription>
        </Alert>

        {/* Daily check-in strip */}
        <Card className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-muted-foreground" />
              Daily check-in · 15 min · OC&C + James Whitfield (CVC Capital Partners)
            </p>
            <div className="flex items-center gap-2">
              {CHECK_IN_DAYS.map(d => (
                <span
                  key={d.day}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors ${
                    d.done  ? "bg-muted text-muted-foreground border-transparent"
                    : d.today ? "bg-blue-500 text-white border-transparent"
                    : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {d.day}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">Cadence reviewed start of W3 — relaxed if delivery is strong</p>

          {/* Suggested check-in content */}
          <div className="mt-4 pt-4 border-t border-border space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Suggested content for today's check-in
            </p>
            <div className="flex items-start gap-2.5 text-sm">
              <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                <Flag className="w-3 h-3" /> Flag
              </span>
              <span className="text-foreground leading-relaxed">
                Interim deck at risk — expert interviews only completed Mon. Flagging to client now to avoid surprise on Thu. Recommend agreeing on a Wed evening preview slot.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                <Info className="w-3 h-3" /> Update
              </span>
              <span className="text-foreground leading-relaxed">
                Management interviews (CEO, CFO, CPO) complete. Key finding: CFO's revenue growth assumptions diverge materially from bottom-up model — to be addressed in interim.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                <TrendingUp className="w-3 h-3" /> Progress
              </span>
              <span className="text-foreground leading-relaxed">
                Market, Competitive and Customer workstreams on track. Financial model and Management assessment in progress — both on schedule for Thu interim.
              </span>
            </div>
          </div>
        </Card>

        {/* Milestone list by week */}
        <div className="space-y-4">
          {byWeek.map(w => (
            <Card key={w.week} className="overflow-hidden">
              <div
                className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
                onClick={() => toggleWeek(w.week)}
              >
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${collapsedWeeks.has(w.week) ? "-rotate-90" : ""}`} />
                <span className="text-sm font-bold text-foreground">Week {w.week}</span>
                <span className="text-xs text-muted-foreground">{WEEK_STARTS[w.week]}</span>
                <WeekBadge badge={w.badge} />
              </div>

              {!collapsedWeeks.has(w.week) && (
                <div className="divide-y divide-border">
                  {w.meetings.length === 0 && (
                    <p className="px-5 py-3 text-sm text-muted-foreground italic">No client meetings this week</p>
                  )}
                  {w.meetings.map(m => (
                    <div key={m.id} className="px-5 py-4 flex items-start gap-4">
                      <StatusIcon status={m.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className={`text-sm font-semibold ${m.status === "done" ? "text-muted-foreground" : "text-foreground"}`}>
                              {m.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.date}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {m.status === "today" && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Today</span>
                            )}
                            {m.status === "at-risk" && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />At risk
                              </span>
                            )}
                            {m.docStatus && (
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${docStatusConfig[m.docStatus].bg} ${docStatusConfig[m.docStatus].color}`}>
                                Deck: {docStatusConfig[m.docStatus].label}
                              </span>
                            )}
                            {(m.status === "upcoming" || m.status === "at-risk" || m.status === "today") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[11px] gap-1"
                                onClick={() => setShowComingSoon(true)}
                              >
                                <FileText className="w-3 h-3" />
                                Review deck
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{m.agenda}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Early warning draft modal */}
        <Dialog open={showDraft} onOpenChange={setShowDraft}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base">Draft early warning — James Whitfield (CVC)</DialogTitle>
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

        {/* Coming soon modal */}
        <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Deck review
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">Coming soon — in-app document review and annotation.</p>
            <Button variant="outline" size="sm" onClick={() => setShowComingSoon(false)}>Close</Button>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
