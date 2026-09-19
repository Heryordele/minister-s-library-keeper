import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.href = "/reading";
      } else if (event === "SIGNED_OUT") {
        window.location.href = "/auth";
      }
    });
  }, []);

  return (
    <div className="grid place-items-center min-h-screen">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
