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

        const { data, error: err } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.user.id)
          .single();

        if (err && err.code !== "PGRST116") throw err; // PGRST116 = no rows found

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
