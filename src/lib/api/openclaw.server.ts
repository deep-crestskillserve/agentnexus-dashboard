import { createServerFn } from "@tanstack/react-start";
import { createServerClient } from "@/lib/supabase/server";
import {
  AgentStatusSchema,
  TaskSchema,
  LogSchema,
  WorkflowSchema,
  EventSchema,
  MetricSchema,
} from "./schemas";

// ── Agent Status ────────────────────────────────────────────────────────────

export const upsertAgentStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => AgentStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const db = createServerClient();
    if (data.id) {
      // Update existing
      const { data: row, error } = await db
        .from("agents")
        .update({ name: data.name, type: data.type, status: data.status, model: data.model })
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    } else {
      const { data: row, error } = await db
        .from("agents")
        .insert({ name: data.name, type: data.type, status: data.status, model: data.model })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
  });

// ── Task ────────────────────────────────────────────────────────────────────

export const createTask = createServerFn({ method: "POST" })
  .validator((data: unknown) => TaskSchema.parse(data))
  .handler(async ({ data }) => {
    const db = createServerClient();
    const { data: row, error } = await db
      .from("tasks")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ── Log ─────────────────────────────────────────────────────────────────────

export const writeLog = createServerFn({ method: "POST" })
  .validator((data: unknown) => LogSchema.parse(data))
  .handler(async ({ data }) => {
    const db = createServerClient();
    const { data: row, error } = await db
      .from("agent_logs")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ── Workflow ─────────────────────────────────────────────────────────────────

export const upsertWorkflow = createServerFn({ method: "POST" })
  .validator((data: unknown) => WorkflowSchema.parse(data))
  .handler(async ({ data }) => {
    const db = createServerClient();
    const { data: row, error } = await db
      .from("workflow_runs")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ── Event ────────────────────────────────────────────────────────────────────

export const publishEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => EventSchema.parse(data))
  .handler(async ({ data }) => {
    const db = createServerClient();
    const { data: row, error } = await db
      .from("events")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ── Metric ────────────────────────────────────────────────────────────────────

export const recordMetric = createServerFn({ method: "POST" })
  .validator((data: unknown) => MetricSchema.parse(data))
  .handler(async ({ data }) => {
    const db = createServerClient();
    const { data: row, error } = await db
      .from("metrics")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
