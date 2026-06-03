import { motion } from "framer-motion";
import { useState } from "react";
import type { Agent, Priority, Task, TaskStatus } from "./data";

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "doing", title: "Doing" },
  { id: "needs_input", title: "Needs Input" },
  { id: "done", title: "Done" },
];

const priorityDot: Record<Priority, string> = {
  low: "bg-gray-400",
  medium: "bg-cyan-400",
  high: "bg-amber-400",
  urgent: "bg-red-400",
};

export function TaskBoard({
  tasks,
  agents,
  onMove,
}: {
  tasks: Task[];
  agents: Agent[];
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const agentById = (id: string) => agents.find((a) => a.id === id);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.id);
            }}
            onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
            onDrop={() => {
              if (dragId) onMove(dragId, col.id);
              setDragId(null);
              setOver(null);
            }}
            className={`glass-card flex min-h-[400px] flex-col p-4 transition-shadow ${over === col.id ? "shadow-[0_0_0_1px_rgba(16,185,129,0.45)]" : ""}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </h3>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => {
                const agent = agentById(t.agentId);
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    className="cursor-grab rounded-lg border border-white/10 bg-black/30 p-3 active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{t.title}</p>
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDot[t.priority]}`} title={t.priority} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg" title={agent?.name}>{agent?.emoji ?? "🤖"}</span>
                      {t.status === "doing" && (
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full bg-emerald-400" style={{ width: `${t.progress}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{t.progress}%</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {colTasks.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/5 p-6 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}