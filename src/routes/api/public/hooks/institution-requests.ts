import { createFileRoute } from "@tanstack/react-router";

/**
 * Pinged by a database trigger when an institution admin request is filed.
 * Emails the project owner about any pending requests not yet announced.
 * The daily reminders sweep runs the same check as a fallback.
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

        const { sendInstitutionRequestAlerts } = await import("@/lib/institution-alerts.server");
        const result = await sendInstitutionRequestAlerts();
        return Response.json({ success: !result.error, ...result });
      },
    },
  },
});
