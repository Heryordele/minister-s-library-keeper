export type StreakStatus = {
  state: "none" | "active" | "at-risk" | "reset";
  message: string;
};

export type StreakStatusInput = {
  /** The last calendar day (YYYY-MM-DD) with a logged session, or null. */
  lastLoggedDate: string | null;
  /** The streak as stored, before checking whether it is still live. */
  currentStreak: number;
  longestStreak: number;
  /** Today's date (YYYY-MM-DD). Passed in so the logic can be tested. */
  today: string;
};

const DAY_MS = 86_400_000;

/** Whole days since 1970 for a YYYY-MM-DD string, so two dates can be subtracted. */
function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Explains the streak in plain words: whether it is active, at risk of
 * ending today, or has already reset, and what the user can do about it.
 */
export function streakStatus(input: StreakStatusInput): StreakStatus {
  const { lastLoggedDate, currentStreak, longestStreak, today } = input;

  if (!lastLoggedDate) {
    return { state: "none", message: "Log a reading session to start your streak." };
  }

  const gap = dayNumber(today) - dayNumber(lastLoggedDate);

  if (gap <= 0) {
    return {
      state: "active",
      message: `You've read today. Log a session tomorrow to reach ${currentStreak + 1} days.`,
    };
  }

  if (gap === 1) {
    return {
      state: "at-risk",
      message: `Log a session today to keep your ${currentStreak}-day streak going.`,
    };
  }

  const missed = gap - 1;
  return {
    state: "reset",
    message:
      `Your streak reset: no reading was logged for ${missed} ${missed === 1 ? "day" : "days"} ` +
      `after ${formatDay(lastLoggedDate)}. Log a session today to start a new one. ` +
      `Your longest streak of ${longestStreak} days is kept.`,
  };
}
