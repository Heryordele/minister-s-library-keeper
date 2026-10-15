import { supabase } from "@/integrations/supabase/client";
import { buildDataExport, exportFileName, type ExportSources } from "@/lib/data-export-format";
import { fetchStreak } from "@/lib/reading";

const PAGE_SIZE = 1000;

type PagedTable = "books" | "borrow_records" | "reading_goals" | "reading_progress";

/**
 * Reads every row of a table the user can see. Supabase returns at most 1,000
 * rows per request, so this pages until a short page comes back.
 */
async function fetchAllRows(
  table: PagedTable,
  orderBy: "created_at" | "logged_at",
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

/** Gathers the signed-in user's own data. Row-level security limits every query. */
export async function fetchDataExport(): Promise<ReturnType<typeof buildDataExport>> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("You must be signed in to export your data.");

  const [profile, categories, books, lendingRecords, readingGoals, readingProgress, readingStreak] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "name, email, plan, organization_name, position, library_name, admin_email, created_at",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("categories").select("id, name"),
      fetchAllRows("books", "created_at"),
      fetchAllRows("borrow_records", "created_at"),
      fetchAllRows("reading_goals", "created_at"),
      fetchAllRows("reading_progress", "logged_at"),
      fetchStreak(),
    ]);

  if (profile.error) throw profile.error;
  if (categories.error) throw categories.error;

  const sources: ExportSources = {
    profile: profile.data ?? null,
    books,
    categories: (categories.data ?? []) as ExportSources["categories"],
    lendingRecords,
    readingGoals,
    readingProgress,
    readingStreak: readingStreak as Record<string, unknown> | null,
  };
  return buildDataExport(sources, new Date());
}

/** Remembers when the user last exported. Institution accounts need this before they can delete. */
export async function recordExport(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  const { error } = await supabase
    .from("profiles")
    .update({ last_exported_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

/** Saves the export as a JSON file through the browser's download. */
export function downloadDataExport(data: ReturnType<typeof buildDataExport>): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportFileName(new Date(data.exported_at));
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
