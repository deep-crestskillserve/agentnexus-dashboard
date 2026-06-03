import { Bell, Check } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialNotifications, type Notification } from "./mockExtras";

const kindColor: Record<Notification["kind"], string> = {
  task: "bg-cyan-500/15 text-cyan-300",
  council: "bg-emerald-500/15 text-emerald-300",
  system: "bg-amber-500/15 text-amber-300",
  agent: "bg-violet-500/15 text-violet-300",
};

export function NotificationsMenu() {
  const [items, setItems] = useState(initialNotifications);
  const unread = items.filter((n) => n.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="glow-hover relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-black/20 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-semibold text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
              {unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-white/5 p-3">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {unread} unread
            </div>
          </div>
          <button
            onClick={() => setItems((p) => p.map((n) => ({ ...n, unread: false })))}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
          >
            <Check className="h-3 w-3" /> Mark all read
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.map((n) => (
            <div
              key={n.id}
              className="flex gap-3 border-b border-white/5 p-3 last:border-b-0 hover:bg-white/[0.02]"
            >
              <span
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase ${kindColor[n.kind]}`}
              >
                {n.kind[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-medium text-foreground">{n.title}</div>
                  {n.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />}
                </div>
                <div className="line-clamp-1 text-xs text-muted-foreground">{n.body}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {n.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}