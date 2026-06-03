import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Header } from "@/components/clawbuddy/Header";
import { CommandDeck } from "@/components/clawbuddy/CommandDeck";
import { AgentProfiles } from "@/components/clawbuddy/AgentProfiles";
import { TaskBoard } from "@/components/clawbuddy/TaskBoard";
import { AILog } from "@/components/clawbuddy/AILog";
import { Council } from "@/components/clawbuddy/Council";
import { MeetingIntelligence } from "@/components/clawbuddy/MeetingIntelligence";
import {
  initialActivity,
  initialAgents,
  initialCouncils,
  initialLogs,
  initialMeetings,
  initialTasks,
  type TaskStatus,
} from "@/components/clawbuddy/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClawBuddy — AI Agent Command Center" },
      { name: "description", content: "Mission control for your AI workforce. Track agents, tasks, councils, and meeting intelligence in one premium command center." },
      { property: "og:title", content: "ClawBuddy — AI Agent Command Center" },
      { property: "og:description", content: "Mission control for your AI workforce." },
    ],
  }),
  component: Index,
});

const TABS = [
  { id: "deck", label: "Command Deck" },
  { id: "agents", label: "Agents" },
  { id: "tasks", label: "Task Board" },
  { id: "log", label: "AI Log" },
  { id: "council", label: "Council" },
  { id: "meetings", label: "Meetings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Index() {
  const [tab, setTab] = useState<TabId>("deck");
  const [agents] = useState(initialAgents);
  const [tasks, setTasks] = useState(initialTasks);
  const [logs] = useState(initialLogs);
  const [activity] = useState(initialActivity);
  const [councils] = useState(initialCouncils);
  const [meetings] = useState(initialMeetings);

  const moveTask = (id: string, status: TaskStatus) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status, progress: status === "done" ? 100 : t.progress } : t,
      ),
    );

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <Header activeAgent={agents[0]} />

        <motion.nav
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
          className="glass-card flex flex-wrap items-center gap-1 p-1.5"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <motion.button
                key={t.id}
                variants={{
                  hidden: { opacity: 0, y: -4 },
                  visible: { opacity: 1, y: 0 },
                }}
                onClick={() => setTab(t.id)}
                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-lg border border-emerald-500/30 bg-emerald-500/15"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </motion.button>
            );
          })}
        </motion.nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "deck" && <CommandDeck agents={agents} tasks={tasks} activity={activity} />}
            {tab === "agents" && <AgentProfiles agents={agents} />}
            {tab === "tasks" && <TaskBoard tasks={tasks} agents={agents} onMove={moveTask} />}
            {tab === "log" && <AILog logs={logs} agents={agents} />}
            {tab === "council" && <Council sessions={councils} agents={agents} />}
            {tab === "meetings" && <MeetingIntelligence meetings={meetings} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
