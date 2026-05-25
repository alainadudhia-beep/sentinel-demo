import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const bullets: { heading: string; items: string[] }[] = [
  {
    heading: "Who I am",
    items: [
      "Former OC&C Consultant",
      "Later Senior Product Manager at Vivino",
      "Recently at Antler VC exploring AI-first ventures",
    ],
  },
  {
    heading: "What I've been working on",
    items: [
      "Problem: 25-50% of projects overrun at a cost of £50-100k/week",
      "Cause: In CDDs the cause is structural, not operational",
      "Validation: 30+ interviews across consulting (OC&C, Bain, BCG, LEK, CIL, A&M, Monitor-Deloitte, Elixirr, EY-Parthenon), PE funds and AI-native companies",
      "Solution: Built a concept demo grounded in that research - a governance layer for CDD engagements from scoping through delivery",
    ],
  },
  {
    heading: "Today's goal",
    items: [
      "Walk you through the concept demo",
      "Understand where OC&C is on this problem",
      "Explore whether there's a fit to work together",
    ],
  },
];

export default function Intro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">

        {/* Wordmark */}
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-12">
          Sentinel
        </p>

        {/* Sections */}
        <div className="space-y-10">
          {bullets.map((section) => (
            <div key={section.heading}>
              <h2 className="text-sm font-semibold text-foreground mb-3">
                {section.heading}
              </h2>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-[7px] w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            See demo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
