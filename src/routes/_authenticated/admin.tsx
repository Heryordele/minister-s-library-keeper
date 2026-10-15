import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Minister's Vault" }] }),
  component: AdminPage,
});

const requestsKey = ["admin-institution-requests"] as const;
const superAdminKey = ["is-super-admin"] as const;

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

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const decided = (requests ?? []).filter((r) => r.status !== "pending");

  return (
    <>
      <PageHeader
        title="Institution requests"
        subtitle="Review schools that asked for an institution admin account."
      />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (requests ?? []).length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No requests yet"
            body="When a school finishes setup and asks for an institution account, it appears here."
          />
        ) : (
          <>
            <RequestList
              title="Awaiting review"
              rows={pending}
              busy={decide.isPending}
              onDecide={(userId, action) => decide.mutate({ userId, action })}
            />
            <RequestList title="Decided" rows={decided} busy={false} />
          </>
        )}
      </div>
    </>
  );
}

type Row = {
  user_id: string;
  status: string;
  created_at: string;
  account_email: string | null;
  organization_name: string | null;
  library_name: string | null;
  admin_email: string | null;
};

function RequestList({
  title,
  rows,
  busy,
  onDecide,
}: {
  title: string;
  rows: Row[];
  busy: boolean;
  onDecide?: (userId: string, action: "approve" | "reject") => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-serif text-lg font-semibold">{title}</h2>
        <Badge variant="secondary">{rows.length}</Badge>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Nothing here.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {rows.map((r) => (
            <li
              key={r.user_id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-serif font-semibold">
                  {r.organization_name ?? "Unnamed institution"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {r.library_name ? `${r.library_name} · ` : ""}Account: {r.account_email ?? "—"}
                </p>
                {r.admin_email && (
                  <p className="text-xs text-muted-foreground">Administrator: {r.admin_email}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Requested {new Date(r.created_at).toLocaleDateString()} · {r.status}
                </p>
              </div>
              {r.status === "pending" && onDecide && (
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" disabled={busy} onClick={() => onDecide(r.user_id, "approve")}>
                    <Check className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => onDecide(r.user_id, "reject")}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
