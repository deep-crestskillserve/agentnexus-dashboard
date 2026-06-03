import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity as ActivityIcon, Bot, CheckCircle2, Zap } from "lucide-react";
import type { Activity, Agent, Task } from "./data";
import { Sparkline } from "./Sparkline";
import { sparkSeries, systemPulse } from "./mockExtras";

function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  delay,
  series,
  color,
}: {
  icon: typeof Bot;
  label: string;
  value: number;
  trend: string;
  delay: number;
  series: { x: number; y: number }[];
  color: string;
}) {
  const v = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
      className="glass-card-elevated glow-hover shimmer group relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 glow-emerald">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/80">{trend}</span>
      </div>
      <div className="mt-4 font-mono text-3xl font-semibold text-foreground tabular-nums">{v}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="-mx-2 -mb-2 mt-3 opacity-80">
        <Sparkline data={series} color={color} height={36} />
      </div>
    </motion.div>
  );
}

const statusDot: Record<Agent["status"], string> = {
  active: "bg-emerald-400",
  idle: "bg-amber-400",
  error: "bg-red-400",
  offline: "bg-gray-500",
};

export function CommandDeck({
  agents,
  tasks,
  activity,
}: {
  agents: Agent[];
  tasks: Task[];
  activity: Activity[];
}) {
  const active = agents.filter((a) => a.status === "active").length;
  const open = tasks.filter((t) => t.status !== "done").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const agentById = (id: string) => agents.find((a) => a.id === id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Bot} label="Active Agents" value={active} trend="+1 today" delay={0} series={sparkSeries(2)} color="#10b981" />
        <MetricCard icon={ActivityIcon} label="Open Tasks" value={open} trend="-2 vs yesterday" delay={0.05} series={sparkSeries(5)} color="#06b6d4" />
        <MetricCard icon={CheckCircle2} label="Completed Today" value={done} trend="+3 today" delay={0.1} series={sparkSeries(9)} color="#a78bfa" />
        <MetricCard icon={Zap} label="Throughput / hr" value={47} trend="+12%" delay={0.15} series={sparkSeries(13)} color="#fbbf24" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card-elevated p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">System pulse</h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            real-time
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {systemPulse.map((p) => (
            <div key={p.key} className="rounded-lg border border-white/5 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {p.label}
                </span>
                <span className="font-mono text-sm font-semibold" style={{ color: p.color }}>
                  {p.value}
                </span>
              </div>
              <div className="mt-2">
                <Sparkline data={p.series} color={p.color} height={32} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="glass-card lg:col-span-3 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Recent activity</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">live feed</span>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-2">
            {activity.map((a, i) => {
              const agent = agentById(a.agentId);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/20 p-3 transition-colors hover:bg-black/30"
                >
                  <span className="text-xl leading-none">{agent?.emoji ?? "🤖"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground">
                      <span className="font-medium">{agent?.name ?? "Agent"}</span>{" "}
                      <span className="text-muted-foreground">{a.text}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {a.time}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="glass-card lg:col-span-2 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Agent status</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{agents.length} agents</span>
          </div>
          <div className="space-y-2">
            {agents.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 p-3"
              >
                <span className="text-xl">{a.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span
                      className={`h-2 w-2 rounded-full ${statusDot[a.status]} ${a.status === "active" ? "pulse-dot" : ""}`}
                    />
                    {a.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{a.activity}</div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {a.lastSeen}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}