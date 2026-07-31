import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Notification = Tables<"notifications">;
export type NotificationType = Notification["type"];

export const notificationsKey = ["notifications"] as const;

/** In-app delivery only for now; "push" is the closest channel in the schema. */
const IN_APP_CHANNEL = "push" as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDay(value: string): Date {
  const d = new Date(value.length > 10 ? value : `${value}T00:00:00`);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;
}

type Pending = { type: NotificationType; message: string };

/**
 * Builds the notifications the current data warrants. Messages are deterministic
 * so an identical message is never inserted twice (our de-duplication key).
 */
async function buildPending(userId: string): Promise<Pending[]> {
  const pending: Pending[] = [];
  const now = today();

  // --- Lending reminders -------------------------------------------------
  const { data: loans } = await supabase
    .from("borrow_records")
    .select("id, borrower_name, expected_return_date, status, books(title)")
    .eq("status", "borrowed");

  for (const loan of loans ?? []) {
    if (!loan.expected_return_date) continue;
    const title = (loan.books as { title: string } | null)?.title ?? "A book";
    const due = toDay(loan.expected_return_date);
    const daysLeft = daysBetween(now, due);
    const dueLabel = due.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (daysLeft === 3) {
      pending.push({
        type: "lending_reminder",
        message: `“${title}” is due back from ${loan.borrower_name} on ${dueLabel} — three days to go. A gentle reminder now usually does the trick.`,
      });
    }
    if (daysLeft < 0) {
      pending.push({
        type: "overdue",
        message: `“${title}” was due back from ${loan.borrower_name} on ${dueLabel} and hasn't returned yet. Worth a friendly follow-up.`,
      });
    }
  }

  // --- Habit accountability nudges --------------------------------------
  const { data: goals } = await supabase
    .from("reading_goals")
    .select("id")
    .limit(1);

  if (goals?.length) {
    const { data: lastEntry } = await supabase
      .from("reading_progress")
      .select("logged_at")
      .order("logged_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const daysSince = lastEntry?.logged_at
      ? daysBetween(toDay(lastEntry.logged_at), now)
      : null;
    const stamp = now.toISOString().slice(0, 10);

    if (daysSince === null || daysSince >= 7) {
      pending.push({
        type: "habit_nudge",
        message: `Your books are waiting patiently. Even ten minutes today would begin a fresh rhythm — open one and read a page. (${stamp})`,
      });
    } else if (daysSince >= 3) {
      pending.push({
        type: "habit_nudge",
        message: `It's been ${daysSince} days since your last entry — your streak is resting, not lost. One short reading today brings it back. (${stamp})`,
      });
    } else if (daysSince >= 1) {
      pending.push({
        type: "habit_nudge",
        message: `No reading logged yet today. A few faithful pages now keep your goal moving steadily forward. (${stamp})`,
      });
    }
  }

  void userId;
  return pending;
}

/** Generates any missing notifications for the signed-in user. Safe to call often. */
export async function generateNotifications(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return 0;

  const pending = await buildPending(userId);
  if (pending.length === 0) return 0;

  const { data: existing } = await supabase
    .from("notifications")
    .select("message")
    .in(
      "message",
      pending.map((p) => p.message),
    );
  const seen = new Set((existing ?? []).map((e) => e.message));

  const rows = pending
    .filter((p) => !seen.has(p.message))
    .map((p) => ({
      user_id: userId,
      type: p.type,
      channel: IN_APP_CHANNEL,
      message: p.message,
      sent_at: new Date().toISOString(),
    }));

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) throw error;
  return rows.length;
}
