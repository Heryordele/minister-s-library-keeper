import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/reading")({
  head: () => ({ meta: [{ title: "Reading — Minister's Vault" }] }),
  component: () => (
    <>
      <PageHeader
        title="Reading"
        subtitle="Your goals, streaks, and what you're reading now."
      />
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <EmptyState
          icon={<Flame className="h-6 w-6" />}
          title="Your reading dashboard lives here"
          body="Set a goal, log a session, and start building a streak."
        />
      </div>
    </>
  ),
});
