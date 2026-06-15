import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Agent } from "@/types/supabase";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setAgents(data ?? []);
        setLoading(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel("agents-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAgents((prev) => [payload.new as Agent, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setAgents((prev) =>
              prev.map((a) =>
                a.id === (payload.new as Agent).id ? (payload.new as Agent) : a,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setAgents((prev) =>
              prev.filter((a) => a.id !== (payload.old as Agent).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { agents, loading, error };
}
