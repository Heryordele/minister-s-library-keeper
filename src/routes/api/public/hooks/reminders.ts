import { createFileRoute } from "@tanstack/react-router";

type Pending = {
  user_id: string;
  type: "lending_reminder" | "overdue" | "habit_nudge";
  message: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value: string | Date): Date {
  const d =
    typeof value === "string"
      ? new Date(value.length > 10 ? value : `${value}T00:00:00`)
      : new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Scheduled reminder sweep. Runs server-side so lending reminders and habit
 * nudges are generated even when a user has not opened the app.
 */
export const Route = createFileRoute("/api/public/hooks/reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace("Bearer ", "");
        if (
          !apiKey ||
          (apiKey !== process.env["SUPABASE_PUBLISHABLE_KEY"] &&
            apiKey !== process.env["SUPABASE_ANON_KEY"])
        ) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const now = startOfDay(new Date());
        const stamp = now.toISOString().slice(0, 10);
        const pending: Pending[] = [];

        // --- Lending reminders -------------------------------------------
        const { data: loans, error: loansError } = await supabaseAdmin
          .from("borrow_records")
          .select("owner_name:owner_id, borrower_name, expected_return_date, books(title)")
          .eq("status", "borrowed")
          .not("expected_return_date", "is", null);
        if (loansError) {
          return Response.json({ error: loansError.message }, { status: 500 });
        }

        for (const loan of loans ?? []) {
          const ownerId = (loan as { owner_name: string }).owner_name;
          const due = startOfDay(loan.expected_return_date as string);
          const daysLeft = daysBetween(now, due);
          const title =
            (loan.books as { title: string } | null)?.title ?? "A book";
          const dueLabel = due.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          if (daysLeft === 3) {
            pending.push({
              user_id: ownerId,
              type: "lending_reminder",
              message: `“${title}” is due back from ${loan.borrower_name} on ${dueLabel} — three days to go. A gentle reminder now usually does the trick.`,
            });
          }
          if (daysLeft < 0) {
            pending.push({
              user_id: ownerId,
              type: "overdue",
              message: `“${title}” was due back from ${loan.borrower_name} on ${dueLabel} and hasn't returned yet. Worth a friendly follow-up.`,
            });
          }
        }

        // --- Habit nudges --------------------------------------------------
        const { data: goals } = await supabaseAdmin
          .from("reading_goals")
          .select("user_id");
        const goalUsers = [...new Set((goals ?? []).map((g) => g.user_id))];

        if (goalUsers.length > 0) {
          const { data: entries } = await supabaseAdmin
            .from("reading_progress")
            .select("user_id, logged_at")
            .in("user_id", goalUsers)
            .order("logged_at", { ascending: false });

          const lastByUser = new Map<string, string>();
          for (const e of entries ?? []) {
            if (!lastByUser.has(e.user_id)) lastByUser.set(e.user_id, e.logged_at);
          }

          for (const userId of goalUsers) {
            const last = lastByUser.get(userId);
            const daysSince = last ? daysBetween(startOfDay(last), now) : null;

            if (daysSince === null || daysSince >= 7) {
              pending.push({
                user_id: userId,
                type: "habit_nudge",
                message: `Your books are waiting patiently. Even ten minutes today would begin a fresh rhythm — open one and read a page. (${stamp})`,
              });
            } else if (daysSince >= 3) {
              pending.push({
                user_id: userId,
                type: "habit_nudge",
                message: `It's been ${daysSince} days since your last entry — your streak is resting, not lost. One short reading today brings it back. (${stamp})`,
              });
            } else if (daysSince >= 1) {
              pending.push({
                user_id: userId,
                type: "habit_nudge",
                message: `No reading logged yet today. A few faithful pages now keep your goal moving steadily forward. (${stamp})`,
              });
            }
          }
        }

        if (pending.length === 0) {
          return Response.json({ success: true, created: 0 });
        }

        // De-duplicate against notifications this user already has.
        const { data: existing } = await supabaseAdmin
          .from("notifications")
          .select("user_id, message")
          .in("user_id", [...new Set(pending.map((p) => p.user_id))]);
        const seen = new Set(
          (existing ?? []).map((e) => `${e.user_id}::${e.message}`),
        );

        const rows = pending
          .filter((p) => !seen.has(`${p.user_id}::${p.message}`))
          .map((p) => ({
            user_id: p.user_id,
            type: p.type,
            channel: "push" as const,
            message: p.message,
            sent_at: new Date().toISOString(),
          }));

        if (rows.length === 0) {
          return Response.json({ success: true, created: 0 });
        }

        const { error } = await supabaseAdmin.from("notifications").insert(rows);
        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ success: true, created: rows.length });
      },
    },
  },
});
