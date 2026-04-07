import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ganttWorkstreams, GanttItem, Workstream } from "@/data/mockData";
import { ArrowRight, Clock, Sparkles, ChevronRight, ChevronDown, Diamond, Check, AlertTriangle, Plus, X, GripVertical, Circle, MessageSquare } from "lucide-react";

/* ---- Scope questions mapped to workstreams ---- */
interface ScopeQuestionSummary {
  question: string;
  status: "answered" | "in-progress" | "open";
}

const WORKSTREAM_QUESTIONS: Record<string, ScopeQuestionSummary[]> = {
  "ws-survey": [
    { question: "What is the current customer churn rate by cohort?", status: "answered" },
    { question: "What is the net revenue retention rate for enterprise vs. SMB?", status: "in-progress" },
  ],
  "ws-market": [
    { question: "What is the gross margin profile by product line?", status: "answered" },
    { question: "What capex is required to support the 3-year growth plan?", status: "open" },
  ],
  "ws-internal": [
    { question: "How defensible is the competitive moat?", status: "open" },
    { question: "What are the key regulatory risks?", status: "in-progress" },
  ],
  "ws-presentation": [],
};

const TOTAL_DAYS = 15;
const TODAY_DAY = 8; // Wednesday Week 2 (26 Mar)
const WEEKS = [
  { label: "Week 1 · 17–21 Mar", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { label: "Week 2 · 24–28 Mar", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { label: "Week 3 · 31 Mar–4 Apr", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
];

interface MeetingMarker {
  id: string;
  day: number;
  label: string;
  cssVar: string;
}

const INITIAL_MEETING_MARKERS: MeetingMarker[] = [
  { id: "mk1", day: 1, label: "Status Update", cssVar: "--rag-blue" },
  { id: "mk2", day: 6, label: "Status Update", cssVar: "--rag-blue" },
  { id: "mk3", day: 10, label: "Interim", cssVar: "--rag-amber" },
  { id: "mk4", day: 11, label: "Status Update", cssVar: "--rag-blue" },
  { id: "mk5", day: 13, label: "Draft Review", cssVar: "--rag-amber" },
  { id: "mk6", day: 15, label: "Final Readout", cssVar: "--rag-green" },
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
  onUpdateNotes,
}: {
  item: GanttItem;
  onDragStart?: (e: React.MouseEvent, mode: DragMode) => void;
  onUpdateNotes?: (notes: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(item.notes || "");
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPopover = hovered || editingNotes;

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setHovered(true), 300);
  };
  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (!editingNotes) setHovered(false);
  };

  const saveNotes = () => {
    onUpdateNotes?.(notesDraft);
    setEditingNotes(false);
    setHovered(false);
  };

  const popoverContent = showPopover ? (
    <div
      className="absolute z-30 bg-popover border border-border rounded-lg shadow-lg p-3 w-56 text-xs"
      style={{ bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" }}
      onMouseEnter={() => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); setHovered(true); }}
      onMouseLeave={() => { if (!editingNotes) setHovered(false); }}
    >
      <p className="font-medium text-foreground mb-1">{item.label}</p>
      {editingNotes ? (
        <div className="space-y-1.5">
          <Textarea
            autoFocus
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            className="text-xs min-h-[60px] resize-none"
            placeholder="Add notes…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveNotes();
              if (e.key === "Escape") { setEditingNotes(false); setHovered(false); }
            }}
          />
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => { setEditingNotes(false); setHovered(false); }}>
              Cancel
            </Button>
            <Button size="sm" className="h-6 text-[10px] px-2" onClick={saveNotes}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground leading-relaxed">
            {item.notes || <span className="italic">No notes</span>}
          </p>
          <button
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-1.5 transition-colors"
            onClick={(e) => { e.stopPropagation(); setNotesDraft(item.notes || ""); setEditingNotes(true); }}
          >
            <MessageSquare className="w-3 h-3" />
            {item.notes ? "Edit notes" : "Add notes"}
          </button>
        </>
      )}
    </div>
  ) : null;

  if (item.type === "milestone") {
    const left = ((item.startDay - 1) / TOTAL_DAYS) * 100;
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
        style={{ left: `${left}%` }}
        onMouseDown={(e) => { if (!editingNotes) onDragStart?.(e, "move"); }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Diamond className={`w-3.5 h-3.5 fill-current ${milestoneColors[item.status]}`} />
        {popoverContent}
      </div>
    );
  }

  const left = ((item.startDay - 1) / TOTAL_DAYS) * 100;
  const width = ((item.endDay - item.startDay + 1) / TOTAL_DAYS) * 100;

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-sm ${statusColors[item.status]} cursor-grab active:cursor-grabbing group/bar`}
      style={{ left: `${left}%`, width: `${width}%`, minWidth: "6px" }}
      onMouseDown={(e) => { if (!editingNotes) onDragStart?.(e, "move"); }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover/bar:opacity-100 bg-foreground/20 rounded-l-sm"
        onMouseDown={(e) => { e.stopPropagation(); onDragStart?.(e, "resize-left"); }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover/bar:opacity-100 bg-foreground/20 rounded-r-sm"
        onMouseDown={(e) => { e.stopPropagation(); onDragStart?.(e, "resize-right"); }}
      />
      {popoverContent}
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
    currentStatus === "complete" ? (
      <Check className={`w-3.5 h-3.5 ${statusIconColors[currentStatus]}`} />
    ) : currentStatus === "on-track" ? (
      <Circle className={`w-3 h-3 fill-current ${statusIconColors[currentStatus]}`} />
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
  const [markers, setMarkers] = useState<MeetingMarker[]>(() => [...INITIAL_MEETING_MARKERS]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rowDrag, setRowDrag] = useState<{ wsId: string; itemId: string; overItemId: string | null } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const markerDragRef = useRef<{ markerId: string; startX: number; originalDay: number } | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const markerTimelineRef = useRef<HTMLDivElement | null>(null);

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

  const handleMarkerMouseMove = useCallback((e: MouseEvent) => {
    const md = markerDragRef.current;
    const el = markerTimelineRef.current;
    if (!md || !el) return;
    const rect = el.getBoundingClientRect();
    const dayWidth = rect.width / TOTAL_DAYS;
    const deltaDays = Math.round((e.clientX - md.startX) / dayWidth);
    if (deltaDays === 0) return;
    const newDay = Math.max(1, Math.min(TOTAL_DAYS, md.originalDay + deltaDays));
    setMarkers((prev) => prev.map((m) => m.id === md.markerId ? { ...m, day: newDay } : m));
  }, []);

  const handleMarkerMouseUp = useCallback(() => {
    markerDragRef.current = null;
    document.removeEventListener("mousemove", handleMarkerMouseMove);
    document.removeEventListener("mouseup", handleMarkerMouseUp);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, [handleMarkerMouseMove]);

  const startMarkerDrag = useCallback((e: React.MouseEvent, marker: MeetingMarker) => {
    e.preventDefault();
    markerDragRef.current = { markerId: marker.id, startX: e.clientX, originalDay: marker.day };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    document.addEventListener("mousemove", handleMarkerMouseMove);
    document.addEventListener("mouseup", handleMarkerMouseUp);
  }, [handleMarkerMouseMove, handleMarkerMouseUp]);

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
        <button
          onClick={() => navigate("/project")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-rag-red/15 text-rag-red border border-rag-red/25 hover:bg-rag-red/25 transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" />
          Project at risk! If unresolved, synthesis delayed +2 days → partner review at risk
        </button>
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
      </div>

      {/* Gantt Chart */}
      <div className="border border-border rounded-lg overflow-x-auto bg-card relative">
        <div className="min-w-[1200px] relative">
        {/* Meeting marker callouts row */}
        <div className="flex border-b border-border bg-secondary/30">
          <div className="w-[460px] min-w-[460px] shrink-0" />
          <div className="flex-1 relative h-6" ref={markerTimelineRef}>
            {markers.map((marker) => {
              const left = ((marker.day - 1 + 0.5) / TOTAL_DAYS) * 100;
              return (
                <div
                  key={marker.id}
                  className="absolute bottom-0 flex flex-col items-center -translate-x-1/2 cursor-grab active:cursor-grabbing"
                  style={{ left: `${left}%` }}
                  onMouseDown={(e) => startMarkerDrag(e, marker)}
                  title="Drag to move"
                >
                  <span
                    className="text-[8px] font-semibold text-center px-1 py-px rounded select-none leading-tight"
                    style={{ color: `white`, backgroundColor: `hsl(var(${marker.cssVar}))` }}
                  >
                    {marker.label.includes(" ") ? marker.label.split(" ").map((word, i) => <span key={i} className="block">{word}</span>) : marker.label}
                  </span>
                </div>
              );
            })}
            {/* Today marker label */}
            <div
              className="absolute bottom-0 flex flex-col items-center -translate-x-1/2 z-20"
              style={{ left: `${((TODAY_DAY - 1 + 0.5) / TOTAL_DAYS) * 100}%` }}
            >
              <span className="text-[8px] font-bold whitespace-nowrap px-1.5 py-px rounded bg-primary text-primary-foreground">
                Today
              </span>
            </div>
          </div>
        </div>

        {/* Timeline header */}
        <div className="flex border-b border-border bg-secondary/50">
          <div className="w-[460px] min-w-[460px] shrink-0 flex text-[10px] font-medium text-muted-foreground">
            <div className="w-[240px] px-4 py-2">Task</div>
            <div className="w-[60px] px-2 py-2">Due</div>
            <div className="w-[160px] px-2 py-2">Dependency</div>
            
          </div>
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

        {/* Vertical dotted lines for meeting markers + Today line */}
        <div className="absolute top-0 bottom-0 pointer-events-none z-10" style={{ left: '460px', right: 0 }}>
          {markers.map((marker, i) => {
            const left = ((marker.day - 1 + 0.5) / TOTAL_DAYS) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0"
                style={{
                  left: `${left}%`,
                  borderLeft: `1.5px dashed hsl(var(${marker.cssVar}))`,
                  opacity: 0.25,
                }}
              />
            );
          })}
          {/* Today vertical line */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${((TODAY_DAY - 1 + 0.5) / TOTAL_DAYS) * 100}%`,
              borderLeft: `2px solid hsl(var(--primary))`,
              opacity: 0.6,
            }}
          />
        </div>

        {/* Workstream rows */}
        {workstreams.map((ws) => (
          <div key={ws.id}>
            {/* Workstream header row */}
            <div
              className="flex border-b border-border hover:bg-accent/50 transition-colors cursor-pointer group/ws"
              onClick={() => toggleWorkstream(ws.id)}
            >
              <div className="w-[460px] min-w-[460px] shrink-0 px-4 py-2.5 flex items-center gap-2">
                {expanded[ws.id] ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold text-foreground">{ws.name}</span>
                {ws.id === "ws-survey" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rag-critical/20 text-rag-critical">
                    <AlertTriangle className="w-3 h-3" />Critical
                  </span>
                )}
                {ws.id === "ws-market" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rag-red/10 text-rag-red">
                    <AlertTriangle className="w-3 h-3" />High
                  </span>
                )}
                {ws.id === "ws-internal" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rag-amber/10 text-rag-amber">
                    <AlertTriangle className="w-3 h-3" />Medium
                  </span>
                )}
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
                    <GanttBar key={item.id} item={item} onUpdateNotes={(notes) => updateItem(ws.id, item.id, { notes })} />
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
                  <div className="w-[460px] min-w-[460px] shrink-0 flex items-center">
                    {/* Task name column */}
                    <div className="w-[240px] px-4 py-2 pl-7 flex items-center gap-1.5">
                      <GripVertical className="w-3 h-3 text-muted-foreground/30 shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      <StatusPicker
                        currentStatus={item.status}
                        onChangeStatus={(status) => updateItem(ws.id, item.id, { status: status as GanttItem["status"] })}
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
                          className="text-xs text-foreground cursor-text hover:text-primary transition-colors break-words"
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
                    {/* Due date column */}
                    <div className="w-[60px] px-2 py-2">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.dueDate || "—"}</span>
                    </div>
                    {/* Dependency column */}
                    <div className="w-[160px] px-2 py-2">
                      <span className="text-[10px] text-muted-foreground block break-words">{item.dependency || "—"}</span>
                    </div>
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
                        onUpdateNotes={(notes) => updateItem(ws.id, item.id, { notes })}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
        </div>
      </div>

      {/* Today marker note */}
      <p className="text-[10px] text-muted-foreground mt-3">
        Today is Wednesday Week 2 (26 Mar). Drag bars to move or resize. Double-click labels to edit. Click status icons to change progress.
      </p>
    </div>
  );
}
