import { motion } from "framer-motion";
import type { Agent } from "./data";

const accentMap = {
  emerald: { ring: "rgba(16,185,129,0.4)", text: "text-emerald-400", bg: "bg-emerald-500/15" },
  amber: { ring: "rgba(245,158,11,0.4)", text: "text-amber-400", bg: "bg-amber-500/15" },
  cyan: { ring: "rgba(6,182,212,0.4)", text: "text-cyan-400", bg: "bg-cyan-500/15" },
};

const statusDot: Record<Agent["status"], string> = {
  active: "bg-emerald-400",
  idle: "bg-amber-400",
  error: "bg-red-400",
  offline: "bg-gray-500",
};

export function AgentProfiles({ agents }: { agents: Agent[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((a, i) => {
        const accent = accentMap[a.accent];
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
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
                <span className={`h-2 w-2 rounded-full ${statusDot[a.status]} ${a.status === "active" ? "pulse-dot" : ""}`} />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{a.status}</span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-display text-lg font-semibold text-foreground">{a.name}</h3>
              <p className="text-sm text-muted-foreground">{a.subtitle}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Type</div>
                <div className={`mt-1 text-sm font-medium ${accent.text}`}>{a.type}</div>
              </div>
              <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Role</div>
                <div className="mt-1 text-sm font-medium text-foreground">{a.role}</div>
              </div>
              <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Tasks</div>
                <div className="mt-1 font-mono text-lg font-semibold text-foreground tabular-nums">{a.tasksCompleted}</div>
              </div>
              <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Accuracy</div>
                <div className="mt-1 font-mono text-lg font-semibold text-foreground tabular-nums">{a.accuracy}%</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Skills</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {a.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <button className="mt-5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10">
              View details
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}