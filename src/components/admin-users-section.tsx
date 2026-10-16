import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setUserSuspended } from "@/lib/admin-users.functions";

const usersKey = ["admin-users"] as const;
const activityKey = ["admin-recent-activity"] as const;

const ROLE_FILTERS = [
  { value: "all", label: "All roles" },
  { value: "minister", label: "Ministers" },
  { value: "student", label: "Students" },
  { value: "institution_admin", label: "Institutions" },
  { value: "none", label: "No role" },
] as const;

const ROLE_LABELS: Record<string, string> = {
  minister: "Minister",
  student: "Student",
  institution_admin: "Institution",
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "Never";
}

/**
 * Every account on the platform. Super admins can search, filter by role,
 * set a minister or student role, and suspend or restore accounts.
 */
export function AdminUsersSection() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const setSuspended = useServerFn(setUserSuspended);

  const { data: users, isLoading } = useQuery({
    queryKey: [...usersKey, search, roleFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", {
        _search: search,
        _limit: 200,
        _role: roleFilter === "all" ? undefined : roleFilter,
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  const change = useMutation({
    mutationFn: ({ userId, suspended }: { userId: string; suspended: boolean }) =>
      setSuspended({ data: { userId, suspended } }),
    onSuccess: (_result, { suspended }) => {
      qc.invalidateQueries({ queryKey: usersKey });
      qc.invalidateQueries({ queryKey: activityKey });
      toast.success(suspended ? "Account suspended. They can't sign in." : "Account restored.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update this account."),
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "minister" | "student" }) => {
      const { error } = await supabase.rpc("admin_set_user_role", {
        _user_id: userId,
        _role: role,
      });
      if (error) throw error;
    },
    onSuccess: (_result, { role }) => {
      qc.invalidateQueries({ queryKey: usersKey });
      qc.invalidateQueries({ queryKey: activityKey });
      toast.success(`Role set to ${ROLE_LABELS[role]}.`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not change this role."),
  });

  function confirmAndChange(userId: string, suspended: boolean) {
    if (
      suspended &&
      !window.confirm("Suspend this account? They won't be able to sign in until you restore it.")
    ) {
      return;
    }
    change.mutate({ userId, suspended });
  }

  return (
    <section>
      <div className="mb-3 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-semibold">Users</h2>
            {users && <Badge variant="secondary">{users.length}</Badge>}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, school or email"
              className="pl-8 sm:w-72"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1 rounded-md border border-border p-1 sm:w-fit">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setRoleFilter(f.value)}
              className={
                roleFilter === f.value
                  ? "rounded bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                  : "rounded px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (users ?? []).length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          No accounts match this search and filter.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {(users ?? []).map((u) => {
            const suspended = u.suspended_at !== null;
            const isInstitution = u.role === "institution_admin";
            return (
              <li
                key={u.user_id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-serif font-semibold">{u.name ?? "Unnamed reader"}</p>
                  <p className="mt-0.5 break-all text-sm text-muted-foreground">
                    {u.email}
                    {u.organization_name ? ` · ${u.organization_name}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {u.plan} · Joined {formatDate(u.created_at)} · Last sign-in{" "}
                    {formatDate(u.last_sign_in_at)} · {u.book_count}{" "}
                    {u.book_count === 1 ? "book" : "books"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isInstitution ? (
                    <Badge variant="secondary">Institution</Badge>
                  ) : (
                    <select
                      aria-label={`Role for ${u.email}`}
                      value={u.role ?? ""}
                      disabled={setRole.isPending}
                      onChange={(e) =>
                        setRole.mutate({
                          userId: u.user_id,
                          role: e.target.value as "minister" | "student",
                        })
                      }
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {u.role === null && <option value="">No role</option>}
                      <option value="minister">Minister</option>
                      <option value="student">Student</option>
                    </select>
                  )}
                  <Badge variant={suspended ? "destructive" : "secondary"}>
                    {suspended ? "Suspended" : "Active"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={change.isPending}
                    onClick={() => confirmAndChange(u.user_id, !suspended)}
                  >
                    {suspended ? "Restore" : "Suspend"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
