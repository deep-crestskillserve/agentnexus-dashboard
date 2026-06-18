import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity as ActivityIcon, Bot, CheckCircle2, Radio, Zap } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useTasks } from "@/hooks/useTasks";
import { useLogs } from "@/hooks/useLogs";
import { useEvents } from "@/hooks/useEvents";
import { AGENT_STATUS_DOT } from "@/lib/agentStatus";
import { timeAgo } from "@/lib/timeAgo";
import { Skeleton } from "@/components/ui/skeleton";
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
  loading,
}: {
  icon: typeof Bot;
  label: string;
  value: number;
  trend: string;
  delay: number;
  series: { x: number; y: number }[];
  color: string;
  loading?: boolean;
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
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/80">
          {trend}
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-8 w-16" />
      ) : (
        <div className="mt-4 font-mono text-3xl font-semibold text-foreground tabular-nums">
          {v}
        </div>
      )}
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="-mx-2 -mb-2 mt-3 opacity-80">
        <Sparkline data={series} color={color} height={36} />
      </div>
    </motion.div>
  );
}

// ── Feed item: agent_logs and events normalized into one shape ──────────────

interface FeedItem {
  id: string;
  agentId: string | null;
  text: string;
  createdAt: string;
}

function humanizeEventType(type: string): string {
  return type.replace(/_/g, " ");
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function CommandDeck() {
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();
  const { logs, loading: logsLoading } = useLogs({ limit: 50 });
  const { events, loading: eventsLoading } = useEvents(50);

  const loading = agentsLoading || tasksLoading;
  const feedLoading = logsLoading || eventsLoading;

  const agentById = (id: string | null) => (id ? agents.find((a) => a.id === id) : undefined);

  // ── Headline metrics ────────────────────────────────────────────────────
  const active = agents.filter((a) => a.status === "active").length;
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "canceled").length;
  const doneAll = tasks.filter((t) => t.status === "done").length;
  const doneToday = tasks.filter((t) => t.status === "done" && isToday(t.updated_at)).length;

  // ── Combined activity feed (agent_logs + events) ────────────────────────
  const logFeed: FeedItem[] = logs.map((l) => ({
    id: `log-${l.id}`,
    agentId: l.agent_id,
    text: l.message,
    createdAt: l.created_at,
  }));
  const eventFeed: FeedItem[] = events.map((e) => {
    const payloadAgentId =
      e.payload && typeof e.payload.agent_id === "string" ? (e.payload.agent_id as string) : null;
    return {
      id: `event-${e.id}`,
      agentId: payloadAgentId,
      text: e.source ? `${humanizeEventType(e.type)} · ${e.source}` : humanizeEventType(e.type),
      createdAt: e.created_at,
    };
  });
  const combinedFeed = [...logFeed, ...eventFeed].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const feed = combinedFeed.slice(0, 20);

  // Throughput / hr: combined log + event volume in the trailing hour, vs. the hour before that
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const ageMs = (iso: string) => now - new Date(iso).getTime();
  const lastHr = combinedFeed.filter((i) => ageMs(i.createdAt) < hourMs).length;
  const prevHr = combinedFeed.filter(
    (i) => ageMs(i.createdAt) >= hourMs && ageMs(i.createdAt) < 2 * hourMs,
  ).length;
  const throughputTrend =
    prevHr === 0
      ? "trailing 60 min"
      : `${lastHr >= prevHr ? "+" : ""}${Math.round(((lastHr - prevHr) / prevHr) * 100)}% vs prior hr`;

  // Most recent log per agent, used as the "current activity" line in the agent list
  const latestLogFor = (agentId: string) => logs.find((l) => l.agent_id === agentId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Bot}
          label="Active Agents"
          value={active}
          trend={`${agents.length} total`}
          delay={0}
          series={sparkSeries(2)}
          color="#10b981"
          loading={loading}
        />
        <MetricCard
          icon={ActivityIcon}
          label="Open Tasks"
          value={open}
          trend={`${doneAll} done`}
          delay={0.05}
          series={sparkSeries(5)}
          color="#06b6d4"
          loading={loading}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completed Today"
          value={doneToday}
          trend={`${doneAll} all-time`}
          delay={0.1}
          series={sparkSeries(9)}
          color="#a78bfa"
          loading={loading}
        />
        <MetricCard
          icon={Zap}
          label="Throughput / hr"
          value={lastHr}
          trend={throughputTrend}
          delay={0.15}
          series={sparkSeries(13)}
          color="#fbbf24"
          loading={feedLoading}
        />
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
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              live feed
            </span>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-2">
            {feedLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : feed.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No activity yet — agent logs and events will stream in here as they happen.
              </p>
            ) : (
              feed.map((item, i) => {
                const agent = agentById(item.agentId);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/20 p-3 transition-colors hover:bg-black/30"
                  >
                    <span className="text-xl leading-none">
                      {agent?.emoji ?? <Radio className="h-5 w-5 text-purple-400" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-foreground">
                        <span className="font-medium">{agent?.name ?? "System"}</span>{" "}
                        <span className="text-muted-foreground">{item.text}</span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
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
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {agents.length} agents
            </span>
          </div>
          <div className="space-y-2">
            {agentsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : agents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No agents registered yet — register one via the OpenClaw API.
              </p>
            ) : (
              agents.map((a) => {
                const latest = latestLogFor(a.id);
                const activityText =
                  latest?.message ??
                  (a.capabilities.length > 0
                    ? a.capabilities.slice(0, 3).join(", ")
                    : "No recent activity");
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 p-3"
                  >
                    <span className="text-xl">{a.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span
                          className={`h-2 w-2 rounded-full ${AGENT_STATUS_DOT[a.status]} ${a.status === "active" ? "pulse-dot" : ""}`}
                        />
                        {a.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{activityText}</div>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {timeAgo(a.updated_at)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}