import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { Badge } from "@/components/ui/badge";

const EVENT_COLOR: Record<string, string> = {
  task_created: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  task_started: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  task_completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  task_failed: "border-red-500/40 bg-red-500/10 text-red-300",
  workflow_started: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  workflow_completed: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  agent_online: "border-green-500/40 bg-green-500/10 text-green-300",
  agent_offline: "border-gray-500/40 bg-gray-500/10 text-gray-300",
};

export function LiveEventBus() {
  const { events, loading } = useEvents(100);

  const typeCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Type legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(typeCounts).map(([type, count]) => (
          <Badge
            key={type}
            className={`border text-[10px] ${EVENT_COLOR[type] ?? "border-white/20 bg-white/5 text-white/60"}`}
            variant="outline"
          >
            {type} ({count})
          </Badge>
        ))}
      </div>

      {/* Stream */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card-elevated overflow-hidden"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Radio className="h-4 w-4 text-purple-400 animate-pulse" />
          <span className="text-sm font-medium text-foreground">Event Stream</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {events.length} events
          </span>
        </div>
        <div className="h-[65vh] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : events.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No events yet — waiting for OpenClaw activity…
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {events.map((ev) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-4 border-b border-white/5 px-4 py-3 hover:bg-white/5"
                >
                  <span className="mt-0.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                  <Badge
                    className={`border shrink-0 text-[10px] ${EVENT_COLOR[ev.type] ?? "border-white/20 bg-white/5 text-white/60"}`}
                    variant="outline"
                  >
                    {ev.type}
                  </Badge>
                  {ev.source && (
                    <span className="text-xs text-cyan-400 shrink-0">{ev.source}</span>
                  )}
                  {ev.payload && (
                    <pre className="overflow-x-auto font-mono text-[10px] text-muted-foreground">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
