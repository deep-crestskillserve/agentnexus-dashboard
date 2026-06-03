export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  kind: "task" | "council" | "system" | "agent";
}

export const initialNotifications: Notification[] = [
  { id: "n1", title: "Council vote ready", body: "Billing migration cutover needs your sign-off.", time: "2m ago", unread: true, kind: "council" },
  { id: "n2", title: "Agent Alpha shipped PR #1142", body: "Auth middleware refactor merged to main.", time: "14m ago", unread: true, kind: "agent" },
  { id: "n3", title: "Audit Bot flagged anomaly", body: "Unusual login pattern from 3 IPs.", time: "1h ago", unread: true, kind: "system" },
  { id: "n4", title: "Weekly digest", body: "47 tasks completed, 12 meetings summarized.", time: "yesterday", unread: false, kind: "system" },
  { id: "n5", title: "Dispatch routed 4 tasks", body: "Capacity rebalanced across the swarm.", time: "yesterday", unread: false, kind: "task" },
];

export interface Workspace {
  id: string;
  name: string;
  plan: "Free" | "Pro" | "Enterprise";
  emoji: string;
}

export const initialWorkspaces: Workspace[] = [
  { id: "w1", name: "Acme Inc.", plan: "Pro", emoji: "🚀" },
  { id: "w2", name: "Northwind Labs", plan: "Enterprise", emoji: "🌐" },
  { id: "w3", name: "Personal", plan: "Free", emoji: "🏠" },
];

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  emoji: string;
}

export const initialIntegrations: Integration[] = [
  { id: "slack", name: "Slack", category: "Messaging", description: "Send agent updates and council results to channels.", connected: true, emoji: "💬" },
  { id: "linear", name: "Linear", category: "Project Mgmt", description: "Sync tasks both ways with Linear issues.", connected: true, emoji: "📐" },
  { id: "github", name: "GitHub", category: "Code", description: "Agents open PRs, review code, run CI.", connected: true, emoji: "🐙" },
  { id: "notion", name: "Notion", category: "Docs", description: "Mirror meeting summaries to your team wiki.", connected: false, emoji: "📓" },
  { id: "gcal", name: "Google Calendar", category: "Scheduling", description: "Auto-schedule councils around your team's availability.", connected: true, emoji: "📅" },
  { id: "zapier", name: "Zapier", category: "Automation", description: "Trigger 5,000+ apps from any agent event.", connected: false, emoji: "⚡" },
  { id: "stripe", name: "Stripe", category: "Billing", description: "Agents can issue refunds and view subscription data.", connected: false, emoji: "💳" },
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Surface sales context inside agent conversations.", connected: false, emoji: "🎯" },
];

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed";
}

export const initialInvoices: Invoice[] = [
  { id: "INV-2026-005", date: "May 1, 2026", amount: "$499.00", status: "paid" },
  { id: "INV-2026-004", date: "Apr 1, 2026", amount: "$499.00", status: "paid" },
  { id: "INV-2026-003", date: "Mar 1, 2026", amount: "$499.00", status: "paid" },
  { id: "INV-2026-002", date: "Feb 1, 2026", amount: "$249.00", status: "paid" },
  { id: "INV-2026-001", date: "Jan 1, 2026", amount: "$249.00", status: "paid" },
];

// Sparkline mock data generators (deterministic enough for demo)
export function sparkSeries(seed: number, n = 16): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  let v = 40 + (seed % 30);
  for (let i = 0; i < n; i++) {
    v += Math.sin(i * 0.7 + seed) * 6 + ((seed * (i + 1)) % 7) - 3;
    out.push({ x: i, y: Math.max(8, Math.min(96, Math.round(v))) });
  }
  return out;
}

export const systemPulse = [
  { key: "cpu", label: "CPU", value: "42%", color: "#10b981", series: sparkSeries(3) },
  { key: "queue", label: "Queue depth", value: "18", color: "#06b6d4", series: sparkSeries(11) },
  { key: "latency", label: "p95 latency", value: "112ms", color: "#a78bfa", series: sparkSeries(7) },
  { key: "errors", label: "Errors / hr", value: "0.4%", color: "#fbbf24", series: sparkSeries(19) },
];