import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ganttWorkstreams, GanttItem, Workstream } from "@/data/mockData";
import { ArrowRight, Clock, Sparkles, ChevronRight, ChevronDown, Diamond, Check, AlertTriangle, Plus, X, GripVertical } from "lucide-react";

const TOTAL_DAYS = 15;
const WEEKS = [
  { label: "Week 1 · 17–21 Mar", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { label: "Week 2 · 24–28 Mar", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { label: "Week 3 · 31 Mar–4 Apr", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
];

const STATUS_KEYS = ["complete", "on-track", "at-risk", "blocked", "not-started"] as const;
type StatusKey = typeof STATUS_KEYS[number];

const STATUS_LABELS: Record<StatusKey, string> = {
  complete: "Complete",
  "on-track": "On track",
  "at-risk": "At risk",
  blocked: "Blocked",
  "not-started": "Not started",
};

const statusColors: Record<string, string> = {
  complete: "bg-rag-green",
  "on-track": "bg-rag-green-light",
  "at-risk": "bg-rag-amber",
  blocked: "bg-rag-red",
  "not-started": "bg-muted-foreground/30",
};

const milestoneColors: Record<string, string> = {
  complete: "text-rag-green",
  "on-track": "text-rag-green-light",
  "at-risk": "text-rag-amber",
  blocked: "text-rag-red",
  "not-started": "text-muted-foreground",
};

const statusIconColors: Record<string, string> = {
  complete: "text-rag-green",
  "on-track": "text-rag-green-light",
  "at-risk": "text-rag-amber",
  blocked: "text-rag-red",
  "not-started": "text-muted-foreground",
};

type DragMode = "move" | "resize-left" | "resize-right";

interface DragState {
  itemId: string;
  wsId: string;
  mode: DragMode;
  startX: number;
  originalStart: number;
  originalEnd: number;
}

function GanttBar({
  item,
  onDragStart,
}: {
  item: GanttItem;
  onDragStart?: (e: React.MouseEvent, mode: DragMode) => void;
}) {
  if (item.type === "milestone") {
    const left = ((item.startDay - 1) / TOTAL_DAYS) * 100;
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
        style={{ left: `${left}%` }}
        onMouseDown={(e) => onDragStart?.(e, "move")}
      >
        <Diamond className={`w-3.5 h-3.5 fill-current ${milestoneColors[item.status]}`} />
      </div>
    );
  }

  const left = ((item.startDay - 1) / TOTAL_DAYS) * 100;
  const width = ((item.endDay - item.startDay + 1) / TOTAL_DAYS) * 100;

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-sm ${statusColors[item.status]} ${item.critical ? "ring-1 ring-rag-red/40" : ""} cursor-grab active:cursor-grabbing group/bar`}
      style={{ left: `${left}%`, width: `${width}%`, minWidth: "6px" }}
      title={`${item.label}${item.notes ? ` — ${item.notes}` : ""}`}
      onMouseDown={(e) => onDragStart?.(e, "move")}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover/bar:opacity-100 bg-foreground/20 rounded-l-sm"
        onMouseDown={(e) => { e.stopPropagation(); onDragStart?.(e, "resize-left"); }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover/bar:opacity-100 bg-foreground/20 rounded-r-sm"
        onMouseDown={(e) => { e.stopPropagation(); onDragStart?.(e, "resize-right"); }}
      />
    </div>
  );
}

function StatusPicker({
  currentStatus,
  onChangeStatus,
}: {
  currentStatus: string;
  onChangeStatus: (status: string) => void;
}) {
  const icon =
    currentStatus === "complete" || currentStatus === "on-track" ? (
      <Check className={`w-3.5 h-3.5 ${statusIconColors[currentStatus]}`} />
    ) : currentStatus === "at-risk" || currentStatus === "blocked" ? (
      <AlertTriangle className={`w-3 h-3 ${statusIconColors[currentStatus]}`} />
    ) : (
      <span className={`w-3 h-3 rounded-full border-2 border-muted-foreground/40 inline-block`} />
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="shrink-0 rounded hover:bg-accent p-0.5 transition-colors"
          title={`Status: ${STATUS_LABELS[currentStatus as StatusKey] || currentStatus} — click to change`}
        >
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="start" side="bottom">
        {STATUS_KEYS.map((status) => (
          <button
            key={status}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors ${
              status === currentStatus ? "bg-accent font-medium" : ""
            }`}
            onClick={() => onChangeStatus(status)}
          >
            <span className={`w-2.5 h-2.5 rounded-sm ${statusColors[status]} inline-block`} />
            {STATUS_LABELS[status]}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default function Plan() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(ganttWorkstreams.map((ws) => [ws.id, true]))
  );
  const [workstreams, setWorkstreams] = useState<Workstream[]>(
    () => JSON.parse(JSON.stringify(ganttWorkstreams))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rowDrag, setRowDrag] = useState<{ wsId: string; itemId: string; overItemId: string | null } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const toggleWorkstream = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const updateItem = useCallback((wsId: string, itemId: string, updates: Partial<GanttItem>) => {
    setWorkstreams((prev) =>
      prev.map((ws) =>
        ws.id === wsId
          ? {
              ...ws,
              items: ws.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : ws
      )
    );
  }, []);

  const addItem = useCallback((wsId: string) => {
    setWorkstreams((prev) =>
      prev.map((ws) => {
        if (ws.id !== wsId) return ws;
        const lastItem = ws.items[ws.items.length - 1];
        const startDay = lastItem ? Math.min(lastItem.endDay + 1, TOTAL_DAYS) : 1;
        const newItem: GanttItem = {
          id: `new-${Date.now()}`,
          label: "New task",
          type: "task",
          owner: ws.owner,
          startDay,
          endDay: Math.min(startDay + 1, TOTAL_DAYS),
          status: "not-started",
        };
        return { ...ws, items: [...ws.items, newItem] };
      })
    );
    setExpanded((prev) => ({ ...prev, [wsId]: true }));
  }, []);

  const removeItem = useCallback((wsId: string, itemId: string) => {
    setWorkstreams((prev) =>
      prev.map((ws) =>
        ws.id === wsId
          ? { ...ws, items: ws.items.filter((item) => item.id !== itemId) }
          : ws
      )
    );
  }, []);

  const handleRowDrop = useCallback((wsId: string, dragItemId: string, dropItemId: string) => {
    setWorkstreams((prev) =>
      prev.map((ws) => {
        if (ws.id !== wsId) return ws;
        const items = [...ws.items];
        const fromIdx = items.findIndex((i) => i.id === dragItemId);
        const toIdx = items.findIndex((i) => i.id === dropItemId);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return ws;
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        return { ...ws, items };
      })
    );
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const dayWidth = rect.width / TOTAL_DAYS;
      const deltadays = Math.round((e.clientX - drag.startX) / dayWidth);

      if (deltadays === 0) return;

      if (drag.mode === "move") {
        const newStart = Math.max(1, Math.min(TOTAL_DAYS, drag.originalStart + deltadays));
        const duration = drag.originalEnd - drag.originalStart;
        const newEnd = Math.min(TOTAL_DAYS, newStart + duration);
        const adjustedStart = newEnd - duration;
        updateItem(drag.wsId, drag.itemId, { startDay: adjustedStart, endDay: newEnd });
      } else if (drag.mode === "resize-left") {
        const newStart = Math.max(1, Math.min(drag.originalEnd, drag.originalStart + deltadays));
        updateItem(drag.wsId, drag.itemId, { startDay: newStart });
      } else if (drag.mode === "resize-right") {
        const newEnd = Math.max(drag.originalStart, Math.min(TOTAL_DAYS, drag.originalEnd + deltadays));
        updateItem(drag.wsId, drag.itemId, { endDay: newEnd });
      }
    },
    [updateItem]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, [handleMouseMove]);

  const startDrag = useCallback(
    (e: React.MouseEvent, mode: DragMode, wsId: string, item: GanttItem) => {
      e.preventDefault();
      dragRef.current = {
        itemId: item.id,
        wsId,
        mode,
        startX: e.clientX,
        originalStart: item.startDay,
        originalEnd: item.endDay,
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = mode === "move" ? "grabbing" : "col-resize";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  const handleLabelChange = (wsId: string, itemId: string, newLabel: string) => {
    updateItem(wsId, itemId, { label: newLabel });
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Generated Project Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Commercial DD — Project Falcon · FreshCart Ltd · 3 weeks
          </p>
        </div>
        <Button onClick={() => navigate("/project")} className="gap-2">
          Open live project
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
          <Clock className="w-3 h-3" />
          Generated from scope in 12 seconds
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
          <Sparkles className="w-3 h-3" />
          Found 3 prior retail DDs with similar structure
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded-sm bg-rag-green inline-block" /> Complete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded-sm bg-rag-green-light inline-block" /> On track
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded-sm bg-rag-amber inline-block" /> At risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded-sm bg-rag-red inline-block" /> Blocked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded-sm bg-muted-foreground/30 inline-block" /> Not started
        </span>
        <span className="flex items-center gap-1.5">
          <Diamond className="w-3 h-3 fill-current text-muted-foreground" /> Milestone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm bg-rag-amber ring-1 ring-rag-red/40 inline-block" /> Critical path
        </span>
      </div>

      {/* Gantt Chart */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Timeline header */}
        <div className="flex border-b border-border bg-secondary/50">
          <div className="w-64 min-w-[256px] shrink-0 px-4 py-2" />
          <div className="flex-1 flex" ref={timelineRef}>
            {WEEKS.map((week, wi) => (
              <div key={wi} className="flex-1 border-l border-border">
                <div className="text-[10px] font-medium text-muted-foreground px-2 py-1 border-b border-border/50">
                  {week.label}
                </div>
                <div className="flex">
                  {week.days.map((d, di) => (
                    <div key={di} className="flex-1 text-center text-[10px] text-muted-foreground/60 py-1 border-r border-border/30 last:border-0">
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workstream rows */}
        {workstreams.map((ws) => (
          <div key={ws.id}>
            {/* Workstream header row */}
            <div
              className="flex border-b border-border hover:bg-accent/50 transition-colors cursor-pointer group/ws"
              onClick={() => toggleWorkstream(ws.id)}
            >
              <div className="w-64 min-w-[256px] shrink-0 px-4 py-2.5 flex items-center gap-2">
                {expanded[ws.id] ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold text-foreground">{ws.name}</span>
                <span className="text-[10px] text-muted-foreground ml-1">{ws.owner}</span>
                <button
                  className="ml-auto opacity-0 group-hover/ws:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
                  onClick={(e) => { e.stopPropagation(); addItem(ws.id); }}
                  title="Add task"
                >
                  <Plus className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex-1 border-l border-border" />
                  ))}
                </div>
                {!expanded[ws.id] &&
                  ws.items.map((item) => (
                    <GanttBar key={item.id} item={item} />
                  ))}
              </div>
            </div>

            {/* Sub-items */}
            {expanded[ws.id] &&
              ws.items.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    setRowDrag({ wsId: ws.id, itemId: item.id, overItemId: null });
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (rowDrag && rowDrag.wsId === ws.id) {
                      setRowDrag({ ...rowDrag, overItemId: item.id });
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (rowDrag && rowDrag.wsId === ws.id) {
                      handleRowDrop(ws.id, rowDrag.itemId, item.id);
                    }
                    setRowDrag(null);
                  }}
                  onDragEnd={() => setRowDrag(null)}
                  className={`flex border-b border-border/50 hover:bg-accent/30 transition-colors group/item ${
                    rowDrag?.overItemId === item.id && rowDrag?.itemId !== item.id
                      ? "border-t-2 border-t-primary"
                      : ""
                  }`}
                >
                  <div className="w-64 min-w-[256px] shrink-0 px-4 py-2 pl-7 flex items-center gap-1.5">
                    <GripVertical className="w-3 h-3 text-muted-foreground/30 shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    <StatusPicker
                      currentStatus={item.status}
                      onChangeStatus={(status) => updateItem(ws.id, item.id, { status })}
                    />
                    {editingId === item.id ? (
                      <input
                        autoFocus
                        defaultValue={item.label}
                        className="text-xs text-foreground bg-transparent border-b border-primary outline-none w-full"
                        onBlur={(e) => handleLabelChange(ws.id, item.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleLabelChange(ws.id, item.id, (e.target as HTMLInputElement).value);
                          } else if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                      />
                    ) : (
                      <span
                        className="text-xs text-foreground truncate cursor-text hover:text-primary transition-colors"
                        onDoubleClick={() => setEditingId(item.id)}
                        title="Double-click to edit"
                      >
                        {item.label}
                      </span>
                    )}
                    <button
                      className="ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 shrink-0"
                      onClick={() => removeItem(ws.id, item.id)}
                      title="Remove task"
                    >
                      <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  <div className="flex-1 relative py-1">
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex-1 border-l border-border/50" />
                      ))}
                    </div>
                    <div className="relative h-6">
                      <GanttBar
                        item={item}
                        onDragStart={(e, mode) => startDrag(e, mode, ws.id, item)}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Today marker note */}
      <p className="text-[10px] text-muted-foreground mt-3">
        Today is Wednesday Week 2 (26 Mar). Drag bars to move or resize. Double-click labels to edit. Click status icons to change progress.
      </p>
    </div>
  );
}
