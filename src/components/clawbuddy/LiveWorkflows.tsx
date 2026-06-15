import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useWorkflowRuns } from "@/hooks/useWorkflowRuns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLOR: Record<string, string> = {
  running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function LiveWorkflows() {
  const { runs, loading } = useWorkflowRuns();

  const byName = runs.reduce<Record<string, { name: string; count: number; avgMs: number }>>((acc, r) => {
    if (!acc[r.workflow_name]) acc[r.workflow_name] = { name: r.workflow_name, count: 0, avgMs: 0 };
    acc[r.workflow_name].count += 1;
    acc[r.workflow_name].avgMs =
      (acc[r.workflow_name].avgMs * (acc[r.workflow_name].count - 1) + (r.duration_ms ?? 0)) /
      acc[r.workflow_name].count;
    return acc;
  }, {});

  const chartData = Object.values(byName).slice(0, 10);
  const running = runs.filter((r) => r.status === "running");
  const completed = runs.filter((r) => r.status === "completed");
  const failed = runs.filter((r) => r.status === "failed");

  return (
    <div className="space-y-6">
      {/* Summary badges */}
      <div className="flex gap-3">
        <div className="glass-card-elevated flex items-center gap-2 px-4 py-3">
          <span className="text-sm text-muted-foreground">Running</span>
          <span className="font-mono text-lg font-bold text-blue-400">{running.length}</span>
        </div>
        <div className="glass-card-elevated flex items-center gap-2 px-4 py-3">
          <span className="text-sm text-muted-foreground">Completed</span>
          <span className="font-mono text-lg font-bold text-emerald-400">{completed.length}</span>
        </div>
        <div className="glass-card-elevated flex items-center gap-2 px-4 py-3">
          <span className="text-sm text-muted-foreground">Failed</span>
          <span className="font-mono text-lg font-bold text-red-400">{failed.length}</span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-elevated p-5"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">Avg Duration by Workflow (ms)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#888", fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                labelStyle={{ color: "#ccc" }}
                cursor={{ fill: "#ffffff08" }}
              />
              <Bar dataKey="avgMs" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-elevated overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Workflow
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Started
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No workflow runs yet.
                  </td>
                </tr>
              ) : (
                runs.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.workflow_name}</td>
                    <td className="px-4 py-3">
                      <Badge className={`border text-[10px] ${STATUS_COLOR[r.status]}`} variant="outline">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {r.duration_ms ? `${r.duration_ms}ms` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
