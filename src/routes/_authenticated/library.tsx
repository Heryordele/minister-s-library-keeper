import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarcodeIcon,
  BookMarked,
  FileSpreadsheet,
  Loader2,
  PencilLine,
  Plus,
  Search,
} from "lucide-react";

import { PageHeader, EmptyState } from "@/components/page-header";
import { BookCover, LendingBadge, ReadingBadge } from "@/components/book-cover";
import {
  booksKey,
  categoriesKey,
  fetchBooks,
  fetchCategories,
  groupCategories,
  READING_STATUSES,
} from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Library — Minister's Vault" },
      {
        name: "description",
        content:
          "Search and filter every volume in your personal ministry library.",
      },
    ],
  }),
  component: LibraryPage,
});

const ALL = "__all__";

function LibraryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [reading, setReading] = useState<string>(ALL);

  const { data: books, isLoading } = useQuery({
    queryKey: booksKey,
    queryFn: fetchBooks,
  });
  const { data: categories = [] } = useQuery({
    queryKey: categoriesKey,
    queryFn: fetchCategories,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (books ?? []).filter((b) => {
      if (category !== ALL && b.category_id !== category) return false;
      if (reading !== ALL && b.reading_status !== reading) return false;
      if (!q) return true;
      return [b.title, b.author, b.publisher, b.isbn]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q));
    });
  }, [books, search, category, reading]);

  const hasBooks = (books?.length ?? 0) > 0;

  return (
    <>
      <PageHeader
        title="Library"
        subtitle="Every volume in your collection."
        actions={<AddBookMenu />}
      />

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasBooks ? (
          <EmptyState
            icon={<BookMarked className="h-6 w-6" />}
            title="No books yet"
            body="Start your vault by cataloguing the first volume on your shelf."
            action={<AddBookMenu label="Add your first book" />}
          />
        ) : (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative sm:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, author, publisher, ISBN"
                  className="pl-9"
                  aria-label="Search your library"
                />
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Filter by category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All categories</SelectItem>
                  {groupCategories(categories).map(([group, items]) => (
                    <SelectGroup key={group}>
                      <SelectLabel>{group}</SelectLabel>
                      {items.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>

              <Select value={reading} onValueChange={setReading}>
                <SelectTrigger aria-label="Filter by reading status">
                  <SelectValue placeholder="Reading status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All reading statuses</SelectItem>
                  {READING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="No matches"
                body="No books match your search or filters. Try widening them."
              />
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((b) => (
                  <li key={b.id}>
                    <Link
                      to="/books/$bookId"
                      params={{ bookId: b.id }}
                      className="group block rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:border-accent"
                    >
                      <BookCover path={b.cover_image_url} title={b.title} />
                      <div className="mt-3 space-y-1">
                        <h2 className="line-clamp-2 font-serif text-sm font-semibold leading-snug">
                          {b.title}
                        </h2>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {b.author ?? "Unknown author"}
                        </p>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <ReadingBadge status={b.reading_status} />
                        <LendingBadge status={b.lending_status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}

function AddBookMenu({ label = "Add book" }: { label?: string }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>How would you like to add books?</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => navigate({ to: "/books/new", search: { isbn: undefined } })}
        >
          <PencilLine className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">Enter manually</div>
            <div className="text-xs text-muted-foreground">
              Type in the details yourself
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate({ to: "/books/scan" })}>
          <BarcodeIcon className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">Scan barcode</div>
            <div className="text-xs text-muted-foreground">
              Look up the ISBN with your camera
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate({ to: "/books/import" })}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">Bulk import</div>
            <div className="text-xs text-muted-foreground">
              Upload a CSV or Excel file
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
