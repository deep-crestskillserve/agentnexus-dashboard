import { motion } from "framer-motion";
import { useState } from "react";
import { useLogs } from "@/hooks/useLogs";
import { useAgents } from "@/hooks/useAgents";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/timeAgo";
import type { LogLevel } from "@/types/supabase";

const levelColors: Record<LogLevel, string> = {
  debug: "bg-white/5 text-muted-foreground border-white/10",
  info: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  error: "bg-red-500/15 text-red-300 border-red-500/30",
};

const filters: (LogLevel | "all")[] = ["all", "debug", "info", "warn", "error"];

export function AILog() {
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const { agents } = useAgents();
  const { logs, loading } = useLogs({
    level: filter !== "all" ? filter : undefined,
    limit: 100,
  });

  const agentById = (id: string | null) => (id ? agents.find((a) => a.id === id) : undefined);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">AI Log</h2>
          <p className="text-xs text-muted-foreground">Chronological feed from all agents</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((c) => (
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
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No logs yet — agent activity will appear here as it happens.
          </p>
        ) : (
          logs.map((l, i) => {
            const agent = agentById(l.agent_id);
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
                    <span className="text-sm font-medium text-foreground">
                      {agent?.name ?? "Unknown agent"}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${levelColors[l.level]}`}
                    >
                      {l.level}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {timeAgo(l.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.message}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}