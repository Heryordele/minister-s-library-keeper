import { createFileRoute } from "@tanstack/react-router";
import { BookMarked } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — Minister's Vault" }] }),
  component: () => (
    <>
      <PageHeader title="Library" subtitle="Every volume in your collection." />
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <EmptyState
          icon={<BookMarked className="h-6 w-6" />}
          title="No books yet"
          body="Book cataloging is coming next. This is where your library will live."
        />
      </div>
    </>
  ),
});
