import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, Pencil, UserCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { SignOutButton } from "@/components/app-shell";
import { DataExportCard } from "@/components/data-export-card";
import { StreakBadges } from "@/components/streak-badges";
import { fetchStreak, liveStreakDays, readingStreakKey } from "@/lib/reading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — Minister's Vault" }] }),
  component: AccountPage,
});

type Profile = {
  name: string | null;
  email: string | null;
  plan: string;
  organization_name?: string | null;
  position?: string | null;
  library_name?: string | null;
  admin_email?: string | null;
};

function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [superAdmin, setSuperAdmin] = useState(false);
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
          .select("name, email, plan, organization_name, position, library_name, admin_email")
          .eq("id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
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
      const { data: isAdmin } = await supabase.rpc("is_super_admin");
      setSuperAdmin(isAdmin === true);
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
                  <div className="text-xl font-semibold">{profile.name ?? "Unnamed reader"}</div>
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

            {(role === "minister" || role === "institution_admin") && (
              <SetupDetails
                role={role}
                profile={profile}
                onSaved={(updates) => setProfile({ ...profile, ...updates })}
              />
            )}

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">Reading discipline</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current streak {liveStreakDays(streak ?? null)} days · longest{" "}
                {streak?.longest_streak_days ?? 0} days.
              </p>
              <StreakBadges longestStreak={streak?.longest_streak_days ?? 0} className="mt-4" />
            </div>

            {superAdmin && (
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-semibold">Super admin</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review institution requests and approve or reject schools.
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin">Institution requests</Link>
                  </Button>
                </div>
              </div>
            )}

            <DataExportCard />

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold">Session</h2>
              <p className="mt-1 text-sm text-muted-foreground">Sign out of this device.</p>
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

type SetupKey = "organization_name" | "position" | "library_name" | "admin_email";

const SETUP_FIELDS: Record<
  "minister" | "institution_admin",
  { key: SetupKey; label: string; required?: boolean; type?: string }[]
> = {
  minister: [
    { key: "organization_name", label: "Church / ministry", required: true },
    { key: "position", label: "Position" },
  ],
  institution_admin: [
    { key: "organization_name", label: "Institution", required: true },
    { key: "library_name", label: "Library", required: true },
    { key: "admin_email", label: "Administrator email", type: "email" },
  ],
};

function SetupDetails({
  role,
  profile,
  onSaved,
}: {
  role: "minister" | "institution_admin";
  profile: Profile;
  onSaved: (updates: Partial<Record<SetupKey, string | null>>) => void;
}) {
  const fields = SETUP_FIELDS[role];
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  function startEditing() {
    setValues(Object.fromEntries(fields.map((f) => [f.key, profile[f.key] ?? ""])));
    setEditing(true);
  }

  async function save() {
    const updates: Partial<Record<SetupKey, string | null>> = {};
    for (const f of fields) {
      const value = (values[f.key] ?? "").trim();
      if (f.required && !value) return toast.error(`${f.label} is required.`);
      if (f.type === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
        return toast.error("Enter a valid email address.");
      }
      updates[f.key] = value || null;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("profiles").update(updates).eq("id", userData.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    onSaved(updates);
    setEditing(false);
    toast.success("Details saved.");
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">
          {role === "institution_admin" ? "Institution details" : "Ministry details"}
        </h2>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`setup-${f.key}`}>
                  {f.label}
                  {!f.required && <span className="text-muted-foreground"> (optional)</span>}
                </Label>
                <Input
                  id={`setup-${f.key}`}
                  type={f.type ?? "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {profile[f.key] || <span className="text-muted-foreground">—</span>}
            </Field>
          ))}
        </div>
      )}
    </div>
  );
}
