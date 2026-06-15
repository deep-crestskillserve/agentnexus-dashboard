import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Metric } from "@/types/supabase";

export function useMetrics(agentId?: string) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let query = supabase
      .from("metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (agentId) query = query.eq("agent_id", agentId);

    query.then(({ data, error }) => {
      if (error) setError(error.message);
      else setMetrics(data ?? []);
      setLoading(false);
    });

    const channel = supabase
      .channel(`metrics${agentId ? `-${agentId}` : ""}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "metrics",
          ...(agentId ? { filter: `agent_id=eq.${agentId}` } : {}),
        },
        (payload) => {
          setMetrics((prev) => [payload.new as Metric, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  // Aggregates
  const totalTokens = metrics.reduce((s, m) => s + (m.tokens_used ?? 0), 0);
  const totalCost = metrics.reduce((s, m) => s + (m.cost ?? 0), 0);
  const avgExecTime =
    metrics.length > 0
      ? metrics.reduce((s, m) => s + (m.execution_time ?? 0), 0) / metrics.length
      : 0;

  return { metrics, loading, error, totalTokens, totalCost, avgExecTime };
}
