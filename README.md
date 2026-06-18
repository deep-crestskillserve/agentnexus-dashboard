# OpenClaw Agent Control Center

A real-time dashboard for monitoring and controlling OpenClaw AI agents, built on **TanStack Start** + **Supabase Realtime**.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | TanStack Start (Vite + TanStack Router v1) |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Charts | Recharts |
| Animation | Framer Motion |
| Database | Supabase (PostgreSQL + Realtime) |
| Validation | Zod |
| Runtime | Bun / Node.js |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/deep-crestskillserve/agentnexus-dashboard
cd agentnexus-dashboard
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in your Supabase credentials
```

### 3. Run database migrations

Open your Supabase project → **SQL Editor** → paste and run, in order:

```
migrations/000_base.sql
migrations/005 add task subtasks.sql
migrations/006_update_agents_schema.sql
```

`000_base.sql` is a consolidated, idempotent script that creates all tables, RLS policies, indexes, and enables Realtime — safe to run even if some of the older `001`–`004` migrations were already applied. `005` adds the tasks checklist column, and `006` moves the `agents` table to its current `emoji` / `capabilities` shape (also safe to run if you already have the older `type` / `model` columns).

### 4. Start dev server

```bash
npm run dev
```

Open http://localhost:3000 and navigate to the **OpenClaw Live** section in the sidebar.

---

## Architecture

```
Browser (dashboard)
  └── Supabase Realtime WebSocket
        └── PostgreSQL tables (agents, tasks, logs, events, metrics, workflow_runs)
              ↑ written by
OpenClaw agents → POST /api/* server functions (uses service role key)
```

### Realtime hooks

All hooks in `src/hooks/` subscribe to Supabase Realtime and receive live INSERT/UPDATE/DELETE events:

| Hook | Table | Auto-reconnect |
|---|---|---|
| `useAgents` | `agents` | ✅ |
| `useTasks` | `tasks` | ✅ |
| `useWorkflowRuns` | `workflow_runs` | ✅ |
| `useLogs` | `agent_logs` | ✅ |
| `useMetrics` | `metrics` | ✅ |
| `useEvents` | `events` | ✅ |

---

## OpenClaw Integration API

All endpoints are TanStack Start server functions. Call them from your OpenClaw workflow using the following patterns.

### Register / update agent status

```bash
curl -X POST https://your-dashboard.vercel.app/api/openclaw/agent-status \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ResearchAgent-01",
    "emoji": "🔍",
    "status": "active",
    "capabilities": ["web_search", "summarization"]
  }'
```

### Create a task

```bash
curl -X POST https://your-dashboard.vercel.app/api/openclaw/task \
  -H "Content-Type: application/json" \
  -d '{
    "assignee_id": "uuid-of-agent-or-user",
    "assignee_type": "agent",
    "title": "Summarise Q3 earnings report",
    "description": "Extract key financials and write a 3-paragraph summary",
    "status": "todo",
    "priority": "high"
  }'
```

### Write a log

```bash
curl -X POST https://your-dashboard.vercel.app/api/openclaw/log \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "uuid-of-agent",
    "level": "info",
    "message": "Tool call completed: web_search",
    "metadata": { "query": "OpenAI revenue 2024", "results": 5 }
  }'
```

### Record a workflow run

```bash
curl -X POST https://your-dashboard.vercel.app/api/openclaw/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "earnings-research",
    "agent_id": "uuid-of-agent",
    "status": "completed",
    "duration_ms": 4230
  }'
```

### Publish an event

```bash
curl -X POST https://your-dashboard.vercel.app/api/openclaw/event \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task_completed",
    "source": "ResearchAgent-01",
    "payload": { "task_id": "abc123", "result": "success" }
  }'
```

### Record a metric

```bash
curl -X POST https://your-dashboard.vercel.app/api/openclaw/metric \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "uuid-of-agent",
    "tokens_used": 2847,
    "cost": 0.008541,
    "execution_time": 3120
  }'
```

---

## Dashboard Pages (sidebar → OpenClaw Live)

| Page | Path | Description |
|---|---|---|
| Live Dashboard | `live-dashboard` | KPIs, agent health, recent logs, event stream |
| Live Agents | `live-agents` | Search, filter, click for detailed drawer |
| Workflow Monitor | `live-workflows` | Duration chart, status table |
| Log Viewer | `live-logs` | Filter by agent/level/search, auto-scroll |
| Event Bus | `live-events` | Animated realtime event stream |

---

## Security

- **Dashboard readers** use the `anon` key (read-only via RLS policies)
- **OpenClaw writers** use the `service_role` key (bypasses RLS, server-side only)
- `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser (no `VITE_` prefix)
- All API inputs are validated with Zod before hitting the database

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

The project uses `@lovable.dev/vite-tanstack-config` which bundles a Nitro adapter — it deploys to Vercel Edge Functions out of the box.

---

## File Map

```
src/
├── types/
│   └── supabase.ts              # All TypeScript interfaces
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   └── server.ts            # Server Supabase client (service role)
│   └── api/
│       ├── schemas.ts           # Zod validation schemas
│       └── openclaw.server.ts   # TanStack server functions
├── hooks/
│   ├── useAgents.ts
│   ├── useTasks.ts
│   ├── useWorkflowRuns.ts
│   ├── useLogs.ts
│   ├── useMetrics.ts
│   └── useEvents.ts
├── components/clawbuddy/
│   ├── LiveDashboard.tsx        # KPI overview
│   ├── LiveAgents.tsx           # Agent list + detail drawer
│   ├── LiveWorkflows.tsx        # Workflow monitor + chart
│   ├── LiveLogsViewer.tsx       # Streaming log viewer
│   └── LiveEventBus.tsx         # Event bus viewer
└── routes/
    └── index.tsx                # Main route (updated with live sections)

migrations/
├── 000_base.sql                  # Consolidated schema + RLS + Realtime
├── 005 add task subtasks.sql     # Adds tasks.subtasks JSONB column
└── 006_update_agents_schema.sql  # agents: type/model → emoji/capabilities
```