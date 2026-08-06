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

/** Marks a book (and its open loan, if any) as lost. */
export async function markLost(bookId: string, recordId?: string | null): Promise<void> {
  if (recordId) {
    const { error } = await supabase
      .from("borrow_records")
      .update({ status: "lost" })
      .eq("id", recordId);
    if (error) throw error;
  }

  const { error: bookError } = await supabase
    .from("books")
    .update({ lending_status: "lost" })
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

/* ----------------------------- borrower history ---------------------------- */

export type BorrowerHistory = {
  key: string;
  name: string;
  organization: string | null;
  phone: string | null;
  email: string | null;
  records: BorrowRecordWithBook[];
  outstanding: number;
};

/** Groups every loan ever made by the person who borrowed it. */
export function groupByBorrower(
  records: BorrowRecordWithBook[],
): BorrowerHistory[] {
  const map = new Map<string, BorrowerHistory>();
  for (const r of records) {
    const key = `${r.borrower_name.trim().toLowerCase()}|${(r.borrower_email ?? "").trim().toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.records.push(r);
      existing.organization ??= r.borrower_organization;
      existing.phone ??= r.borrower_phone;
      existing.email ??= r.borrower_email;
    } else {
      map.set(key, {
        key,
        name: r.borrower_name,
        organization: r.borrower_organization,
        phone: r.borrower_phone,
        email: r.borrower_email,
        records: [r],
        outstanding: 0,
      });
    }
  }
  const list = [...map.values()];
  for (const b of list) {
    b.outstanding = b.records.filter((r) => r.status === "borrowed").length;
  }
  return list.sort(
    (a, b) => b.outstanding - a.outstanding || a.name.localeCompare(b.name),
  );
}

const CSV_HEADERS = [
  "book_title",
  "book_author",
  "borrower_name",
  "borrower_organization",
  "borrower_phone",
  "borrower_email",
  "date_borrowed",
  "expected_return_date",
  "actual_return_date",
  "status",
] as const;

function csvCell(value: string | null | undefined): string {
  const v = value ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** A full lending record set as CSV — a portable receipt of every loan. */
export function borrowRecordsToCsv(records: BorrowRecordWithBook[]): string {
  const rows = records.map((r) =>
    [
      r.books?.title ?? "",
      r.books?.author ?? "",
      r.borrower_name,
      r.borrower_organization,
      r.borrower_phone,
      r.borrower_email,
      r.date_borrowed,
      r.expected_return_date,
      r.actual_return_date,
      effectiveStatus(r),
    ]
      .map(csvCell)
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export function downloadLendingCsv(records: BorrowRecordWithBook[]): void {
  const blob = new Blob([borrowRecordsToCsv(records)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lending-records-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
