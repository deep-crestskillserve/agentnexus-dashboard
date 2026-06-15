import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { AgentLog, LogLevel } from "@/types/supabase";

interface UseLogsOptions {
  agentId?: string;
  level?: LogLevel;
  limit?: number;
  search?: string;
}

export function useLogs({
  agentId,
  level,
  limit = 200,
  search,
}: UseLogsOptions = {}) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let query = supabase
      .from("agent_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (agentId) query = query.eq("agent_id", agentId);
    if (level) query = query.eq("level", level);
    if (search) query = query.ilike("message", `%${search}%`);

    query.then(({ data, error }) => {
      if (error) setError(error.message);
      else setLogs(data ?? []);
      setLoading(false);
    });

    const channel = supabase
      .channel(`logs${agentId ? `-${agentId}` : ""}${level ? `-${level}` : ""}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_logs",
          ...(agentId ? { filter: `agent_id=eq.${agentId}` } : {}),
        },
        (payload) => {
          const newLog = payload.new as AgentLog;
          if (level && newLog.level !== level) return;
          if (search && !newLog.message.toLowerCase().includes(search.toLowerCase())) return;
          setLogs((prev) => [newLog, ...prev].slice(0, limit));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, level, limit, search]);

  return { logs, loading, error };
}
