import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Bot } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useTasks } from "@/hooks/useTasks";
import { useLogs } from "@/hooks/useLogs";
import { useMetrics } from "@/hooks/useMetrics";
import { useWorkflowRuns } from "@/hooks/useWorkflowRuns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Agent } from "@/types/supabase";

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  offline: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function AgentDrawer({ agent, open, onClose }: { agent: Agent | null; open: boolean; onClose: () => void }) {
  const { tasks } = useTasks(agent?.id);
  const { logs } = useLogs({ agentId: agent?.id, limit: 20 });
  const { runs } = useWorkflowRuns(agent?.id);
  const { totalTokens, totalCost } = useMetrics(agent?.id);

  if (!agent) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-400" />
            {agent.name}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {/* Metadata */}
          <div className="rounded-lg bg-muted/30 p-4 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="text-foreground truncate max-w-48">{agent.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="text-foreground">{agent.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="text-foreground">{agent.model ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={`border text-[10px] ${STATUS_COLOR[agent.status]}`} variant="outline">
                {agent.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tokens Used</span>
              <span className="text-foreground">{totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Cost</span>
              <span className="text-foreground">${totalCost.toFixed(4)}</span>
            </div>
          </div>

          {/* Tasks */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Tasks ({tasks.length})</h4>
            <div className="space-y-1">
              {tasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex justify-between rounded bg-muted/20 px-3 py-1.5 text-xs">
                  <span className="text-foreground truncate max-w-xs">{t.title}</span>
                  <Badge variant="outline" className="text-[9px]">{t.status}</Badge>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks.</p>}
            </div>
          </div>

          {/* Workflow Runs */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Workflows ({runs.length})</h4>
            <div className="space-y-1">
              {runs.slice(0, 5).map((r) => (
                <div key={r.id} className="flex justify-between rounded bg-muted/20 px-3 py-1.5 text-xs">
                  <span className="text-foreground">{r.workflow_name}</span>
                  <div className="flex items-center gap-2">
                    {r.duration_ms && <span className="text-muted-foreground">{r.duration_ms}ms</span>}
                    <Badge variant="outline" className="text-[9px]">{r.status}</Badge>
                  </div>
                </div>
              ))}
              {runs.length === 0 && <p className="text-xs text-muted-foreground">No workflow runs.</p>}
            </div>
          </div>

          {/* Logs */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Recent Logs</h4>
            <div className="font-mono text-[10px] space-y-0.5 max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className={
                    log.level === "error" ? "text-red-400" :
                    log.level === "warn" ? "text-amber-400" : "text-emerald-400"
                  }>[{log.level}]</span>
                  <span className="text-muted-foreground truncate">{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-muted-foreground">No logs.</p>}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function LiveAgents() {
  const { agents, loading } = useAgents();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Agent | null>(null);

  const filtered = agents.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents…"
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

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card-elevated p-8 text-center"
        >
          <Bot className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {agents.length === 0
              ? "No agents registered yet. POST to /api/openclaw/agent-status to add one."
              : "No agents match your filters."}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agent, i) => (
            <motion.button
              key={agent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              onClick={() => setSelected(agent)}
              className="glass-card-elevated glow-hover p-4 text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.type}</p>
                  {agent.model && (
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{agent.model}</p>
                  )}
                </div>
                <Badge className={`border text-[10px] ${STATUS_COLOR[agent.status]}`} variant="outline">
                  {agent.status}
                </Badge>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AgentDrawer
        agent={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
