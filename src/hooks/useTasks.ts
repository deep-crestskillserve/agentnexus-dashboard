import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Task } from "@/types/supabase";

export function useTasks(agentId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountId = useRef(0);

  useEffect(() => {
    // Unique channel name per effect invocation prevents the
    // "cannot add postgres_changes callbacks after subscribe()" error
    // that occurs in React 18 Strict Mode (double-invocation of effects).
    mountId.current += 1;
    const channelName = `tasks-changes-${agentId ?? "all"}-${mountId.current}`;

    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (agentId) query = query.eq("assignee_id", agentId);

    query.then(({ data, error }) => {
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
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  return { tasks, loading, error };
}