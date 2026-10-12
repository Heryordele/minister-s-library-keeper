import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SignOutButton } from "@/components/app-shell";
import { fetchInstitutionRequestStatus } from "@/lib/institution-request";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "pending" | "ready">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .limit(1);
      if (cancelled) return;
      if (roles && roles.length > 0) return setStatus("ready");

      // No role yet: an institution request may be awaiting approval.
      const request = await fetchInstitutionRequestStatus(userData.user.id);
      if (cancelled) return;
      if (request === "pending") return setStatus("pending");

      // Everyone without a role goes through the one onboarding flow.
      navigate({ to: "/onboarding/role-select", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (status === "pending") {
    return <AwaitingApproval />;
  }
  return <>{children}</>;
}

function AwaitingApproval() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold">Awaiting approval</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Institution accounts are reviewed before the library dashboard unlocks. We'll let you in
          as soon as your request is approved.
        </p>
        <SignOutButton className="mt-6" />
      </div>
    </div>
  );
}
