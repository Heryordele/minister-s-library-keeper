import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  Camera,
  HandCoins,
  Library,
  Plus,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/use-user-role";
import { borrowRecordsKey, effectiveStatus, fetchBorrowRecords } from "@/lib/lending";

/**
 * Role-specific shortcuts shown above the reading dashboard. Every role lands
 * on the same reading dashboard (PRD FR-013); this row adds the actions and
 * summaries each role reaches for most.
 */
export function RoleShortcuts({ role }: { role: AppRole }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      {role === "minister" && <MinisterShortcuts />}
      {role === "student" && <StudentShortcuts />}
      {role === "institution_admin" && <InstitutionShortcuts />}
    </section>
  );
}

function ScanAndAdd({ addLabel = "Add a book" }: { addLabel?: string }) {
  return (
    <>
      <Button asChild size="sm">
        <Link to="/books/scan">
          <Camera className="mr-2 h-4 w-4" /> Scan a barcode
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/books/new" search={{ isbn: undefined }}>
          <Plus className="mr-2 h-4 w-4" /> {addLabel}
        </Link>
      </Button>
    </>
  );
}

function LendingSummary() {
  const { data: records } = useQuery({ queryKey: borrowRecordsKey, queryFn: fetchBorrowRecords });
  const statuses = (records ?? []).map(effectiveStatus);
  const out = statuses.filter((s) => s === "borrowed" || s === "overdue").length;
  const overdue = statuses.filter((s) => s === "overdue").length;

  return (
    <p className="text-sm text-muted-foreground">
      {out === 0 ? (
        "No books out on loan."
      ) : (
        <>
          {out} {out === 1 ? "book" : "books"} out on loan
          {overdue > 0 && (
            <>
              {" · "}
              <span className="font-medium text-destructive">{overdue} overdue</span>
            </>
          )}
          .
        </>
      )}
    </p>
  );
}

function MinisterShortcuts() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <LendingSummary />
      <div className="flex flex-wrap gap-2">
        <ScanAndAdd />
        <Button asChild variant="outline" size="sm">
          <Link to="/lending">
            <HandCoins className="mr-2 h-4 w-4" /> Lending
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StudentShortcuts() {
  return (
    <div className="flex flex-wrap gap-2">
      <ScanAndAdd />
      <Button asChild variant="outline" size="sm">
        <Link to="/library">
          <Library className="mr-2 h-4 w-4" /> Library
        </Link>
      </Button>
    </div>
  );
}

function InstitutionShortcuts() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LendingSummary />
        <div className="flex flex-wrap gap-2">
          <ScanAndAdd addLabel="Add books" />
          <Button asChild variant="outline" size="sm">
            <Link to="/analytics">
              <BarChart3 className="mr-2 h-4 w-4" /> Reports
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/account">
              <Settings className="mr-2 h-4 w-4" /> Institution settings
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Users className="mr-2 h-4 w-4" /> Manage users (coming soon)
          </Button>
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        Shared libraries and multi-user access for institutions are coming in a later phase.
      </p>
    </div>
  );
}
