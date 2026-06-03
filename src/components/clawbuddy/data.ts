export type AgentStatus = "active" | "idle" | "error" | "offline";

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  type: string;
  role: string;
  status: AgentStatus;
  activity: string;
  lastSeen: string;
  tasksCompleted: number;
  accuracy: number;
  skills: string[];
  accent: "emerald" | "amber" | "cyan";
}

export const initialAgents: Agent[] = [
  {
    id: "alpha",
    name: "Agent Alpha",
    emoji: "🤖",
    subtitle: "Reliable, fast, ships clean code",
    type: "Code Agent",
    role: "Lead Engineer",
    status: "active",
    activity: "Refactoring auth module",
    lastSeen: "just now",
    tasksCompleted: 142,
    accuracy: 98.4,
    skills: ["TypeScript", "React", "PostgreSQL", "Refactoring", "Code Review"],
    accent: "emerald",
  },
  {
    id: "dispatch",
    name: "Dispatch Bot",
    emoji: "📋",
    subtitle: "Coordinates the swarm",
    type: "Coordinator",
    role: "Operations Director",
    status: "active",
    activity: "Routing 4 tasks to Alpha",
    lastSeen: "1m ago",
    tasksCompleted: 89,
    accuracy: 96.1,
    skills: ["Planning", "Routing", "Prioritization", "Scheduling"],
    accent: "amber",
  },
  {
    id: "audit",
    name: "Audit Bot",
    emoji: "🛡️",
    subtitle: "Watches every move",
    type: "Quality Agent",
    role: "Compliance Officer",
    status: "idle",
    activity: "Awaiting next audit window",
    lastSeen: "12m ago",
    tasksCompleted: 56,
    accuracy: 99.7,
    skills: ["Validation", "Security", "Logging", "Policy"],
    accent: "cyan",
  },
];

export type TaskStatus = "todo" | "doing" | "needs_input" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  agentId: string;
  status: TaskStatus;
  progress: number;
  priority: Priority;
}

export const initialTasks: Task[] = [
  { id: "t1", title: "Refactor authentication middleware", agentId: "alpha", status: "doing", progress: 65, priority: "high" },
  { id: "t2", title: "Audit Q1 access logs", agentId: "audit", status: "doing", progress: 30, priority: "medium" },
  { id: "t3", title: "Triage new feature requests", agentId: "dispatch", status: "todo", progress: 0, priority: "medium" },
  { id: "t4", title: "Migrate billing schema v2", agentId: "alpha", status: "todo", progress: 0, priority: "urgent" },
  { id: "t5", title: "Confirm vendor compliance docs", agentId: "audit", status: "needs_input", progress: 50, priority: "high" },
  { id: "t6", title: "Weekly status report", agentId: "dispatch", status: "done", progress: 100, priority: "low" },
  { id: "t7", title: "Patch CVE-2026-1131", agentId: "alpha", status: "done", progress: 100, priority: "urgent" },
  { id: "t8", title: "Onboarding checklist v3", agentId: "dispatch", status: "todo", progress: 0, priority: "low" },
  { id: "t9", title: "Investigate spike in 500s", agentId: "alpha", status: "needs_input", progress: 40, priority: "urgent" },
  { id: "t10", title: "Archive stale projects", agentId: "audit", status: "done", progress: 100, priority: "low" },
];

export type LogCategory = "observation" | "general" | "reminder" | "fyi";
export interface LogEntry {
  id: string;
  agentId: string;
  category: LogCategory;
  text: string;
  time: string;
}

export const initialLogs: LogEntry[] = [
  { id: "l1", agentId: "alpha", category: "observation", text: "Detected duplicated query pattern in /api/users — consolidating.", time: "2m ago" },
  { id: "l2", agentId: "dispatch", category: "general", text: "Routed 4 backlog items to Alpha based on capacity.", time: "8m ago" },
  { id: "l3", agentId: "audit", category: "reminder", text: "SOC2 quarterly review window opens Friday.", time: "21m ago" },
  { id: "l4", agentId: "alpha", category: "fyi", text: "Upgraded React Query to v5.83.0 — no breakages.", time: "44m ago" },
  { id: "l5", agentId: "audit", category: "observation", text: "Unusual login pattern from 3 IPs — flagged for review.", time: "1h ago" },
  { id: "l6", agentId: "dispatch", category: "general", text: "Closed 7 stale tasks older than 30 days.", time: "2h ago" },
  { id: "l7", agentId: "alpha", category: "fyi", text: "Cached weather widget responses — 38% latency drop.", time: "3h ago" },
  { id: "l8", agentId: "audit", category: "reminder", text: "Rotate API keys for staging environment by EOD.", time: "5h ago" },
  { id: "l9", agentId: "dispatch", category: "observation", text: "Sprint velocity trending +12% week over week.", time: "8h ago" },
];

export type ActivityType = "task" | "log" | "council" | "meeting";
export interface Activity {
  id: string;
  agentId: string;
  type: ActivityType;
  text: string;
  time: string;
}

export const initialActivity: Activity[] = [
  { id: "a1", agentId: "alpha", type: "task", text: "completed PR #1142 — auth middleware refactor", time: "just now" },
  { id: "a2", agentId: "dispatch", type: "log", text: "routed 4 new tasks to Agent Alpha", time: "3m ago" },
  { id: "a3", agentId: "audit", type: "log", text: "flagged unusual login pattern from 3 IPs", time: "12m ago" },
  { id: "a4", agentId: "alpha", type: "task", text: "started work on Migrate billing schema v2", time: "18m ago" },
  { id: "a5", agentId: "dispatch", type: "council", text: "convened council: 'Q2 roadmap priorities'", time: "34m ago" },
  { id: "a6", agentId: "audit", type: "meeting", text: "summarized weekly engineering standup", time: "1h ago" },
  { id: "a7", agentId: "alpha", type: "task", text: "closed CVE-2026-1131 hotfix", time: "2h ago" },
  { id: "a8", agentId: "dispatch", type: "log", text: "archived 7 stale projects", time: "3h ago" },
];

export interface CouncilMessage {
  id: string;
  agentId: string;
  num: number;
  text: string;
  time: string;
}

export interface CouncilParticipant {
  agentId: string;
  sent: number;
  limit: number;
  status: "speaking" | "done" | "waiting";
}

export interface CouncilSession {
  id: string;
  question: string;
  status: "in_progress" | "concluded";
  participants: CouncilParticipant[];
  messages: CouncilMessage[];
}

export const initialCouncils: CouncilSession[] = [
  {
    id: "c1",
    question: "Should we ship the v2 billing migration this Friday or hold for next sprint?",
    status: "in_progress",
    participants: [
      { agentId: "alpha", sent: 2, limit: 3, status: "speaking" },
      { agentId: "dispatch", sent: 2, limit: 3, status: "waiting" },
      { agentId: "audit", sent: 1, limit: 3, status: "waiting" },
    ],
    messages: [
      { id: "m1", agentId: "dispatch", num: 1, text: "Capacity is tight but doable if we defer the onboarding refresh.", time: "12m ago" },
      { id: "m2", agentId: "alpha", num: 1, text: "Migration scripts pass on staging. Cutover window is ~18 minutes.", time: "10m ago" },
      { id: "m3", agentId: "audit", num: 1, text: "I'd want a rollback rehearsal before we touch production billing.", time: "7m ago" },
      { id: "m4", agentId: "alpha", num: 2, text: "Agreed — I can run the rehearsal Thursday morning.", time: "5m ago" },
      { id: "m5", agentId: "dispatch", num: 2, text: "Then I'll lock Friday 6pm as the cutover. Anyone object?", time: "2m ago" },
    ],
  },
  {
    id: "c2",
    question: "What's our policy on auto-merging dependency PRs from Renovate?",
    status: "concluded",
    participants: [
      { agentId: "alpha", sent: 3, limit: 3, status: "done" },
      { agentId: "audit", sent: 3, limit: 3, status: "done" },
    ],
    messages: [
      { id: "n1", agentId: "alpha", num: 1, text: "Patch-level updates with green CI should auto-merge.", time: "yesterday" },
      { id: "n2", agentId: "audit", num: 1, text: "Only if the package isn't on the security-sensitive list.", time: "yesterday" },
      { id: "n3", agentId: "alpha", num: 2, text: "Fair. I'll maintain that list in the repo.", time: "yesterday" },
      { id: "n4", agentId: "audit", num: 2, text: "Minor versions still need a human reviewer.", time: "yesterday" },
      { id: "n5", agentId: "alpha", num: 3, text: "Drafting the policy doc now.", time: "yesterday" },
      { id: "n6", agentId: "audit", num: 3, text: "Approved.", time: "yesterday" },
    ],
  },
];

export type MeetingType = "1-on-1" | "external" | "sales" | "team" | "standup" | "planning" | "interview" | "all-hands";

export interface ActionItem {
  task: string;
  assignee: string;
  done: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration_minutes: number;
  duration_display: string;
  attendees: string[];
  summary: string;
  action_items: ActionItem[];
  ai_insights: string;
  meeting_type: MeetingType;
  sentiment: "positive" | "neutral" | "negative";
  has_external_participants: boolean;
  external_domains: string[];
  fathom_url: string | null;
  share_url: string | null;
}

function daysAgo(d: number, h = 10) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(h, 0, 0, 0);
  return dt.toISOString();
}

export const initialMeetings: Meeting[] = [
  {
    id: "mt1",
    title: "Weekly Standup with Engineering",
    date: daysAgo(0, 9),
    duration_minutes: 30,
    duration_display: "30m",
    attendees: ["Alice Chen", "Bob Reyes", "Charlie Park"],
    summary: "Discussed sprint progress. **Backend API 80% complete**, frontend integration starts Thursday. No blockers.",
    action_items: [
      { task: "Review PR #42 for the new gateway", assignee: "Alice Chen", done: false },
      { task: "Update onboarding docs", assignee: "Bob Reyes", done: true },
    ],
    ai_insights: "30 min meeting with 3 attendees. Positive momentum on backend stream.",
    meeting_type: "standup",
    sentiment: "positive",
    has_external_participants: false,
    external_domains: [],
    fathom_url: "https://fathom.video/share/abc",
    share_url: "https://clawbuddy.app/m/mt1",
  },
  {
    id: "mt2",
    title: "Discovery — Northwind Logistics",
    date: daysAgo(1, 14),
    duration_minutes: 55,
    duration_display: "55m",
    attendees: ["Sasha Wu", "M. Okafor (Northwind)", "J. Patel (Northwind)"],
    summary: "Northwind operates 1,200 trucks and is exploring AI dispatch. Pain point: **manual route planning** burns 4 hours/day per dispatcher.",
    action_items: [
      { task: "Send case study + pricing PDF", assignee: "Sasha Wu", done: false },
      { task: "Schedule technical deep-dive", assignee: "Sasha Wu", done: false },
    ],
    ai_insights: "Strong buying signals. Mentioned budget approval already in motion.",
    meeting_type: "sales",
    sentiment: "positive",
    has_external_participants: true,
    external_domains: ["northwind.com"],
    fathom_url: "https://fathom.video/share/def",
    share_url: "https://clawbuddy.app/m/mt2",
  },
  {
    id: "mt3",
    title: "1:1 — Alice / Manager",
    date: daysAgo(2, 11),
    duration_minutes: 25,
    duration_display: "25m",
    attendees: ["Alice Chen", "Morgan Lee"],
    summary: "Career growth discussion. Alice interested in moving toward a staff engineer track.",
    action_items: [{ task: "Draft growth plan", assignee: "Morgan Lee", done: false }],
    ai_insights: "Career planning conversation. Sentiment positive.",
    meeting_type: "1-on-1",
    sentiment: "positive",
    has_external_participants: false,
    external_domains: [],
    fathom_url: null,
    share_url: null,
  },
  {
    id: "mt4",
    title: "Eng Standup",
    date: daysAgo(3, 9),
    duration_minutes: 18,
    duration_display: "18m",
    attendees: ["Alice Chen", "Bob Reyes", "Charlie Park", "Dana Kim"],
    summary: "Short standup. Two PRs blocked on review, otherwise on track.",
    action_items: [{ task: "Unblock PR #41", assignee: "Charlie Park", done: true }],
    ai_insights: "Quick sync. No major issues.",
    meeting_type: "standup",
    sentiment: "neutral",
    has_external_participants: false,
    external_domains: [],
    fathom_url: "https://fathom.video/share/ghi",
    share_url: null,
  },
  {
    id: "mt5",
    title: "Customer Renewal — Acme Corp",
    date: daysAgo(4, 15),
    duration_minutes: 42,
    duration_display: "42m",
    attendees: ["Sasha Wu", "Priya Shah", "L. Hernandez (Acme)"],
    summary: "Renewal discussion. Acme wants expanded seat count and an SLA upgrade. Mostly positive but pricing pushback on the SLA tier.",
    action_items: [
      { task: "Send revised SLA pricing", assignee: "Priya Shah", done: false },
      { task: "Schedule exec sync", assignee: "Sasha Wu", done: false },
    ],
    ai_insights: "Renewal likely. Pricing is the main objection.",
    meeting_type: "sales",
    sentiment: "positive",
    has_external_participants: true,
    external_domains: ["acme.com"],
    fathom_url: "https://fathom.video/share/jkl",
    share_url: "https://clawbuddy.app/m/mt5",
  },
  {
    id: "mt6",
    title: "Interview — Senior Backend Candidate",
    date: daysAgo(5, 13),
    duration_minutes: 60,
    duration_display: "1h",
    attendees: ["Alice Chen", "Charlie Park", "R. Adeyemi (candidate)"],
    summary: "System design round. Strong on distributed systems. Some gaps on observability tooling.",
    action_items: [{ task: "Submit interview scorecard", assignee: "Alice Chen", done: true }],
    ai_insights: "Above-bar performance. Recommend advancing.",
    meeting_type: "interview",
    sentiment: "positive",
    has_external_participants: true,
    external_domains: ["personal.io"],
    fathom_url: "https://fathom.video/share/mno",
    share_url: null,
  },
  {
    id: "mt7",
    title: "All-Hands Q1 Update",
    date: daysAgo(7, 16),
    duration_minutes: 75,
    duration_display: "1h 15m",
    attendees: ["Whole Company"],
    summary: "CEO recapped Q1: revenue +18%, two new enterprise logos, hiring plan for Q2 announced.",
    action_items: [],
    ai_insights: "Company-wide alignment session. Positive tone throughout.",
    meeting_type: "all-hands",
    sentiment: "positive",
    has_external_participants: false,
    external_domains: [],
    fathom_url: "https://fathom.video/share/pqr",
    share_url: "https://clawbuddy.app/m/mt7",
  },
  {
    id: "mt8",
    title: "1:1 — Bob / Manager",
    date: daysAgo(9, 11),
    duration_minutes: 30,
    duration_display: "30m",
    attendees: ["Bob Reyes", "Morgan Lee"],
    summary: "Project handoff discussion. Bob to take over the analytics module starting next sprint.",
    action_items: [{ task: "Schedule handoff session with Dana", assignee: "Bob Reyes", done: false }],
    ai_insights: "Smooth ownership transition planned.",
    meeting_type: "1-on-1",
    sentiment: "neutral",
    has_external_participants: false,
    external_domains: [],
    fathom_url: null,
    share_url: null,
  },
  {
    id: "mt9",
    title: "Q2 Sprint Planning",
    date: daysAgo(11, 10),
    duration_minutes: 90,
    duration_display: "1h 30m",
    attendees: ["Alice Chen", "Bob Reyes", "Charlie Park", "Dana Kim", "Morgan Lee"],
    summary: "Scoped 12 stories across 3 epics. Capacity confirmed for 9. Stretch goals identified.",
    action_items: [
      { task: "Break down billing epic", assignee: "Alice Chen", done: false },
      { task: "Confirm design assets ready", assignee: "Dana Kim", done: true },
    ],
    ai_insights: "Well-scoped sprint. Clear ownership across the team.",
    meeting_type: "planning",
    sentiment: "positive",
    has_external_participants: false,
    external_domains: [],
    fathom_url: "https://fathom.video/share/stu",
    share_url: null,
  },
  {
    id: "mt10",
    title: "Design Crit — Onboarding v3",
    date: daysAgo(14, 14),
    duration_minutes: 45,
    duration_display: "45m",
    attendees: ["Dana Kim", "Alice Chen", "Charlie Park"],
    summary: "Reviewed three onboarding flow variants. Variant B selected with minor copy tweaks.",
    action_items: [{ task: "Finalize copy with marketing", assignee: "Dana Kim", done: false }],
    ai_insights: "Decisive crit. Clear winner emerged early.",
    meeting_type: "team",
    sentiment: "positive",
    has_external_participants: false,
    external_domains: [],
    fathom_url: "https://fathom.video/share/vwx",
    share_url: null,
  },
];

export const meetingTypeColors: Record<MeetingType, string> = {
  "1-on-1": "#60a5fa",
  external: "#a78bfa",
  sales: "#34d399",
  team: "#fb923c",
  standup: "#818cf8",
  planning: "#2dd4bf",
  interview: "#f472b6",
  "all-hands": "#fbbf24",
};