import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Inbox, Plus, Search, Trash2, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { useAgents } from "@/hooks/useAgents";
import { useUsers } from "@/hooks/useUsers";
import type { Agent, User as SupabaseUser } from "@/types/supabase";

// ───────────────── Types ─────────────────
type ColumnId = "todo" | "doing" | "needs_input" | "done" | "canceled";
type Priority = "urgent" | "high" | "medium" | "low";

interface BoardColumn {
  id: ColumnId;
  name: string;
  color: string;
  position: number;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

// A unified assignee — could be an Agent or a human User
interface Assignee {
  id: string;           // UUID from agents or users table
  display_name: string;
  kind: "agent" | "user";
}

interface BoardTask {
  id: string;
  title: string;
  description: string;
  board_column_id: ColumnId;
  priority: Priority;
  due_date: string | null;
  position: number;
  created_at: string;
  subtasks: Subtask[];   // stored as JSONB in a real schema; here kept client-side
  assignee: Assignee | null;  // single assignee (tasks.assignee_id FK)
}

// ───────────────── Constants ─────────────────
const COLUMNS: BoardColumn[] = [
  { id: "todo",        name: "To Do",       color: "#ef4444", position: 0 },
  { id: "doing",       name: "Doing",       color: "#f59e0b", position: 1 },
  { id: "needs_input", name: "Needs Input", color: "#a855f7", position: 2 },
  { id: "done",        name: "Done",        color: "#10b981", position: 3 },
  { id: "canceled",    name: "Canceled",    color: "#6b7280", position: 4 },
];

const PRIORITY_STYLES: Record<Priority, { label: string; cls: string; bar: string }> = {
  urgent: { label: "Urgent", cls: "bg-red-500/15 text-red-300 border border-red-500/30",      bar: "bg-red-500" },
  high:   { label: "High",   cls: "bg-orange-500/15 text-orange-300 border border-orange-500/30", bar: "bg-orange-500" },
  medium: { label: "Medium", cls: "bg-blue-500/15 text-blue-300 border border-blue-500/30",   bar: "bg-blue-500" },
  low:    { label: "Low",    cls: "bg-gray-500/15 text-gray-300 border border-gray-500/30",   bar: "bg-gray-500" },
};

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-cyan-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-blue-500", "bg-fuchsia-500", "bg-teal-500",
];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .replace(/\p{Emoji}/gu, "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0)  return { label: "Today",            overdue: false };
  if (diff === 1)  return { label: "Tomorrow",         overdue: false };
  if (diff === -1) return { label: "Yesterday",        overdue: true  };
  if (diff < 0)   return { label: `${-diff}d overdue`, overdue: true  };
  if (diff < 7)   return { label: `in ${diff}d`,       overdue: false };
  return { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), overdue: false };
}

// ───────────────── Helpers to build unified assignee lists ─────────────────
function agentToAssignee(a: Agent): Assignee {
  return { id: a.id, display_name: `🤖 ${a.name}`, kind: "agent" };
}

function userToAssignee(u: SupabaseUser): Assignee {
  return { id: u.id, display_name: `👤 ${u.display_name ?? u.name}`, kind: "user" };
}

// Map a Supabase task row to our BoardTask shape
function rowToTask(
  row: Record<string, unknown>,
  agents: Agent[],
  users: SupabaseUser[],
): BoardTask {
  const assigneeId = row.assignee_id as string | null;
  const assigneeType = row.assignee_type as "agent" | "user" | null;
  let assignee: Assignee | null = null;
  if (assigneeId) {
    if (assigneeType === "agent") {
      const agent = agents.find((a) => a.id === assigneeId);
      if (agent) assignee = agentToAssignee(agent);
    } else if (assigneeType === "user") {
      const user = users.find((u) => u.id === assigneeId);
      if (user) assignee = userToAssignee(user);
    } else {
      // Older rows without assignee_type — fall back to id matching
      const agent = agents.find((a) => a.id === assigneeId);
      const user  = users.find((u) => u.id === assigneeId);
      if (agent) assignee = agentToAssignee(agent);
      else if (user) assignee = userToAssignee(user);
    }
  }

  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    board_column_id: ((row.status as string) ?? "todo") as ColumnId,
    priority: ((row.priority as string) ?? "medium") as Priority,
    due_date: (row.due_date as string) ?? null,
    position: (row.position as number) ?? 0,
    created_at: row.created_at as string,
    subtasks: Array.isArray(row.subtasks) ? (row.subtasks as Subtask[]) : [],
    assignee,
  };
}

// ───────────────── Main Component ─────────────────
export function TaskBoard() {
  const { agents, loading: agentsLoading } = useAgents();
  const { users,  loading: usersLoading  } = useUsers();

  const [tasks,         setTasks]         = useState<BoardTask[]>([]);
  const [tasksLoading,  setTasksLoading]  = useState(true);
  const [query,         setQuery]         = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [openTaskId,    setOpenTaskId]    = useState<string | null>(null);
  const [newOpen,       setNewOpen]       = useState(false);
  const [addError,      setAddError]      = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragId,        setDragId]        = useState<string | null>(null);
  const [overCol,       setOverCol]       = useState<ColumnId | null>(null);
  const [mobileCol,     setMobileCol]     = useState<ColumnId>("todo");

  const loading = agentsLoading || usersLoading || tasksLoading;

  // ── Fetch tasks from Supabase once agents+users are loaded ──
  useMemo(() => {
    if (agentsLoading || usersLoading) return;
    supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setTasks(data.map((row) => rowToTask(row, agents, users)));
        }
        setTasksLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentsLoading, usersLoading]);

  // ── Unified assignee list (agents + users) ──
  const availableAssignees: Assignee[] = useMemo(() => [
    ...agents.map(agentToAssignee),
    ...users.map(userToAssignee),
  ], [agents, users]);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q))
        return false;
    }
    return true;
  }), [tasks, query, priorityFilter]);

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null;

  // ── Local + Supabase update helpers ──
  const updateTaskLocally = (id: string, patch: Partial<BoardTask>) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const persistTask = async (id: string, patch: Partial<BoardTask>) => {
    updateTaskLocally(id, patch);

    // Map BoardTask fields → DB column names
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined)           dbPatch.title       = patch.title;
    if (patch.description !== undefined)     dbPatch.description = patch.description;
    if (patch.board_column_id !== undefined) dbPatch.status      = patch.board_column_id;
    if (patch.priority !== undefined)        dbPatch.priority    = patch.priority;
    if (patch.due_date !== undefined)        dbPatch.due_date    = patch.due_date;
    if (patch.subtasks !== undefined)        dbPatch.subtasks    = patch.subtasks;
    if ("assignee" in patch) {
      dbPatch.assignee_id   = patch.assignee?.id ?? null;
      dbPatch.assignee_type = patch.assignee?.kind ?? null;
    }

    if (Object.keys(dbPatch).length > 0) {
      const { error } = await supabase.from("tasks").update(dbPatch).eq("id", id);
      if (error) console.error("Failed to save task changes:", error.message);
    }
  };

  const moveTask = async (id: string, colId: ColumnId) => {
    updateTaskLocally(id, { board_column_id: colId });
    const { error } = await supabase.from("tasks").update({ status: colId }).eq("id", id);
    if (error) console.error("Failed to move task:", error.message);
  };

  const deleteTask = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
    setConfirmDelete(null);
    setOpenTaskId(null);
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) console.error("Failed to delete task:", error.message);
  };

  const addTask = async (draft: {
    title: string;
    description: string;
    priority: Priority;
    board_column_id: ColumnId;
    due_date: string | null;
    assignee: Assignee | null;
    subtasks: Subtask[];
  }) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title:         draft.title,
        description:   draft.description,
        status:        draft.board_column_id,
        priority:      draft.priority,
        due_date:      draft.due_date,
        assignee_id:   draft.assignee?.id ?? null,
        assignee_type: draft.assignee?.kind ?? null,
        subtasks:      draft.subtasks,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create task:", error.message);
      setAddError(error.message);
      return;
    }

    setTasks((p) => [rowToTask(data, agents, users), ...p]);
    setAddError(null);
    setNewOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Board</h2>
          <p className="text-xs text-muted-foreground">
            {tasks.length} tasks across {COLUMNS.length} columns
          </p>
        </div>
        <Button
          onClick={() => setNewOpen(true)}
          className="bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)]"
        >
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-wrap items-center gap-2 p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="h-9 pl-8 bg-black/30 border-white/10"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "urgent", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                priorityFilter === p
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile column switcher */}
      <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
        {COLUMNS.map((c) => (
          <button
            key={c.id}
            onClick={() => setMobileCol(c.id)}
            className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${
              mobileCol === c.id
                ? "border-white/20 bg-white/5 text-foreground"
                : "border-white/5 text-muted-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const colTasks = filtered
            .filter((t) => t.board_column_id === col.id)
            .sort((a, b) => a.position - b.position);
          const visible = mobileCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
              onDragLeave={() => setOverCol((o) => (o === col.id ? null : o))}
              onDrop={() => { if (dragId) moveTask(dragId, col.id); setDragId(null); setOverCol(null); }}
              className={`glass-card flex min-h-[400px] flex-col p-3 transition-all md:max-h-[calc(100vh-260px)] ${
                overCol === col.id ? "ring-1 ring-emerald-500/50 shadow-[0_0_30px_-8px_rgba(16,185,129,0.5)]" : ""
              } ${visible ? "" : "hidden md:flex"}`}
              style={{ borderLeft: `3px solid ${col.color}` }}
            >
              <div
                className="-mx-3 -mt-3 mb-3 h-1 rounded-t-[12px]"
                style={{ background: `linear-gradient(90deg, ${col.color}, transparent)` }}
              />
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                    {col.name}
                  </h3>
                </div>
                <Badge variant="secondary" className="h-5 bg-white/5 px-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {colTasks.length}
                </Badge>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                <AnimatePresence>
                  {colTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onOpen={() => setOpenTaskId(t.id)}
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                    />
                  ))}
                </AnimatePresence>
                {colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 p-8 text-center">
                    <Inbox className="h-5 w-5 text-muted-foreground/60" />
                    <p className="text-xs text-muted-foreground">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail dialog */}
      <TaskDetailDialog
        task={openTask}
        availableAssignees={availableAssignees}
        onClose={() => setOpenTaskId(null)}
        onUpdate={(patch) => openTask && persistTask(openTask.id, patch)}
        onDelete={() => openTask && setConfirmDelete(openTask.id)}
      />

      {/* New task dialog */}
      <NewTaskDialog
        open={newOpen}
        onOpenChange={(o) => { setNewOpen(o); if (o) setAddError(null); }}
        availableAssignees={availableAssignees}
        onCreate={addTask}
        error={addError}
      />

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="glass-card-elevated border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>This can't be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteTask(confirmDelete)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ───────────────── Card ─────────────────
function TaskCard({
  task,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  task: BoardTask;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const pri = PRIORITY_STYLES[task.priority];
  const done  = task.subtasks.filter((s) => s.completed).length;
  const total = task.subtasks.length;
  const due   = task.due_date ? relativeDate(task.due_date) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-white/[0.06] bg-[rgba(17,24,39,0.7)] p-3 backdrop-blur-md transition-all hover:border-white/[0.12] hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(16,185,129,0.15)]"
    >
      <span className={`absolute left-0 top-0 h-full w-[3px] ${pri.bar}`} />
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-semibold text-foreground">{task.title}</h4>
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${pri.cls}`}>
          {pri.label}
        </span>
      </div>
      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}
      {total > 0 && (
        <div className="mt-2.5">
          <span className="text-[10px] text-muted-foreground tabular-nums">{done}/{total} subtasks</span>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-emerald-500" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        {/* Assignee avatar */}
        {task.assignee ? (
          <div
            title={task.assignee.display_name}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-[#0a0a0f] ${colorFor(task.assignee.display_name)}`}
          >
            {initials(task.assignee.display_name)}
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 ring-2 ring-[#0a0a0f]">
            <User className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
        {due && (
          <span className={`flex items-center gap-1 text-[10px] tabular-nums ${due.overdue ? "text-red-400" : "text-muted-foreground"}`}>
            <CalendarDays className="h-3 w-3" />
            {due.label}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ───────────────── Detail dialog ─────────────────
function TaskDetailDialog({
  task,
  availableAssignees,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: BoardTask | null;
  availableAssignees: Assignee[];
  onClose: () => void;
  onUpdate: (patch: Partial<BoardTask>) => void;
  onDelete: () => void;
}) {
  const [newSubtask, setNewSubtask] = useState("");

  if (!task) return null;

  const toggleSub = (id: string) =>
    onUpdate({ subtasks: task.subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)) });
  const deleteSub = (id: string) =>
    onUpdate({ subtasks: task.subtasks.filter((s) => s.id !== id) });
  const addSub = () => {
    if (!newSubtask.trim()) return;
    onUpdate({ subtasks: [...task.subtasks, { id: `s${Date.now()}`, title: newSubtask.trim(), completed: false }] });
    setNewSubtask("");
  };

  const currentAssigneeId = task.assignee?.id ?? "__none__";

  const handleAssigneeChange = (value: string) => {
    if (value === "__none__") {
      onUpdate({ assignee: null });
    } else {
      const found = availableAssignees.find((a) => a.id === value);
      if (found) onUpdate({ assignee: found });
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-card-elevated max-h-[90vh] overflow-y-auto border-white/10 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{task.title || "Edit task"}</DialogTitle>
          <Input
            value={task.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="border-none bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
          />
          <DialogDescription>Edit task details, subtasks, and assignee.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Meta row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Priority</label>
              <Select value={task.priority} onValueChange={(v: Priority) => onUpdate({ priority: v })}>
                <SelectTrigger className="h-9 bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["urgent", "high", "medium", "low"] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Column</label>
              <Select value={task.board_column_id} onValueChange={(v: ColumnId) => onUpdate({ board_column_id: v })}>
                <SelectTrigger className="h-9 bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Due date</label>
              <Input
                type="date"
                value={task.due_date ?? ""}
                onChange={(e) => onUpdate({ due_date: e.target.value || null })}
                className="h-9 bg-black/30 border-white/10"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Assignee</label>
              <Select value={currentAssigneeId} onValueChange={handleAssigneeChange}>
                <SelectTrigger className="h-9 bg-black/30 border-white/10">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Unassigned —</SelectItem>
                  {availableAssignees.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Agents</div>
                      {availableAssignees.filter((a) => a.kind === "agent").map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                      ))}
                      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Users</div>
                      {availableAssignees.filter((a) => a.kind === "user").map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Description</label>
            <Textarea
              value={task.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={4}
              className="bg-black/30 border-white/10"
            />
          </div>

          {/* Subtasks */}
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-wider text-muted-foreground">
              Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
            </label>
            <div className="space-y-1.5">
              {task.subtasks.map((s) => (
                <div key={s.id} className="group flex items-center gap-2 rounded-md border border-white/5 bg-black/20 px-2 py-1.5">
                  <Checkbox checked={s.completed} onCheckedChange={() => toggleSub(s.id)} />
                  <span className={`flex-1 text-sm ${s.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {s.title}
                  </span>
                  <button onClick={() => deleteSub(s.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSub())}
                placeholder="Add subtask…"
                className="h-8 bg-black/30 border-white/10"
              />
              <Button size="sm" variant="secondary" onClick={addSub}>Add</Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-white/5 pt-4">
          <Button variant="destructive" onClick={onDelete} className="mr-auto">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="bg-emerald-500 text-black hover:bg-emerald-400"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────── New task dialog ─────────────────
function NewTaskDialog({
  open,
  onOpenChange,
  availableAssignees,
  onCreate,
  error,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  availableAssignees: Assignee[];
  onCreate: (t: {
    title: string;
    description: string;
    priority: Priority;
    board_column_id: ColumnId;
    due_date: string | null;
    assignee: Assignee | null;
    subtasks: Subtask[];
  }) => void;
  error?: string | null;
}) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [priority,    setPriority]    = useState<Priority>("medium");
  const [column,      setColumn]      = useState<ColumnId>("todo");
  const [dueDate,     setDueDate]     = useState("");
  const [assigneeId,  setAssigneeId]  = useState<string>("__none__");
  const [subtasks,    setSubtasks]    = useState<Subtask[]>([]);
  const [newSubtask,  setNewSubtask]  = useState("");

  const reset = () => {
    setTitle(""); setDescription(""); setPriority("medium");
    setColumn("todo"); setDueDate(""); setAssigneeId("__none__");
    setSubtasks([]); setNewSubtask("");
  };

  // Fresh form every time the dialog opens. Doesn't re-fire while it
  // stays open after a failed submit, so input + error message persist.
  useEffect(() => {
    if (open) reset();
  }, [open]);

  const addSub = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((p) => [...p, { id: `s${Date.now()}`, title: newSubtask.trim(), completed: false }]);
    setNewSubtask("");
  };
  const toggleSub = (id: string) =>
    setSubtasks((p) => p.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  const deleteSub = (id: string) =>
    setSubtasks((p) => p.filter((s) => s.id !== id));

  const submit = () => {
    if (!title.trim()) return;
    const assignee = assigneeId === "__none__"
      ? null
      : (availableAssignees.find((a) => a.id === assigneeId) ?? null);
    onCreate({ title: title.trim(), description: description.trim(), priority, board_column_id: column, due_date: dueDate || null, assignee, subtasks });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card-elevated border-white/10 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>Add a card to the board.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="bg-black/30 border-white/10"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="bg-black/30 border-white/10"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={priority} onValueChange={(v: Priority) => setPriority(v)}>
              <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["urgent", "high", "medium", "low"] as Priority[]).map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={column} onValueChange={(v: ColumnId) => setColumn(v)}>
              <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLUMNS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-black/30 border-white/10"
            />
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="bg-black/30 border-white/10">
                <SelectValue placeholder="Assignee…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Unassigned —</SelectItem>
                {availableAssignees.filter((a) => a.kind === "agent").length > 0 && (
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Agents</div>
                )}
                {availableAssignees.filter((a) => a.kind === "agent").map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                ))}
                {availableAssignees.filter((a) => a.kind === "user").length > 0 && (
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Users</div>
                )}
                {availableAssignees.filter((a) => a.kind === "user").map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-wider text-muted-foreground">
            Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
          </label>
          <div className="space-y-1.5">
            {subtasks.map((s) => (
              <div key={s.id} className="group flex items-center gap-2 rounded-md border border-white/5 bg-black/20 px-2 py-1.5">
                <Checkbox checked={s.completed} onCheckedChange={() => toggleSub(s.id)} />
                <span className={`flex-1 text-sm ${s.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {s.title}
                </span>
                <button onClick={() => deleteSub(s.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSub())}
              placeholder="Add subtask…"
              className="h-8 bg-black/30 border-white/10"
            />
            <Button size="sm" variant="secondary" onClick={addSub}>Add</Button>
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            Couldn't create task: {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!title.trim()}
            onClick={submit}
            className="bg-emerald-500 text-black hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" /> Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}