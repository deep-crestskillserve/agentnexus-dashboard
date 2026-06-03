import { motion } from "framer-motion";
import { Download, Sparkles } from "lucide-react";
import { initialInvoices } from "./mockExtras";

const usage = [
  { label: "Agent runtime hours", used: 412, limit: 600 },
  { label: "Council sessions", used: 38, limit: 100 },
  { label: "Meeting summaries", used: 247, limit: 500 },
  { label: "Storage", used: 18, limit: 50, unit: "GB" },
];

export function Billing() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated gradient-border relative overflow-hidden p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
              <Sparkles className="h-3 w-3" /> Current plan
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
              <span className="text-gradient-aurora">Pro</span> · $499<span className="text-base text-muted-foreground">/mo</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Renews on June 1, 2026. Billed annually.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10">
              Change plan
            </button>
            <button
              className="rounded-lg px-4 py-2 text-sm font-semibold text-background shadow-[0_0_32px_-6px_rgba(16,185,129,0.6)] transition-all hover:shadow-[0_0_48px_-4px_rgba(16,185,129,0.8)]"
              style={{ background: "var(--gradient-emerald)" }}
            >
              Upgrade to Enterprise
            </button>
          </div>
        </div>
      </motion.div>

      <div className="glass-card-elevated p-6">
        <h3 className="font-display text-base font-semibold">Usage this month</h3>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {usage.map((u) => {
            const pct = Math.min(100, (u.used / u.limit) * 100);
            return (
              <div key={u.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-foreground">{u.label}</span>
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {u.used}
                    {u.unit ? ` ${u.unit}` : ""} / {u.limit}
                    {u.unit ? ` ${u.unit}` : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-emerald)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card-elevated overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <h3 className="font-display text-base font-semibold">Invoices</h3>
          <button className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
            <Download className="h-3 w-3" /> Export all
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {initialInvoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02]">
              <div className="flex-1">
                <div className="font-mono text-xs text-foreground">{inv.id}</div>
                <div className="text-xs text-muted-foreground">{inv.date}</div>
              </div>
              <div className="font-mono text-sm tabular-nums">{inv.amount}</div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                {inv.status}
              </span>
              <button className="text-muted-foreground hover:text-foreground">
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}