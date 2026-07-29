import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Minister's Vault" }] }),
  component: () => (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Reading pace, categories, and library value over time."
      />
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="Insights will appear here"
          body="Once you start logging reading and cataloging books, you'll see trends and patterns."
        />
      </div>
    </>
  ),
});
