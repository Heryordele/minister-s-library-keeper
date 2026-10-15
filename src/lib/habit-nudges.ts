/**
 * Habit-accountability nudges (PRD FR-014): an escalating sequence sent on the
 * 1st, 3rd and 7th full day without reading progress, then nothing more until
 * the reader logs again.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type HabitNudge = { day: 1 | 3 | 7; message: string };

/** Calendar date (UTC) of a timestamp or YYYY-MM-DD string, as midnight UTC. */
function utcDay(value: string | Date): number {
  const iso = typeof value === "string" ? value : value.toISOString();
  return Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
}

/**
 * Full days with no reading since `lastActivity`, counted up to (not
 * including) `today`. Reading on Monday and checking on Wednesday means
 * Tuesday was missed: 1 day.
 */
export function missedDays(lastActivity: string | Date, today: Date): number {
  return Math.max(0, Math.round((utcDay(today) - utcDay(lastActivity)) / DAY_MS) - 1);
}

function formatDay(value: string | Date): string {
  return new Date(utcDay(value)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The nudge due today, if any. The last-activity date is part of the message,
 * so each lapse gets its own Day 1/3/7 messages and the sweep's
 * per-message de-duplication never blocks a later lapse.
 */
export function habitNudgeFor(
  lastActivity: string | Date,
  today: Date,
  sinceLabel: "Last reading" | "Goal set" = "Last reading",
): HabitNudge | null {
  const missed = missedDays(lastActivity, today);
  const since = `${sinceLabel}: ${formatDay(lastActivity)}`;
  if (missed === 1) {
    return {
      day: 1,
      message: `You missed yesterday's reading target. A few faithful pages today keep your goal moving steadily forward. (${since}.)`,
    };
  }
  if (missed === 3) {
    return {
      day: 3,
      message: `It's been 3 days without reading, so your streak is at risk. One short reading today brings it back. (${since}.)`,
    };
  }
  if (missed === 7) {
    return {
      day: 7,
      message: `It's been a week without reading. Your books are waiting patiently; even ten minutes today begins a fresh rhythm. (${since}.)`,
    };
  }
  return null;
}
