import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";

export const Route = createFileRoute("/_authenticated/admin/$userId")({
  head: () => ({ meta: [{ title: "School — Minister's Vault" }] }),
  component: SchoolDetailPage,
});

type SchoolDetail = {
  account_email: string | null;
  organization_name: string | null;
  library_name: string | null;
  administrator_email: string | null;
  joined: string | null;
  request_status: string | null;
  requested: string | null;
  reviewed: string | null;
  books: number;
  books_added_30_days: number;
  out_on_loan: number;
  overdue: number;
  returned: number;
  lost: number;
};

function SchoolDetailPage() {
  const { userId } = Route.useParams();

  const { data: isSuperAdmin, isLoading: checking } = useQuery({
    queryKey: ["is-super-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_super_admin");
      if (error) throw error;
      return data === true;
    },
  });

  const { data: school, isLoading } = useQuery({
    queryKey: ["admin-school-detail", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_school_detail", { _user_id: userId });
      if (error) throw error;
      return data as unknown as SchoolDetail;
    },
    enabled: isSuperAdmin === true,
  });

  if (checking || isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin || !school) {
    return (
      <>
        <PageHeader title="School" subtitle="Super admin only." />
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

  const fmt = (v: string | null) => (v ? new Date(v).toLocaleDateString() : "—");

  return (
    <>
      <PageHeader
        title={school.organization_name ?? "Unnamed institution"}
        subtitle={school.library_name ?? "Institution account"}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" /> All schools
            </Link>
          </Button>
        }
      />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-lg font-semibold">Account</h2>
            {school.request_status && (
              <Badge
                variant={school.request_status === "approved" ? "default" : "secondary"}
                className="capitalize"
              >
                {school.request_status}
              </Badge>
            )}
          </div>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Sign-in email
              </dt>
              <dd className="mt-1 break-all">{school.account_email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Administrator email
              </dt>
              <dd className="mt-1 break-all">{school.administrator_email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Requested</dt>
              <dd className="mt-1">{fmt(school.requested)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Decided</dt>
              <dd className="mt-1">{fmt(school.reviewed)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Joined</dt>
              <dd className="mt-1">{fmt(school.joined)}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-lg font-semibold">Library</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Books catalogued" value={school.books} />
            <StatCard label="Added in 30 days" value={school.books_added_30_days} />
            <StatCard label="Out on loan" value={school.out_on_loan} />
            <StatCard label="Overdue" value={school.overdue} />
            <StatCard label="Returned" value={school.returned} />
            <StatCard label="Lost" value={school.lost} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Counts only. Borrower names and contact details stay private to the school.
          </p>
        </section>
      </div>
    </>
  );
}
