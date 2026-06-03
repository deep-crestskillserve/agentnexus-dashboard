import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import type { Agent } from "./data";

export function Header({ activeAgent }: { activeAgent: Agent }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card relative flex flex-wrap items-center justify-between gap-4 px-6 py-4"
      style={{ borderLeft: "2px solid rgba(16,185,129,0.6)", boxShadow: "0 0 32px -8px rgba(16,185,129,0.2)" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(16,185,129,0.15)] text-2xl">
          🐾
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            Claw<span className="text-gradient-emerald">Buddy</span>
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            AI Agent Command Center
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-foreground">
              {activeAgent.name}: <span className="text-emerald-400">Online</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {activeAgent.activity} · {activeAgent.lastSeen}
            </span>
          </div>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-black/20 text-muted-foreground transition-colors hover:bg-black/40 hover:text-foreground"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </motion.header>
  );
}