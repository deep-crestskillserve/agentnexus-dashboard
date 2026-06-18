import { createFileRoute } from "@tanstack/react-router";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";

export const Route = createFileRoute("/integration-guide")({
  component: IntegrationGuide,
});

const registerAgentCode = `curl -X POST https://your-domain.com/api/openclaw/agent-status \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \\
  -d '{
    "name": "YourAgent-01",
    "emoji": "🤖",
    "status": "active",
    "capabilities": ["code_review", "refactoring"]
  }'`;

const updateAgentStatusCode = `curl -X POST https://your-domain.com/api/openclaw/agent-status \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \\
  -d '{
    "name": "YourAgent-01",
    "status": "idle"
  }'`;

const createTaskCode = `curl -X POST https://your-domain.com/api/openclaw/task \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \\
  -d '{
    "assignee_id": "YOUR_AGENT_UUID",
    "assignee_type": "agent",
    "title": "Analyze Q3 earnings report",
    "description": "Extract key financial metrics and write summary",
    "status": "todo",
    "priority": "high"
  }'`;

const updateTaskCode = `curl -X POST https://your-domain.com/api/openclaw/task \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \\
  -d '{
    "assignee_id": "YOUR_AGENT_UUID",
    "assignee_type": "agent",
    "title": "Analyze Q3 earnings report",
    "status": "doing"
  }'`;

const writeLogCode = `curl -X POST https://your-domain.com/api/openclaw/log \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \\
  -d '{
    "agent_id": "YOUR_AGENT_UUID",
    "level": "info",
    "message": "Task completed: web_search",
    "metadata": { "query": "OpenAI revenue 2024", "results": 5 }
  }'`;

const workflowRunCode = `curl -X POST https://your-domain.com/api/openclaw/workflow \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \\
  -d '{
    "workflow_name": "earnings-research",
    "agent_id": "YOUR_AGENT_UUID",
    "status": "completed",
    "duration_ms": 4230
  }'`;

const humanRegistryCode = `{
  "id": "YOUR_HUMAN_UUID",
  "name": "Deep",
  "role": "CEO",
  "created_at": "2026-06-15T11:32:00Z"
}`;

export function IntegrationGuide() {
  return (
    <div className="space-y-8">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          <span className="text-gradient-aurora animate-aurora">Integration Guide</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Learn how to integrate your AI agents with ClawBuddy and OpenClaw platform
        </p>
      </div>
      
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Register your AI agent with the platform to begin tracking tasks, logs, metrics, and workflows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h2 className="font-semibold">1. Register Your Agent</h2>
              <p>
                Use the agent registration endpoint to register your AI agent with the platform. 
                This creates an entry in the <code>agents</code> table and enables live tracking.
              </p>
              <pre className="bg-muted p-4 rounded"><code className="language-bash">{registerAgentCode}</code></pre>
            </div>
            
            <Separator className="my-4" />
            
            <h2 className="font-semibold">2. Update Agent Status</h2>
            <p>
              Periodically update your agent's status (active, idle, error, offline) to reflect its current state.
            </p>
            <pre className="bg-muted p-4 rounded"><code className="language-bash">{updateAgentStatusCode}</code></pre>
          </CardContent>
        </Card>
      </div>
      
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="tasks" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3 border-b">
            <TabsTrigger value="tasks" className="hover:text-muted-foreground border-b-2 border-transparent px-3 py-2 text-sm font-medium">
              Tasks API
            </TabsTrigger>
            <TabsTrigger value="logs" className="hover:text-muted-foreground border-b-2 border-transparent px-3 py-2 text-sm font-medium">
              Logs API
            </TabsTrigger>
            <TabsTrigger value="workflows" className="hover:text-muted-foreground border-b-2 border-transparent px-3 py-2 text-sm font-medium">
              Workflows API
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <Card className="space-y-4">
              <CardHeader>
                <CardTitle>Task Management API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h2 className="font-semibold">Create a Task</h2>
                  <p>
                    Create a new task assigned to your agent. Tasks appear on the Kanban board and can be dragged between lanes.
                  </p>
                  <pre className="bg-muted p-4 rounded"><code className="language-bash">{createTaskCode}</code></pre>
                  
                  <h2 className="font-semibold mt-4">Update Task Status</h2>
                  <p>
                    Update task status as work progresses. Use status values: todo, doing, needs_input, done.
                  </p>
                  <pre className="bg-muted p-4 rounded"><code className="language-bash">{updateTaskCode}</code></pre>
                  
                  <h2 className="font-semibold mt-4">Task Priorities</h2>
                  <p className="text-sm">
                    Available priorities: low, medium, high, urgent. Visual indicators appear on the task cards.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <Card className="space-y-4">
              <CardHeader>
                <CardTitle>Logging API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h2 className="font-semibold">Write Agent Logs</h2>
                  <p>
                    Log important events, debug information, errors, and metrics from your agent's execution.
                  </p>
                  <pre className="bg-muted p-4 rounded"><code className="language-bash">{writeLogCode}</code></pre>
                  
                  <h2 className="font-semibold mt-4">Log Levels</h2>
                  <p className="text-sm">
                    Available levels: debug, info, warn, error. Logs are filterable by level in the Log Viewer.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="workflows">
            <Card className="space-y-4">
              <CardHeader>
                <CardTitle>Workflow Runs API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h2 className="font-semibold">Record Workflow Execution</h2>
                  <p>
                    Track multi-step workflows executed by your agent. Useful for monitoring complex automations.
                  </p>
                  <pre className="bg-muted p-4 rounded"><code className="language-bash">{workflowRunCode}</code></pre>
                  
                  <h2 className="font-semibold mt-4">Workflow Statuses</h2>
                  <p className="text-sm">
                    Available statuses: pending, running, completed, failed. View live workflow monitoring in the Workflows section.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Real-time Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              All data is synchronized in real-time via Supabase Realtime. Subscribe to changes in:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li><strong>agents</strong> - Live agent status updates</li>
              <li><strong>tasks</strong> - Task creation and status changes</li>
              <li><strong>workflow_runs</strong> - Workflow execution tracking</li>
              <li><strong>agent_logs</strong> - Streaming log entries</li>
              <li><strong>metrics</strong> - Token usage and cost metrics</li>
              <li><strong>events</strong> - Custom event bus for agent communication</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Human Registry</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The platform maintains a registry of human users. Your human profile has been pre-registered:
            </p>
            <pre className="bg-muted p-4 rounded"><code className="language-json">{humanRegistryCode}</code></pre>
            <p>
              AI agents can reference this human registry for handoffs, approvals, and collaborative workflows.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
