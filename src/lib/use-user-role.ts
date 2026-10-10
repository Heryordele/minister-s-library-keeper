import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "minister" | "student" | "institution_admin";

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRole() {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user?.id) {
          setRole(null);
          setLoading(false);
          return;
        }

        // A user can hold more than one role row (unique on user_id + role),
        // e.g. after re-picking a role. Use the most recently chosen one.
        const { data, error: err } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (err) throw err;

        setRole((data?.role as AppRole) || null);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to fetch role"));
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, []);

  return { role, loading, error };
}
