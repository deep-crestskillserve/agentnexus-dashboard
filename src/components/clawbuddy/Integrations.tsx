import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Plug } from "lucide-react";
import { initialIntegrations, type Integration } from "./mockExtras";

export function Integrations() {
  const [items, setItems] = useState<Integration[]>(initialIntegrations);
  const connected = items.filter((i) => i.connected).length;

  const toggle = (id: string) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)));

  return (
    <div className="space-y-6">
      <div className="glass-card-elevated flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect ClawBuddy to your stack. Agents act across every tool you ship with.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <Plug className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-mono text-xs text-emerald-300">
            {connected} / {items.length} connected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((i, idx) => (
          <motion.div
            key={i.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            className="glass-card-elevated glow-hover shimmer flex flex-col gap-4 p-5"
          >
            <div className="flex items-start justify-between">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ background: "var(--surface-3)" }}
              >
                {i.emoji}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {i.category}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-semibold">{i.name}</h3>
                {i.connected && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
                    <Check className="h-2.5 w-2.5" /> Live
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
            </div>
            <button
              onClick={() => toggle(i.id)}
              className={`mt-auto w-full rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                i.connected
                  ? "border-white/10 bg-white/5 text-foreground hover:bg-white/10"
                  : "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 hover:shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)]"
              }`}
            >
              {i.connected ? "Disconnect" : "Connect"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}