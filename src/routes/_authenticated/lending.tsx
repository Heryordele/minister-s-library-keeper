import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PackageX, Undo2, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { booksKey } from "@/lib/books";
import {
  borrowRecordsKey,
  effectiveStatus,
  fetchBorrowRecords,
  formatDate,
  markLost,
  markReturned,
  syncOverdueBooks,
  type BorrowRecordWithBook,
} from "@/lib/lending";

export const Route = createFileRoute("/_authenticated/lending")({
  head: () => ({
    meta: [
      { title: "Lending — Minister's Vault" },
      {
        name: "description",
        content:
          "Track who borrowed your books, what's overdue, and what's already back on the shelf.",
      },
    ],
  }),
  component: LendingPage,
});

const SECTIONS = [
  { key: "overdue", label: "Overdue" },
  { key: "borrowed", label: "Borrowed" },
  { key: "returned", label: "Returned" },
] as const;

function LendingPage() {
  const qc = useQueryClient();
  const { data: records, isLoading } = useQuery({
    queryKey: borrowRecordsKey,
    queryFn: fetchBorrowRecords,
  });

  useEffect(() => {
    if (!records?.length) return;
    syncOverdueBooks(records)
      .then(() => qc.invalidateQueries({ queryKey: booksKey }))
      .catch(() => undefined);
  }, [records, qc]);

  const grouped = useMemo(() => {
    const map: Record<string, BorrowRecordWithBook[]> = {
      overdue: [],
      borrowed: [],
      returned: [],
    };
    for (const r of records ?? []) {
      const status = effectiveStatus(r);
      if (status === "lost") continue;
      map[status]?.push(r);
    }
    return map;
  }, [records]);

  const total = (records ?? []).length;

  const returnLoan = useMutation({
    mutationFn: ({ id, bookId }: { id: string; bookId: string }) =>
      markReturned(id, bookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowRecordsKey });
      qc.invalidateQueries({ queryKey: booksKey });
      toast.success("Book marked as returned.");
    },
    onError: (e) =>
      toast.error(
        e instanceof Error ? e.message : "Could not mark this book returned.",
      ),
  });

  const reportLost = useMutation({
    mutationFn: ({ id, bookId }: { id: string; bookId: string }) =>
      markLost(bookId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowRecordsKey });
      qc.invalidateQueries({ queryKey: booksKey });
      toast.success("Book marked as lost.");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not mark this book lost."),
  });

  return (
    <>
      <PageHeader
        title="Lending"
        subtitle="Who has your books — and when they're due home."
      />
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : total === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No books out on loan"
            body="Open a book in your library and choose “Lend this book” to start keeping track."
            action={
              <Button asChild>
                <Link to="/library">Go to library</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-10">
            {SECTIONS.map(({ key, label }) => (
              <section key={key}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-serif text-lg font-semibold">{label}</h2>
                  <Badge variant="secondary">{grouped[key].length}</Badge>
                </div>
                {grouped[key].length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    {key === "returned"
                      ? "No books have come back yet."
                      : key === "overdue"
                        ? "Nothing is past its return date. "
                        : "No books are currently out on loan."}
                  </p>
                ) : (
                  <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                    {grouped[key].map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <Link
                            to="/books/$bookId"
                            params={{ bookId: r.book_id }}
                            className="font-serif font-semibold hover:underline"
                          >
                            {r.books?.title ?? "Untitled book"}
                          </Link>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            Lent to {r.borrower_name}
                            {r.borrower_organization
                              ? ` · ${r.borrower_organization}`
                              : ""}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Borrowed {formatDate(r.date_borrowed)} · Due{" "}
                            {formatDate(r.expected_return_date)}
                            {r.actual_return_date
                              ? ` · Returned ${formatDate(r.actual_return_date)}`
                              : ""}
                          </p>
                        </div>
                        {key !== "returned" && (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={returnLoan.isPending}
                              onClick={() =>
                                returnLoan.mutate({ id: r.id, bookId: r.book_id })
                              }
                            >
                              <Undo2 className="mr-2 h-4 w-4" /> Mark as returned
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={reportLost.isPending}
                              onClick={() =>
                                reportLost.mutate({ id: r.id, bookId: r.book_id })
                              }
                            >
                              <PackageX className="mr-2 h-4 w-4" /> Mark as lost
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
