/** Shared color tokens for the live `agents.status` enum (active/idle/error/offline). */

export const AGENT_STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-400",
  idle: "bg-amber-400",
  error: "bg-red-400",
  offline: "bg-gray-500",
};

export const AGENT_STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  offline: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};