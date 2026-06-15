import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  CheckCircle2,
  Coins,
  AlertTriangle,
  Zap,
  Database,
  Radio,
} from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useTasks } from "@/hooks/useTasks";
import { useWorkflowRuns } from "@/hooks/useWorkflowRuns";
import { useLogs } from "@/hooks/useLogs";
import { useMetrics } from "@/hooks/useMetrics";
import { useEvents } from "@/hooks/useEvents";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
  loading = false,
}: {
  icon: typeof Bot;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay?: number;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card-elevated glow-hover p-5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        {sub && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {sub}
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-8 w-20" />
      ) : (
        <div className="mt-4 font-mono text-3xl font-semibold tabular-nums text-foreground">
          {value}
        </div>
      )}
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </motion.div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  offline: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ── Live Dashboard ────────────────────────────────────────────────────────────

export function LiveDashboard() {
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();
  const { runs, loading: runsLoading } = useWorkflowRuns();
  const { logs } = useLogs({ limit: 8 });
  const { totalTokens, totalCost } = useMetrics();
  const { events } = useEvents(10);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const runningTasks = tasks.filter((t) => t.status === "doing").length;
  const failedTasks = tasks.filter((t) => t.status === "needs_input").length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const runningWorkflows = runs.filter((r) => r.status === "running").length;

  const loading = agentsLoading || tasksLoading;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={Bot}
          label="Active Agents"
          value={activeAgents}
          sub={`${agents.length} total`}
          color="#10b981"
          delay={0}
          loading={agentsLoading}
        />
        <MetricCard
          icon={Activity}
          label="Running Tasks"
          value={runningTasks}
          sub={`${doneTasks} done`}
          color="#06b6d4"
          delay={0.05}
          loading={tasksLoading}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Needs Input"
          value={failedTasks}
          color="#f59e0b"
          delay={0.1}
          loading={tasksLoading}
        />
        <MetricCard
          icon={Zap}
          label="Running Workflows"
          value={runningWorkflows}
          sub={`${runs.length} total`}
          color="#a78bfa"
          delay={0.15}
          loading={runsLoading}
        />
      </div>

      {/* Cost / Token row */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={Coins}
          label="Total Cost"
          value={`$${totalCost.toFixed(4)}`}
          color="#fbbf24"
          delay={0.2}
        />
        <MetricCard
          icon={Database}
          label="Tokens Used"
          value={totalTokens.toLocaleString()}
          color="#34d399"
          delay={0.25}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Agent Health */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card-elevated p-5"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bot className="h-4 w-4 text-emerald-400" /> Agent Health
          </h3>
          {agentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No agents connected yet. Use the OpenClaw API to register agents.
            </p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.type}</p>
                  </div>
                  <Badge
                    className={`border text-[10px] ${STATUS_COLOR[agent.status] ?? ""}`}
                    variant="outline"
                  >
                    {agent.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Logs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="glass-card-elevated p-5"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-cyan-400" /> Recent Logs
          </h3>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs yet.</p>
          ) : (
            <div className="space-y-1 font-mono text-[11px]">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 items-start">
                  <span
                    className={
                      log.level === "error"
                        ? "text-red-400"
                        : log.level === "warn"
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }
                  >
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-muted-foreground truncate">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Event Stream */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="glass-card-elevated p-5"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Radio className="h-4 w-4 text-purple-400 animate-pulse" /> Live Event Stream
        </h3>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events yet — waiting for OpenClaw activity…
          </p>
        ) : (
          <div className="space-y-1.5 font-mono text-[11px] max-h-48 overflow-y-auto">
            {events.map((ev) => (
              <div key={ev.id} className="flex gap-3 items-center">
                <span className="text-muted-foreground">
                  {new Date(ev.created_at).toLocaleTimeString()}
                </span>
                <Badge className="border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[9px]">
                  {ev.type}
                </Badge>
                {ev.source && (
                  <span className="text-cyan-400">{ev.source}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
