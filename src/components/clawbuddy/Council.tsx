import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle2, ChevronDown, Clock, Mic } from "lucide-react";
import type { Agent, CouncilSession } from "./data";

const statusIcon = {
  speaking: <Mic className="h-3 w-3 text-emerald-400" />,
  done: <CheckCircle2 className="h-3 w-3 text-cyan-400" />,
  waiting: <Clock className="h-3 w-3 text-amber-400" />,
};

export function Council({ sessions, agents }: { sessions: CouncilSession[]; agents: Agent[] }) {
  const [open, setOpen] = useState<string | null>(sessions[0]?.id ?? null);
  const agentById = (id: string) => agents.find((a) => a.id === id);

  return (
    <div className="space-y-4">
      {sessions.map((s) => {
        const isOpen = open === s.id;
        return (
          <div key={s.id} className="glass-card overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : s.id)}
              className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
                      s.status === "in_progress"
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {s.status === "in_progress" ? "In progress" : "Concluded"}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">{s.question}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.participants.map((p) => {
                    const agent = agentById(p.agentId);
                    return (
                      <div
                        key={p.agentId}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-2.5 py-1"
                      >
                        <span>{agent?.emoji}</span>
                        <span className="text-xs font-medium text-foreground">{agent?.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                          {p.sent}/{p.limit}
                        </span>
                        {statusIcon[p.status]}
                      </div>
                    );
                  })}
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-white/5"
                >
                  <div className="space-y-2 p-5">
                    {s.messages.map((m, i) => {
                      const agent = agentById(m.agentId);
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.05 }}
                          className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/20 p-3"
                        >
                          <span className="text-xl">{agent?.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{agent?.name}</span>
                              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                #{m.num}
                              </span>
                              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                {m.time}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}