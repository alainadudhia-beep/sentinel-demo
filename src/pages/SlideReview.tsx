import { useState, useRef, useEffect } from "react";
import { AlertTriangle, X, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Slide {
  number: number;
  title: string;
  status: "done" | "awaiting-review" | "not-started";
  content: string;
  depthFlag?: string;
}

const COMMERCIAL_SLIDES: Slide[] = [
  { number: 1, title: "Market size & growth", status: "done", content: "UK industrial SaaS market £2.1bn, growing at 14% CAGR. Target holds ~4% share. Market growth driven by digitisation of mid-market manufacturing." },
  { number: 2, title: "Revenue bridge: organic vs. acquired", status: "done", content: "Headline revenue CAGR 19% (FY23–FY25). Adjusted for two bolt-on acquisitions: organic CAGR 11%. M&A accounts for 27% of total revenue base." },
  { number: 3, title: "Customer cohort analysis", status: "done", content: "Top-10 customers: NRR 118%, gross churn <2%. SMB tier: gross churn 14%, NRR 91%. Revenue concentration: top-10 = 38% of ARR.", depthFlag: "Depth: medium · management-supplied data, not independently verified" },
  { number: 4, title: "Competitive positioning", status: "done", content: "Target positioned as mid-market specialist vs. SAP (enterprise) and generic SaaS (SMB). Key differentiator: deep ERP integration layer. 3 of 5 expert interviews cite switching cost as primary retention driver." },
  { number: 5, title: "Pipeline & new logo momentum", status: "done", content: "Current pipeline coverage: 1.8x FY26 new logo target. Industry benchmark: 2.5–3x. Gap raises credibility questions on FY26 plan." },
  { number: 6, title: "Pricing & packaging", status: "done", content: "Per-seat SaaS model. ARPU growing 8% YoY driven by upsell. No evidence of pricing power testing." },
  { number: 7, title: "Management plan stress test", status: "awaiting-review", content: "FY26 plan assumes: (1) 22% new logo growth, (2) 12% ARPU uplift, (3) no SMB churn deterioration. Our view: scenario 1 achievable, scenarios 2 and 3 optimistic without evidence." },
  { number: 8, title: "Commercial risk summary", status: "awaiting-review", content: "Primary risks: pipeline undercoverage, integration partner concentration ~30% ARR, SMB churn at upper end of acceptable range." },
  { number: 9, title: "Salesforce incentive analysis", status: "not-started", content: "Not started · Q5 scope item · due Mon 7 Apr" },
  { number: 10, title: "Commercial conclusion", status: "not-started", content: "To be completed W4 after expert synthesis" },
];

interface Section {
  name: string;
  done: number;
  forReview: number;
  inProgress: number;
  notStarted: number;
  total: number;
  status: "on-track" | "at-risk" | "off-track";
}

const SECTIONS: Section[] = [
  { name: "Executive summary", done: 2, forReview: 0, inProgress: 0, notStarted: 1, total: 3, status: "on-track" },
  { name: "Commercial", done: 6, forReview: 2, inProgress: 0, notStarted: 2, total: 10, status: "on-track" },
  { name: "Financial", done: 4, forReview: 0, inProgress: 2, notStarted: 2, total: 8, status: "on-track" },
  { name: "Expert synthesis", done: 0, forReview: 0, inProgress: 3, notStarted: 5, total: 8, status: "at-risk" },
  { name: "Tech & product", done: 0, forReview: 0, inProgress: 0, notStarted: 6, total: 6, status: "off-track" },
];

const statusBadge = (s: Section["status"]) => {
  switch (s) {
    case "on-track": return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--rag-green))]/10 text-[hsl(var(--rag-green))]">On track</span>;
    case "at-risk": return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--rag-amber))]/10 text-[hsl(var(--rag-amber))]">At risk</span>;
    case "off-track": return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--rag-red))]/10 text-[hsl(var(--rag-red))]">Off track</span>;
  }
};

export default function SlideReview() {
  const [approvedSlides, setApprovedSlides] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [scrollToSlide, setScrollToSlide] = useState<number | null>(null);
  const slideRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const awaitingCount = 2 - approvedSlides.size;
  const allApproved = awaitingCount <= 0;

  useEffect(() => {
    if (modalOpen && scrollToSlide !== null) {
      setTimeout(() => {
        slideRefs.current[scrollToSlide]?.scrollIntoView({ behavior: "smooth", block: "center" });
        setScrollToSlide(null);
      }, 100);
    }
  }, [modalOpen, scrollToSlide]);

  const approveSlide = (n: number) => setApprovedSlides((prev) => new Set(prev).add(n));
  const approveAll = () => setApprovedSlides(new Set([7, 8]));

  const openModal = (scrollTo?: number) => {
    setModalOpen(true);
    if (scrollTo) setScrollToSlide(scrollTo);
  };

  const pipColors = (s: Section) => {
    const pips: string[] = [];
    for (let i = 0; i < s.done; i++) pips.push("bg-[hsl(var(--rag-green))]");
    for (let i = 0; i < s.forReview; i++) pips.push("bg-[hsl(264,67%,50%)]");
    for (let i = 0; i < s.inProgress; i++) pips.push("bg-[hsl(var(--rag-amber))]");
    for (let i = 0; i < s.notStarted; i++) pips.push("bg-[hsl(var(--border))]");
    return pips;
  };

  const canReview = (s: Section) => s.forReview > 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Slide Review</h1>
          <p className="text-sm text-muted-foreground mt-1">Track output quality and manage partner sign-off</p>
        </div>

        {/* Section 1: Alert banner */}
        {!allApproved && (
          <div className="rounded-lg border border-[hsl(var(--rag-amber))]/30 bg-[hsl(var(--rag-amber))]/5 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--rag-amber))]" />
              <span className="text-sm text-foreground">
                <strong>{awaitingCount} slide{awaitingCount !== 1 ? "s" : ""} awaiting partner review</strong>
                {" · Fri 4 Apr 4pm hold confirmed · Mon 7 client presentation"}
              </span>
            </div>
            <Button size="sm" className="bg-[hsl(264,67%,50%)] hover:bg-[hsl(264,67%,44%)] text-white" onClick={() => openModal(7)}>
              Open partner review
            </Button>
          </div>
        )}

        {/* Section 2: Team request card */}
        {!allApproved && (
          <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[hsl(0,60%,45%)] flex items-center justify-center text-white text-xs font-bold shrink-0">JO</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">J. Okafor</span>
                <span className="text-[11px] text-muted-foreground">Today 8:31am</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Can you check my 2 slides please? Management plan stress test + Commercial risk summary — flagged for partner review
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="bg-[hsl(264,67%,50%)] hover:bg-[hsl(264,67%,44%)] text-white" onClick={() => openModal(7)}>
                  Open slides
                </Button>
                <Button size="sm" variant="outline" onClick={approveAll}>Approve all</Button>
              </div>
            </div>
          </div>
        )}

        {allApproved && (
          <div className="rounded-lg border border-[hsl(var(--rag-green))]/30 bg-[hsl(var(--rag-green))]/5 px-5 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--rag-green))]" />
            <span className="text-sm text-foreground font-medium">0 slides awaiting partner review · All approved</span>
          </div>
        )}

        {/* Section 3: Section progress tracker */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Deck progress by section</h2>
          <div className="space-y-3">
            {SECTIONS.map((s) => {
              const pips = pipColors(s);
              const completedCount = s.done + (s.name === "Commercial" ? approvedSlides.size : 0);
              const adjustedForReview = s.name === "Commercial" ? Math.max(0, s.forReview - approvedSlides.size) : s.forReview;

              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground w-36 shrink-0">{s.name}</span>

                  <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                    {s.done > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{s.name === "Commercial" ? completedCount : s.done} done</span>}
                    {adjustedForReview > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-[hsl(264,67%,50%)]/10 text-[hsl(264,67%,50%)] font-medium">{adjustedForReview} for review</span>}
                    {s.inProgress > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-[hsl(var(--rag-amber))]/10 text-[hsl(var(--rag-amber))] font-medium">{s.inProgress} in progress</span>}
                  </div>

                  <div className="flex items-center gap-[3px]">
                    {pips.map((c, i) => {
                      let color = c;
                      if (s.name === "Commercial") {
                        const reviewPipStart = s.done;
                        if (i >= reviewPipStart && i < reviewPipStart + s.forReview) {
                          const reviewIdx = i - reviewPipStart;
                          if (approvedSlides.has(7 + reviewIdx)) color = "bg-[hsl(var(--rag-green))]";
                        }
                      }
                      return <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />;
                    })}
                  </div>

                  <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                    {s.name === "Commercial" ? `${completedCount + adjustedForReview + s.inProgress}` : s.done + s.forReview + s.inProgress} / {s.total}
                  </span>

                  {statusBadge(s.status)}

                  <Button
                    size="sm"
                    variant={canReview(s) && (s.name !== "Commercial" || !allApproved) ? "default" : "outline"}
                    disabled={!canReview(s) || (s.name === "Commercial" && allApproved)}
                    className={
                      canReview(s) && (s.name !== "Commercial" || !allApproved)
                        ? "bg-[hsl(264,67%,50%)] hover:bg-[hsl(264,67%,44%)] text-white text-[11px] px-3 h-7 shrink-0"
                        : `text-[11px] px-3 h-7 shrink-0 ${s.status === "off-track" ? "opacity-40" : "opacity-60"}`
                    }
                    onClick={() => s.name === "Commercial" && openModal()}
                  >
                    Ready for review
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            {[
              { color: "bg-[hsl(var(--rag-green))]", label: "Done" },
              { color: "bg-[hsl(264,67%,50%)]", label: "Awaiting review" },
              { color: "bg-[hsl(var(--rag-amber))]", label: "In progress" },
              { color: "bg-[hsl(var(--border))]", label: "Not started" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                <span className="text-[11px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Quality flags */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-foreground">Quality flags</h2>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--rag-red))]/10 text-[hsl(var(--rag-red))]">2</span>
          </div>
          <div className="space-y-3">
            {/* Flag 1 — amber */}
            <div className="rounded-lg border border-[hsl(var(--rag-amber))]/30 bg-[hsl(var(--rag-amber))]/5 p-4">
              <p className="text-sm font-semibold text-foreground">Customer cohort data not independently verified</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Q2 (NRR and churn by tier) is marked answered but figures are management-supplied and have not been cross-checked against VDR data or expert interviews. If SMB churn of 14% is understated, the commercial conclusion changes materially.
              </p>
              <Button size="sm" variant="outline" className="mt-3 text-[11px] h-7 border-[hsl(var(--rag-amber))]/40 text-[hsl(var(--rag-amber))] hover:bg-[hsl(var(--rag-amber))]/10">
                Flag for verification
              </Button>
            </div>

            {/* Flag 2 — red */}
            <div className="rounded-lg border border-[hsl(var(--rag-red))]/30 bg-[hsl(var(--rag-red))]/5 p-4">
              <p className="text-sm font-semibold text-foreground">2 commercial slides insufficiently evidenced</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Management plan stress test and commercial risk summary rely on pipeline coverage ratios that have not been independently validated. Awaiting partner review before Mon 7 client presentation.
              </p>
              <Button size="sm" variant="outline" className="mt-3 text-[11px] h-7 border-[hsl(var(--rag-red))]/40 text-[hsl(var(--rag-red))] hover:bg-[hsl(var(--rag-red))]/10" onClick={() => openModal(7)}>
                Open slides
              </Button>
            </div>
          </div>
        </div>

        {/* Section 5: Slide preview modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center overflow-y-auto">
            <div className="bg-background w-full max-w-4xl my-8 rounded-xl border border-border shadow-2xl">
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-background border-b border-border rounded-t-xl px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Commercial section
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {6 + approvedSlides.size} done · {Math.max(0, 2 - approvedSlides.size)} awaiting partner review · 2 not started
                  </p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Slides */}
              <div className="p-6 space-y-4">
                {COMMERCIAL_SLIDES.map((slide) => {
                  const isApproved = approvedSlides.has(slide.number);
                  const effectiveStatus = isApproved ? "approved" : slide.status;

                  return (
                    <div
                      key={slide.number}
                      ref={(el) => { slideRefs.current[slide.number] = el; }}
                      className={`rounded-lg border p-5 ${
                        effectiveStatus === "awaiting-review"
                          ? "border-[hsl(264,67%,50%)]/30 bg-[hsl(264,67%,50%)]/[0.02]"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-muted-foreground">Slide {slide.number}</span>
                            <span className="text-sm font-semibold text-foreground">{slide.title}</span>
                            {effectiveStatus === "done" && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Done</span>
                            )}
                            {effectiveStatus === "awaiting-review" && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-[hsl(264,67%,50%)]/10 text-[hsl(264,67%,50%)] font-medium">Awaiting review</span>
                            )}
                            {effectiveStatus === "approved" && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-[hsl(var(--rag-green))]/10 text-[hsl(var(--rag-green))] font-medium">Approved</span>
                            )}
                            {effectiveStatus === "not-started" && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium italic">Not started</span>
                            )}
                          </div>

                          {slide.status === "not-started" ? (
                            <p className="text-sm text-muted-foreground italic">{slide.content}</p>
                          ) : (
                            <p className="text-sm text-foreground/80 leading-relaxed">{slide.content}</p>
                          )}

                          {slide.depthFlag && (
                            <div className="mt-2">
                              <span className="text-[11px] px-2 py-1 rounded bg-[hsl(var(--rag-amber))]/10 text-[hsl(var(--rag-amber))]">
                                {slide.depthFlag}
                              </span>
                            </div>
                          )}

                          {effectiveStatus === "awaiting-review" && (
                            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--rag-amber))] mr-3">
                                <AlertTriangle className="w-3 h-3" />
                                Awaiting partner review
                              </div>
                              <Button
                                size="sm"
                                className="bg-[hsl(var(--rag-green))] hover:bg-[hsl(142,60%,34%)] text-white text-[11px] h-7 px-3"
                                onClick={(e) => { e.stopPropagation(); approveSlide(slide.number); }}
                              >
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-[11px] h-7 px-3">
                                Request changes
                              </Button>
                            </div>
                          )}

                          {effectiveStatus === "approved" && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--rag-green))]">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved · partner notified
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
