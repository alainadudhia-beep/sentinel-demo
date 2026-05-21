import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, X, ExternalLink } from "lucide-react";
import { useProject, RISK_FLAGS } from "@/context/ProjectContext";

// ─── Day rates (derived from historical engagements) ─────────────────────────
// Project 1: £285k / 15 days / 9 people ≈ £2,111/person/day blended
// Project 2: £195k / 15 days / 6 people ≈ £2,167/person/day blended

const DAY_RATES = {
  partner:    3200,
  manager:    2100,
  consultant: 1600,
  analyst:    1100,
} as const;

type RoleKey = keyof typeof DAY_RATES;

interface TeamMember { role: RoleKey; count: number; label: string }

const ENGAGEMENT_DAYS = 15; // 3 delivery weeks × 5 days (Weeks 1–3, excl. Week 0 ramp)

function computeFee(team: TeamMember[]): number {
  return team.reduce((sum, m) => sum + m.count * DAY_RATES[m.role] * ENGAGEMENT_DAYS, 0);
}

function formatFee(n: number): string {
  return `£${Math.round(n / 1000).toLocaleString()}k`;
}

function totalHeadcount(team: TeamMember[]): number {
  return team.reduce((s, m) => s + m.count, 0);
}

// ─── Pricing tiers ────────────────────────────────────────────────────────────

// Tier days derived from timeline (Tier A = 10d, B = 15d, C = 20d)
const TIER_DAYS = { A: 10, B: 15, C: 20 } as const;

export const PRICING_TIERS: {
  id: string;
  label: string;
  tagline: string;
  specFee: number;          // fixed fee from spec (overrides computed)
  durationWeeks: number;
  recommended: boolean;
  team: TeamMember[];
  includes: string[];
}[] = [
  {
    id: "A",
    label: "Tier A",
    tagline: "AI-Accelerated",
    specFee: 145000,
    durationWeeks: 2,
    recommended: false,
    team: [
      { role: "partner",    count: 2,   label: "Partners"           },
      { role: "manager",    count: 1,   label: "Engagement Manager" }, // 0.5 FTE shown in label
      { role: "consultant", count: 1,   label: "Consultant"         },
      { role: "analyst",    count: 1,   label: "Associate"          },
    ],
    includes: [
      "AI-driven research & synthesis",
      "5 workstream coverage",
      "Interim findings (Week 2)",
      "Final deck delivery",
      "Up to 4 expert interviews",
    ],
  },
  {
    id: "B",
    label: "Tier B",
    tagline: "Standard",
    specFee: 285000,
    durationWeeks: 3,
    recommended: true,
    team: [
      { role: "partner",    count: 2, label: "Partners"            },
      { role: "manager",    count: 1, label: "Engagement Manager"  },
      { role: "consultant", count: 2, label: "Consultants"         },
      { role: "analyst",    count: 3, label: "Associates"          },
    ],
    includes: [
      "5 workstream coverage",
      "Consumer survey (n=200)",
      "Up to 8 expert interviews",
      "Interim + final delivery",
      "Client briefing session",
    ],
  },
  {
    id: "C",
    label: "Tier C",
    tagline: "Comprehensive",
    specFee: 385000,
    durationWeeks: 4,
    recommended: false,
    team: [
      { role: "partner",    count: 3, label: "Partners"            },
      { role: "manager",    count: 1, label: "Engagement Manager"  },
      { role: "consultant", count: 2, label: "Consultants"         },
      { role: "analyst",    count: 4, label: "Associates"          },
    ],
    includes: [
      "5 workstream coverage",
      "Consumer survey (n=400)",
      "Up to 16 expert interviews",
      "Management interview support",
      "Interim + final + IC support",
      "Partner sign-off on findings",
    ],
  },
];

// ─── Historical engagements ───────────────────────────────────────────────────

const PAST_ENGAGEMENTS = [
  // ── CVC ──
  { client: "CVC", project: "Consumer Retail CDD",        target: "Online grocery delivery",       weeks: 3, overrun: 1.5, fee: 285000, satisfaction: 3.9, team: "3P · 1M · 2C · 3A", additions: ["Supplier concentration risk (W2)", "Online vs offline channel split (W3)"],         keyLearning: "Add supplier concentration and channel mix upfront. Data room access clause needed." },
  { client: "CVC", project: "B2B SaaS CDD",               target: "Industrial SaaS",               weeks: 3, overrun: 0,   fee: 195000, satisfaction: 4.4, team: "2P · 1M · 1C · 2A", additions: ["Integration partner concentration (W1)", "CAC payback with PS allocation (W2)"], keyLearning: "SaaS deals: add integration dependency and true CAC to standard scope template." },
  { client: "CVC", project: "Healthcare Tech CDD",         target: "Digital health platform",       weeks: 3, overrun: 0,   fee: 218000, satisfaction: 4.5, team: "2P · 1M · 2C · 2A", additions: ["Reimbursement risk analysis (W2)"],                                                  keyLearning: "Digital health requires regulatory reimbursement scoping from Day 1." },
  { client: "CVC", project: "Consumer Fintech CDD",        target: "BNPL platform",                 weeks: 4, overrun: 1,   fee: 310000, satisfaction: 4.0, team: "3P · 1M · 2C · 3A", additions: ["Fraud loss rate benchmarking (W1)", "Regulatory capital requirements (W2)"],       keyLearning: "BNPL: add fraud benchmarking and regulatory capital to standard fintech scope." },
  { client: "CVC", project: "Last-Mile Logistics CDD",     target: "On-demand delivery network",    weeks: 2, overrun: 0,   fee: 162000, satisfaction: 4.3, team: "2P · 1M · 1C · 2A", additions: ["Driver classification risk (W1)"],                                                   keyLearning: "Gig logistics: worker classification risk always surfaces — scope it upfront." },
  { client: "CVC", project: "EdTech Growth Equity CDD",    target: "Corporate L&D platform",        weeks: 3, overrun: 0.5, fee: 225000, satisfaction: 4.1, team: "2P · 1M · 1C · 2A", additions: ["Sales cycle and CAC benchmarking (W2)"],                                            keyLearning: "B2B EdTech: enterprise sales cycle length consistently underestimated by management." },
  { client: "CVC", project: "Home Services CDD",           target: "Home services marketplace",     weeks: 3, overrun: 0,   fee: 198000, satisfaction: 4.6, team: "2P · 1M · 1C · 2A", additions: ["Supply-side retention analysis (W2)"],                                               keyLearning: "Marketplace: supply-side retention as critical as demand-side — always add both." },
  { client: "CVC", project: "Enterprise Software CDD",     target: "ERP platform for SMEs",         weeks: 4, overrun: 0,   fee: 275000, satisfaction: 4.4, team: "2P · 1M · 2C · 3A", additions: ["Implementation partner dependency (W1)"],                                            keyLearning: "ERP: partner channel concentration risk consistently underweighted. Add to template." },
  { client: "CVC", project: "Food & Beverage CDD",         target: "Restaurant delivery aggregator", weeks: 3, overrun: 1, fee: 260000, satisfaction: 3.8, team: "2P · 1M · 2C · 2A", additions: ["Restaurant churn by geography (W2)", "Dark kitchen economics (W3)"],                 keyLearning: "Food delivery: dark kitchen economics and geographic churn diverge significantly." },
  { client: "CVC", project: "Proptech CDD",                target: "Residential lettings platform",  weeks: 2, overrun: 0, fee: 145000, satisfaction: 4.5, team: "1P · 1M · 1C · 2A", additions: [],                                                                                      keyLearning: "Clean engagement — well-scoped upfront with no mid-project additions." },
  { client: "CVC", project: "Cybersecurity Growth CDD",    target: "SME security SaaS",              weeks: 3, overrun: 0, fee: 205000, satisfaction: 4.3, team: "2P · 1M · 1C · 2A", additions: ["Incident response capability benchmarking (W2)"],                                     keyLearning: "Cyber: IR benchmarking always added — build into standard SaaS security scope." },
  { client: "CVC", project: "Consumer Subscription CDD",   target: "Beauty box subscription",        weeks: 2, overrun: 0.5, fee: 172000, satisfaction: 4.0, team: "2P · 1M · 1C · 2A", additions: ["Cohort churn depth by acquisition channel (W1)"],                                 keyLearning: "Subscription: acquisition channel mix drives churn divergence — scope cohort depth upfront." },
  // ── Comparable consumer retail CDDs (other clients) ──
  { client: "Hg",     project: "Consumer Retail CDD",  target: "Omnichannel retail",             weeks: 3, overrun: 1,   fee: 350000, satisfaction: 3.7, team: "2P · 1M · 1C · 3A", additions: ["Greater N expert interviews", "Consumer survey edits (multiple rounds)"],              keyLearning: "Client over-extends survey scope. Clear timeline dependency clauses or 20% scope buffer." },
  { client: "KKR",    project: "Consumer Retail CDD",  target: "Fashion e-commerce platform",    weeks: 3, overrun: 0,   fee: 295000, satisfaction: 4.2, team: "2P · 1M · 2C · 2A", additions: ["Returns economics analysis (W2)"],                                                      keyLearning: "Fashion e-com: returns rate and unit economics on returned goods always underscoped." },
  { client: "Apax",   project: "Consumer Retail CDD",  target: "Health & wellness marketplace",  weeks: 3, overrun: 0,   fee: 268000, satisfaction: 4.4, team: "2P · 1M · 1C · 2A", additions: [],                                                                                         keyLearning: "Well-scoped engagement — clear scope letter with named dependencies delivered on time." },
  { client: "Warburg", project: "Consumer Retail CDD", target: "Direct-to-consumer supplements", weeks: 4, overrun: 0.5, fee: 335000, satisfaction: 4.0, team: "3P · 1M · 2C · 3A", additions: ["Influencer channel concentration risk (W2)", "Regulatory claims risk (W3)"],            keyLearning: "DTC: influencer concentration and regulatory claims risk on supplements — scope both upfront." },
];

// Current deal context
const CURRENT_CLIENT = "CVC";
const CURRENT_SECTOR = "Consumer Retail";

// Client history: same client
const CLIENT_HISTORY = PAST_ENGAGEMENTS.filter((e) => e.client === CURRENT_CLIENT);

// Similar deals: same sector, different client
const SIMILAR_DEALS = PAST_ENGAGEMENTS.filter(
  (e) => e.client !== CURRENT_CLIENT && e.project.toLowerCase().includes("consumer retail")
);

function computeStats(engagements: typeof PAST_ENGAGEMENTS) {
  const n = engagements.length;
  const totalFee   = engagements.reduce((s, e) => s + e.fee, 0);
  const totalWeeks = engagements.reduce((s, e) => s + e.weeks, 0);
  return {
    count:          n,
    onTimePct:      Math.round((engagements.filter((e) => e.overrun === 0).length / n) * 100),
    avgWeeklyFee:   Math.round(totalFee / totalWeeks),
    avgSat:         Math.round((engagements.reduce((s, e) => s + e.satisfaction, 0) / n) * 10) / 10,
  };
}

const clientStats  = computeStats(CLIENT_HISTORY);
const similarStats = computeStats(SIMILAR_DEALS);

// ─── Engagement row (shared between both modal sections) ─────────────────────

export { PAST_ENGAGEMENTS, CLIENT_HISTORY, SIMILAR_DEALS, clientStats, similarStats, formatFee };

export function EngagementSection({
  title,
  engagements,
  showClient,
}: {
  title: string;
  engagements: typeof PAST_ENGAGEMENTS;
  showClient: boolean;
}) {
  return (
    <div>
      <div className="px-5 py-2.5 bg-muted/20 border-y border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      </div>
      <div className="divide-y divide-border">
        {engagements.map((e, i) => (
          <div key={i} className="px-5 py-4 space-y-2.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{e.project}</span>
                  {showClient && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                      {e.client}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                    e.overrun === 0
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {e.overrun === 0 ? "On time" : `+${e.overrun}w overrun`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{e.target} · {e.weeks}w · {e.team} · {e.satisfaction}/5</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">{formatFee(e.fee)}</p>
                {e.overrun > 0 && (
                  <p className="text-[10px] text-red-600 mt-0.5">Overrun absorbed by OC&C</p>
                )}
              </div>
            </div>

            {e.additions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {e.additions.map((a) => (
                  <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    {a}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Learning: </span>{e.keyLearning}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── History modal (generic) ──────────────────────────────────────────────────

export function HistoryModal({
  title,
  subtitle,
  stats,
  sections,
  onClose,
}: {
  title: string;
  subtitle: string;
  stats: { label: string; value: string | number }[];
  sections: { heading: string; engagements: typeof PAST_ENGAGEMENTS; showClient: boolean }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid divide-x divide-border border-b border-border" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
          {stats.map(({ label, value }) => (
            <div key={label} className="px-4 py-3">
              <p className="text-lg font-semibold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {sections.map((s) => (
          <EngagementSection key={s.heading} title={s.heading} engagements={s.engagements} showClient={s.showClient} />
        ))}
      </div>
    </div>
  );
}

// ─── Risk flag card ───────────────────────────────────────────────────────────

function RiskFlagCard({
  flag,
  approved,
  onApprove,
}: {
  flag: typeof RISK_FLAGS[number];
  approved: boolean;
  onApprove: () => void;
}) {
  const isCritical = flag.severity === "critical";

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
      approved
        ? "border-border opacity-60 bg-card"
        : isCritical
        ? "border-red-200 bg-red-50/30"
        : "border-amber-200 bg-amber-50/20"
    }`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
        approved ? "bg-green-500" : isCritical ? "bg-red-500" : "bg-amber-500"
      }`} />

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
            approved
              ? "bg-green-50 text-green-700 border-green-200"
              : isCritical
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {approved ? "Approved" : isCritical ? "Critical" : "Amber"}
          </span>
          <span className="text-sm font-semibold text-foreground">{flag.title}</span>
          <span className="text-xs text-muted-foreground">— {flag.historical}</span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{flag.detail}</p>

        <div>
          <p className="text-xs font-semibold text-foreground mb-1.5">Recommendation</p>
          <div className="flex items-start gap-2">
          <div className="flex-1 text-xs text-muted-foreground bg-background border border-border rounded px-3 py-2 leading-relaxed">
            {flag.recommendation}
          </div>
          {approved ? (
            <div className="flex items-center gap-1 text-xs font-medium text-green-700 shrink-0 mt-1.5">
              <Check className="w-3.5 h-3.5" />
              Escalated
            </div>
          ) : (
            <Button size="sm" onClick={onApprove} className="h-7 gap-1.5 text-xs px-3 shrink-0 mt-0.5">
              Escalate to Legal
            </Button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Engagement() {
  const navigate = useNavigate();
  const { approvedFlags, approveFlag, advanceScopingStep, selectedTier, setSelectedTier } = useProject();

  const [showClientModal,  setShowClientModal]  = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);

  const approvedCount = RISK_FLAGS.filter((f) => approvedFlags.has(f.id)).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Engagement Intelligence</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Client history, risk flags, and fee options for this engagement.
        </p>
      </div>

      {/* ── Two intel panels ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Client history panel */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
            <p className="text-xs font-semibold text-foreground">{CURRENT_CLIENT} — client history</p>
            <button
              onClick={() => setShowClientModal(true)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              See more <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border">
            {[
              { label: "Engagements",     value: clientStats.count },
              { label: "% on time",       value: `${clientStats.onTimePct}%` },
              { label: "Avg weekly fee",   value: formatFee(clientStats.avgWeeklyFee) },
              { label: "Avg satisfaction",value: `${clientStats.avgSat} / 5` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-4 py-3">
                <p className="text-xl font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Similar deals panel */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
            <p className="text-xs font-semibold text-foreground">{CURRENT_SECTOR} CDDs — comparable deals</p>
            <button
              onClick={() => setShowSimilarModal(true)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              See more <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border">
            {[
              { label: "Comparable deals", value: similarStats.count },
              { label: "% on time",        value: `${similarStats.onTimePct}%` },
              { label: "Avg weekly fee",    value: formatFee(similarStats.avgWeeklyFee) },
              { label: "Avg satisfaction", value: `${similarStats.avgSat} / 5` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-4 py-3">
                <p className="text-xl font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Client risk flags ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Client risk flags</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Approve each clause to include it in the engagement letter.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {RISK_FLAGS.map((flag) => (
            <RiskFlagCard
              key={flag.id}
              flag={flag}
              approved={approvedFlags.has(flag.id)}
              onApprove={() => approveFlag(flag.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Fee options ── */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Fee options</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fees derived from historical rates — Partner £{(DAY_RATES.partner / 1000).toFixed(1)}k/day · Manager £{(DAY_RATES.manager / 1000).toFixed(1)}k/day · Consultant £{(DAY_RATES.consultant / 1000).toFixed(1)}k/day · Analyst £{(DAY_RATES.analyst / 1000).toFixed(1)}k/day
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {PRICING_TIERS.map((tier) => {
            const selected  = selectedTier === tier.id;
            const headcount = totalHeadcount(tier.team);

            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative text-left rounded-lg border p-4 transition-all ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {tier.recommended && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
                    Recommended
                  </span>
                )}

                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{tier.tagline}</span>
                  {selected && <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />}
                </div>

                <p className="text-2xl font-bold text-foreground mb-0.5">
                  {formatFee(tier.specFee)}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {tier.durationWeeks} weeks · {headcount} people
                </p>

                {/* Team */}
                <div className="mb-3 pb-3 border-b border-border/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Team</p>
                  <ul className="space-y-0.5">
                    {tier.team.map((m) => (
                      <li key={m.label} className="text-xs text-muted-foreground">
                        {m.count > 1 ? `${m.count}× ` : ""}{m.label}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Includes */}
                <ul className="space-y-1">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {approvedCount} of {RISK_FLAGS.length} client protections approved
          {approvedCount < RISK_FLAGS.length && (
            <span className="ml-1 text-amber-600">· review remaining flags before proceeding</span>
          )}
        </p>
        <Button onClick={() => { advanceScopingStep(6); navigate("/letter"); }} className="gap-2">
          Proceed to Letter
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {showClientModal && (
        <HistoryModal
          title="CVC Capital Partners — client history"
          subtitle={`${clientStats.count} engagements on record`}
          stats={[
            { label: "Engagements",     value: clientStats.count },
            { label: "On time",         value: `${clientStats.onTimePct}%` },
            { label: "Avg weekly fee",   value: formatFee(clientStats.avgWeeklyFee) },
            { label: "Avg satisfaction",value: `${clientStats.avgSat} / 5` },
          ]}
          sections={[{ heading: "All engagements", engagements: CLIENT_HISTORY, showClient: false }]}
          onClose={() => setShowClientModal(false)}
        />
      )}

      {showSimilarModal && (
        <HistoryModal
          title={`${CURRENT_SECTOR} CDDs — comparable deals`}
          subtitle={`${similarStats.count} comparable engagements from other PE clients`}
          stats={[
            { label: "Deals",           value: similarStats.count },
            { label: "On time",         value: `${similarStats.onTimePct}%` },
            { label: "Avg fee",         value: formatFee(similarStats.avgFee) },
            { label: "Avg satisfaction",value: `${similarStats.avgSat} / 5` },
          ]}
          sections={[{ heading: "Comparable consumer retail deals", engagements: SIMILAR_DEALS, showClient: true }]}
          onClose={() => setShowSimilarModal(false)}
        />
      )}

    </div>
  );
}
