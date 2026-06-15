import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CommandDeck } from "@/components/clawbuddy/CommandDeck";
import { AgentProfiles } from "@/components/clawbuddy/AgentProfiles";
import { TaskBoard } from "@/components/clawbuddy/TaskBoard";
import { AILog } from "@/components/clawbuddy/AILog";
import { Council } from "@/components/clawbuddy/Council";
import { MeetingIntelligence } from "@/components/clawbuddy/MeetingIntelligence";
import { Integrations } from "@/components/clawbuddy/Integrations";
import { Billing } from "@/components/clawbuddy/Billing";
import { Settings as SettingsPage } from "@/components/clawbuddy/Settings";
import { AppSidebar, type SectionId } from "@/components/clawbuddy/AppSidebar";
import { Topbar } from "@/components/clawbuddy/Topbar";
import { CommandPalette } from "@/components/clawbuddy/CommandPalette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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

function Index() {
  const [section, setSection] = useState<SectionId>("deck");
  const [paletteOpen, setPaletteOpen] = useState(false);
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar section={section} onSelect={setSection} />
        <SidebarInset className="bg-transparent">
          <Topbar
            section={section}
            onOpenPalette={() => setPaletteOpen(true)}
            onSettings={() => setSection("settings")}
          />
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                  transition={{ duration: 0.25 }}
                >
                  <SectionTitle section={section} />
                  {section === "deck" && (
                    <CommandDeck agents={agents} tasks={tasks} activity={activity} />
                  )}
                  {section === "agents" && <AgentProfiles agents={agents} />}
                  {section === "tasks" && <TaskBoard />}
                  {section === "log" && <AILog logs={logs} agents={agents} />}
                  {section === "council" && <Council sessions={councils} agents={agents} />}
                  {section === "meetings" && <MeetingIntelligence meetings={meetings} />}
                  {section === "integrations" && <Integrations />}
                  {section === "billing" && <Billing />}
                  {section === "settings" && <SettingsPage />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </SidebarInset>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNavigate={setSection}
        agents={agents}
        tasks={tasks}
      />
    </SidebarProvider>
  );
}

const titles: Record<SectionId, { title: string; sub: string }> = {
  deck: { title: "Command Deck", sub: "Mission control for your AI workforce." },
  tasks: { title: "Task Board", sub: "Drag work between lanes — your swarm picks it up." },
  agents: { title: "Agents", sub: "Every agent, every skill, every signal." },
  meetings: { title: "Meeting Intelligence", sub: "Searchable summaries with AI insight." },
  council: { title: "Council", sub: "Multi-agent debates, decisions, and votes." },
  log: { title: "AI Log", sub: "A chronological feed from every agent." },
  integrations: { title: "Integrations", sub: "Plug ClawBuddy into your stack." },
  billing: { title: "Billing", sub: "Plan, usage, and invoice history." },
  settings: { title: "Settings", sub: "Workspace, profile, and preferences." },
};

function SectionTitle({ section }: { section: SectionId }) {
  const t = titles[section];
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        <span className="text-gradient-aurora animate-aurora">{t.title}</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
    </div>
  );
}
