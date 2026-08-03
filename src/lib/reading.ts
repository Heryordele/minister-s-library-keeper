import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ReadingGoal = Tables<"reading_goals">;
export type ReadingProgress = Tables<"reading_progress">;
export type ReadingStreak = Tables<"reading_streaks">;

export const GOAL_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
] as const;
export const GOAL_UNITS = ["pages", "books"] as const;

export type GoalPeriod = (typeof GOAL_PERIODS)[number];
export type GoalUnit = (typeof GOAL_UNITS)[number];

export const readingGoalsKey = ["reading_goals"] as const;
export const readingProgressKey = ["reading_progress"] as const;
export const readingStreakKey = ["reading_streaks"] as const;

export const MILESTONES = [7, 30, 100] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const ms =
    new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("You must be signed in to do that.");
  return id;
}

/* ---------------------------------- goals --------------------------------- */

export async function fetchGoals(): Promise<ReadingGoal[]> {
  const { data, error } = await supabase
    .from("reading_goals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type GoalInput = {
  period: GoalPeriod;
  target_value: number;
  target_unit: GoalUnit;
  start_date: string;
};

export async function saveGoal(input: GoalInput, id?: string): Promise<void> {
  const userId = await requireUserId();
  if (id) {
    const { error } = await supabase
      .from("reading_goals")
      .update(input)
      .eq("id", id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("reading_goals")
    .insert({ ...input, user_id: userId });
  if (error) throw error;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from("reading_goals").delete().eq("id", id);
  if (error) throw error;
}

export function describeGoal(goal: ReadingGoal): string {
  const per =
    goal.period === "daily"
      ? "per day"
      : goal.period === "weekly"
        ? "per week"
        : goal.period === "monthly"
          ? "per month"
          : goal.period === "quarterly"
            ? "per quarter"
            : "per year";
  return `${goal.target_value} ${goal.target_unit} ${per}`;
}

/* -------------------------------- progress -------------------------------- */

export async function fetchProgressForBook(
  bookId: string,
): Promise<ReadingProgress[]> {
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("book_id", bookId)
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentProgress(
  limit = 20,
): Promise<ReadingProgress[]> {
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .order("logged_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export type ProgressInput = {
  book_id: string;
  current_page: number;
  total_pages: number | null;
  start_page: number | null;
  reading_time_minutes: number | null;
  notes: string | null;
  key_lessons: string | null;
};

export async function logProgress(input: ProgressInput): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("reading_progress")
    .insert({ ...input, user_id: userId });
  if (error) throw error;
  await recordStreakDay(userId);
}

/** Aggregate stats for one book from its logged sessions. */
export type BookReadingStats = {
  currentPage: number;
  totalPages: number | null;
  percentComplete: number | null;
  pagesRemaining: number | null;
  pagesRead: number;
  minutes: number;
  pagesPerHour: number | null;
  sessions: number;
};

export function computeBookStats(entries: ReadingProgress[]): BookReadingStats {
  const sorted = [...entries].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  const last = sorted[sorted.length - 1];
  const currentPage = last?.current_page ?? 0;
  const totalPages =
    [...sorted].reverse().find((e) => e.total_pages)?.total_pages ?? null;
  const firstStart = sorted.find((e) => e.start_page != null)?.start_page ?? 0;
  const pagesRead = Math.max(0, currentPage - firstStart);
  const minutes = sorted.reduce(
    (sum, e) => sum + (e.reading_time_minutes ?? 0),
    0,
  );
  return {
    currentPage,
    totalPages,
    percentComplete:
      totalPages && totalPages > 0
        ? Math.min(100, Math.round((currentPage / totalPages) * 100))
        : null,
    pagesRemaining:
      totalPages && totalPages > 0 ? Math.max(0, totalPages - currentPage) : null,
    pagesRead,
    minutes,
    pagesPerHour:
      minutes > 0 && pagesRead > 0
        ? Math.round((pagesRead / minutes) * 60)
        : null,
    sessions: sorted.length,
  };
}

/* --------------------------------- streaks -------------------------------- */

export async function fetchStreak(): Promise<ReadingStreak | null> {
  const { data, error } = await supabase
    .from("reading_streaks")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Increment on consecutive days, reset after a gap, keep the longest run. */
export async function recordStreakDay(userId: string): Promise<void> {
  const day = today();
  const existing = await fetchStreak();

  if (!existing) {
    const { error } = await supabase.from("reading_streaks").insert({
      user_id: userId,
      current_streak_days: 1,
      longest_streak_days: 1,
      last_logged_date: day,
    });
    if (error) throw error;
    return;
  }

  if (existing.last_logged_date === day) return;

  const gap = existing.last_logged_date
    ? daysBetween(existing.last_logged_date, day)
    : null;
  const current = gap === 1 ? existing.current_streak_days + 1 : 1;

  const { error } = await supabase
    .from("reading_streaks")
    .update({
      current_streak_days: current,
      longest_streak_days: Math.max(existing.longest_streak_days, current),
      last_logged_date: day,
    })
    .eq("id", existing.id);
  if (error) throw error;
}

/** A stored streak goes stale once a day is missed — show it as broken. */
export function liveStreakDays(streak: ReadingStreak | null): number {
  if (!streak || !streak.last_logged_date) return 0;
  const gap = daysBetween(streak.last_logged_date, today());
  return gap <= 1 ? streak.current_streak_days : 0;
}

export function earnedMilestones(streak: ReadingStreak | null): number[] {
  const best = streak?.longest_streak_days ?? 0;
  return MILESTONES.filter((m) => best >= m);
}

export function milestoneLabel(days: number): string {
  if (days === 7) return "Faithful Week";
  if (days === 30) return "Steady Month";
  return "Century of Days";
}
