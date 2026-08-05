import { supabase } from "@/integrations/supabase/client";

import type { Book, Category } from "@/lib/books";
import { isOverdue, type BorrowRecordWithBook } from "@/lib/lending";
import type { ReadingProgress } from "@/lib/reading";

export const allProgressKey = ["reading_progress", "all"] as const;

export async function fetchAllProgress(): Promise<ReadingProgress[]> {
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Pages read per session. When `start_page` is missing we fall back to the
 * previous session's `current_page` for the same book (and to 0 for the very
 * first session), so sessions that only record a current page still count.
 */
function pagesByEntry(progress: ReadingProgress[]): Map<string, number> {
  const byBook = new Map<string, ReadingProgress[]>();
  for (const entry of progress) {
    const list = byBook.get(entry.book_id) ?? [];
    list.push(entry);
    byBook.set(entry.book_id, list);
  }

  const pages = new Map<string, number>();
  for (const entries of byBook.values()) {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
    );
    let previousPage = 0;
    for (const entry of sorted) {
      const current = entry.current_page ?? previousPage;
      const start = entry.start_page ?? previousPage;
      pages.set(entry.id, Math.max(0, current - start));
      previousPage = Math.max(previousPage, current);
    }
  }
  return pages;
}

export type ReadingDashboardStats = {
  currentlyReading: number;
  completed: number;
  pagesThisMonth: number;
  hoursThisMonth: number;
  mostReadCategory: string | null;
};

export function computeReadingDashboard(
  books: Book[],
  progress: ReadingProgress[],
  categories: Category[],
): ReadingDashboardStats {
  const thisMonth = monthKey(new Date());
  const inMonth = progress.filter(
    (p) => monthKey(new Date(p.logged_at)) === thisMonth,
  );

  const pagesThisMonth = inMonth.reduce((sum, p) => sum + sessionPages(p), 0);
  const minutesThisMonth = inMonth.reduce(
    (sum, p) => sum + (p.reading_time_minutes ?? 0),
    0,
  );

  const categoryPages = categoryPagesRead(books, progress, categories);
  const top = categoryPages[0];

  return {
    currentlyReading: books.filter((b) => b.reading_status === "reading").length,
    completed: books.filter((b) => b.reading_status === "completed").length,
    pagesThisMonth,
    hoursThisMonth: Math.round((minutesThisMonth / 60) * 10) / 10,
    mostReadCategory: top?.pages ? top.name : null,
  };
}

/** Pages logged per category, highest first. */
export function categoryPagesRead(
  books: Book[],
  progress: ReadingProgress[],
  categories: Category[],
): { name: string; pages: number }[] {
  const bookCategory = new Map(books.map((b) => [b.id, b.category_id]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const totals = new Map<string, number>();

  for (const entry of progress) {
    const categoryId = bookCategory.get(entry.book_id);
    const name = categoryId ? (categoryName.get(categoryId) ?? "Uncategorized") : "Uncategorized";
    totals.set(name, (totals.get(name) ?? 0) + sessionPages(entry));
  }

  return [...totals.entries()]
    .map(([name, pages]) => ({ name, pages }))
    .filter((row) => row.pages > 0)
    .sort((a, b) => b.pages - a.pages);
}

export type LibraryStats = {
  total: number;
  read: number;
  reading: number;
  unread: number;
  lentOut: number;
  overdue: number;
  lost: number;
};

export function computeLibraryStats(
  books: Book[],
  records: BorrowRecordWithBook[],
): LibraryStats {
  const overdueIds = new Set(records.filter(isOverdue).map((r) => r.book_id));
  return {
    total: books.length,
    read: books.filter((b) => b.reading_status === "completed").length,
    reading: books.filter((b) => b.reading_status === "reading").length,
    unread: books.filter((b) => b.reading_status === "unread").length,
    lentOut: books.filter(
      (b) => b.lending_status === "borrowed" || b.lending_status === "overdue",
    ).length,
    overdue: books.filter((b) => b.lending_status === "overdue" || overdueIds.has(b.id))
      .length,
    lost: books.filter((b) => b.lending_status === "lost").length,
  };
}

/** Pages logged per month for the last 6 calendar months (oldest first). */
export function readingGrowth(
  progress: ReadingProgress[],
): { month: string; pages: number }[] {
  const now = new Date();
  const buckets: { month: string; key: string; pages: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: d.toLocaleDateString(undefined, { month: "short" }),
      key: monthKey(d),
      pages: 0,
    });
  }
  for (const entry of progress) {
    const key = monthKey(new Date(entry.logged_at));
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.pages += sessionPages(entry);
  }
  return buckets.map(({ month, pages }) => ({ month, pages }));
}
