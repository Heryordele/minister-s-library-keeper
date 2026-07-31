import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BorrowRecord = Tables<"borrow_records">;
export type BorrowRecordWithBook = BorrowRecord & {
  books: { id: string; title: string; author: string | null } | null;
};

export const borrowRecordsKey = ["borrow_records"] as const;

export type LendInput = {
  borrower_name: string;
  borrower_phone: string | null;
  borrower_email: string | null;
  borrower_organization: string | null;
  expected_return_date: string | null;
};

/** A record is overdue when it's still out and its expected return date has passed. */
export function isOverdue(record: BorrowRecord): boolean {
  if (record.status !== "borrowed" || !record.expected_return_date) return false;
  const due = new Date(`${record.expected_return_date}T23:59:59`);
  return due.getTime() < Date.now();
}

export function effectiveStatus(record: BorrowRecord): "borrowed" | "overdue" | "returned" | "lost" {
  if (isOverdue(record)) return "overdue";
  return record.status;
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function fetchBorrowRecords(): Promise<BorrowRecordWithBook[]> {
  const { data, error } = await supabase
    .from("borrow_records")
    .select("*, books(id, title, author)")
    .order("date_borrowed", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BorrowRecordWithBook[];
}

export async function fetchActiveLoan(bookId: string): Promise<BorrowRecord | null> {
  const { data, error } = await supabase
    .from("borrow_records")
    .select("*")
    .eq("book_id", bookId)
    .eq("status", "borrowed")
    .order("date_borrowed", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function lendBook(bookId: string, input: LendInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData.user?.id;
  if (!ownerId) throw new Error("You must be signed in to lend a book.");

  const { error } = await supabase.from("borrow_records").insert({
    book_id: bookId,
    owner_id: ownerId,
    borrower_name: input.borrower_name,
    borrower_phone: input.borrower_phone,
    borrower_email: input.borrower_email,
    borrower_organization: input.borrower_organization,
    expected_return_date: input.expected_return_date,
    date_borrowed: new Date().toISOString().slice(0, 10),
    status: "borrowed",
  });
  if (error) throw error;

  const { error: bookError } = await supabase
    .from("books")
    .update({ lending_status: "borrowed" })
    .eq("id", bookId);
  if (bookError) throw bookError;
}

export async function markReturned(recordId: string, bookId: string): Promise<void> {
  const { error } = await supabase
    .from("borrow_records")
    .update({
      status: "returned",
      actual_return_date: new Date().toISOString().slice(0, 10),
    })
    .eq("id", recordId);
  if (error) throw error;

  const { error: bookError } = await supabase
    .from("books")
    .update({ lending_status: "available" })
    .eq("id", bookId);
  if (bookError) throw bookError;
}

/** Keep books whose loan has passed its due date flagged as overdue. */
export async function syncOverdueBooks(records: BorrowRecordWithBook[]): Promise<void> {
  const overdueBookIds = records.filter(isOverdue).map((r) => r.book_id);
  if (overdueBookIds.length === 0) return;
  await supabase
    .from("books")
    .update({ lending_status: "overdue" })
    .in("id", overdueBookIds)
    .eq("lending_status", "borrowed");
}
