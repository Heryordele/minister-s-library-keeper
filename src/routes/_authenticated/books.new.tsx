import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { BookForm, type BookFormValues } from "@/components/book-form";
import { supabase } from "@/integrations/supabase/client";
import { booksKey } from "@/lib/books";

export const Route = createFileRoute("/_authenticated/books/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    isbn: typeof search.isbn === "string" ? search.isbn : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Add a book — Minister's Vault" },
      {
        name: "description",
        content: "Catalogue a new volume in your ministry library.",
      },
    ],
  }),
  component: NewBookPage,
});

function NewBookPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isbn } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);


  const mutation = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You must be signed in.");
      const { data, error: err } = await supabase
        .from("books")
        .insert({
          ...values,
          owner_id: userId,
          reading_status: "unread",
          lending_status: "available",
        })
        .select("id")
        .single();
      if (err) throw err;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: booksKey });
      toast.success("Book added to your library.");
      navigate({ to: "/books/$bookId", params: { bookId: data.id } });
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Could not save this book."),
  });

  return (
    <>
      <PageHeader
        title="Add a book"
        subtitle="Manual entry — only the title is required."
      />
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        <BookForm
          submitLabel="Save book"
          submitting={mutation.isPending}
          error={error}
          onSubmit={(v) => {
            setError(null);
            mutation.mutate(v);
          }}
          onCancel={() => navigate({ to: "/library" })}
        />
      </div>
    </>
  );
}
