import { motion } from "framer-motion";
import {
  LayoutDashboard,
  KanbanSquare,
  Bot,
  Calendar,
  Users2,
  ScrollText,
  Plug,
  CreditCard,
  Settings,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialWorkspaces } from "./mockExtras";
import { useState } from "react";

export type SectionId =
  | "deck"
  | "tasks"
  | "agents"
  | "meetings"
  | "council"
  | "log"
  | "integrations"
  | "billing"
  | "settings";

const workspace = [
  { id: "deck" as const, label: "Command Deck", icon: LayoutDashboard },
  { id: "tasks" as const, label: "Task Board", icon: KanbanSquare },
  { id: "agents" as const, label: "Agents", icon: Bot },
  { id: "meetings" as const, label: "Meetings", icon: Calendar },
  { id: "council" as const, label: "Council", icon: Users2 },
  { id: "log" as const, label: "AI Log", icon: ScrollText },
];

const system = [
  { id: "integrations" as const, label: "Integrations", icon: Plug },
  { id: "billing" as const, label: "Billing", icon: CreditCard },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function AppSidebar({
  section,
  onSelect,
}: {
  section: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [ws, setWs] = useState(initialWorkspaces[0]);

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5">
      <SidebarHeader className="border-b border-white/5">
        <div className="flex items-center gap-3 px-1 py-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl animate-glow-pulse"
            style={{ background: "var(--gradient-aurora)" }}
          >
            🐾
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-base font-bold tracking-tight">
                Claw<span className="text-gradient-emerald">Buddy</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Command Center
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspace.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={section === item.id}
                  collapsed={collapsed}
                  onSelect={() => onSelect(item.id)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {system.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={section === item.id}
                  collapsed={collapsed}
                  onSelect={() => onSelect(item.id)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="glass-card glow-hover flex w-full items-center gap-2 p-2 text-left">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-base">
                {ws.emoji}
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">{ws.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                      {ws.plan} plan
                    </div>
                  </div>
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-widest">
              Switch workspace
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {initialWorkspaces.map((w) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => setWs(w)}
                className="flex items-center gap-2"
              >
                <span>{w.emoji}</span>
                <span className="flex-1">{w.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{w.plan}</span>
                {w.id === ws.id && <Check className="h-3.5 w-3.5 text-emerald-400" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  onSelect,
}: {
  item: { id: SectionId; label: string; icon: typeof Bot };
  active: boolean;
  collapsed: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onSelect}
        isActive={active}
        tooltip={item.label}
        className={`relative transition-all ${
          active
            ? "bg-emerald-500/10 text-foreground"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        }`}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-emerald-400 shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon className={`h-4 w-4 ${active ? "text-emerald-400" : ""}`} />
        {!collapsed && <span>{item.label}</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}