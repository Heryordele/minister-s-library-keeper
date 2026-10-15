export type ReadingFrequency = {
  /** Distinct calendar days with a logged session in the last 30 days. */
  daysReadLast30: number;
  /** Logged sessions in the last 7 days, today included. */
  sessionsLast7: number;
  /** Average logged sessions per week over the last 4 weeks. */
  sessionsPerWeek: number;
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** How often the user reads, counted from their logged sessions. */
export function computeReadingFrequency(
  progress: { logged_at: string }[],
  now = new Date(),
): ReadingFrequency {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const daysAgo = (n: number) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - n);
    return d;
  };
  const last30 = daysAgo(29);
  const last7 = daysAgo(6);
  const last28 = daysAgo(27);

  const days = new Set<string>();
  let sessionsLast7 = 0;
  let sessionsLast28 = 0;
  for (const entry of progress) {
    const at = new Date(entry.logged_at);
    if (at >= last30) days.add(dayKey(at));
    if (at >= last7) sessionsLast7++;
    if (at >= last28) sessionsLast28++;
  }

  return {
    daysReadLast30: days.size,
    sessionsLast7,
    sessionsPerWeek: Math.round((sessionsLast28 / 4) * 10) / 10,
  };
}
