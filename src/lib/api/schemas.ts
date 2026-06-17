import { z } from "zod";

export const AgentStatusSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  type: z.string().default("generic"),
  status: z.enum(["active", "idle", "error", "offline"]),
  model: z.string().optional().nullable(),
});

export const TaskSchema = z.object({
  assignee_id: z.string().uuid().optional().nullable(),
  assignee_type: z.enum(["agent", "user"]).optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "doing", "needs_input", "done", "canceled"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z.string().optional().nullable(),
  position: z.number().int().optional(),
});

export const LogSchema = z.object({
  agent_id: z.string().uuid().optional().nullable(),
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  message: z.string().min(1),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const WorkflowSchema = z.object({
  workflow_name: z.string().min(1),
  agent_id: z.string().uuid().optional().nullable(),
  status: z.enum(["pending", "running", "completed", "failed"]).default("running"),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional().nullable(),
  duration_ms: z.number().int().optional().nullable(),
});

export const EventSchema = z.object({
  type: z.string().min(1),
  source: z.string().optional().nullable(),
  payload: z.record(z.unknown()).optional().nullable(),
});

export const MetricSchema = z.object({
  agent_id: z.string().uuid().optional().nullable(),
  tokens_used: z.number().int().optional().nullable(),
  cost: z.number().optional().nullable(),
  execution_time: z.number().int().optional().nullable(),
});

export type AgentStatusInput = z.infer<typeof AgentStatusSchema>;
export type TaskInput = z.infer<typeof TaskSchema>;
export type LogInput = z.infer<typeof LogSchema>;
export type WorkflowInput = z.infer<typeof WorkflowSchema>;
export type EventInput = z.infer<typeof EventSchema>;
export type MetricInput = z.infer<typeof MetricSchema>;