import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useLogs } from "@/hooks/useLogs";
import { useAgents } from "@/hooks/useAgents";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { LogLevel } from "@/types/supabase";

const LEVEL_COLOR: Record<string, string> = {
  debug: "text-gray-400",
  info: "text-emerald-400",
  warn: "text-amber-400",
  error: "text-red-400",
};

export function LiveLogsViewer() {
  const { agents } = useAgents();
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { logs, loading } = useLogs({
    agentId: agentFilter !== "all" ? agentFilter : undefined,
    level: levelFilter !== "all" ? (levelFilter as LogLevel) : undefined,
    search: search || undefined,
    limit: 300,
  });

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0; // newest on top
    }
  }, [logs, autoScroll]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warn</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="autoscroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
          <Label htmlFor="autoscroll" className="text-xs">Auto-scroll</Label>
        </div>
      </div>

      {/* Log pane */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card-elevated overflow-hidden"
      >
        <div
          ref={scrollRef}
          className="h-[60vh] overflow-y-auto p-4 font-mono text-[11px] space-y-0.5"
        >
          {loading ? (
            <p className="text-muted-foreground">Loading logs…</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground">No logs match your filters.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-white/5 px-1 py-0.5 rounded">
                <span className="text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
                <span className={`whitespace-nowrap font-bold ${LEVEL_COLOR[log.level]}`}>
                  {log.level.toUpperCase().padEnd(5)}
                </span>
                <span className="text-foreground/80 break-all">{log.message}</span>
                {log.metadata && (
                  <span className="text-muted-foreground/60 truncate max-w-48">
                    {JSON.stringify(log.metadata)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        <div className="border-t border-white/10 px-4 py-2 text-xs text-muted-foreground">
          {logs.length} log entries • live streaming
        </div>
      </motion.div>
    </div>
  );
}
