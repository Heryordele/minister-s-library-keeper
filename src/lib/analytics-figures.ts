export type AnalyticsFigures = {
  /** Logged reading time this calendar month, in hours (one decimal place). */
  hoursThisMonth: number;
  /** Finished books as a share of books started (reading or finished). Null until a book is started. */
  completionRate: number | null;
  currentStreak: number;
  longestStreak: number;
};

export type AnalyticsInput = {
  books: { reading_status: string }[];
  progress: { logged_at: string; reading_time_minutes: number | null }[];
  currentStreak: number;
  longestStreak: number;
};

/** The figures behind the analytics page's stat cards. */
export function computeAnalyticsFigures(input: AnalyticsInput, now = new Date()): AnalyticsFigures {
  const minutes = input.progress
    .filter((p) => {
      const at = new Date(p.logged_at);
      return at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth();
    })
    .reduce((sum, p) => sum + (p.reading_time_minutes ?? 0), 0);

  const completed = input.books.filter((b) => b.reading_status === "completed").length;
  const started = input.books.filter(
    (b) => b.reading_status === "completed" || b.reading_status === "reading",
  ).length;

  return {
    hoursThisMonth: Math.round((minutes / 60) * 10) / 10,
    completionRate: started > 0 ? Math.round((completed / started) * 100) : null,
    currentStreak: input.currentStreak,
    longestStreak: input.longestStreak,
  };
}
