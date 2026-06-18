import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTasks } from "@/hooks/useTasks";
import { useLogs } from "@/hooks/useLogs";
import { useWorkflowRuns } from "@/hooks/useWorkflowRuns";
import { useMetrics } from "@/hooks/useMetrics";
import { timeAgo } from "@/lib/timeAgo";
import { AGENT_STATUS_BADGE } from "../../lib/agentStatus";
import type { Agent } from "@/types/supabase";

export function AgentDetailDrawer({
  agent,
  open,
  onClose,
}: {
  agent: Agent | null;
  open: boolean;
  onClose: () => void;
}) {
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
            <span className="text-xl leading-none">{agent.emoji}</span>
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
              <span className="text-muted-foreground">Status</span>
              <Badge className={`border text-[10px] ${AGENT_STATUS_BADGE[agent.status]}`} variant="outline">
                {agent.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="text-foreground">{timeAgo(agent.updated_at)}</span>
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

          {/* Capabilities */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Capabilities</h4>
            <div className="flex flex-wrap gap-1.5">
              {agent.capabilities.length > 0 ? (
                agent.capabilities.map((cap) => (
                  <Badge key={cap} variant="outline" className="text-[10px]">
                    {cap}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No capabilities listed.</p>
              )}
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