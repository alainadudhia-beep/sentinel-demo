import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Check, FileText,
  AlertTriangle, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  useProject, RISK_FLAGS,
} from "@/context/ProjectContext";
import { PRICING_TIERS } from "@/pages/Engagement";
import { TIER_STAFF, type TierId } from "@/pages/Team";
import {
  SequencingSummary, INITIAL_GANTT_SECTIONS,
  type GanttInputSection,
} from "@/pages/Plan";

// ─── Team helpers ─────────────────────────────────────────────────────────────

const CTX_TO_TIER: Record<string, TierId> = { A: "ai", B: "standard", C: "premium" };

/** Groups non-AI staff by role and returns sorted label strings like "2 Partners" */
function getTeamLines(tierId: TierId): string[] {
  const counts: Record<string, number> = {};
  TIER_STAFF[tierId]
    .filter(m => !m.isAI)
    .forEach(m => { counts[m.role] = (counts[m.role] ?? 0) + 1; });
  const order = ["Partner", "Manager", "Consultant", "Senior Associate", "Junior Associate"];
  return order
    .filter(r => counts[r])
    .map(r => `${counts[r] > 1 ? `${counts[r]} ` : ""}${counts[r] > 1 ? `${r}s` : r}`);
}

// ─── Approvals (only internal — no Client on this page) ───────────────────────

type InternalApproverKey = "partner1" | "partner2" | "manager";
const INTERNAL_APPROVERS: { key: InternalApproverKey; label: string }[] = [
  { key: "partner1", label: "Partner 1" },
  { key: "partner2", label: "Partner 2" },
  { key: "manager",  label: "Manager"   },
];

// ─── Priority badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: "critical" | "important" | "nice-to-have" }) {
  if (priority === "critical")
    return <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Critical</span>;
  if (priority === "important")
    return <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Important</span>;
  return <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded bg-muted text-muted-foreground border border-border">Nice to have</span>;
}

// ─── Collapsible workstream row ───────────────────────────────────────────────

function WorkstreamRow({ ws }: { ws: ReturnType<typeof useProject>["workstreams"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          {open
            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          }
          <span className={`text-sm font-semibold ${ws.colorClass}`}>{ws.name}</span>
          <span className="text-xs text-muted-foreground">
            {ws.deliverables.length} deliverable{ws.deliverables.length !== 1 ? "s" : ""}
            {" · "}
            {ws.questions.length} question{ws.questions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex gap-1 flex-wrap justify-end max-w-[40%]">
          {ws.deliverables.map(d => (
            <span key={d.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-background border border-border text-muted-foreground whitespace-nowrap">
              {d.name}
            </span>
          ))}
        </div>
      </button>

      {open && (
        <div className="divide-y divide-border/50">
          {ws.questions.length === 0 ? (
            <p className="px-5 py-3 text-xs text-muted-foreground italic">No questions added</p>
          ) : (
            ws.questions.map(q => (
              <div key={q.id} className="flex items-start gap-2.5 px-5 py-2.5">
                <PriorityBadge priority={q.priority} />
                <p className="text-xs text-foreground leading-snug flex-1">{q.text}</p>
                <span className={`shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded border ${
                  q.dueBy === "interim"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-muted text-muted-foreground border-border"
                }`}>{q.dueBy === "interim" ? "Interim" : "Final"}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Summary section wrapper ──────────────────────────────────────────────────

function SummarySection({
  number, title, children, action,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {number}
          </span>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Letter() {
  const navigate = useNavigate();
  const {
    workstreams, approvedFlags, approveFlag, selectedTier,
    inputPipeline, clientTouchpoints, advanceScopingStep,
    approvals, setApproval,
  } = useProject();

  const [ganttSections] = useState<GanttInputSection[]>(INITIAL_GANTT_SECTIONS);

  const tier              = PRICING_TIERS.find(t => t.id === selectedTier) ?? PRICING_TIERS[1];
  const activeTierId      = CTX_TO_TIER[selectedTier] ?? "standard";
  const teamLines         = getTeamLines(activeTierId);
  const escalatedClauses  = RISK_FLAGS.filter(f => approvedFlags.has(f.id));
  const internalApproved  = INTERNAL_APPROVERS.every(a => approvals[a.key]);
  const totalQuestions    = workstreams.reduce((s, ws) => s + ws.questions.length, 0);
  const totalDeliverables = workstreams.reduce((s, ws) => s + ws.deliverables.length, 0);
  const totalHeadcount    = TIER_STAFF[activeTierId].filter(m => !m.isAI).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Summary</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {workstreams.length} workstreams · {totalDeliverables} deliverables · {totalQuestions} questions
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            £{Math.round(tier.specFee / 1000)}k fee · {tier.durationWeeks + 1} weeks incl. ramp · {teamLines.join(", ")}
          </p>
        </div>
      </div>

      {/* ── Section 1: Scope ── */}
      <SummarySection number="01" title="Scope of Work">
        <div className="space-y-2">
          {workstreams.map(ws => <WorkstreamRow key={ws.id} ws={ws} />)}
        </div>
      </SummarySection>

      {/* ── Section 2: Team & Fees ── */}
      <SummarySection number="02" title="Team & Fees">
        <div className="bg-card border border-border rounded-lg p-5 grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Selected tier</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{tier.tagline}</span>
                {tier.recommended && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">Recommended</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Fixed fee</p>
              <p className="text-3xl font-bold text-foreground">£{Math.round(tier.specFee / 1000)}k</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tier.durationWeeks} weeks · {totalHeadcount} people</p>
            </div>
            <ul className="space-y-1.5">
              {tier.includes.map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />{item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Team composition</p>
            <ul className="space-y-2">
              {teamLines.map(line => (
                <li key={line} className="flex items-center gap-2.5 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SummarySection>

      {/* ── Section 3: Client Milestone Summary ── */}
      <SummarySection number="03" title="Client Milestone Summary">
        <SequencingSummary
          workstreams={workstreams}
          clientTouchpoints={clientTouchpoints}
          ganttSections={ganttSections}
        />
      </SummarySection>

      {/* ── Section 4: Risk Assessment ── */}
      <SummarySection number="04" title="Risk Assessment & Scope Protections">
        <div className="space-y-3">
          {RISK_FLAGS.map(flag => {
            const approved   = approvedFlags.has(flag.id);
            const isCritical = flag.severity === "critical";
            return (
              <div
                key={flag.id}
                className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
                  approved ? "border-green-200 bg-green-50/30"
                  : isCritical ? "border-red-200 bg-red-50/30"
                  : "border-amber-200 bg-amber-50/20"
                }`}
              >
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${approved ? "text-green-500" : isCritical ? "text-red-500" : "text-amber-500"}`} />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                      approved ? "bg-green-50 text-green-700 border-green-200"
                      : isCritical ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>{approved ? "Included in letter" : isCritical ? "Critical" : "Amber"}</span>
                    <span className="text-sm font-semibold text-foreground">{flag.title}</span>
                    <span className="text-xs text-muted-foreground">— {flag.historical}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{flag.detail}</p>
                  <div className="rounded-md bg-background border border-border px-3 py-2 text-sm leading-relaxed">
                    <span className="font-bold text-foreground">Recommendation: </span>
                    <span className="text-foreground/80">{flag.recommendation}</span>
                  </div>
                </div>
                <div className="shrink-0 mt-0.5">
                  {approved ? (
                    <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                      <Check className="w-3.5 h-3.5" />Added
                    </div>
                  ) : (
                    <button
                      onClick={() => approveFlag(flag.id)}
                      className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      Add to letter
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </SummarySection>

      {/* ── Internal approvals ── */}
      <div className="flex items-center gap-3 flex-wrap p-4 bg-card border border-border rounded-lg">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0 mr-2">Internal approval</p>
        {INTERNAL_APPROVERS.map(({ key, label }) => {
          const approved = !!approvals[key];
          return (
            <button
              key={key}
              onClick={() => setApproval(key, !approved)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                approved
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                approved ? "bg-green-500 border-green-500" : "border-muted-foreground/40"
              }`}>
                {approved && <Check className="w-2 h-2 text-white" />}
              </div>
              {label}
            </button>
          );
        })}
        {internalApproved && (
          <span className="ml-auto text-xs font-semibold text-green-700 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Ready to generate letter
          </span>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {internalApproved
            ? "All internal approvals received — generate the engagement letter"
            : `${INTERNAL_APPROVERS.filter(a => approvals[a.key]).length} of ${INTERNAL_APPROVERS.length} internal approvals`}
        </p>
        <Button
          onClick={() => { advanceScopingStep(6); navigate("/engagement-letter"); }}
          disabled={!internalApproved}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Generate Letter
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
}
