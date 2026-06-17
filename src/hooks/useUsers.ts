import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@/types/supabase";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setUsers(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setUsers((prev) => [...prev, payload.new as User].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === "UPDATE") {
            setUsers((prev) =>
              prev.map((u) => (u.id === (payload.new as User).id ? (payload.new as User) : u)),
            );
          } else if (payload.eventType === "DELETE") {
            setUsers((prev) => prev.filter((u) => u.id !== (payload.old as User).id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { users, loading, error };
}