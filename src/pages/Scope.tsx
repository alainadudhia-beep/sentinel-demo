import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sampleEngagementLetter } from "@/data/mockData";
import { Loader2, ArrowRight } from "lucide-react";

export default function Scope() {
  const [searchParams] = useSearchParams();
  const isEmpty = searchParams.get("empty") === "1";
  const [text, setText] = useState(isEmpty ? "" : sampleEngagementLetter);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => navigate("/plan"), 1800);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Engagement Letter</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paste or review the engagement scope below. The AI will extract workstreams, timelines, and deliverables.
        </p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[420px] font-mono text-xs leading-relaxed bg-card"
        placeholder="Paste your engagement letter here..."
      />

      <div className="flex items-center justify-between mt-6">
        <p className="text-xs text-muted-foreground">
          {text.length > 0 ? `${text.split(/\s+/).length} words` : "No content"}
        </p>
        <Button
          onClick={handleGenerate}
          disabled={text.trim().length === 0 || loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating plan…
            </>
          ) : (
            <>
              Generate project plan
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
