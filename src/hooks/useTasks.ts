import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Task } from "@/types/supabase";

export function useTasks(agentId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use a random suffix so each effect invocation gets a brand-new channel.
    // This prevents the Supabase "cannot add postgres_changes callbacks after
    // subscribe()" error caused by React 18 Strict Mode double-invoking effects:
    // the cleanup removes the old channel, but Supabase's internal registry may
    // still hold a reference to it by name until GC. A random name guarantees
    // we never call .on() on an already-subscribed channel object.
    const channelName = `tasks-${agentId ?? "all"}-${crypto.randomUUID()}`;

    let cancelled = false;

    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (agentId) query = query.eq("assignee_id", agentId);

    query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) setError(error.message);
      else setTasks(data ?? []);
      setLoading(false);
    });

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          ...(agentId ? { filter: `assignee_id=eq.${agentId}` } : {}),
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Task).id ? (payload.new as Task) : t,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) =>
              prev.filter((t) => t.id !== (payload.old as Task).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  return { tasks, loading, error };
}