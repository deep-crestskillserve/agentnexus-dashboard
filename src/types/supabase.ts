export type AgentStatus = "active" | "idle" | "error" | "offline";
export type TaskStatus = "todo" | "doing" | "needs_input" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export type LogLevel = "debug" | "info" | "warn" | "error";
export type WorkflowStatus = "running" | "completed" | "failed" | "pending";

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  model: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_name: string;
  agent_id: string | null;
  status: WorkflowStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface AgentLog {
  id: string;
  agent_id: string | null;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Event {
  id: string;
  type: string;
  source: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface AgentMemory {
  id: string;
  agent_id: string | null;
  memory_type: string;
  content: string;
  created_at: string;
}

export interface Metric {
  id: string;
  agent_id: string | null;
  tokens_used: number | null;
  cost: number | null;
  execution_time: number | null;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  role: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  providers: string | null;
  created_at: string;
  updated_at: string;
}

export type EventType =
  | "task_created"
  | "task_started"
  | "task_completed"
  | "task_failed"
  | "workflow_started"
  | "workflow_completed"
  | "agent_online"
  | "agent_offline";
