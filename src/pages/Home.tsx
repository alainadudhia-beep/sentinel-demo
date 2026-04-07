import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import sentinelLogo from "@/assets/sentinel-logo.png";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src={sentinelLogo} alt="Sentinel logo" width={40} height={40} />
          <span className="text-2xl font-bold tracking-tight text-foreground">Sentinel</span>
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
