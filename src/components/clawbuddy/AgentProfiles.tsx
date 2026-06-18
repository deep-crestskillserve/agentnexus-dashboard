import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Search } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useTasks } from "@/hooks/useTasks";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/timeAgo";
import { AGENT_STATUS_DOT } from "@/lib/agentStatus";
import { AgentDetailDrawer } from "./AgentDetailDrawer";
import type { Agent } from "@/types/supabase";

const ACCENTS = ["emerald", "amber", "cyan", "violet", "rose", "blue"] as const;
type Accent = (typeof ACCENTS)[number];

const accentMap: Record<Accent, { ring: string; text: string; bg: string }> = {
  emerald: { ring: "rgba(16,185,129,0.4)", text: "text-emerald-400", bg: "bg-emerald-500/15" },
  amber: { ring: "rgba(245,158,11,0.4)", text: "text-amber-400", bg: "bg-amber-500/15" },
  cyan: { ring: "rgba(6,182,212,0.4)", text: "text-cyan-400", bg: "bg-cyan-500/15" },
  violet: { ring: "rgba(167,139,250,0.4)", text: "text-violet-400", bg: "bg-violet-500/15" },
  rose: { ring: "rgba(244,63,94,0.4)", text: "text-rose-400", bg: "bg-rose-500/15" },
  blue: { ring: "rgba(96,165,250,0.4)", text: "text-blue-400", bg: "bg-blue-500/15" },
};

// Deterministic accent per agent id, so each agent always gets the same color.
function accentFor(id: string): Accent {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

export function AgentProfiles() {
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks } = useTasks();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Agent | null>(null);

  const filtered = useMemo(
    () =>
      agents.filter((a) => {
        const q = search.toLowerCase();
        const matchesSearch =
          a.name.toLowerCase().includes(q) || a.capabilities.some((c) => c.toLowerCase().includes(q));
        const matchesStatus = statusFilter === "all" || a.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [agents, search, statusFilter],
  );

  const statsFor = (agentId: string) => {
    const own = tasks.filter((t) => t.assignee_id === agentId && t.assignee_type === "agent");
    const done = own.filter((t) => t.status === "done").length;
    const open = own.filter((t) => t.status !== "done" && t.status !== "canceled").length;
    return { done, open };
  };

  if (agentsLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents or capabilities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-elevated p-8 text-center">
          <Bot className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {agents.length === 0
              ? "No agents registered yet. POST to /api/openclaw/agent-status to add one."
              : "No agents match your filters."}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a, i) => {
            const accent = accentMap[accentFor(a.id)];
            const { done, open } = statsFor(a.id);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className="glass-card relative overflow-hidden p-6 transition-shadow"
                style={{ boxShadow: `0 0 0 1px transparent` }}
              >
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl"
                  style={{ background: accent.ring }}
                />
                <div className="flex items-start justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${accent.bg}`}>
                    {a.emoji}
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-2.5 py-1">
                    <span
                      className={`h-2 w-2 rounded-full ${AGENT_STATUS_DOT[a.status]} ${a.status === "active" ? "pulse-dot" : ""}`}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {a.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-display text-lg font-semibold text-foreground">{a.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {a.capabilities.length > 0 ? a.capabilities.slice(0, 2).join(" · ") : "No capabilities listed"}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Open Tasks
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold text-foreground tabular-nums">{open}</div>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Tasks Done
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold text-foreground tabular-nums">{done}</div>
                  </div>
                  <div className="col-span-2 rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Last Active
                    </div>
                    <div className={`mt-1 text-sm font-medium ${accent.text}`}>{timeAgo(a.updated_at)}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Capabilities
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.capabilities.length > 0 ? (
                      a.capabilities.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-foreground"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None listed</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(a)}
                  className="mt-5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
                >
                  View details
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <AgentDetailDrawer agent={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}