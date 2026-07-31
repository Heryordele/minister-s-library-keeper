import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, EmptyState } from "@/components/page-header";
import { BookForm, type BookFormValues } from "@/components/book-form";
import { LendingBadge, ReadingBadge } from "@/components/book-cover";
import { supabase } from "@/integrations/supabase/client";
import { booksKey, fetchBook } from "@/lib/books";
import { LendBookDialog } from "@/components/lend-book-dialog";
import {
  borrowRecordsKey,
  effectiveStatus,
  fetchActiveLoan,
  formatDate,
  markReturned,
} from "@/lib/lending";
import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/books/$bookId")({
  head: () => ({
    meta: [
      { title: "Book details — Minister's Vault" },
      {
        name: "description",
        content: "View, edit, or remove a volume in your ministry library.",
      },
    ],
  }),
  component: BookDetailPage,
});

function BookDetailPage() {
  const { bookId } = useParams({ from: "/_authenticated/books/$bookId" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: book, isLoading } = useQuery({
    queryKey: [...booksKey, bookId],
    queryFn: () => fetchBook(bookId),
  });

  const update = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { error: err } = await supabase
        .from("books")
        .update(values)
        .eq("id", bookId);
      if (err) throw err;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: booksKey });
      toast.success("Changes saved.");
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Could not save changes."),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error: err } = await supabase.from("books").delete().eq("id", bookId);
      if (err) throw err;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: booksKey });
      toast.success("Book removed from your library.");
      navigate({ to: "/library" });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not delete this book."),
  });

  const { data: activeLoan } = useQuery({
    queryKey: [...borrowRecordsKey, bookId],
    queryFn: () => fetchActiveLoan(bookId),
  });

  const returnLoan = useMutation({
    mutationFn: async () => {
      if (!activeLoan) return;
      await markReturned(activeLoan.id, bookId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: booksKey });
      qc.invalidateQueries({ queryKey: borrowRecordsKey });
      toast.success("Book marked as returned.");
    },
    onError: (e) =>
      toast.error(
        e instanceof Error ? e.message : "Could not mark this book returned.",
      ),
  });



  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <EmptyState
          title="Book not found"
          body="This book may have been deleted or does not belong to your library."
          action={
            <Button onClick={() => navigate({ to: "/library" })}>
              Back to library
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={book.title}
        subtitle={book.author ?? "Unknown author"}
        actions={
          <>
            {!activeLoan && (
              <LendBookDialog bookId={book.id} bookTitle={book.title} />
            )}
            <AlertDialog>

            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{book.title}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the book and its record from your
                  library. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep book</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => remove.mutate()}
                  disabled={remove.isPending}
                >
                  Delete book
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/library" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Library
          </Button>
          <ReadingBadge status={book.reading_status} />
          <LendingBadge
            status={
              activeLoan ? effectiveStatus(activeLoan) : book.lending_status
            }
          />
        </div>

        {activeLoan && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-serif font-semibold">
                  Lent to {activeLoan.borrower_name}
                  {activeLoan.borrower_organization
                    ? ` · ${activeLoan.borrower_organization}`
                    : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Borrowed {formatDate(activeLoan.date_borrowed)} · Due{" "}
                  {formatDate(activeLoan.expected_return_date)}
                  {activeLoan.borrower_phone
                    ? ` · ${activeLoan.borrower_phone}`
                    : ""}
                  {activeLoan.borrower_email
                    ? ` · ${activeLoan.borrower_email}`
                    : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={returnLoan.isPending}
                onClick={() => returnLoan.mutate()}
              >
                Mark as returned
              </Button>
            </div>
          </div>
        )}


        <BookForm
          key={book.id}
          book={book}
          submitLabel="Save changes"
          submitting={update.isPending}
          error={error}
          onSubmit={(v) => {
            setError(null);
            update.mutate(v);
          }}
        />
      </div>
    </>
  );
}
