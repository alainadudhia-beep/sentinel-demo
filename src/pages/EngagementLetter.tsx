import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Check, Copy, FileText, Send,
} from "lucide-react";
import {
  useProject, RISK_FLAGS,
  type InputPipelineRow, type ClientTouchpoint,
} from "@/context/ProjectContext";
import { PRICING_TIERS } from "@/pages/Engagement";
import { TIER_STAFF, type TierId } from "@/pages/Team";
import {
  SequencingSummary, INITIAL_GANTT_SECTIONS,
  type GanttInputSection,
} from "@/pages/Plan";

// ─── Constants ────────────────────────────────────────────────────────────────

const ENGAGEMENT_DATE = "21 April 2026";
const CLIENT          = "CVC Capital Partners";
const CLIENT_EMAIL    = "james.whitfield@cvc.com";
const TARGET          = "FreshCart";
const FIRM            = "OC&C Strategy Consultants";
const REFERENCE       = "EL-2026-0421-CVC";

const WEEK_FULL = ["Week 0", "Week 1", "Week 2", "Week 3"] as const;
const DAY_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

function tpDateShort(tp: ClientTouchpoint) {
  return `${WEEK_FULL[tp.week]}, ${DAY_SHORT[tp.day]}`;
}

// ─── All approvers ────────────────────────────────────────────────────────────

type ApproverKey = "partner1" | "partner2" | "manager" | "client";
const ALL_APPROVERS: { key: ApproverKey; label: string }[] = [
  { key: "partner1", label: "Partner 1" },
  { key: "partner2", label: "Partner 2" },
  { key: "manager",  label: "Manager"   },
  { key: "client",   label: "Client"    },
];

// ─── Team helpers ─────────────────────────────────────────────────────────────

const CTX_TO_TIER: Record<string, TierId> = { A: "ai", B: "standard", C: "premium" };

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

// ─── Input pipeline prose ────────────────────────────────────────────────────

function describeInput(row: InputPipelineRow): string {
  const day = (d: number) => ["Mon","Tue","Wed","Thu","Fri"][d] ?? "Mon";
  const wday = (w: number, d: number) => `${day(d)} of Week ${w}`;
  const { inputId, phases } = row;
  if (inputId === "data-room") {
    const p = phases.find(ph => ph.label.toLowerCase().includes("confirmed")) ?? phases[1];
    return `we will request access asap, but require access by ${wday(p?.week ?? 0, p?.day ?? 4)}`;
  }
  if (inputId === "survey") {
    const draft   = phases.find(ph => ph.label.toLowerCase().includes("draft"))   ?? phases[0];
    const signoff = phases.find(ph => ph.label.toLowerCase().includes("sign"))     ?? phases[1];
    return `we will aim to share a draft with you by ${wday(draft.week, draft.day)} and will expect your final sign off by ${wday(signoff.week, signoff.day)}`;
  }
  if (inputId === "mgmt") {
    const confirm = phases.find(ph => ph.label.toLowerCase().includes("confirmed")) ?? phases[1];
    return `we need you to confirm our plan by ${wday(confirm?.week ?? 0, confirm?.day ?? 3)} and support with scheduling`;
  }
  const first = phases[0];
  return `required by ${wday(first?.week ?? 0, first?.day ?? 0)}`;
}

function describeTeam(tierId: TierId): string {
  const lines = getTeamLines(tierId).map(l => l.toLowerCase());
  if (lines.length === 0) return "a dedicated team";
  if (lines.length === 1) return lines[0];
  return lines.slice(0, -1).join(", ") + " and " + lines[lines.length - 1];
}

// ─── Styled letter components ─────────────────────────────────────────────────

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-foreground/80 leading-relaxed">{children}</p>;
}

function LetterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">{title}</p>
        <div className="h-px flex-1 bg-border/60" />
      </div>
      {children}
    </div>
  );
}

// ─── Plain-text copy ──────────────────────────────────────────────────────────

function generateLetterText(
  tier: typeof PRICING_TIERS[number],
  tierId: TierId,
  workstreams: ReturnType<typeof useProject>["workstreams"],
  inputPipeline: InputPipelineRow[],
  clientTouchpoints: ClientTouchpoint[],
  escalatedClauses: typeof RISK_FLAGS,
): string {
  const totalHeadcount = TIER_STAFF[tierId].filter(m => !m.isAI).length;
  const sorted = [...clientTouchpoints]
    .filter(tp => (tp.type ?? "client") === "client")
    .sort((a, b) => a.week * 5 + a.day - (b.week * 5 + b.day));

  const lines: string[] = [
    `ENGAGEMENT LETTER — DRAFT`,
    `${FIRM}`,
    ``,
    `Date:      ${ENGAGEMENT_DATE}`,
    `Reference: ${REFERENCE}`,
    `Client:    ${CLIENT}`,
    `Target:    ${TARGET}`,
    ``,
    `Dear James Whitfield,`,
    ``,
    `We are pleased to confirm the terms of our engagement to conduct a commercial due diligence of ${TARGET} on behalf of ${CLIENT}. This letter sets out the agreed scope of work, team composition, fee, timeline, and any conditions applicable to the engagement.`,
    ``,
    `────────────────────────────────────────`,
    `1. SCOPE OF WORK`,
    `────────────────────────────────────────`,
    ``,
    `The scope of this engagement covers ${workstreams.length} analytical workstreams. For each workstream we set out below the questions we will seek to answer.`,
    ``,
  ];

  workstreams.forEach(ws => {
    lines.push(`${ws.name}:`);
    ws.questions.forEach((q, i) => lines.push(`  ${i + 1}. ${q.text}`));
    lines.push(``);
  });

  if (escalatedClauses.some(f => f.id === "rf2")) {
    lines.push(
      `Requests for additional scope after the project commences will be prioritised against existing questions and reprioritised with client approval as needed to ensure timely delivery. If reprioritisation is not approved, project extensions will be at the cost of the client.`,
      ``,
    );
  }

  lines.push(
    `────────────────────────────────────────`,
    `2. TEAM & FEES`,
    `────────────────────────────────────────`,
    ``,
    `To deliver this work, we will staff ${describeTeam(tierId)}, totalling ${totalHeadcount} people. The fixed fee for this engagement is £${Math.round(tier.specFee / 1000)}k, covering a ${tier.durationWeeks}-week engagement from kick-off through final delivery.`,
    ``,
    `The fee is inclusive of all reasonable expenses, expert interview costs up to the agreed volume, and any consumer survey costs within the agreed specification. Work beyond the agreed scope will be quoted separately.`,
    ``,
    `Our team is available to commence from 18 May 2026. We propose to use the week of 18 May as a ramp-up week, with the core analytical workstreams beginning the week of 25 May and a final delivery targeted for the week of 13 June.`,
    ``,
    `────────────────────────────────────────`,
    `3. TIMELINE & CONDITIONS`,
    `────────────────────────────────────────`,
    ``,
    `This engagement and its fee are conditional upon the following inputs being made available to the team on schedule:`,
    ``,
    ...inputPipeline.map(row => `  • ${row.inputLabel} — ${describeInput(row)}`),
    ``,
    `Delays to any named input will extend the delivery timeline proportionally. ${CLIENT} accepts that late provision of inputs constitutes a scope change and may result in revised fees.${escalatedClauses.some(f => f.id === "rf1") ? ` In the case of delayed access to the data room, ${CLIENT} accepts shared 50:50 responsibility for fees for project extensions.` : ""}`,
    ``,
  );

  lines.push(
    `────────────────────────────────────────`,
    `4. CLIENT MEETING CADENCE`,
    `────────────────────────────────────────`,
    ``,
    `We will have regular check-ins throughout the engagement, with a formal client meeting each week. We propose to cover the following topics:`,
    ``,
    ...sorted.map(tp => `  • ${tp.label} (${tpDateShort(tp)}) — ${tp.agenda ?? tp.label}`),
    ``,
    `Interim findings will be shared in advance of each formal meeting to allow ${CLIENT} to review and direct focus. The final presentation will be delivered in a format suitable for IC circulation.${escalatedClauses.some(f => f.id === "rf3") ? ` ${FIRM} agrees to regularly update the client outside of formal meetings to prevent misaligned expectations. If scope materially changes after the Interim presentation, ${FIRM} is not liable for delays to IC materials.` : ""}`,
    ``,
    `────────────────────────────────────────`,
    `ACCEPTANCE`,
    `────────────────────────────────────────`,
    ``,
    `Please confirm your acceptance of these terms by signing below or replying in writing. We look forward to working with you on this engagement.`,
    ``,
    `Yours sincerely,`,
    ``,
    `James Whitfield`,
    FIRM,
    ``,
    `_________________________________`,
    `For and on behalf of ${FIRM}`,
    ``,
    `_________________________________`,
    `For and on behalf of ${CLIENT}`,
  );

  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EngagementLetter() {
  const navigate = useNavigate();
  const {
    workstreams, approvedFlags, selectedTier,
    inputPipeline, clientTouchpoints,
    approvals, setApproval,
  } = useProject();

  const [ganttSections] = useState<GanttInputSection[]>(INITIAL_GANTT_SECTIONS);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const tier             = PRICING_TIERS.find(t => t.id === selectedTier) ?? PRICING_TIERS[1];
  const activeTierId     = CTX_TO_TIER[selectedTier] ?? "standard";
  const teamLines        = getTeamLines(activeTierId);
  const escalatedClauses = RISK_FLAGS.filter(f => approvedFlags.has(f.id));
  const totalHeadcount   = TIER_STAFF[activeTierId].filter(m => !m.isAI).length;
  const allApproved      = ALL_APPROVERS.every(a => approvals[a.key]);

  const clientMeetings = [...clientTouchpoints]
    .filter(tp => (tp.type ?? "client") === "client")
    .sort((a, b) => a.week * 5 + a.day - (b.week * 5 + b.day));

  function handleCopy() {
    const text = generateLetterText(tier, activeTierId, workstreams, inputPipeline, clientTouchpoints, escalatedClauses);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleSend() {
    setSending(true);
    // Simulate sending — after a short delay, mark as sent and auto-tick client
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setApproval("client", true);
    }, 1800);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/letter")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Engagement Letter</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Draft · {REFERENCE}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy text"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            <FileText className="w-3.5 h-3.5" />Export PDF
          </Button>
        </div>
      </div>

      {/* ── Approval strip ── */}
      <div className="flex items-center gap-3 flex-wrap p-4 bg-card border border-border rounded-lg">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0 mr-2">Approvals</p>
        {ALL_APPROVERS.map(({ key, label }) => {
          const approved = !!approvals[key];
          const isClient = key === "client";
          return (
            <button
              key={key}
              onClick={() => !isClient && setApproval(key, !approved)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                approved
                  ? "bg-green-50 border-green-300 text-green-700"
                  : isClient
                    ? "bg-card border-dashed border-border text-muted-foreground cursor-default"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                approved ? "bg-green-500 border-green-500" : "border-muted-foreground/40"
              }`}>
                {approved && <Check className="w-2 h-2 text-white" />}
              </div>
              {label}
              {isClient && !approved && (
                <span className="ml-0.5 text-[9px] text-muted-foreground/60 font-normal">— pending</span>
              )}
            </button>
          );
        })}
        {allApproved && (
          <span className="ml-auto text-xs font-semibold text-green-700 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Fully approved
          </span>
        )}
      </div>

      {/* ── Send to client CTA ── */}
      {!sent ? (
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 border border-border rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Ready to send to client</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Will be sent to <span className="font-medium text-foreground">{CLIENT_EMAIL}</span> ({CLIENT})
            </p>
          </div>
          <Button onClick={handleSend} disabled={sending} className="gap-2 shrink-0">
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending…" : "Send to Client"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Letter sent to {CLIENT_EMAIL}</p>
            <p className="text-xs text-green-700 mt-0.5">Client approval automatically logged — awaiting formal sign-off</p>
          </div>
        </div>
      )}

      {/* ── Letter body ── */}
      <div className="bg-card border border-border rounded-xl px-10 py-10 space-y-8">

        {/* Letterhead */}
        <div className="flex items-start justify-between gap-6 pb-6 border-b border-border">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{FIRM}</p>
            <h1 className="text-2xl font-bold text-foreground mt-2">Engagement Letter</h1>
            <p className="text-sm text-muted-foreground mt-1">Draft — subject to review</p>
          </div>
          <div className="text-right space-y-1 shrink-0">
            {[
              { label: "Date",   value: ENGAGEMENT_DATE },
              { label: "Ref",    value: REFERENCE       },
              { label: "Client", value: CLIENT          },
              { label: "Target", value: TARGET          },
            ].map(({ label, value }) => (
              <p key={label} className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{label}:</span> {value}
              </p>
            ))}
          </div>
        </div>

        {/* Salutation */}
        <div className="space-y-3">
          <Paragraph>Dear James Whitfield,</Paragraph>
          <Paragraph>
            We are pleased to confirm the terms of our engagement to conduct a commercial due
            diligence of <strong>{TARGET}</strong> on behalf of <strong>{CLIENT}</strong>. This
            letter sets out the agreed scope of work, team composition, fee, timeline, and any
            conditions applicable to the engagement.
          </Paragraph>
        </div>

        {/* Section 1: Scope */}
        <LetterBlock title="1. Scope of Work">
          <Paragraph>
            The scope of this engagement covers {workstreams.length} analytical workstreams.
            For each workstream we set out below the questions we will seek to answer.
          </Paragraph>
          <div className="space-y-5">
            {workstreams.map(ws => (
              <div key={ws.id}>
                <p className="text-sm font-semibold text-foreground mb-1.5">{ws.name}:</p>
                <ol className="space-y-1 pl-1">
                  {ws.questions.map((q, i) => (
                    <li key={q.id} className="flex gap-2 text-sm text-foreground/75 leading-snug">
                      <span className="shrink-0 text-muted-foreground font-medium w-5">{i + 1}.</span>
                      <span>{q.text}</span>
                    </li>
                  ))}
                  {ws.questions.length === 0 && (
                    <li className="text-sm text-muted-foreground italic">No questions defined</li>
                  )}
                </ol>
              </div>
            ))}
          </div>
          {escalatedClauses.some(f => f.id === "rf2") && (
            <Paragraph>
              Requests for additional scope after the project commences will be prioritised against
              existing questions and reprioritised with client approval as needed to ensure timely
              delivery. If reprioritisation is not approved, project extensions will be at the cost
              of the client.
            </Paragraph>
          )}
        </LetterBlock>

        {/* Section 2: Team & Fees */}
        <LetterBlock title="2. Team & Fees">
          <Paragraph>
            To deliver this work, we will staff {describeTeam(activeTierId)}, totalling {totalHeadcount}{" "}
            people. The fixed fee for this engagement is{" "}
            <strong>£{Math.round(tier.specFee / 1000)}k</strong>, covering a{" "}
            {tier.durationWeeks}-week engagement from kick-off through final delivery.
          </Paragraph>
          <Paragraph>
            The fee is inclusive of all reasonable expenses, expert interview costs up to the
            agreed volume, and any consumer survey costs within the agreed specification. Work
            beyond the agreed scope will be quoted separately and agreed in writing prior to
            commencing.
          </Paragraph>
          <Paragraph>
            Our team is available to commence from <strong>18 May 2026</strong>. We propose
            to use the week of 18 May as a ramp-up week, with the core analytical workstreams
            beginning the week of 25 May and a final delivery targeted for the week of 13 June.
          </Paragraph>
        </LetterBlock>

        {/* Section 3: Timeline & Conditions */}
        <LetterBlock title="3. Timeline & Conditions">
          <Paragraph>
            This engagement and its fee are conditional upon the following inputs being made
            available to the team on schedule:
          </Paragraph>
          <ul className="space-y-1 pl-1">
            {inputPipeline.map(row => (
              <li key={row.inputId} className="flex gap-2 text-sm text-foreground/75 leading-snug">
                <span className="shrink-0 text-muted-foreground">•</span>
                <span>
                  <strong>{row.inputLabel}</strong> — {describeInput(row)}
                </span>
              </li>
            ))}
          </ul>
          <Paragraph>
            Delays to any named input will extend the delivery timeline proportionally.{" "}
            {CLIENT} accepts that late provision of inputs constitutes a scope change and may
            result in revised fees.
            {escalatedClauses.some(f => f.id === "rf1") && (
              <> In the case of delayed access to the data room, {CLIENT} accepts shared 50:50 responsibility for fees for project extensions.</>
            )}
          </Paragraph>
        </LetterBlock>

        {/* Section 4: Meetings */}
        <LetterBlock title="4. Client Meeting Cadence">
          <Paragraph>
            We will have regular check-ins throughout the engagement, with a formal client
            meeting each week. We propose to cover the following topics:
          </Paragraph>
          <ul className="space-y-2 pl-1">
            {clientMeetings.map(tp => (
              <li key={tp.id} className="flex gap-2 text-sm text-foreground/75 leading-snug">
                <span className="shrink-0 text-muted-foreground">•</span>
                <span>
                  <strong>{tp.label}</strong> ({tpDateShort(tp)}){" "}
                  — {tp.agenda ?? tp.label}
                </span>
              </li>
            ))}
          </ul>
          <Paragraph>
            Interim findings will be shared in advance of each formal meeting to allow{" "}
            {CLIENT} to review and direct focus. The final presentation will be delivered
            in a format suitable for IC circulation.
            {escalatedClauses.some(f => f.id === "rf3") && (
              <> {FIRM} agrees to regularly update the client outside of formal meetings to prevent misaligned expectations. If scope materially changes after the Interim presentation, {FIRM} is not liable for delays to IC materials.</>
            )}
          </Paragraph>
        </LetterBlock>

        {/* Signature */}
        <div className="pt-4 border-t border-border space-y-5">
          <Paragraph>
            Please confirm your acceptance of these terms by signing below or replying in
            writing. We look forward to working with you on this engagement.
          </Paragraph>
          <Paragraph>Yours sincerely,</Paragraph>
          <div className="grid grid-cols-2 gap-10 pt-4">
            <div className="space-y-1.5">
              <div className="h-px bg-border" />
              <p className="text-xs text-muted-foreground">For and on behalf of {FIRM}</p>
            </div>
            <div className="space-y-1.5">
              <div className="h-px bg-border" />
              <p className="text-xs text-muted-foreground">For and on behalf of {CLIENT}</p>
            </div>
          </div>
        </div>

        {/* Appendix: Client Milestone Summary */}
        <LetterBlock title="Appendix — Client Milestone Summary">
          <div style={{ filter: "grayscale(1)" }}>
            <SequencingSummary
              workstreams={workstreams}
              clientTouchpoints={clientTouchpoints}
              ganttSections={ganttSections}
            />
          </div>
        </LetterBlock>

      </div>
    </div>
  );
}
