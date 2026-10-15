export const EXPORT_FORMAT = "ministers-vault-export";
export const EXPORT_VERSION = 1;

export type ExportCategory = { id: string; name: string };

export type ExportSources = {
  profile: Record<string, unknown> | null;
  books: Record<string, unknown>[];
  categories: ExportCategory[];
  lendingRecords: Record<string, unknown>[];
  readingGoals: Record<string, unknown>[];
  readingProgress: Record<string, unknown>[];
  readingStreak: Record<string, unknown> | null;
};

export type DataExport = {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exported_at: string;
  account: Record<string, unknown> | null;
  books: Record<string, unknown>[];
  lending_records: Record<string, unknown>[];
  reading_goals: Record<string, unknown>[];
  reading_progress: Record<string, unknown>[];
  reading_streak: Record<string, unknown> | null;
};

/**
 * Turns the rows read from the database into the export file's structure.
 * Each book gets its category name alongside the category id, so the file
 * can be read without looking up the categories list.
 */
export function buildDataExport(sources: ExportSources, exportedAt: Date): DataExport {
  const categoryName = new Map(sources.categories.map((c) => [c.id, c.name]));

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exported_at: exportedAt.toISOString(),
    account: sources.profile,
    books: sources.books.map((book) => ({
      ...book,
      category_name: categoryName.get(String(book.category_id)) ?? null,
    })),
    lending_records: sources.lendingRecords,
    reading_goals: sources.readingGoals,
    reading_progress: sources.readingProgress,
    reading_streak: sources.readingStreak,
  };
}

/** For example: ministers-vault-export-2026-10-15.json */
export function exportFileName(exportedAt: Date): string {
  return `ministers-vault-export-${exportedAt.toISOString().slice(0, 10)}.json`;
}
