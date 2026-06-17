import { LogOut, Moon, Settings as SettingsIcon, Sparkles, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

export function UserMenu({ onSettings }: { onSettings: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "User";
  const email = user?.email ?? "";
  const initials = displayName
    .split(" ")
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/signin" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="glow-hover flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 p-1 pr-2.5 transition-colors hover:bg-black/40">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-bold text-background"
            style={{ background: "var(--gradient-emerald)" }}
          >
            {initials || "U"}
          </div>
          <span className="hidden text-sm font-medium md:inline">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2 p-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md font-mono text-sm font-bold text-background"
            style={{ background: "var(--gradient-emerald)" }}
          >
            {initials || "U"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{displayName}</div>
            <div className="truncate text-xs text-muted-foreground">{email}</div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 pb-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
            <Sparkles className="h-3 w-3" /> Pro plan
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem><User className="mr-2 h-3.5 w-3.5" />Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={onSettings}>
          <SettingsIcon className="mr-2 h-3.5 w-3.5" />Settings
        </DropdownMenuItem>
        <DropdownMenuItem><Moon className="mr-2 h-3.5 w-3.5" />Theme: Dark</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-rose-300 focus:text-rose-200 cursor-pointer"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}