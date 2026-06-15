import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Event } from "@/types/supabase";

export function useEvents(limit = 100) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setEvents(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel("events-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          setEvents((prev) => [payload.new as Event, ...prev].slice(0, limit));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { events, loading, error };
}
