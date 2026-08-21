// Server-only — never import this from a route file or a *.functions.ts
// module (those ship to the client bundle); import inside server handlers.
import { Resend } from "resend";

let _resend: Resend | undefined;

function resendClient(): Resend {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    throw new Error("Email isn't configured yet — set RESEND_API_KEY.");
  }
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

/**
 * Sends a single reminder/nudge email. Failures are caught and reported to
 * the caller as a boolean rather than thrown — one bad address shouldn't
 * abort the rest of a sweep across many users.
 */
export async function sendReminderEmail(params: {
  to: string;
  subject: string;
  message: string;
}): Promise<{ sent: boolean; error?: string }> {
  const from = process.env["REMINDERS_FROM_EMAIL"];
  if (!from) {
    return { sent: false, error: "REMINDERS_FROM_EMAIL is not configured." };
  }

  try {
    const { error } = await resendClient().emails.send({
      from,
      to: params.to,
      subject: params.subject,
      text: params.message,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Send failed." };
  }
}
