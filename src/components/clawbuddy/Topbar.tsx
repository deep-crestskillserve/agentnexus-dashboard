import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, Search, Activity } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";
import type { SectionId } from "./AppSidebar";

const sectionLabels: Record<SectionId, string> = {
  deck: "Command Deck",
  tasks: "Task Board",
  agents: "Agents",
  meetings: "Meetings",
  council: "Council",
  log: "AI Log",
  integrations: "Integrations",
  billing: "Billing",
  settings: "Settings",
};

export function Topbar({
  section,
  onOpenPalette,
  onSettings,
}: {
  section: SectionId;
  onOpenPalette: () => void;
  onSettings: () => void;
}) {
  const { scrollY } = useScroll();
  const glow = useTransform(scrollY, [0, 80], [0, 0.6]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/5 bg-[rgba(10,10,15,0.6)] px-4 backdrop-blur-xl"
    >
      <motion.div
        style={{ opacity: glow }}
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
      />

      <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />

      <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
        <span>Workspace</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{sectionLabels[section]}</span>
      </nav>

      <button
        onClick={onOpenPalette}
        className="group ml-auto flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-muted-foreground transition-all hover:border-emerald-500/30 hover:bg-black/40 hover:shadow-[0_0_24px_-8px_rgba(16,185,129,0.5)] md:w-80"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search anything…</span>
        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <div className="hidden items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 lg:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <Activity className="h-3 w-3 text-emerald-400" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300">
            All systems · 47ms
          </span>
        </div>
        <NotificationsMenu />
        <UserMenu onSettings={onSettings} />
      </div>
    </motion.header>
  );
}