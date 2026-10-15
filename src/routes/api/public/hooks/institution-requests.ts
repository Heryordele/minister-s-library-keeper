import { createFileRoute } from "@tanstack/react-router";

/**
 * Pinged by database triggers when an institution admin request is filed or
 * reviewed. Emails the project owner about new requests and each requester
 * about the approval or rejection of theirs. The daily reminders sweep runs the same
 * checks as a fallback.
 */
export const Route = createFileRoute("/api/public/hooks/institution-requests")({
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

        const { sendInstitutionRequestAlerts, sendInstitutionDecisionEmails } =
          await import("@/lib/institution-alerts.server");
        const alerts = await sendInstitutionRequestAlerts();
        const decisions = await sendInstitutionDecisionEmails(new URL(request.url).origin);
        return Response.json({
          success: !alerts.error && !decisions.error,
          alerted: alerts.alerted,
          decisionsEmailed: decisions.emailed,
          errors: [alerts.error, decisions.error].filter(Boolean),
        });
      },
    },
  },
});
