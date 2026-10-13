// Server-only — import inside server handlers, never from route modules.

const SQL_EDITOR_URL = "https://app.supabase.com/project/ggcaniqywwozydsugaij/sql/new";

/**
 * Emails the project owner (ADMIN_ALERT_EMAIL) about each pending institution
 * request that hasn't been announced yet. Each request is claimed by setting
 * notified_at before sending, so overlapping runs (the insert trigger and the
 * daily sweep) never send the same alert twice; a failed send releases the
 * claim so the next run retries it.
 */
export async function sendInstitutionRequestAlerts(): Promise<{ alerted: number; error?: string }> {
  const to = process.env["ADMIN_ALERT_EMAIL"];
  if (!to) return { alerted: 0, error: "ADMIN_ALERT_EMAIL is not configured." };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendReminderEmail } = await import("@/lib/email.server");

  const { data: requests, error } = await supabaseAdmin
    .from("institution_requests")
    .select("id, user_id, created_at")
    .eq("status", "pending")
    .is("notified_at", null);
  if (error) return { alerted: 0, error: error.message };

  let alerted = 0;
  for (const request of requests ?? []) {
    const { data: claimed } = await supabaseAdmin
      .from("institution_requests")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", request.id)
      .is("notified_at", null)
      .select("id");
    if (!claimed?.length) continue; // another run already took it

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name, email, organization_name, library_name, admin_email")
      .eq("id", request.user_id)
      .maybeSingle();

    const institution = profile?.organization_name ?? "An institution";
    const message = [
      `${institution} has asked for an institution admin account on Minister's Vault.`,
      "",
      `Name: ${profile?.name ?? "—"}`,
      `Account email: ${profile?.email ?? "—"}`,
      `Institution: ${profile?.organization_name ?? "—"}`,
      `Library: ${profile?.library_name ?? "—"}`,
      `Administrator email: ${profile?.admin_email ?? "—"}`,
      `Requested: ${new Date(request.created_at).toUTCString()}`,
      "",
      `Review it in the Supabase SQL editor (${SQL_EDITOR_URL}):`,
      `  Approve: SELECT approve_institution_request('${request.user_id}');`,
      `  Reject:  SELECT reject_institution_request('${request.user_id}');`,
    ].join("\n");

    const result = await sendReminderEmail({
      to,
      subject: `New institution request: ${institution} — Minister's Vault`,
      message,
    });

    if (result.sent) {
      alerted += 1;
    } else {
      await supabaseAdmin
        .from("institution_requests")
        .update({ notified_at: null })
        .eq("id", request.id);
    }
  }

  return { alerted };
}

/**
 * Emails each requester whose institution request has been approved and
 * hasn't been told yet, using the same claim-then-send pattern as above
 * (approval_notified_at). `siteUrl` is the app's origin for the sign-in link.
 */
export async function sendInstitutionApprovalEmails(
  siteUrl: string,
): Promise<{ emailed: number; error?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendReminderEmail } = await import("@/lib/email.server");

  const { data: requests, error } = await supabaseAdmin
    .from("institution_requests")
    .select("id, user_id")
    .eq("status", "approved")
    .is("approval_notified_at", null);
  if (error) return { emailed: 0, error: error.message };

  let emailed = 0;
  for (const request of requests ?? []) {
    const { data: claimed } = await supabaseAdmin
      .from("institution_requests")
      .update({ approval_notified_at: new Date().toISOString() })
      .eq("id", request.id)
      .is("approval_notified_at", null)
      .select("id");
    if (!claimed?.length) continue; // another run already took it

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name, email, organization_name")
      .eq("id", request.user_id)
      .maybeSingle();

    const release = () =>
      supabaseAdmin
        .from("institution_requests")
        .update({ approval_notified_at: null })
        .eq("id", request.id);

    if (!profile?.email) {
      await release();
      continue;
    }

    const institution = profile.organization_name ?? "your institution";
    const message = [
      `Hello${profile.name ? ` ${profile.name}` : ""},`,
      "",
      `Good news: the institution account for ${institution} on Minister's Vault has been approved.`,
      "",
      `Sign in to open your Library Dashboard: ${siteUrl}/auth`,
      "",
      "If you're already signed in, refresh the page.",
    ].join("\n");

    const result = await sendReminderEmail({
      to: profile.email,
      subject: "Your institution account is approved — Minister's Vault",
      message,
    });

    if (result.sent) emailed += 1;
    else await release();
  }

  return { emailed };
}
