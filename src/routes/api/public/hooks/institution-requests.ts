import { createFileRoute } from "@tanstack/react-router";

/**
 * Pinged by database triggers when an institution admin request is filed or
 * approved. Emails the project owner about new requests and each approved
 * requester about their approval. The daily reminders sweep runs the same
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

        const { sendInstitutionRequestAlerts, sendInstitutionApprovalEmails } =
          await import("@/lib/institution-alerts.server");
        const alerts = await sendInstitutionRequestAlerts();
        const approvals = await sendInstitutionApprovalEmails(new URL(request.url).origin);
        return Response.json({
          success: !alerts.error && !approvals.error,
          alerted: alerts.alerted,
          approvalsEmailed: approvals.emailed,
          errors: [alerts.error, approvals.error].filter(Boolean),
        });
      },
    },
  },
});
