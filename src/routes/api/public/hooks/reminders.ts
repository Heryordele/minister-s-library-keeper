import { createFileRoute } from "@tanstack/react-router";

type Pending = {
  user_id: string;
  type: "lending_reminder" | "overdue" | "habit_nudge";
  message: string;
};

const SUBJECT_BY_TYPE: Record<Pending["type"], string> = {
  lending_reminder: "A book is due back soon — Minister's Vault",
  overdue: "A borrowed book is overdue — Minister's Vault",
  habit_nudge: "Your library is waiting — Minister's Vault",
};

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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Fallback for institution request and decision emails the triggers missed.
        const { sendInstitutionRequestAlerts, sendInstitutionDecisionEmails } =
          await import("@/lib/institution-alerts.server");
        await sendInstitutionRequestAlerts();
        await sendInstitutionDecisionEmails(new URL(request.url).origin);

        const pending: Pending[] = [];

        // --- Lending reminders -------------------------------------------
        // Owner and borrower reminders, overdue flags and their send log.
        const { sendLendingReminders } = await import("@/lib/lending-reminders.server");
        const lending = await sendLendingReminders();

        // --- Habit nudges --------------------------------------------------
        // Day 1, 3 and 7 of inactivity only (PRD FR-014), for readers with a goal.
        const { habitNudgeFor } = await import("@/lib/habit-nudges");
        const { data: goals } = await supabaseAdmin
          .from("reading_goals")
          .select("user_id, created_at");
        const firstGoalByUser = new Map<string, string>();
        for (const g of goals ?? []) {
          const prev = firstGoalByUser.get(g.user_id);
          if (!prev || g.created_at < prev) firstGoalByUser.set(g.user_id, g.created_at);
        }
        const goalUsers = [...firstGoalByUser.keys()];

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

          const today = new Date();
          for (const userId of goalUsers) {
            const last = lastByUser.get(userId);
            const nudge = last
              ? habitNudgeFor(last, today)
              : habitNudgeFor(firstGoalByUser.get(userId)!, today, "Goal set");
            if (nudge)
              pending.push({ user_id: userId, type: "habit_nudge", message: nudge.message });
          }
        }

        if (pending.length === 0) {
          return Response.json({ success: true, created: 0, lending });
        }

        // De-duplicate against notifications this user already has.
        const { data: existing } = await supabaseAdmin
          .from("notifications")
          .select("user_id, message")
          .in("user_id", [...new Set(pending.map((p) => p.user_id))]);
        const seen = new Set((existing ?? []).map((e) => `${e.user_id}::${e.message}`));

        const fresh = pending.filter((p) => !seen.has(`${p.user_id}::${p.message}`));
        if (fresh.length === 0) {
          return Response.json({ success: true, created: 0, emailed: 0, lending });
        }

        // Look up each recipient's email once before sending.
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, email")
          .in("id", [...new Set(fresh.map((p) => p.user_id))]);
        const emailByUser = new Map(
          (profiles ?? [])
            .filter((p): p is { id: string; email: string } => !!p.email)
            .map((p) => [p.id, p.email]),
        );

        const { sendReminderEmail } = await import("@/lib/email.server");
        let emailed = 0;
        const rows = await Promise.all(
          fresh.map(async (p) => {
            const to = emailByUser.get(p.user_id);
            let channel: "email" | "push" = "push";
            if (to) {
              const result = await sendReminderEmail({
                to,
                subject: SUBJECT_BY_TYPE[p.type],
                message: p.message,
              });
              if (result.sent) {
                channel = "email";
                emailed += 1;
              }
              // A send failure still records the in-app notification below —
              // the user isn't left with no record of the reminder at all.
            }
            return {
              user_id: p.user_id,
              type: p.type,
              channel,
              message: p.message,
              sent_at: new Date().toISOString(),
            };
          }),
        );

        const { error } = await supabaseAdmin.from("notifications").insert(rows);
        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ success: true, created: rows.length, emailed, lending });
      },
    },
  },
});
