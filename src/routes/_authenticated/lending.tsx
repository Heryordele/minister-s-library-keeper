import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/lending")({
  head: () => ({ meta: [{ title: "Lending — Minister's Vault" }] }),
  component: () => (
    <>
      <PageHeader
        title="Lending"
        subtitle="Who has your books — and when they're due home."
      />
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No books out on loan"
          body="Once you catalog a book, you'll be able to record who borrowed it."
        />
      </div>
    </>
  ),
});
