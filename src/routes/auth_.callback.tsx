import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Landing page for Google sign-in and email confirmation links. Once the
// session is in place, /reading sends anyone without a role to onboarding.
export const Route = createFileRoute("/auth_/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION covers a session set up from the link before this
      // listener was attached; without a session the link was invalid or expired.
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        window.location.href = "/reading";
      } else if (event === "INITIAL_SESSION" || event === "SIGNED_OUT") {
        window.location.href = "/auth";
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="grid place-items-center min-h-screen">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
