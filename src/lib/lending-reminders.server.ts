// Server-only — import inside server handlers, never from route modules.

type Milestone = "due_soon" | "overdue_1" | "overdue_7" | "overdue_14";
type Audience = "owner" | "borrower";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from today (UTC) to the due date; negative once overdue. */
function daysUntil(dueDate: string, today: Date): number {
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  return Math.round((due - today.getTime()) / DAY_MS);
}

/** The latest reminder milestone a loan has reached, if any. */
function milestoneFor(daysLeft: number): Milestone | null {
  if (daysLeft >= 0) return daysLeft <= 3 ? "due_soon" : null;
  const overdue = -daysLeft;
  if (overdue >= 14) return "overdue_14";
  if (overdue >= 7) return "overdue_7";
  return "overdue_1";
}

function formatDue(dueDate: string): string {
  return new Date(`${dueDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dueSoonPhrase(daysLeft: number): string {
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  return `in ${daysLeft} days`;
}

function ownerCopy(m: Milestone, title: string, borrower: string, due: string, daysLeft: number) {
  if (m === "due_soon") {
    return {
      type: "lending_reminder" as const,
      subject: "A book is due back soon — Minister's Vault",
      message: `“${title}” is due back from ${borrower} ${dueSoonPhrase(daysLeft)} (${due}). A gentle reminder now usually does the trick.`,
    };
  }
  return {
    type: "overdue" as const,
    subject: "A borrowed book is overdue — Minister's Vault",
    message: `“${title}” was due back from ${borrower} on ${due} and is now ${-daysLeft} day${daysLeft === -1 ? "" : "s"} overdue. Worth a friendly follow-up.`,
  };
}

function borrowerCopy(
  m: Milestone,
  title: string,
  borrower: string,
  owner: string,
  due: string,
  daysLeft: number,
) {
  const greeting = `Hello ${borrower},`;
  if (m === "due_soon") {
    return {
      subject: `Reminder: “${title}” is due back ${dueSoonPhrase(daysLeft)}`,
      message: [
        greeting,
        "",
        `A friendly reminder that “${title}”, which you borrowed from ${owner}, is due back ${dueSoonPhrase(daysLeft)} (${due}).`,
        "",
        `If you've already returned it, thank you, and please let ${owner} know.`,
      ].join("\n"),
    };
  }
  return {
    subject: `“${title}” is overdue`,
    message: [
      greeting,
      "",
      `“${title}”, which you borrowed from ${owner}, was due back on ${due} and is now ${-daysLeft} day${daysLeft === -1 ? "" : "s"} overdue.`,
      "",
      `Please return it to ${owner} when you can. If you've already returned it, thank you, and please let ${owner} know.`,
    ].join("\n"),
  };
}

/**
 * Daily lending sweep: flags overdue books, then sends each open loan's latest
 * reminder milestone to the owner (email + in-app notification) and, when an
 * email was recorded, to the borrower. Each (loan, audience, milestone, due
 * date) is claimed in lending_reminders before sending and released if the
 * send fails, so reminders go out once and failed ones retry next run.
 */
export async function sendLendingReminders(): Promise<{
  overdueFlagged: number;
  ownerReminders: number;
  borrowerReminders: number;
  error?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendReminderEmail } = await import("@/lib/email.server");

  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const result = { overdueFlagged: 0, ownerReminders: 0, borrowerReminders: 0 };

  const { data: loans, error } = await supabaseAdmin
    .from("borrow_records")
    .select(
      "id, owner_id, book_id, borrower_name, borrower_email, expected_return_date, books(title)",
    )
    .eq("status", "borrowed")
    .not("expected_return_date", "is", null);
  if (error) return { ...result, error: error.message };

  // Keep book status in step with the calendar even if the owner never opens the app.
  const overdueBookIds = (loans ?? [])
    .filter((l) => daysUntil(l.expected_return_date as string, today) < 0)
    .map((l) => l.book_id);
  if (overdueBookIds.length > 0) {
    const { data: flagged } = await supabaseAdmin
      .from("books")
      .update({ lending_status: "overdue" })
      .in("id", overdueBookIds)
      .eq("lending_status", "borrowed")
      .select("id");
    result.overdueFlagged = flagged?.length ?? 0;
  }

  const ownerIds = [...new Set((loans ?? []).map((l) => l.owner_id))];
  const { data: owners } = ownerIds.length
    ? await supabaseAdmin.from("profiles").select("id, name, email").in("id", ownerIds)
    : { data: [] };
  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

  for (const loan of loans ?? []) {
    const dueDate = loan.expected_return_date as string;
    const daysLeft = daysUntil(dueDate, today);
    const milestone = milestoneFor(daysLeft);
    if (!milestone) continue;

    const title = (loan.books as { title: string } | null)?.title ?? "A book";
    const due = formatDue(dueDate);
    const owner = ownerById.get(loan.owner_id);
    const ownerName = owner?.name?.trim() || "the owner";

    const claim = async (audience: Audience) => {
      const { data } = await supabaseAdmin
        .from("lending_reminders")
        .upsert(
          { borrow_record_id: loan.id, audience, milestone, due_date: dueDate },
          {
            onConflict: "borrow_record_id,audience,milestone,due_date",
            ignoreDuplicates: true,
          },
        )
        .select("id");
      return data?.[0]?.id as string | undefined;
    };
    const release = (claimId: string) =>
      supabaseAdmin.from("lending_reminders").delete().eq("id", claimId);

    // Owner: email when possible, and always an in-app notification.
    const ownerClaim = await claim("owner");
    if (ownerClaim) {
      const copy = ownerCopy(milestone, title, loan.borrower_name, due, daysLeft);
      let channel: "email" | "push" = "push";
      if (owner?.email) {
        const sent = await sendReminderEmail({
          to: owner.email,
          subject: copy.subject,
          message: copy.message,
        });
        if (sent.sent) channel = "email";
      }
      const { error: notifyError } = await supabaseAdmin.from("notifications").insert({
        user_id: loan.owner_id,
        type: copy.type,
        channel,
        message: copy.message,
        sent_at: new Date().toISOString(),
      });
      if (notifyError) await release(ownerClaim);
      else result.ownerReminders += 1;
    }

    // Borrower: only when the owner recorded an email address.
    const borrowerEmail = loan.borrower_email?.trim();
    if (borrowerEmail) {
      const borrowerClaim = await claim("borrower");
      if (borrowerClaim) {
        const copy = borrowerCopy(milestone, title, loan.borrower_name, ownerName, due, daysLeft);
        const sent = await sendReminderEmail({
          to: borrowerEmail,
          subject: copy.subject,
          message: copy.message,
        });
        if (sent.sent) result.borrowerReminders += 1;
        else await release(borrowerClaim);
      }
    }
  }

  return result;
}
