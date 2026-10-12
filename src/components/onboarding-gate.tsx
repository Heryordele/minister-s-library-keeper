import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Building2, Clock, GraduationCap, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SignOutButton } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { fetchInstitutionRequestStatus } from "@/lib/institution-request";
import { cn } from "@/lib/utils";

type Role = "minister" | "student" | "institution_admin";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "needs-role" | "pending" | "ready">("checking");
  const [institutionRejected, setInstitutionRejected] = useState(false);

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
      setInstitutionRejected(request === "rejected");
      setStatus(request === "pending" ? "pending" : "needs-role");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
  if (status === "needs-role") {
    return (
      <RolePicker institutionRejected={institutionRejected} onDone={() => setStatus("ready")} />
    );
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

function RolePicker({
  institutionRejected,
  onDone,
}: {
  institutionRejected: boolean;
  onDone: () => void;
}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!selected) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      return;
    }
    if (selected === "institution_admin") {
      // Institution accounts need approval; the setup form files the request.
      navigate({ to: "/onboarding/institution" });
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userData.user.id, role: selected });
    setSaving(false);
    if (error) return toast.error(error.message);
    onDone();
  }

  const allOptions: { value: Role; title: string; body: string; icon: typeof BookOpen }[] = [
    {
      value: "minister",
      title: "Minister / Pastor",
      body: "Shepherding a congregation and building a lifelong ministry library.",
      icon: BookOpen,
    },
    {
      value: "student",
      title: "Theological student",
      body: "Studying scripture and building your reading foundation.",
      icon: GraduationCap,
    },
    {
      value: "institution_admin",
      title: "Institution / seminary",
      body: "Managing a shared library for a college, seminary, or church.",
      icon: Building2,
    },
  ];
  const options = institutionRejected
    ? allOptions.filter((opt) => opt.value !== "institution_admin")
    : allOptions;

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold">Welcome to your vault</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Which best describes you? You can change this later.
          </p>
          {institutionRejected && (
            <p className="mt-2 text-sm text-muted-foreground">
              Your institution account request wasn't approved. You can still use a personal
              account.
            </p>
          )}
        </div>
        <div
          className={cn("grid gap-4", institutionRejected ? "sm:grid-cols-2" : "md:grid-cols-3")}
        >
          {options.map((opt) => {
            const active = selected === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={cn(
                  "rounded-lg border p-5 text-left transition-all",
                  active
                    ? "border-accent bg-accent/10 shadow-sm ring-2 ring-accent"
                    : "border-border bg-card hover:border-accent/40",
                )}
              >
                <div
                  className={cn(
                    "mb-3 grid h-10 w-10 place-items-center rounded-md",
                    active ? "bg-accent text-accent-foreground" : "bg-muted text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{opt.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{opt.body}</div>
              </button>
            );
          })}
        </div>
        <Button
          className="mt-8 w-full"
          size="lg"
          disabled={!selected || saving}
          onClick={save}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}
