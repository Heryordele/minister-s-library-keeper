import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Loader2, Search, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stat-card";
import { AdminUsersSection } from "@/components/admin-users-section";
import { AdminNav } from "@/components/admin-nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Minister's Vault" }] }),
  component: AdminPage,
});

const requestsKey = ["admin-institution-requests"] as const;
const superAdminKey = ["is-super-admin"] as const;
const statsKey = ["admin-dashboard-stats"] as const;
const activityKey = ["admin-recent-activity"] as const;

type Status = "all" | "pending" | "approved" | "rejected";

export type Stats = {
  pending: number;
  approved: number;
  rejected: number;
  users: number;
  books: number;
  out_on_loan: number;
  overdue: number;
};

function AdminPage() {
  const qc = useQueryClient();

  const { data: isSuperAdmin, isLoading: checking } = useQuery({
    queryKey: superAdminKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_super_admin");
      if (error) throw error;
      return data === true;
    },
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: requestsKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_institution_requests");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isSuperAdmin === true,
  });

  const { data: stats } = useQuery({
    queryKey: statsKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
    enabled: isSuperAdmin === true,
  });

  const { data: activity } = useQuery({
    queryKey: activityKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_recent_activity", { _limit: 25 });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isSuperAdmin === true,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (requests ?? []).filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.organization_name, r.library_name, r.account_email, r.admin_email].some((v) =>
        v?.toLowerCase().includes(q),
      );
    });
  }, [requests, search, status]);

  const decide = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "approve" | "reject" }) => {
      const { error } =
        action === "approve"
          ? await supabase.rpc("admin_approve_institution_request", { _user_id: userId })
          : await supabase.rpc("admin_reject_institution_request", { _user_id: userId });
      if (error) throw error;
    },
    onSuccess: (_data, { action }) => {
      toast.success(
        action === "approve"
          ? "Approved. The school has been emailed."
          : "Rejected. The school has been emailed.",
      );
      qc.invalidateQueries({ queryKey: requestsKey });
      qc.invalidateQueries({ queryKey: statsKey });
      qc.invalidateQueries({ queryKey: activityKey });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update this request."),
  });

  if (checking) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <>
        <PageHeader title="Admin" subtitle="Super admin only." />
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Nothing to see here"
            body="This page is for the Minister's Vault super admins."
          />
        </div>
      </>
    );
  }

  const all = requests ?? [];
  const pendingCount = all.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Super admin"
        subtitle="Schools, requests, and what's happening across the vault."
      />
      <AdminNav />
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 md:px-8">
        <section aria-label="Overview" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <a href="#schools" className="block transition-opacity hover:opacity-80">
            <StatCard label="Awaiting review" value={stats?.pending ?? "—"} />
          </a>
          <a href="#schools" className="block transition-opacity hover:opacity-80">
            <StatCard label="Approved schools" value={stats?.approved ?? "—"} />
          </a>
          <a href="#users" className="block transition-opacity hover:opacity-80">
            <StatCard label="Users" value={stats?.users ?? "—"} />
          </a>
          <StatCard label="Books catalogued" value={stats?.books ?? "—"} />
          <StatCard label="Out on loan" value={stats?.out_on_loan ?? "—"} />
          <StatCard label="Overdue" value={stats?.overdue ?? "—"} />
          <a href="#schools" className="block transition-opacity hover:opacity-80">
            <StatCard label="Rejected" value={stats?.rejected ?? "—"} />
          </a>
        </section>

        <section id="schools" className="scroll-mt-20">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-semibold">Schools</h2>
              {pendingCount > 0 && <Badge>{pendingCount} to review</Badge>}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search school, library or email"
                  className="pl-8 sm:w-72"
                />
              </div>
              <div className="flex gap-1 rounded-md border border-border p-1">
                {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-medium capitalize",
                      status === s
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : all.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-6 w-6" />}
              title="No school requests yet"
              body="When a school finishes setup and asks for an institution account, it appears here."
            />
          ) : filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              No schools match this search.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {filtered.map((r) => (
                <li
                  key={r.user_id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    to="/admin/$userId"
                    params={{ userId: r.user_id }}
                    className="group min-w-0 flex-1"
                  >
                    <p className="font-serif font-semibold group-hover:underline">
                      {r.organization_name ?? "Unnamed institution"}
                      <ChevronRight className="ml-1 inline h-4 w-4 opacity-50" />
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {r.library_name ? `${r.library_name} · ` : ""}
                      {r.account_email ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant={r.status === "approved" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
                    {r.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          disabled={decide.isPending}
                          onClick={() => decide.mutate({ userId: r.user_id, action: "approve" })}
                        >
                          <Check className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={decide.isPending}
                          onClick={() => decide.mutate({ userId: r.user_id, action: "reject" })}
                        >
                          <X className="mr-2 h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div id="users" className="scroll-mt-20">
          <AdminUsersSection />
        </div>

        <section id="activity" className="scroll-mt-20">
          <h2 className="mb-3 font-serif text-lg font-semibold">Recent activity</h2>
          {(activity ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Approvals and rejections you make will be listed here.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {(activity ?? []).map((a, i) => (
                <li key={`${a.created_at}-${i}`} className="p-3 text-sm">
                  <span className="font-medium">{a.action}</span>
                  {a.target_organization && <span> · {a.target_organization}</span>}
                  <p className="text-xs text-muted-foreground">
                    {a.actor_email} · {new Date(a.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
