import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, UserCircle, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { SignOutButton } from "@/components/app-shell";
import { StreakBadges } from "@/components/streak-badges";
import { fetchStreak, liveStreakDays, readingStreakKey } from "@/lib/reading";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — Minister's Vault" }] }),
  component: AccountPage,
});

type Profile = {
  name: string | null;
  email: string | null;
  plan: string;
};

function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: streak } = useQuery({
    queryKey: readingStreakKey,
    queryFn: fetchStreak,
  });

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, email, plan")
          .eq("id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .limit(1)
          .maybeSingle(),
      ]);
      setProfile(
        p ?? {
          name: userData.user.user_metadata?.name ?? null,
          email: userData.user.email ?? null,
          plan: "free",
        },
      );
      setRole(r?.role ?? null);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <PageHeader title="Account" subtitle="Your profile and plan." />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
        {loading || !profile ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
                  <UserCircle className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-xl font-semibold">
                    {profile.name ?? "Unnamed reader"}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {profile.email}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
                <Field label="Role">
                  {role ? (
                    <Badge variant="secondary" className="capitalize">
                      {role.replace("_", " ")}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Field>
                <Field label="Plan">
                  <Badge className="capitalize">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    {profile.plan}
                  </Badge>
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">Reading discipline</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current streak {liveStreakDays(streak ?? null)} days · longest{" "}
                {streak?.longest_streak_days ?? 0} days.
              </p>
              <StreakBadges
                longestStreak={streak?.longest_streak_days ?? 0}
                className="mt-4"
              />
            </div>



            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">Session</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign out of this device.
              </p>
              <div className="mt-4">
                <SignOutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
