import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sampleScopingTranscript } from "@/data/mockData";
import { Loader2, ArrowRight, FileText, Mic } from "lucide-react";
import { useProject } from "@/context/ProjectContext";

type Mode = "transcript" | "record";

export default function ScopingCall() {
  const [mode, setMode] = useState<Mode>("transcript");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { advanceScopingStep, transcript, setTranscript } = useProject();

  const handleLoadSample = () => {
    setTranscript(sampleScopingTranscript);
  };

  const handleAnalyse = () => {
    setLoading(true);
    setTimeout(() => {
      advanceScopingStep(1);
      navigate("/scoping-review");
    }, 2000);
  };

  const wordCount = transcript.trim().length > 0
    ? transcript.split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground">Scoping Assistant</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Paste your scoping call transcript. Sentinel will extract scope questions,
          cross-reference client history, flag risks, and map the dependency timeline.
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setMode("transcript")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === "transcript"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Paste transcript
        </button>
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
        >
          <Mic className="w-3.5 h-3.5" />
          Record call
          <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground/60 px-1.5 py-0.5 rounded">
            Coming soon
          </span>
        </button>
      </div>

      {/* Main card */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">

        {/* Card header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Scoping call transcript</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paste meeting notes or a recorded call transcript
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
            className="gap-1.5 shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Load sample
          </Button>
        </div>

        {/* Transcript textarea */}
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="min-h-[340px] font-mono text-xs leading-relaxed bg-background resize-none"
          placeholder="Paste scoping call transcript here…"
        />

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {wordCount > 0 ? `${wordCount} words` : "No content"}
          </p>
          <Button
            onClick={handleAnalyse}
            disabled={transcript.trim().length === 0 || loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysing transcript…
              </>
            ) : (
              <>
                Analyse transcript
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}
