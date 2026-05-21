import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, X, ArrowRight, Check } from "lucide-react";
import { useProject, type InputRelationship } from "@/context/ProjectContext";

// ─── Cell ─────────────────────────────────────────────────────────────────────

const CYCLE: (InputRelationship | null)[] = [null, "critical", "supporting"];

function MatrixCell({
  value,
  onChange,
}: {
  value: InputRelationship | null;
  onChange: (next: InputRelationship | null) => void;
}) {
  const next = CYCLE[(CYCLE.indexOf(value) + 1) % CYCLE.length];

  if (value === "critical") {
    return (
      <button
        onClick={() => onChange(next)}
        title="Critical — click to change"
        className="w-full h-full flex items-center justify-center"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 select-none">
          C
        </span>
      </button>
    );
  }
  if (value === "supporting") {
    return (
      <button
        onClick={() => onChange(next)}
        title="Supporting — click to change"
        className="w-full h-full flex items-center justify-center"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 select-none">
          S
        </span>
      </button>
    );
  }
  return (
    <button
      onClick={() => onChange(next)}
      title="Click to set"
      className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
    >
      <span className="text-muted-foreground/30 select-none text-base leading-none">+</span>
    </button>
  );
}

// ─── Add column input ─────────────────────────────────────────────────────────

function AddColumnInput({ onAdd }: { onAdd: (label: string) => void }) {
  const [active, setActive] = useState(false);
  const [text, setText] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (active) ref.current?.focus(); }, [active]);

  const commit = () => {
    const t = text.trim();
    if (t) onAdd(t);
    setActive(false);
    setText("");
  };

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
      >
        <Plus className="w-3 h-3" />
        Add input
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setActive(false); setText(""); }
        }}
        onBlur={() => { if (!text.trim()) { setActive(false); setText(""); } }}
        placeholder="Label…"
        className="text-xs bg-background border border-primary/40 rounded px-1.5 py-0.5 w-24 focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
      <button onClick={commit} disabled={!text.trim()} className="text-primary disabled:text-muted-foreground">
        <Check className="w-3 h-3" />
      </button>
      <button onClick={() => { setActive(false); setText(""); }} className="text-muted-foreground hover:text-foreground">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ScopeReview() {
  const navigate = useNavigate();
  const { workstreams, setWorkstreams, inputColumns, setInputColumns, advanceScopingStep } = useProject();

  // Flat list of all deliverables with their workstream attached
  const rows = workstreams.flatMap((ws) =>
    ws.deliverables.map((d) => ({ ws, d }))
  );

  // ── Handlers ──

  const setCell = (wsId: string, dId: string, col: string, value: InputRelationship | null) =>
    setWorkstreams((prev) =>
      prev.map((ws) =>
        ws.id !== wsId ? ws : {
          ...ws,
          deliverables: ws.deliverables.map((d) => {
            if (d.id !== dId) return d;
            const next = { ...d.inputMap };
            if (value === null) delete next[col];
            else next[col] = value;
            return { ...d, inputMap: next };
          }),
        }
      )
    );

  const addColumn = (label: string) => {
    if (!inputColumns.includes(label))
      setInputColumns((prev) => [...prev, label]);
  };

  const removeColumn = (col: string) => {
    setInputColumns((prev) => prev.filter((c) => c !== col));
    setWorkstreams((prev) =>
      prev.map((ws) => ({
        ...ws,
        deliverables: ws.deliverables.map((d) => {
          const next = { ...d.inputMap };
          delete next[col];
          return { ...d, inputMap: next };
        }),
      }))
    );
  };

  const removeDeliverable = (wsId: string, dId: string) =>
    setWorkstreams((prev) =>
      prev.map((ws) =>
        ws.id !== wsId ? ws : {
          ...ws,
          deliverables: ws.deliverables.filter((d) => d.id !== dId),
        }
      )
    );

  const totalDeliverables = rows.length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Analytical Work Map</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Deliverables vs. inputs. Click a cell to set the relationship.
            <span className="ml-3 inline-flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">C</span>
              Critical
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">S</span>
              Supporting
            </span>
          </p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 mt-1">
          {totalDeliverables} deliverables · {inputColumns.length} inputs
        </span>
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">

            <thead>
              <tr className="border-b border-border bg-muted/20">
                {/* Deliverable column */}
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-64 min-w-[16rem]">
                  Deliverable
                </th>

                {/* Input columns */}
                {inputColumns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground min-w-[7rem] align-top"
                  >
                    <div className="flex items-start justify-center gap-1 group/col">
                      <span className="break-words text-center leading-snug">{col}</span>
                      <button
                        onClick={() => removeColumn(col)}
                        className="opacity-0 group-hover/col:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </th>
                ))}

                {/* Add column */}
                <th className="px-3 py-2.5 text-left min-w-[8rem]">
                  <AddColumnInput onAdd={addColumn} />
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {rows.map(({ ws, d }) => (
                <tr key={d.id} className="group/row hover:bg-muted/10 transition-colors">

                  {/* Deliverable name + workstream tag */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug truncate">
                          {d.name}
                        </p>
                        <p className={`text-[10px] font-semibold mt-0.5 ${ws.colorClass}`}>
                          {ws.name}
                        </p>
                      </div>
                      <button
                        onClick={() => removeDeliverable(ws.id, d.id)}
                        className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Cells */}
                  {inputColumns.map((col) => (
                    <td key={col} className="px-3 py-2.5 h-10 text-center">
                      <MatrixCell
                        value={d.inputMap[col] ?? null}
                        onChange={(val) => setCell(ws.id, d.id, col, val)}
                      />
                    </td>
                  ))}

                  {/* Empty cell under add-column header */}
                  <td />
                </tr>
              ))}

            </tbody>

          </table>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {totalDeliverables} deliverables · {inputColumns.length} inputs
        </p>
        <Button
          onClick={() => { advanceScopingStep(3); navigate("/plan"); }}
          className="gap-2"
        >
          Approve
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
}
