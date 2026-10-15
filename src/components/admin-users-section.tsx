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

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "Never";
}

/** Every account on the platform, with suspend and restore for super admins. */
export function AdminUsersSection() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const setSuspended = useServerFn(setUserSuspended);

  const { data: users, isLoading } = useQuery({
    queryKey: [...usersKey, search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", {
        _search: search,
        _limit: 200,
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
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {isLoading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (users ?? []).length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          No accounts match this search.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {(users ?? []).map((u) => {
            const suspended = u.suspended_at !== null;
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
                <div className="flex shrink-0 items-center gap-2">
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
