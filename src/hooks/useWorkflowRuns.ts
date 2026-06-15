import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { WorkflowRun } from "@/types/supabase";

export function useWorkflowRuns(agentId?: string) {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let query = supabase
      .from("workflow_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(100);

    if (agentId) query = query.eq("agent_id", agentId);

    query.then(({ data, error }) => {
      if (error) setError(error.message);
      else setRuns(data ?? []);
      setLoading(false);
    });

    const channel = supabase
      .channel(`workflow-runs${agentId ? `-${agentId}` : ""}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workflow_runs",
          ...(agentId ? { filter: `agent_id=eq.${agentId}` } : {}),
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRuns((prev) => [payload.new as WorkflowRun, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRuns((prev) =>
              prev.map((r) =>
                r.id === (payload.new as WorkflowRun).id
                  ? (payload.new as WorkflowRun)
                  : r,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setRuns((prev) =>
              prev.filter((r) => r.id !== (payload.old as WorkflowRun).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  return { runs, loading, error };
}
