import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground mb-2">
          <Sparkles className="w-3 h-3" />
          Suggested plan based on prior commercial DD template
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-foreground">
          Keep due diligence projects on track before they slip
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
          Turn engagement scope into a live delivery plan, detect risks early, and help managers act before delays hit the client.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button onClick={() => navigate("/scope")} className="gap-2">
            Use sample engagement letter
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/scope?empty=1")}>
            Paste engagement letter
          </Button>
        </div>
      </div>
    </div>
  );
}
