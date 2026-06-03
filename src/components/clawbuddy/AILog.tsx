import { motion } from "framer-motion";
import { useState } from "react";
import type { Agent, LogCategory, LogEntry } from "./data";

const categoryColors: Record<LogCategory, string> = {
  observation: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  general: "bg-white/5 text-muted-foreground border-white/10",
  reminder: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  fyi: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};

const categories: (LogCategory | "all")[] = ["all", "observation", "general", "reminder", "fyi"];

export function AILog({ logs, agents }: { logs: LogEntry[]; agents: Agent[] }) {
  const [filter, setFilter] = useState<LogCategory | "all">("all");
  const agentById = (id: string) => agents.find((a) => a.id === id);
  const filtered = filter === "all" ? logs : logs.filter((l) => l.category === filter);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">AI Log</h2>
          <p className="text-xs text-muted-foreground">Chronological feed from all agents</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
                filter === c
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((l, i) => {
          const agent = agentById(l.agentId);
          return (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/20 p-3"
            >
              <span className="text-xl">{agent?.emoji ?? "🤖"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{agent?.name}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${categoryColors[l.category]}`}>
                    {l.category}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l.time}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{l.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}