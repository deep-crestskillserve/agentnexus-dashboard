import { useEffect } from "react";
import {
  Bot,
  Calendar,
  KanbanSquare,
  LayoutDashboard,
  Plug,
  ScrollText,
  Settings,
  Users2,
  CreditCard,
  Plus,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { SectionId } from "./AppSidebar";
import type { Agent, Task } from "./data";

const nav: { id: SectionId; label: string; icon: typeof Bot }[] = [
  { id: "deck", label: "Command Deck", icon: LayoutDashboard },
  { id: "tasks", label: "Task Board", icon: KanbanSquare },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "council", label: "Council", icon: Users2 },
  { id: "log", label: "AI Log", icon: ScrollText },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  agents,
  tasks,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNavigate: (id: SectionId) => void;
  agents: Agent[];
  tasks: Task[];
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search agents, tasks, actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {nav.map((n) => (
            <CommandItem
              key={n.id}
              onSelect={() => {
                onNavigate(n.id);
                onOpenChange(false);
              }}
            >
              <n.icon className="mr-2 h-4 w-4" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Agents">
          {agents.map((a) => (
            <CommandItem
              key={a.id}
              onSelect={() => {
                onNavigate("agents");
                onOpenChange(false);
              }}
            >
              <span className="mr-2">{a.emoji}</span>
              {a.name}
              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {a.status}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Tasks">
          {tasks.slice(0, 6).map((t) => (
            <CommandItem
              key={t.id}
              onSelect={() => {
                onNavigate("tasks");
                onOpenChange(false);
              }}
            >
              <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              {t.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem>
            <Plus className="mr-2 h-4 w-4" />
            New task
          </CommandItem>
          <CommandItem>
            <Users2 className="mr-2 h-4 w-4" />
            Convene council
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}